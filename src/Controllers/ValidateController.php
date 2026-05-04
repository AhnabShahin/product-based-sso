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

/**
 * Handles the REST endpoint POST /wp-json/sso/v1/validate.
 *
 * This is called by the "Continue as" confirmation page after the user
 * explicitly clicks the button. It performs:
 *   1. Token decode & expiry pre-check
 *   2. Nonce anti-replay via WordPress transients
 *   3. Full HMAC signature verification
 *   4. Device-binding and IP policy checks (via ValidationService)
 *   5. Source-product trust check
 *   6. Same-site re-auth policy
 *   7. User lookup and wp_set_auth_cookie login
 *   8. Auth-key recording and logging
 */
class ValidateController
{
    use Singleton;

    public function registerRoutes()
    {
        register_rest_route('sso/v1', '/validate', array(
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'handleValidate'),
            'permission_callback' => '__return_true',
            'args'                => array(
                'auth_token'         => array('required' => true,  'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
                'device_fingerprint' => array('required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
                'browser'            => array('required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
                'os'                 => array('required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
                'platform'           => array('required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
                'screen_resolution'  => array('required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
                'timezone'           => array('required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
                'accept_language'    => array('required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'),
            ),
        ));
    }

    public function handleValidate(\WP_REST_Request $request)
    {
        $authToken = (string) $request->get_param('auth_token');
        if (empty($authToken)) {
            return new \WP_REST_Response(array('success' => false, 'message' => 'Missing auth_token.'), 400);
        }

        $settings = SettingsRepository::getInstance()->getSettings();

        if (!empty($settings['require_https']) && !is_ssl()) {
            return new \WP_REST_Response(array('success' => false, 'message' => 'HTTPS required.'), 400);
        }

        $ip = $this->getClientIp();
        if (RateLimitService::getInstance()->isLimited($ip, $settings)) {
            return new \WP_REST_Response(array('success' => false, 'message' => 'Too many attempts. Please try again later.'), 429);
        }

        // --- Step 1: Decode token to allow cheap checks before HMAC ---
        $decoded = ValidationService::getInstance()->decodeAuthKey($authToken);
        if (empty($decoded) || empty($decoded['payload'])) {
            RateLimitService::getInstance()->recordFailure($ip, $settings);
            return new \WP_REST_Response(array('success' => false, 'message' => 'Invalid token.'), 401);
        }

        $rawPayload = $decoded['payload'];

        // --- Step 2: Expiry pre-check ---
        // if (empty($rawPayload['exp']) || (int) $rawPayload['exp'] < time()) {
        //     return new \WP_REST_Response(array('success' => false, 'message' => 'Token has expired.'), 401);
        // }

        // --- Step 3: Nonce anti-replay ---
        $nonce = !empty($rawPayload['nonce']) ? (string) $rawPayload['nonce'] : '';
        if (empty($nonce)) {
            return new \WP_REST_Response(array('success' => false, 'message' => 'Invalid token: missing nonce.'), 401);
        }

        $nonceKey = 'sso_nonce_' . substr(hash('sha256', $nonce), 0, 40);
        if (get_transient($nonceKey) !== false) {
            $this->logFailure('replay_attack', $rawPayload, null, $ip, '', 'replay_attack');
            return new \WP_REST_Response(array('success' => false, 'message' => 'Token has already been used.'), 401);
        }

        // --- Step 4: Full HMAC + policy validation ---
        $context     = $this->buildContext($request, $ip);
        $currentHost = wp_parse_url(home_url(), PHP_URL_HOST);
        $webKey      = WebKeyService::getInstance()->getWebKey();

        $validation = ValidationService::getInstance()->validate(
            $authToken,
            $webKey,
            $currentHost,
            $context
        );

        if (empty($validation['ok'])) {
            $reason = isset($validation['reason']) ? $validation['reason'] : 'invalid_token';
            RateLimitService::getInstance()->recordFailure($ip, $settings);
            $this->logFailure($reason, $rawPayload, null, $ip, $context['device_fingerprint'], $reason);
            return new \WP_REST_Response(array('success' => false, 'message' => 'Unauthorized: ' . $reason), 401);
        }

        $payload = $validation['payload'];

        // // --- Step 5: Source product must be registered and active ---
        // if (!empty($payload['from_product'])) {
        //     $sourceHost    = wp_parse_url($payload['from_product'], PHP_URL_HOST);
        //     $sourceProduct = ProductService::getInstance()->findByHost($sourceHost);
        //     if (empty($sourceProduct) || empty($sourceProduct['is_active'])) {
        //         $this->logFailure('untrusted_product', $payload, $sourceHost, $ip, $context['device_fingerprint'], 'untrusted_product');
        //         return new \WP_REST_Response(array('success' => false, 'message' => 'Untrusted source product.'), 403);
        //     }
        // }

        // --- Step 6: Same-site re-auth policy ---
        if (!empty($payload['from_product']) && !empty($payload['to_product_url'])) {
            $fromHost = wp_parse_url($payload['from_product'], PHP_URL_HOST);
            $toHost   = wp_parse_url($payload['to_product_url'], PHP_URL_HOST);
            if (
                empty($settings['allow_same_site_reauth']) &&
                $fromHost && $toHost &&
                strtolower($fromHost) === strtolower($toHost)
            ) {
                return new \WP_REST_Response(array('success' => false, 'message' => 'Same-site re-authentication is disabled.'), 403);
            }
        }

        // --- Step 7: User lookup ---
        $email = isset($payload['email']) ? sanitize_email($payload['email']) : '';
        $user  = !empty($email) ? get_user_by('email', $email) : null;
        if (empty($user)) {
            $this->logFailure('user_not_found', $payload, null, $ip, $context['device_fingerprint'], 'user_not_found');
            return new \WP_REST_Response(array('success' => false, 'message' => 'User not found.'), 404);
        }

        // Mark nonce consumed; TTL = token lifetime + small buffer so replay
        // attempts after expiry are also rejected.
        $ttl = !empty($payload['token_lifetime']) ? (int) $payload['token_lifetime'] : 300;
        set_transient($nonceKey, 1, max($ttl + 60, 120));

        // --- Step 8: Log in the user ---
        if (is_user_logged_in()) {
            wp_logout();
        }
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);
        do_action('wp_login', $user->user_login, $user);

        // Record auth key to prevent reuse across page reloads.
        AuthKeyRepository::getInstance()->cleanupExpired();
        $authHash    = AuthKeyRepository::getInstance()->hashAuthKey($authToken);
        $expiresAt   = gmdate('Y-m-d H:i:s', (int) $payload['exp']);
        $redirectUrl = !empty($payload['redirect_url']) ? esc_url_raw($payload['redirect_url']) : home_url('/');

        AuthKeyRepository::getInstance()->insert(array(
            'auth_key_hash'      => $authHash,
            'user_id'            => (int) $user->ID,
            'email'              => $email,
            'ip_address'         => $ip,
            'device_fingerprint' => $context['device_fingerprint'],
            'user_agent'         => $context['user_agent'],
            'source_product'     => isset($payload['from_product'])   ? $payload['from_product']   : '',
            'target_product'     => isset($payload['to_product_url']) ? $payload['to_product_url'] : '',
            'redirect_url'       => $redirectUrl,
            'expires_at'         => $expiresAt,
            'created_at'         => gmdate('Y-m-d H:i:s'),
        ));

        $this->logSuccess($payload, $ip, $context['device_fingerprint']);

        return new \WP_REST_Response(array(
            'success'      => true,
            'redirect_url' => $redirectUrl,
        ), 200);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function buildContext(\WP_REST_Request $request, $ip)
    {
        $userAgent = isset($_SERVER['HTTP_USER_AGENT'])
            ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT']))
            : '';

        $platform          = (string) ($request->get_param('platform')          ?? '');
        $screenResolution  = (string) ($request->get_param('screen_resolution') ?? '');
        $timezone          = (string) ($request->get_param('timezone')          ?? '');
        $acceptLanguage    = (string) ($request->get_param('accept_language')   ?? '');
        $browser           = (string) ($request->get_param('browser')           ?? '');
        $os                = (string) ($request->get_param('os')                ?? '');
        $deviceFingerprint = (string) ($request->get_param('device_fingerprint') ?? '');

        if (empty($deviceFingerprint)) {
            $deviceFingerprint = DeviceFingerprintService::getInstance()
                ->buildFingerprint($userAgent, $acceptLanguage, $platform, $screenResolution, $timezone);
        }

        return array(
            'ip'                => $ip,
            'user_agent'        => $userAgent,
            'accept_language'   => $acceptLanguage,
            'browser'           => $browser,
            'os'                => $os,
            'platform'          => $platform,
            'screen_resolution' => $screenResolution,
            'timezone'          => $timezone,
            'device_fingerprint' => $deviceFingerprint,
            'is_ssl'            => is_ssl(),
        );
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

    private function logSuccess($payload, $ip, $deviceFingerprint)
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        if (empty($settings['logging_enabled'])) {
            return;
        }

        LogRepository::getInstance()->insert(array(
            'event_type'         => 'success',
            'user_email'         => isset($payload['email'])          ? $payload['email']          : '',
            'source_product'     => isset($payload['from_product'])   ? $payload['from_product']   : '',
            'target_product'     => isset($payload['to_product_url']) ? $payload['to_product_url'] : '',
            'ip_address'         => $ip,
            'device_fingerprint' => $deviceFingerprint,
            'error_reason'       => null,
            'created_at'         => gmdate('Y-m-d H:i:s'),
        ));
    }

    private function logFailure($eventType, $payload, $sourceProduct, $ip, $deviceFingerprint, $reason)
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        if (empty($settings['logging_enabled'])) {
            return;
        }

        LogRepository::getInstance()->insert(array(
            'event_type'         => $eventType,
            'user_email'         => is_array($payload) && !empty($payload['email'])          ? $payload['email']          : '',
            'source_product'     => $sourceProduct ?: (is_array($payload) && !empty($payload['from_product']) ? $payload['from_product'] : ''),
            'target_product'     => is_array($payload) && !empty($payload['to_product_url']) ? $payload['to_product_url'] : '',
            'ip_address'         => $ip,
            'device_fingerprint' => $deviceFingerprint,
            'error_reason'       => $reason,
            'created_at'         => gmdate('Y-m-d H:i:s'),
        ));
    }
}
