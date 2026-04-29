<?php

namespace ProductBasedSSO\Admin;

use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class AdminController
{
    use Singleton;

    protected function init()
    {
        add_action('admin_menu', array($this, 'registerMenu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueueAssets'));
    }

    public function registerMenu()
    {
        add_menu_page(
            'Product SSO',
            'Product SSO',
            'manage_options',
            'product-based-sso',
            array($this, 'renderPage'),
            'dashicons-shield-alt',
            58
        );
    }

    public function renderPage()
    {
        echo '<div class="product-based-sso-admin"><div id="product-based-sso-root"></div></div>';
    }

    public function enqueueAssets($hook)
    {
        if ($hook !== 'toplevel_page_product-based-sso') {
            return;
        }

        $asset_path = PRODUCT_BASED_SSO_PLUGIN_DIR . 'ui-src-build/index.asset.php';
        $asset = array('dependencies' => array(), 'version' => PRODUCT_BASED_SSO_VERSION);
        if (file_exists($asset_path)) {
            $asset = include $asset_path;
        }

        wp_enqueue_style(
            'product-based-sso-admin',
            PRODUCT_BASED_SSO_PLUGIN_URL . 'ui-src-build/admin-ui.css',
            array(),
            PRODUCT_BASED_SSO_VERSION
        );

        wp_enqueue_script(
            'product-based-sso-admin',
            PRODUCT_BASED_SSO_PLUGIN_URL . 'ui-src-build/index.js',
            isset($asset['dependencies']) ? $asset['dependencies'] : array(),
            isset($asset['version']) ? $asset['version'] : PRODUCT_BASED_SSO_VERSION,
            true
        );

        wp_localize_script('product-based-sso-admin', 'ProductBasedSSOAdmin', array(
            'apiBase' => esc_url_raw(rest_url('product-sso/v1')),
            'nonce' => wp_create_nonce('wp_rest'),
        ));
    }
}
