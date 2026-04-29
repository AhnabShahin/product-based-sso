<?php

namespace ProductBasedSSO\Repositories;

use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class SettingsRepository
{
    use Singleton;

    public function getSettings()
    {
        $defaults = array(
            'token_lifetime' => 30,
            'strict_device_binding' => true,
            'strict_ip_binding' => false,
            'ip_tolerance' => 'subnet',
            'allow_same_site_reauth' => false,
            'rate_limit_enabled' => true,
            'rate_limit_attempts' => 5,
            'rate_limit_window' => 60,
            'logging_enabled' => true,
            'require_https' => true,
        );

        $settings = get_option('product_based_sso_settings', array());
        return array_merge($defaults, is_array($settings) ? $settings : array());
    }

    public function updateSettings($data)
    {
        return update_option('product_based_sso_settings', $data);
    }

    public function getProducts()
    {
        $products = get_option('product_based_sso_products', array());
        return is_array($products) ? $products : array();
    }

    public function saveProducts($products)
    {
        return update_option('product_based_sso_products', $products);
    }

    public function getWebKey()
    {
        return (string) get_option('product_based_sso_web_key', '');
    }

    public function setWebKey($webKey)
    {
        return update_option('product_based_sso_web_key', (string) $webKey);
    }
}
