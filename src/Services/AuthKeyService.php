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

    public function generateAuthKey($user, $product, $deviceFingerprint, $ip, $userAgent)
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        $ttl = isset($settings['token_lifetime']) ? (int) $settings['token_lifetime'] : 30;
        $ttl = min(30, max(10, $ttl));
        $now = time();

        $payload = array(
            'email' => $user->user_email,
            'ip' => (string) $ip,
            'device_fingerprint' => (string) $deviceFingerprint,
            'user_agent' => (string) $userAgent,
            'product_id' => (int) $product['id'],
            'from_product' => home_url(),
            'to_product_url' => $product['page_url'],
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
