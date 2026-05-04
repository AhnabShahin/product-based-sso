<?php

namespace ProductBasedSSO\Services;

use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class ValidationService
{
    use Singleton;

    public function decodeAuthKey($authKey)
    {
        $decoded = base64_decode((string) $authKey, true);
        if ($decoded === false) {
            return null;
        }

        $data = json_decode($decoded, true);
        if (!is_array($data) || empty($data['payload']) || empty($data['signature'])) {
            return null;
        }

        return $data;
    }

    public function validate($authKey, $currentWebKey, $currentHost, $context = array())
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        $data = $this->decodeAuthKey($authKey);
        if (empty($data)) {
            return array('ok' => false, 'reason' => 'invalid_key');
        }

        $context = is_array($context) ? $context : array();
        $deviceFingerprint = isset($context['device_fingerprint']) ? (string) $context['device_fingerprint'] : '';
        $ip = isset($context['ip']) ? (string) $context['ip'] : '';
        $userAgent = isset($context['user_agent']) ? (string) $context['user_agent'] : '';
        $browser = isset($context['browser']) ? (string) $context['browser'] : '';
        $os = isset($context['os']) ? (string) $context['os'] : '';
        $screenResolution = isset($context['screen_resolution']) ? (string) $context['screen_resolution'] : '';
        $acceptLanguage = isset($context['accept_language']) ? (string) $context['accept_language'] : '';
        $isSsl = !empty($context['is_ssl']);

        $payload = $data['payload'];
        $signature = $data['signature'];
        $securityControls = !empty($payload['security_controls']) && is_array($payload['security_controls']) ? $payload['security_controls'] : array();

        $payloadJson = wp_json_encode($payload, JSON_UNESCAPED_SLASHES);
        $expectedSignature = hash_hmac('sha256', $payloadJson, (string) $currentWebKey);

        if (!hash_equals($expectedSignature, $signature)) {
            return array('ok' => false, 'reason' => 'invalid_signature');
        }

        // if (empty($payload['exp']) || (int) $payload['exp'] < time()) {
        //     return array('ok' => false, 'reason' => 'token_expired');
        // }

        // if (in_array('https_only', $securityControls, true) && !$isSsl) {
        //     return array('ok' => false, 'reason' => 'https_required');
        // }

        if (!empty($payload['target_web_key_hash']) && !hash_equals((string) $payload['target_web_key_hash'], hash('sha256', (string) $currentWebKey))) {
            return array('ok' => false, 'reason' => 'invalid_web_key');
        }

        if (empty($payload['nonce'])) {
            return array('ok' => false, 'reason' => 'invalid_nonce');
        }

        // if (!empty($payload['to_product_url'])) {
        //     $targetHost = wp_parse_url($payload['to_product_url'], PHP_URL_HOST);
        //     if ($targetHost && strtolower($targetHost) !== strtolower($currentHost)) {
        //         return array('ok' => false, 'reason' => 'unauthorized_product');
        //     }
        // }

        // if (in_array('strict_device_binding', $securityControls, true)) {
        //     if (!empty($payload['device_fingerprint']) && !empty($deviceFingerprint) && $payload['device_fingerprint'] !== $deviceFingerprint) {
        //         return array('ok' => false, 'reason' => 'device_mismatch');
        //     }

        //     if (!empty($payload['user_agent']) && !empty($userAgent) && $payload['user_agent'] !== $userAgent) {
        //         return array('ok' => false, 'reason' => 'device_mismatch');
        //     }

        //     if (!empty($payload['browser']) && !empty($browser) && strtolower($payload['browser']) !== strtolower($browser)) {
        //         return array('ok' => false, 'reason' => 'device_mismatch');
        //     }

        //     if (!empty($payload['os']) && !empty($os) && strtolower($payload['os']) !== strtolower($os)) {
        //         return array('ok' => false, 'reason' => 'device_mismatch');
        //     }

        //     if (!empty($payload['screen_resolution']) && !empty($screenResolution) && $payload['screen_resolution'] !== $screenResolution) {
        //         return array('ok' => false, 'reason' => 'device_mismatch');
        //     }

        //     if (!empty($payload['accept_language']) && !empty($acceptLanguage) && strtolower($payload['accept_language']) !== strtolower($acceptLanguage)) {
        //         return array('ok' => false, 'reason' => 'device_mismatch');
        //     }
        // }

        if (in_array('exact_ip_match', $securityControls, true)) {
            if (!empty($payload['ip']) && !empty($ip) && $payload['ip'] !== $ip) {
                return array('ok' => false, 'reason' => 'ip_mismatch');
            }
        } elseif (!empty($payload['ip']) && !empty($settings['ip_tolerance']) && $settings['ip_tolerance'] === 'subnet') {
            if (!$this->sameSubnet($payload['ip'], $ip)) {
                return array('ok' => false, 'reason' => 'ip_mismatch');
            }
        }

        return array('ok' => true, 'payload' => $payload);
    }

    private function sameSubnet($ipA, $ipB)
    {
        if (empty($ipA) || empty($ipB)) {
            return false;
        }

        $a = explode('.', $ipA);
        $b = explode('.', $ipB);
        if (count($a) < 3 || count($b) < 3) {
            return $ipA === $ipB;
        }

        return $a[0] === $b[0] && $a[1] === $b[1] && $a[2] === $b[2];
    }
}
