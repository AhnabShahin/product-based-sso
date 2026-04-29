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
        if (!get_query_var('product_sso')) {
            return;
        }

        $settings = SettingsRepository::getInstance()->getSettings();
        if (!empty($settings['require_https']) && !is_ssl()) {
            wp_die('HTTPS required for SSO.', 'SSO Error', array('response' => 400));
        }

        $authKey = isset($_GET['auth_key']) ? sanitize_text_field(wp_unslash($_GET['auth_key'])) : '';
        if (empty($authKey)) {
            wp_die('Invalid auth key.', 'SSO Error', array('response' => 400));
        }

        AuthKeyRepository::getInstance()->cleanupExpired();
        $authHash = AuthKeyRepository::getInstance()->hashAuthKey($authKey);
        $existing = AuthKeyRepository::getInstance()->findValidByHash($authHash);
        if (!empty($existing)) {
            $redirect = !empty($existing['redirect_url']) ? $existing['redirect_url'] : home_url();
            wp_redirect($redirect);
            exit;
        }

        $ip = $this->getClientIp();
        if (RateLimitService::getInstance()->isLimited($ip, $settings)) {
            $this->logFailure('rate_limited', null, null, $ip, null, 'rate_limited');
            wp_die('Too many attempts. Please try again later.', 'SSO Error', array('response' => 429));
        }

        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field($_SERVER['HTTP_USER_AGENT']) : '';
        $acceptLanguage = isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? sanitize_text_field($_SERVER['HTTP_ACCEPT_LANGUAGE']) : '';
        $deviceFingerprint = isset($_GET['device_fingerprint']) ? sanitize_text_field(wp_unslash($_GET['device_fingerprint'])) : '';
        if (empty($deviceFingerprint)) {
            $deviceFingerprint = DeviceFingerprintService::getInstance()->buildFingerprint($userAgent, $acceptLanguage);
        }

        $currentHost = wp_parse_url(home_url(), PHP_URL_HOST);
        $webKey = WebKeyService::getInstance()->getOrCreateWebKey();

        $validation = ValidationService::getInstance()->validate(
            $authKey,
            $webKey,
            $currentHost,
            $deviceFingerprint,
            $ip,
            $userAgent
        );

        if (empty($validation['ok'])) {
            $reason = isset($validation['reason']) ? $validation['reason'] : 'invalid_key';
            RateLimitService::getInstance()->recordFailure($ip, $settings);
            $this->logFailure($reason, null, null, $ip, $deviceFingerprint, $reason);
            wp_die('Unauthorized SSO request.', 'SSO Error', array('response' => 401));
        }

        $payload = $validation['payload'];
        if (!empty($payload['from_product'])) {
            $sourceHost = wp_parse_url($payload['from_product'], PHP_URL_HOST);
            $sourceProduct = ProductService::getInstance()->findByHost($sourceHost);
            if (empty($sourceProduct) || empty($sourceProduct['is_active'])) {
                $this->logFailure('untrusted_product', $payload, $sourceHost, $ip, $deviceFingerprint, 'untrusted_product');
                wp_die('Untrusted product.', 'SSO Error', array('response' => 403));
            }
        }

        if (!empty($payload['from_product']) && !empty($payload['to_product_url'])) {
            $fromHost = wp_parse_url($payload['from_product'], PHP_URL_HOST);
            $toHost = wp_parse_url($payload['to_product_url'], PHP_URL_HOST);
            if (empty($settings['allow_same_site_reauth']) && $fromHost && $toHost && strtolower($fromHost) === strtolower($toHost)) {
                $this->logFailure('same_site_blocked', $payload, $fromHost, $ip, $deviceFingerprint, 'same_site_blocked');
                wp_die('Same-site re-authentication is disabled.', 'SSO Error', array('response' => 403));
            }
        }

        $email = isset($payload['email']) ? sanitize_email($payload['email']) : '';
        $user = !empty($email) ? get_user_by('email', $email) : null;
        if (empty($user)) {
            $this->logFailure('user_not_found', $payload, null, $ip, $deviceFingerprint, 'user_not_found');
            wp_die('User not found.', 'SSO Error', array('response' => 404));
        }

        if (is_user_logged_in()) {
            wp_logout();
        }

        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);
        do_action('wp_login', $user->user_login, $user);

        $expiresAt = gmdate('Y-m-d H:i:s', (int) $payload['exp']);
        $redirectUrl = !empty($payload['to_product_url']) ? esc_url_raw($payload['to_product_url']) : home_url();

        AuthKeyRepository::getInstance()->insert(array(
            'auth_key_hash' => $authHash,
            'user_id' => (int) $user->ID,
            'email' => $email,
            'ip_address' => $ip,
            'device_fingerprint' => $deviceFingerprint,
            'user_agent' => $userAgent,
            'source_product' => isset($payload['from_product']) ? $payload['from_product'] : '',
            'target_product' => isset($payload['to_product_url']) ? $payload['to_product_url'] : '',
            'redirect_url' => $redirectUrl,
            'expires_at' => $expiresAt,
            'created_at' => gmdate('Y-m-d H:i:s'),
        ));

        $this->logSuccess($payload, $ip, $deviceFingerprint);

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
}
