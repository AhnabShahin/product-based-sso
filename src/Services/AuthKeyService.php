<?php

namespace ProductBasedSSO\Services;

use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class AuthKeyService
{
    use Singleton;

    public function generateAuthKey($user, $product, $context = array())
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        $ttl = isset($settings['token_lifetime']) ? (int) $settings['token_lifetime'] : 30;
        $ttl = min(120, max(10, $ttl));
        $now = time();
        $nonce = wp_generate_password(24, false, false);

        $context = is_array($context) ? $context : array();
        $deviceFingerprint = isset($context['device_fingerprint']) ? (string) $context['device_fingerprint'] : '';
        $ip = isset($context['ip']) ? (string) $context['ip'] : '';
        $userAgent = isset($context['user_agent']) ? (string) $context['user_agent'] : '';
        $browser = isset($context['browser']) ? (string) $context['browser'] : '';
        $os = isset($context['os']) ? (string) $context['os'] : '';
        $platform = isset($context['platform']) ? (string) $context['platform'] : '';
        $screenResolution = isset($context['screen_resolution']) ? (string) $context['screen_resolution'] : '';
        $timezone = isset($context['timezone']) ? (string) $context['timezone'] : '';
        $acceptLanguage = isset($context['accept_language']) ? (string) $context['accept_language'] : '';
        $redirectUrl = !empty($product['page_url']) ? esc_url_raw($product['page_url']) : home_url('/');

        $payload = array(
            'email' => $user->user_email,
            'ip' => (string) $ip,
            'device_fingerprint' => (string) $deviceFingerprint,
            'user_agent' => (string) $userAgent,
            'browser' => $browser,
            'os' => $os,
            'platform' => $platform,
            'screen_resolution' => $screenResolution,
            'timezone' => $timezone,
            'accept_language' => $acceptLanguage,
            'security_controls' => array(
                'strict_device_binding',
                'exact_ip_match',
                'https_only',
                'nonce_protected',
                'web_key_signed',
                'short_lived_token',
            ),
            'target_web_key_hash' => hash('sha256', (string) $product['web_key']),
            'security_pin' => 'protected_by_target_web_key',
            'nonce' => $nonce,
            'token_lifetime' => $ttl,
            'product_id' => (int) $product['id'],
            'from_product' => home_url(),
            'to_product_url' => $product['page_url'],
            'redirect_url' => $redirectUrl,
            'iat' => $now,
            'exp' => $now + $ttl,
        );

        $payloadJson = wp_json_encode($payload, JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $payloadJson, (string) $product['web_key']);

        $token = array(
            'payload' => $payload,
            'signature' => $signature,
        );

        return base64_encode(wp_json_encode($token, JSON_UNESCAPED_SLASHES));
    }
}
