<?php

namespace ProductBasedSSO\Services;

use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class WebKeyService
{
    use Singleton;

    public function getWebKey()
    {
        return SettingsRepository::getInstance()->getWebKey();
    }

    public function getOrCreateWebKey()
    {
        $key = $this->getWebKey();
        if (!empty($key)) {
            return $key;
        }

        return $this->generateWebKey(wp_generate_password(12, true, true));
    }

    public function generateWebKey($pin)
    {
        $material = sprintf('%s|%s|%s', (string) $pin, wp_generate_uuid4(), bin2hex(random_bytes(16)));
        $key = 'wk_' . hash('sha256', $material);
        SettingsRepository::getInstance()->setWebKey($key);
        return $key;
    }
}
