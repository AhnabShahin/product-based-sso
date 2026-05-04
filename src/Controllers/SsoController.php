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
        $authKey = $this->getAuthToken();
        if (empty($authKey) && !get_query_var('product_sso')) {
            return;
        }

        $settings = SettingsRepository::getInstance()->getSettings();
        if (!empty($settings['require_https']) && !is_ssl()) {
            wp_die('HTTPS required for SSO.', 'SSO Error', array('response' => 400));
        }

        if (empty($authKey)) {
            wp_die('Invalid auth key.', 'SSO Error', array('response' => 400));
        }

        AuthKeyRepository::getInstance()->cleanupExpired();
        $authHash = AuthKeyRepository::getInstance()->hashAuthKey($authKey);
        $existing = AuthKeyRepository::getInstance()->findValidByHash($authHash);
        if (!empty($existing)) {
            $redirect = !empty($existing['redirect_url']) ? $existing['redirect_url'] : $this->getCleanCurrentUrl();
            wp_redirect($redirect);
            exit;
        }

        $context = $this->buildRequestContext();
        $ip = $context['ip'];
        if (RateLimitService::getInstance()->isLimited($ip, $settings)) {
            $this->logFailure('rate_limited', null, null, $ip, null, 'rate_limited');
            wp_die('Too many attempts. Please try again later.', 'SSO Error', array('response' => 429));
        }

        $currentHost = wp_parse_url(home_url(), PHP_URL_HOST);
        $webKey = WebKeyService::getInstance()->getOrCreateWebKey();

        $validation = ValidationService::getInstance()->validate(
            $authKey,
            $webKey,
            $currentHost,
            $context
        );

        if (empty($validation['ok'])) {
            $reason = isset($validation['reason']) ? $validation['reason'] : 'invalid_key';
            RateLimitService::getInstance()->recordFailure($ip, $settings);
            $this->logFailure($reason, null, null, $ip, $context['device_fingerprint'], $reason);
            wp_die('Unauthorized SSO request.', 'SSO Error', array('response' => 401));
        }

        $payload = $validation['payload'];
        if (!empty($payload['from_product'])) {
            $sourceHost = wp_parse_url($payload['from_product'], PHP_URL_HOST);
            $sourceProduct = ProductService::getInstance()->findByHost($sourceHost);
            if (empty($sourceProduct) || empty($sourceProduct['is_active'])) {
                $this->logFailure('untrusted_product', $payload, $sourceHost, $ip, $context['device_fingerprint'], 'untrusted_product');
                wp_die('Untrusted product.', 'SSO Error', array('response' => 403));
            }
        }

        if (!empty($payload['from_product']) && !empty($payload['to_product_url'])) {
            $fromHost = wp_parse_url($payload['from_product'], PHP_URL_HOST);
            $toHost = wp_parse_url($payload['to_product_url'], PHP_URL_HOST);
            if (empty($settings['allow_same_site_reauth']) && $fromHost && $toHost && strtolower($fromHost) === strtolower($toHost)) {
                $this->logFailure('same_site_blocked', $payload, $fromHost, $ip, $context['device_fingerprint'], 'same_site_blocked');
                wp_die('Same-site re-authentication is disabled.', 'SSO Error', array('response' => 403));
            }
        }

        $email = isset($payload['email']) ? sanitize_email($payload['email']) : '';
        $user = !empty($email) ? get_user_by('email', $email) : null;
        if (empty($user)) {
            $this->logFailure('user_not_found', $payload, null, $ip, $context['device_fingerprint'], 'user_not_found');
            wp_die('User not found.', 'SSO Error', array('response' => 404));
        }

        if (is_user_logged_in()) {
            wp_logout();
        }

        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);
        do_action('wp_login', $user->user_login, $user);

        $expiresAt = gmdate('Y-m-d H:i:s', (int) $payload['exp']);
        $redirectUrl = !empty($payload['redirect_url']) ? esc_url_raw($payload['redirect_url']) : $this->getCleanCurrentUrl();

        AuthKeyRepository::getInstance()->insert(array(
            'auth_key_hash' => $authHash,
            'user_id' => (int) $user->ID,
            'email' => $email,
            'ip_address' => $ip,
            'device_fingerprint' => $context['device_fingerprint'],
            'user_agent' => $context['user_agent'],
            'source_product' => isset($payload['from_product']) ? $payload['from_product'] : '',
            'target_product' => isset($payload['to_product_url']) ? $payload['to_product_url'] : '',
            'redirect_url' => $redirectUrl,
            'expires_at' => $expiresAt,
            'created_at' => gmdate('Y-m-d H:i:s'),
        ));

        $this->logSuccess($payload, $ip, $context['device_fingerprint']);

        wp_redirect($redirectUrl);
        exit;
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
