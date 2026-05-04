<?php

namespace ProductBasedSSO\Services;

use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Traits\EncryptionTrait;
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

    public function getPin()
    {
        return SettingsRepository::getInstance()->getWebKeyPin();
    }

    public function hasKey()
    {
        return !empty($this->getWebKey()) && !empty($this->getPin());
    }

    public function generateWebKey($pin)
    {
        $material = sprintf('%s|%s|%s', (string) $pin, wp_generate_uuid4(), bin2hex(random_bytes(16)));
        $key = 'wk_' . hash('sha256', $material);
        SettingsRepository::getInstance()->setWebKey($key);
        SettingsRepository::getInstance()->setWebKeyPin((string) $pin);
        return $key;
    }

    /**
     * Encrypt a value using this site's stored PIN.
     * Used when sending auth tokens to remote sites.
     */
    public function encryptWithPin($data)
    {
        $pin = $this->getPin();
        if (empty($pin)) {
            return false;
        }
        return EncryptionTrait::encrypt($data, $pin);
    }

    /**
     * Decrypt an AES-encrypted token using this site's stored PIN.
     * Used when receiving auth_key from remote sites.
     */
    public function decryptWithPin($token)
    {
        $pin = $this->getPin();
        if (empty($pin)) {
            return false;
        }
        return EncryptionTrait::decrypt($token, $pin);
    }
}
