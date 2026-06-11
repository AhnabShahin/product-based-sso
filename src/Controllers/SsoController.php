<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Repositories\AuthKeyRepository;
use ProductBasedSSO\Repositories\LogRepository;
use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Services\DeviceFingerprintService;
use ProductBasedSSO\Services\ValidationService;
use ProductBasedSSO\Services\WebKeyService;
use ProductBasedSSO\Traits\EncryptionTrait;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
  exit;
}

class SsoController
{
  use Singleton;

  /**
   * Fires on every page load via template_redirect.
   * If an auth_key is present in the request, decode it, validate the
   * encrypted_web_key against this site's PIN, and show the "Continue As" UI.
   */
  public function handleSsoRequest()
  {
    $rawAuthKey = $this->getAuthToken();
    if (empty($rawAuthKey)) {
      return;
    }

    // Decode the auth_key (base64 JSON envelope).
    $decoded = ValidationService::getInstance()->decodeAuthKey($rawAuthKey);
    if (empty($decoded) || empty($decoded['payload'])) {
      wp_die('Invalid auth key.', 'SSO Error', array('response' => 400));
    }

    $payload = $decoded['payload'];
    $settings = SettingsRepository::getInstance()->getSettings();
    if (isset($settings['require_https']) && isset($payload['https']) && $settings['require_https'] !== $payload['https']) {
      wp_die('Invalid auth key: HTTPS requirement mismatch.', 'SSO Error', array('response' => 400));
    }

    // if($payload['exp'] < time()) {
    //   wp_die('Auth key has expired.', 'SSO Error', array('response' => 401));
    // }

    // Retrieve the encrypted_web_key embedded in the payload and validate it
    // using this site's PIN stored in the database.
    $encryptedWebKey = isset($payload['encrypted_web_key']) ? (string) $payload['encrypted_web_key'] : '';
    if (empty($encryptedWebKey)) {
      wp_die('Invalid auth key: missing web key.', 'SSO Error', array('response' => 400));
    }

    $pin = WebKeyService::getInstance()->getPin();
    if (empty($pin)) {
      wp_die('SSO is not configured on this site (no PIN set).', 'SSO Error', array('response' => 503));
    }

    $decryptedData = EncryptionTrait::decrypt($encryptedWebKey, $pin);

    if ($decryptedData === false) {
      wp_die('Invalid auth key: web key validation failed.', 'SSO Error', array('response' => 401));
    }

    if (!isset($decryptedData['is_ssl']) || $decryptedData['is_ssl'] !== is_ssl()) {
      wp_die('Invalid auth key: SSL requirement mismatch.', 'SSO Error', array('response' => 400));
    }

    // Confirm the decrypted web key data belongs to this site.
    if (!isset($decryptedData['site_url']) || trailingslashit($decryptedData['site_url']) !== trailingslashit(get_site_url())) {
      wp_die('Invalid auth key: web key is not for this site.', 'SSO Error', array('response' => 401));
    }

    $email       = isset($payload['email']) ? sanitize_email($payload['email']) : '';
    $fromProduct = !empty($payload['from_product']) ? (string) $payload['from_product'] : '';

    $this->renderConfirmationPage($rawAuthKey, $email, $fromProduct);
    exit;
  }

  /**
   * Renders a full-page "Continue as {email}" confirmation screen.
   * The page collects device context in JS and POSTs it — together with the
   * auth_key — to the REST endpoint /wp-json/sso/v1/validate.
   */
  private function renderConfirmationPage($authKey, $email, $fromProduct)
  {
    $validateUrl  = esc_url(rest_url('sso/v1/validate'));
    $jsonToken    = wp_json_encode($authKey);
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
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0
        }

        body {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f1117;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #e2e8f0
        }

        .card {
          background: #1a1d27;
          border: 1px solid #2d3148;
          border-radius: 20px;
          padding: 40px 32px;
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, .5)
        }

        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          flex-shrink: 0
        }

        .title {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: .06em
        }

        .email {
          font-size: 18px;
          font-weight: 700;
          color: #f1f5f9;
          text-align: center;
          word-break: break-all
        }

        .from {
          font-size: 12px;
          color: #64748b;
          text-align: center
        }

        .meta {
          text-align: center;
          width: 100%;
        }

        .btn {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          color: #fff;
          transition: opacity .15s;
          margin-top: 4px
        }

        .btn:disabled {
          opacity: .5;
          cursor: default
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          display: none
        }

        .step {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #475569
        }

        .step.done {
          color: #22c55e
        }

        .step.active {
          color: #f1f5f9;
          font-weight: 500
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0
        }

        .step.done .dot {
          background: #22c55e
        }

        .error {
          background: #2d1a1a;
          border: 1px solid #7f1d1d;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 13px;
          color: #fca5a5;
          width: 100%;
          text-align: center;
          display: none
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #2d3148;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          display: none
        }

        @keyframes spin {
          to {
            transform: rotate(360deg)
          }
        }
      </style>
    </head>

    <body>
      <div class="card">
        <div class="avatar"><?php echo esc_html($initials); ?></div>
        <div class="meta">
          <div class="title">Continue as</div>
          <div class="email"><?php echo esc_html($safeEmail); ?></div>
          <?php if ($fromLabel): ?>
            <div class="from">from <?php echo esc_html($fromLabel); ?></div>
          <?php endif; ?>
        </div>

        <button class="btn" id="confirm-btn">Continue</button>
        <div class="spinner" id="spinner"></div>

        <div class="steps" id="steps">
          <div class="step" id="s0"><span class="dot"></span>Verifying browser context</div>
          <div class="step" id="s1"><span class="dot"></span>Collecting device details</div>
          <div class="step" id="s2"><span class="dot"></span>Validating web key &amp; session</div>
          <div class="step" id="s3"><span class="dot"></span>Signing in &amp; redirecting</div>
        </div>

        <div class="error" id="error-box"></div>
      </div>

      <script>
        (function() {
          var AUTH_KEY = <?php echo wp_json_encode($jsonToken, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
          var VALIDATE_URL = <?php echo wp_json_encode($validateUrl); ?>;
          var STEPS = ['s0', 's1', 's2', 's3'];

          function h(input) {
            var v = 5381;
            for (var i = 0; i < input.length; i++) v = (v * 33) ^ input.charCodeAt(i);
            return (v >>> 0).toString(16);
          }

          function deviceContext() {
            var ua = navigator.userAgent || '';
            var lang = navigator.language || '';
            var plat = navigator.platform || '';
            var scr = (window.screen ? window.screen.width + 'x' + window.screen.height : '0x0');
            var tz = (Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') || '';
            var fp = h([ua, lang, plat, scr, tz].join('|'));

            var browser = 'Unknown';
            if (ua.indexOf('Edg/') > -1) browser = 'Edge';
            else if (ua.indexOf('OPR/') > -1) browser = 'Opera';
            else if (ua.indexOf('Chrome/') > -1) browser = 'Chrome';
            else if (ua.indexOf('Firefox/') > -1) browser = 'Firefox';
            else if (ua.indexOf('Safari/') > -1) browser = 'Safari';

            var haystack = (ua + ' ' + plat).toLowerCase();
            var os = 'Unknown';
            if (haystack.indexOf('win') > -1) os = 'Windows';
            else if (haystack.indexOf('mac') > -1 || haystack.indexOf('darwin') > -1) os = 'macOS';
            else if (haystack.indexOf('android') > -1) os = 'Android';
            else if (haystack.indexOf('iphone') > -1 || haystack.indexOf('ipad') > -1) os = 'iOS';
            else if (haystack.indexOf('linux') > -1) os = 'Linux';

            return {
              device_fingerprint: fp,
              browser: browser,
              os: os,
              platform: plat,
              screen_resolution: scr,
              timezone: tz,
              accept_language: lang
            };
          }

          function setStep(i) {
            STEPS.forEach(function(id, idx) {
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

          document.getElementById('confirm-btn').addEventListener('click', function() {
            var btn = document.getElementById('confirm-btn');
            btn.disabled = true;
            document.getElementById('error-box').style.display = 'none';
            document.getElementById('spinner').style.display = 'block';
            document.getElementById('steps').style.display = 'flex';
            setStep(0);

            var ctx = deviceContext();
            var body = Object.assign({
              auth_token: AUTH_KEY
            }, ctx);

            var stepTimers = [
              setTimeout(function() {
                setStep(1);
              }, 400),
              setTimeout(function() {
                setStep(2);
              }, 900),
            ];

            fetch(VALIDATE_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(body),
              })
              .then(function(res) {
                return res.json().then(function(data) {
                  return {
                    ok: res.ok,
                    data: data
                  };
                });
              })
              .then(function(result) {
                stepTimers.forEach(clearTimeout);
                if (!result.ok || !result.data.success) {
                  showError(result.data.message || 'Authentication failed.');
                  return;
                }
                setStep(3);
                setTimeout(function() {
                  window.location.href = result.data.redirect_url;
                }, 500);
              })
              .catch(function() {
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
}
