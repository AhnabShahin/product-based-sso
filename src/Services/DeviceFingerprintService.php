<?php

namespace ProductBasedSSO\Services;

use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class DeviceFingerprintService
{
    use Singleton;

    public function normalize($value)
    {
        return strtolower(trim((string) $value));
    }

    public function buildFingerprint($userAgent, $acceptLanguage, $platform = '', $screen = '', $timezone = '')
    {
        $parts = array(
            $this->normalize($userAgent),
            $this->normalize($acceptLanguage),
            $this->normalize($platform),
            $this->normalize($screen),
            $this->normalize($timezone),
        );

        return hash('sha256', implode('|', $parts));
    }
}
