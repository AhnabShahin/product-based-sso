<?php
/**
 * Plugin Name: Product Based SSO
 * Plugin URI: https://example.com/product-based-sso
 * Description: Product-based cross-domain SSO for WordPress using short-lived auth keys.
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: product-based-sso
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PRODUCT_BASED_SSO_VERSION', '1.0.0');
define('PRODUCT_BASED_SSO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PRODUCT_BASED_SSO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PRODUCT_BASED_SSO_PLUGIN_FILE', __FILE__);

// Simple PSR-4 autoloader.
spl_autoload_register(function ($class) {
    $prefix = 'ProductBasedSSO\\';
    $base_dir = __DIR__ . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

class ProductBasedSSO_Plugin
{
    use ProductBasedSSO\Traits\Singleton;

    protected function init()
    {
        $this->initHooks();
    }

    private function initHooks()
    {
        register_activation_hook(PRODUCT_BASED_SSO_PLUGIN_FILE, array($this, 'activate'));
        register_deactivation_hook(PRODUCT_BASED_SSO_PLUGIN_FILE, array($this, 'deactivate'));

        add_action('plugins_loaded', array($this, 'initPlugin'), 1);
        add_action('init', array($this, 'registerRewriteRules'));
    }

    public function initPlugin()
    {
        ProductBasedSSO\Core\Database::getInstance();

        if (is_admin()) {
            ProductBasedSSO\Admin\AdminController::getInstance();
        }

        add_action('rest_api_init', function () {
            ProductBasedSSO\Controllers\DashboardController::getInstance()->registerRoutes();
            ProductBasedSSO\Controllers\ProductsController::getInstance()->registerRoutes();
            ProductBasedSSO\Controllers\WebKeyController::getInstance()->registerRoutes();
            ProductBasedSSO\Controllers\LogsController::getInstance()->registerRoutes();
            ProductBasedSSO\Controllers\SettingsController::getInstance()->registerRoutes();
            ProductBasedSSO\Controllers\SwitchController::getInstance()->registerRoutes();
        });

        add_filter('query_vars', array($this, 'registerQueryVars'));
        add_action('template_redirect', array(ProductBasedSSO\Controllers\SsoController::getInstance(), 'handleSsoRequest'));
        add_action('template_redirect', array(ProductBasedSSO\Controllers\SwitchController::getInstance(), 'handleSwitchRequest'));

        add_shortcode('product_sso_switcher', array(ProductBasedSSO\Controllers\SwitchController::getInstance(), 'renderSwitcher'));
    }

    public function activate()
    {
        ProductBasedSSO\Core\Database::createTables();
        $this->registerRewriteRules();
        flush_rewrite_rules();
    }

    public function deactivate()
    {
        flush_rewrite_rules();
    }

    public function registerRewriteRules()
    {
        add_rewrite_rule('^sso/?$', 'index.php?product_sso=1', 'top');
    }

    public function registerQueryVars($vars)
    {
        $vars[] = 'product_sso';
        $vars[] = 'product_sso_switch';
        return $vars;
    }
}

ProductBasedSSO_Plugin::getInstance();
