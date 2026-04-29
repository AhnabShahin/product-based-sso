<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Repositories\LogRepository;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class LogsController
{
    use Singleton;

    public function registerRoutes()
    {
        register_rest_route('product-sso/v1', '/logs', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'getLogs'),
                'permission_callback' => array($this, 'canManage'),
            ),
            array(
                'methods' => 'DELETE',
                'callback' => array($this, 'clearLogs'),
                'permission_callback' => array($this, 'canManage'),
            ),
        ));
    }

    public function getLogs($request)
    {
        $args = array(
            'limit' => (int) $request->get_param('limit'),
            'offset' => (int) $request->get_param('offset'),
            'filter' => $request->get_param('filter'),
        );
        $logs = LogRepository::getInstance()->getLogs($args);
        return rest_ensure_response($logs);
    }

    public function clearLogs()
    {
        LogRepository::getInstance()->clear();
        return rest_ensure_response(array('ok' => true));
    }

    public function canManage()
    {
        return current_user_can('manage_options');
    }
}
