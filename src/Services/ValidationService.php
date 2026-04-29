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

    public function validate($authKey, $currentWebKey, $currentHost, $deviceFingerprint, $ip, $userAgent)
    {
        $settings = SettingsRepository::getInstance()->getSettings();
        $data = $this->decodeAuthKey($authKey);
        if (empty($data)) {
            return array('ok' => false, 'reason' => 'invalid_key');
        }

        $payload = $data['payload'];
        $signature = $data['signature'];

        $payloadJson = wp_json_encode($payload, JSON_UNESCAPED_SLASHES);
        $expectedSignature = hash_hmac('sha256', $payloadJson, (string) $currentWebKey);

        if (!hash_equals($expectedSignature, $signature)) {
            return array('ok' => false, 'reason' => 'invalid_signature');
        }

        if (empty($payload['exp']) || (int) $payload['exp'] < time()) {
            return array('ok' => false, 'reason' => 'token_expired');
        }

        if (!empty($payload['to_product_url'])) {
            $targetHost = wp_parse_url($payload['to_product_url'], PHP_URL_HOST);
            if ($targetHost && strtolower($targetHost) !== strtolower($currentHost)) {
                return array('ok' => false, 'reason' => 'unauthorized_product');
            }
        }

        if (!empty($settings['strict_device_binding'])) {
            if (!empty($payload['device_fingerprint']) && $payload['device_fingerprint'] !== $deviceFingerprint) {
                return array('ok' => false, 'reason' => 'device_mismatch');
            }

            if (!empty($payload['user_agent']) && $payload['user_agent'] !== $userAgent) {
                return array('ok' => false, 'reason' => 'device_mismatch');
            }
        }

        if (!empty($settings['strict_ip_binding'])) {
            if (!empty($payload['ip']) && $payload['ip'] !== $ip) {
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
