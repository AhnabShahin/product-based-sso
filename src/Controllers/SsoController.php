<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Repositories\AuthKeyRepository;
use ProductBasedSSO\Repositories\LogRepository;
use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Services\DeviceFingerprintService;
use ProductBasedSSO\Services\ProductService;
use ProductBasedSSO\Services\RateLimitService;
use ProductBasedSSO\Services\ValidationService;
use ProductBasedSSO\Services\WebKeyService;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class SsoController
{
    use Singleton;

    public function handleSsoRequest()
    {
        $rawAuthKey = $this->getAuthToken();
        if (empty($rawAuthKey) && !get_query_var('product_sso')) {
            return;
        }

        if (empty($rawAuthKey)) {
            wp_die('Missing auth token.', 'SSO Error', array('response' => 400));
        }

        $settings = SettingsRepository::getInstance()->getSettings();
        if (!empty($settings['require_https']) && !is_ssl()) {
            wp_die('HTTPS required for SSO.', 'SSO Error', array('response' => 400));
        }

        // If the incoming token is AES-encrypted (starts with "AES-"), decrypt it
        // using this site's stored PIN before processing.
        $authToken = $rawAuthKey;
        if (str_starts_with($rawAuthKey, 'AES-')) {
            $decrypted = WebKeyService::getInstance()->decryptWithPin($rawAuthKey);
            if ($decrypted === false) {
                wp_die('Invalid auth key: decryption failed.', 'SSO Error', array('response' => 401));
            }
            $authToken = is_string($decrypted) ? $decrypted : wp_json_encode($decrypted);
        }

        // Decode only — full validation (HMAC, nonce, device binding) happens
        // in ValidateController after the user explicitly clicks "Continue".
        $decoded = ValidationService::getInstance()->decodeAuthKey($authToken);
        return $decoded;
        if (empty($decoded) || empty($decoded['payload'])) {
            wp_die('Invalid auth token.', 'SSO Error', array('response' => 400));
        }

        $payload     = $decoded['payload'];
        $email       = isset($payload['email']) ? sanitize_email($payload['email']) : '';
        $fromProduct = !empty($payload['from_product']) ? (string) $payload['from_product'] : '';

        $this->renderConfirmationPage($authToken, $email, $fromProduct);
        exit;
    }

    /**
     * Renders a full-page "Continue as {email}" confirmation screen.
     * The page collects device context in JS and POSTs it — together with the
     * auth_token — to the REST endpoint /wp-json/sso/v1/validate.
     */
    private function renderConfirmationPage($authToken, $email, $fromProduct)
    {
        $validateUrl  = esc_url(rest_url('sso/v1/validate'));
        $jsonToken    = wp_json_encode($authToken);          // safe JS string literal
        $safeEmail    = esc_html($email);
        $fromLabel    = $fromProduct ? esc_html(wp_parse_url($fromProduct, PHP_URL_HOST)) : '';
        $initials     = strtoupper(substr($email, 0, 2));
        ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign In Confirmation</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;
     background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0}
.card{background:#1a1d27;border:1px solid #2d3148;border-radius:20px;padding:40px 32px;
      width:100%;max-width:380px;display:flex;flex-direction:column;align-items:center;gap:20px;
      box-shadow:0 20px 60px rgba(0,0,0,.5)}
.avatar{width:64px;height:64px;border-radius:18px;display:flex;align-items:center;
        justify-content:center;font-size:22px;font-weight:800;color:#fff;
        background:linear-gradient(135deg,#1d4ed8,#3b82f6);flex-shrink:0}
.title{font-size:13px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em}
.email{font-size:18px;font-weight:700;color:#f1f5f9;text-align:center;word-break:break-all}
.from{font-size:12px;color:#64748b;text-align:center}
.btn{width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;font-size:15px;
     font-weight:600;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;
     transition:opacity .15s;margin-top:4px}
.btn:disabled{opacity:.5;cursor:default}
.steps{display:flex;flex-direction:column;gap:8px;width:100%;display:none}
.step{display:flex;align-items:center;gap:10px;font-size:12px;color:#475569}
.step.done{color:#22c55e}.step.active{color:#f1f5f9;font-weight:500}
.dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}
.step.done .dot{background:#22c55e}
.error{background:#2d1a1a;border:1px solid #7f1d1d;border-radius:10px;padding:12px 14px;
       font-size:13px;color:#fca5a5;width:100%;text-align:center;display:none}
.spinner{width:36px;height:36px;border:3px solid #2d3148;border-top-color:#3b82f6;
         border-radius:50%;animation:spin .7s linear infinite;display:none}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="card">
  <div class="avatar"><?php echo esc_html($initials); ?></div>
  <div>
    <div class="title">Continue as</div>
    <div class="email"><?php echo $safeEmail; ?></div>
    <?php if ($fromLabel): ?>
    <div class="from">from <?php echo $fromLabel; ?></div>
    <?php endif; ?>
  </div>

  <button class="btn" id="confirm-btn">Continue</button>
  <div class="spinner" id="spinner"></div>

  <div class="steps" id="steps">
    <div class="step" id="s0"><span class="dot"></span>Verifying session</div>
    <div class="step" id="s1"><span class="dot"></span>Collecting device context</div>
    <div class="step" id="s2"><span class="dot"></span>Validating HMAC signature &amp; nonce</div>
    <div class="step" id="s3"><span class="dot"></span>Signing in &amp; redirecting</div>
  </div>

  <div class="error" id="error-box"></div>
</div>

<script>
(function () {
  var AUTH_TOKEN   = <?php echo $jsonToken; ?>;
  var VALIDATE_URL = <?php echo wp_json_encode($validateUrl); ?>;
  var STEPS        = ['s0','s1','s2','s3'];

  function h(input) {
    var v = 5381;
    for (var i = 0; i < input.length; i++) v = (v * 33) ^ input.charCodeAt(i);
    return (v >>> 0).toString(16);
  }

  function deviceContext() {
    var ua   = navigator.userAgent  || '';
    var lang = navigator.language   || '';
    var plat = navigator.platform   || '';
    var scr  = (window.screen ? window.screen.width + 'x' + window.screen.height : '0x0');
    var tz   = (Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') || '';
    var fp   = h([ua, lang, plat, scr, tz].join('|'));

    var browser = 'Unknown';
    if (ua.indexOf('Edg/')     > -1) browser = 'Edge';
    else if (ua.indexOf('OPR/') > -1) browser = 'Opera';
    else if (ua.indexOf('Chrome/') > -1) browser = 'Chrome';
    else if (ua.indexOf('Firefox/') > -1) browser = 'Firefox';
    else if (ua.indexOf('Safari/') > -1) browser = 'Safari';

    var haystack = (ua + ' ' + plat).toLowerCase();
    var os = 'Unknown';
    if (haystack.indexOf('win')     > -1) os = 'Windows';
    else if (haystack.indexOf('mac') > -1 || haystack.indexOf('darwin') > -1) os = 'macOS';
    else if (haystack.indexOf('android') > -1) os = 'Android';
    else if (haystack.indexOf('iphone') > -1 || haystack.indexOf('ipad') > -1) os = 'iOS';
    else if (haystack.indexOf('linux') > -1) os = 'Linux';

    return { device_fingerprint: fp, browser: browser, os: os, platform: plat,
             screen_resolution: scr, timezone: tz, accept_language: lang };
  }

  function setStep(i) {
    STEPS.forEach(function (id, idx) {
      var el = document.getElementById(id);
      el.className = 'step' + (idx < i ? ' done' : idx === i ? ' active' : '');
    });
  }

  function showError(msg) {
    var box = document.getElementById('error-box');
    box.textContent = msg;
    box.style.display = 'block';
    document.getElementById('steps').style.display = 'none';
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('confirm-btn').disabled = false;
    document.getElementById('confirm-btn').textContent = 'Try again';
  }

  document.getElementById('confirm-btn').addEventListener('click', function () {
    var btn = document.getElementById('confirm-btn');
    btn.disabled = true;
    document.getElementById('error-box').style.display = 'none';
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('steps').style.display = 'flex';
    setStep(0);

    var ctx  = deviceContext();
    var body = Object.assign({ auth_token: AUTH_TOKEN }, ctx);

    var stepTimers = [
      setTimeout(function () { setStep(1); }, 400),
      setTimeout(function () { setStep(2); }, 900),
    ];

    fetch(VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      stepTimers.forEach(clearTimeout);
      if (!result.ok || !result.data.success) {
        showError(result.data.message || 'Authentication failed.');
        return;
      }
      setStep(3);
      setTimeout(function () {
        window.location.href = result.data.redirect_url;
      }, 500);
    })
    .catch(function () {
      stepTimers.forEach(clearTimeout);
      showError('Network error. Please try again.');
    });
  });
}());
</script>
</body>
</html>
        <?php
    }

    private function logSuccess($payload, $ip, $deviceFingerprint)
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        if (empty($settings['logging_enabled'])) {
            return;
        }

        LogRepository::getInstance()->insert(array(
            'event_type' => 'success',
            'user_email' => isset($payload['email']) ? $payload['email'] : '',
            'source_product' => isset($payload['from_product']) ? $payload['from_product'] : '',
            'target_product' => isset($payload['to_product_url']) ? $payload['to_product_url'] : '',
            'ip_address' => $ip,
            'device_fingerprint' => $deviceFingerprint,
            'error_reason' => null,
            'created_at' => gmdate('Y-m-d H:i:s'),
        ));
    }

    private function logFailure($eventType, $payload, $sourceProduct, $ip, $deviceFingerprint, $reason)
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        if (empty($settings['logging_enabled'])) {
            return;
        }

        LogRepository::getInstance()->insert(array(
            'event_type' => $eventType,
            'user_email' => is_array($payload) && !empty($payload['email']) ? $payload['email'] : '',
            'source_product' => $sourceProduct ? $sourceProduct : (is_array($payload) && !empty($payload['from_product']) ? $payload['from_product'] : ''),
            'target_product' => is_array($payload) && !empty($payload['to_product_url']) ? $payload['to_product_url'] : '',
            'ip_address' => $ip,
            'device_fingerprint' => $deviceFingerprint,
            'error_reason' => $reason,
            'created_at' => gmdate('Y-m-d H:i:s'),
        ));
    }

    private function getClientIp()
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return sanitize_text_field($_SERVER['HTTP_CLIENT_IP']);
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return sanitize_text_field(trim($parts[0]));
        }
        return isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '';
    }

    private function getAuthToken()
    {
        if (!empty($_GET['auth_token'])) {
            return sanitize_text_field(wp_unslash($_GET['auth_token']));
        }
        if (!empty($_GET['auth_key'])) {
            return sanitize_text_field(wp_unslash($_GET['auth_key']));
        }

        return '';
    }

    private function buildRequestContext()
    {
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';
        $acceptLanguage = isset($_GET['accept_language']) ? sanitize_text_field(wp_unslash($_GET['accept_language'])) : '';
        if (empty($acceptLanguage) && isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            $acceptLanguage = sanitize_text_field(wp_unslash($_SERVER['HTTP_ACCEPT_LANGUAGE']));
        }

        $platform = isset($_GET['platform']) ? sanitize_text_field(wp_unslash($_GET['platform'])) : '';
        $screenResolution = isset($_GET['screen_resolution']) ? sanitize_text_field(wp_unslash($_GET['screen_resolution'])) : '';
        $timezone = isset($_GET['timezone']) ? sanitize_text_field(wp_unslash($_GET['timezone'])) : '';
        $browser = isset($_GET['browser']) ? sanitize_text_field(wp_unslash($_GET['browser'])) : $this->detectBrowser($userAgent);
        $os = isset($_GET['os']) ? sanitize_text_field(wp_unslash($_GET['os'])) : $this->detectOs($userAgent, $platform);
        $deviceFingerprint = isset($_GET['device_fingerprint']) ? sanitize_text_field(wp_unslash($_GET['device_fingerprint'])) : '';

        if (empty($deviceFingerprint)) {
            $deviceFingerprint = DeviceFingerprintService::getInstance()->buildFingerprint($userAgent, $acceptLanguage, $platform, $screenResolution, $timezone);
        }

        return array(
            'ip' => $this->getClientIp(),
            'user_agent' => $userAgent,
            'accept_language' => $acceptLanguage,
            'browser' => $browser,
            'os' => $os,
            'platform' => $platform,
            'screen_resolution' => $screenResolution,
            'timezone' => $timezone,
            'device_fingerprint' => $deviceFingerprint,
            'is_ssl' => is_ssl(),
        );
    }

    private function getCleanCurrentUrl()
    {
        $requestUri = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '/';
        $baseUrl = home_url($requestUri);

        return remove_query_arg(array(
            'auth_token',
            'auth_key',
            'device_fingerprint',
            'browser',
            'os',
            'platform',
            'screen_resolution',
            'timezone',
            'accept_language',
        ), $baseUrl);
    }

    private function detectBrowser($userAgent)
    {
        $map = array(
            'Edg/' => 'Edge',
            'OPR/' => 'Opera',
            'Chrome/' => 'Chrome',
            'Firefox/' => 'Firefox',
            'Safari/' => 'Safari',
        );

        foreach ($map as $needle => $browser) {
            if (strpos($userAgent, $needle) !== false) {
                return $browser;
            }
        }

        return 'Unknown';
    }

    private function detectOs($userAgent, $platform = '')
    {
        $haystack = strtolower($platform . ' ' . $userAgent);
        if (strpos($haystack, 'windows') !== false) {
            return 'Windows';
        }
        if (strpos($haystack, 'mac') !== false || strpos($haystack, 'darwin') !== false) {
            return 'macOS';
        }
        if (strpos($haystack, 'android') !== false) {
            return 'Android';
        }
        if (strpos($haystack, 'iphone') !== false || strpos($haystack, 'ipad') !== false || strpos($haystack, 'ios') !== false) {
            return 'iOS';
        }
        if (strpos($haystack, 'linux') !== false) {
            return 'Linux';
        }

        return 'Unknown';
    }
}
