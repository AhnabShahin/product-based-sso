<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class SettingsController
{
    use Singleton;

    public function registerRoutes()
    {
        register_rest_route('product-sso/v1', '/settings', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'getSettings'),
                'permission_callback' => array($this, 'canManage'),
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'updateSettings'),
                'permission_callback' => array($this, 'canManage'),
            ),
        ));
    }

    public function getSettings()
    {
        return rest_ensure_response(SettingsRepository::getInstance()->getSettings());
    }

    public function updateSettings($request)
    {
        $data = $request->get_json_params();
        $data = is_array($data) ? $data : array();
        SettingsRepository::getInstance()->updateSettings($this->sanitizeSettings($data));
        return rest_ensure_response(SettingsRepository::getInstance()->getSettings());
    }

    public function canManage()
    {
        return current_user_can('manage_options');
    }

    private function sanitizeSettings($data)
    {
        return array(
            'token_lifetime' => isset($data['token_lifetime']) ? max(10, min(120, (int) $data['token_lifetime'])) : 30,
            'open_product_target' => (isset($data['open_product_target']) && $data['open_product_target'] === 'new_tab') ? 'new_tab' : 'self',
            'strict_device_binding' => !empty($data['strict_device_binding']),
            'strict_ip_binding' => !empty($data['strict_ip_binding']),
            'ip_tolerance' => (isset($data['ip_tolerance']) && $data['ip_tolerance'] === 'any') ? 'any' : 'subnet',
            'allow_same_site_reauth' => !empty($data['allow_same_site_reauth']),
            'rate_limit_enabled' => !empty($data['rate_limit_enabled']),
            'rate_limit_attempts' => isset($data['rate_limit_attempts']) ? max(1, (int) $data['rate_limit_attempts']) : 5,
            'rate_limit_window' => isset($data['rate_limit_window']) ? max(1, (int) $data['rate_limit_window']) : 60,
            'logging_enabled' => !empty($data['logging_enabled']),
            'require_https' => !empty($data['require_https']),
        );
    }
}
