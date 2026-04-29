<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Services\WebKeyService;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class WebKeyController
{
    use Singleton;

    public function registerRoutes()
    {
        register_rest_route('product-sso/v1', '/web-key', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'getWebKey'),
                'permission_callback' => array($this, 'canManage'),
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'regenerateWebKey'),
                'permission_callback' => array($this, 'canManage'),
            ),
        ));
    }

    public function getWebKey()
    {
        $key = WebKeyService::getInstance()->getOrCreateWebKey();
        return rest_ensure_response(array(
            'web_key' => $key,
        ));
    }

    public function regenerateWebKey($request)
    {
        $params = $request->get_json_params();
        $pin = isset($params['pin']) ? sanitize_text_field($params['pin']) : '';
        if (strlen($pin) < 4) {
            return new \WP_Error('invalid_pin', 'PIN must be at least 4 characters', array('status' => 400));
        }

        $key = WebKeyService::getInstance()->generateWebKey($pin);
        return rest_ensure_response(array(
            'web_key' => $key,
        ));
    }

    public function canManage()
    {
        return current_user_can('manage_options');
    }
}
