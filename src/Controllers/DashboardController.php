<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Core\Database;
use ProductBasedSSO\Repositories\LogRepository;
use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Services\WebKeyService;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class DashboardController
{
    use Singleton;

    public function registerRoutes()
    {
        register_rest_route('product-sso/v1', '/dashboard', array(
            'methods' => 'GET',
            'callback' => array($this, 'getDashboard'),
            'permission_callback' => array($this, 'canManage'),
        ));
    }

    public function getDashboard()
    {
        global $wpdb;

        $logsTable = Database::getInstance()->getLogsTable();
        $totalAuths = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$logsTable}");
        $successAuths = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$logsTable} WHERE event_type = %s",
            'success'
        ));
        $failedAuths = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$logsTable} WHERE event_type != %s",
            'success'
        ));

        $recentLogs = LogRepository::getInstance()->getLogs(array('limit' => 6));
        $products = SettingsRepository::getInstance()->getProducts();
        $activeProducts = count(array_filter($products, function ($p) {
            return !empty($p['is_active']);
        }));

        return rest_ensure_response(array(
            'site' => array(
                'name' => get_bloginfo('name'),
                'url' => home_url(),
                'web_key_set' => !empty(WebKeyService::getInstance()->getWebKey()),
                'total_products' => count($products),
                'active_products' => $activeProducts,
            ),
            'stats' => array(
                'total_auths' => $totalAuths,
                'success_auths' => $successAuths,
                'failed_auths' => $failedAuths,
                'avg_response_ms' => null,
            ),
            'recent_logs' => $recentLogs,
        ));
    }

    public function canManage()
    {
        return current_user_can('manage_options');
    }
}
