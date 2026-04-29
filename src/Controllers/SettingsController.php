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
        SettingsRepository::getInstance()->updateSettings($data);
        return rest_ensure_response(SettingsRepository::getInstance()->getSettings());
    }

    public function canManage()
    {
        return current_user_can('manage_options');
    }
}
