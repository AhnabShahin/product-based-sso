<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Repositories\SettingsRepository;
use ProductBasedSSO\Services\AuthKeyService;
use ProductBasedSSO\Services\DeviceFingerprintService;
use ProductBasedSSO\Services\ProductService;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class SwitchController
{
    use Singleton;

    public function enqueueAssets()
    {
        wp_enqueue_style(
            'product-based-sso-switch',
            PRODUCT_BASED_SSO_PLUGIN_URL . 'ui-src-build/sso-switch.css',
            array(),
            PRODUCT_BASED_SSO_VERSION
        );

        wp_enqueue_script(
            'product-based-sso-switch',
            PRODUCT_BASED_SSO_PLUGIN_URL . 'ui-src-build/frontend-switch.js',
            array(),
            PRODUCT_BASED_SSO_VERSION,
            true
        );

        wp_localize_script('product-based-sso-switch', 'ProductBasedSSO', array(
            'switchUrl' => home_url('/'),
        ));
    }

    public function renderSwitcher()
    {
        $products = ProductService::getInstance()->all();
        $products = array_filter($products, function ($product) {
            return !empty($product['is_active']);
        });

        ob_start();
        echo '<div class="product-sso-switcher">';
        echo '<h3>Switch to another product</h3>';
        if (empty($products)) {
            echo '<p class="product-sso-empty">No products configured.</p>';
        } else {
            echo '<ul class="product-sso-list">';
            foreach ($products as $product) {
                $id = (int) $product['id'];
                $name = esc_html($product['name']);
                $logo = !empty($product['logo_url']) ? esc_url($product['logo_url']) : '';
                echo '<li class="product-sso-item" data-product-id="' . esc_attr($id) . '">';
                if ($logo) {
                    echo '<img src="' . $logo . '" alt="' . $name . '" />';
                } else {
                    echo '<span class="product-sso-badge">' . esc_html(substr($name, 0, 2)) . '</span>';
                }
                echo '<div class="product-sso-meta">';
                echo '<span class="product-sso-name">' . $name . '</span>';
                echo '<button class="product-sso-btn" type="button" data-product-id="' . esc_attr($id) . '">Switch</button>';
                echo '</div>';
                echo '</li>';
            }
            echo '</ul>';
        }
        echo '</div>';
        return ob_get_clean();
    }

    public function handleSwitchRequest()
    {
        $productId = get_query_var('product_sso_switch');
        if (empty($productId)) {
            return;
        }

        if (!is_user_logged_in()) {
            wp_redirect(wp_login_url(home_url(add_query_arg(array('product_sso_switch' => $productId)))));
            exit;
        }

        $product = ProductService::getInstance()->find((int) $productId);
        if (empty($product) || empty($product['is_active'])) {
            wp_die('Invalid product.', 'SSO Switch Error', array('response' => 400));
        }

        if (empty($product['web_key'])) {
            wp_die('Missing web key.', 'SSO Switch Error', array('response' => 400));
        }

        $settings = SettingsRepository::getInstance()->getSettings();
        if (!empty($settings['require_https']) && !is_ssl()) {
            wp_die('HTTPS required for SSO.', 'SSO Switch Error', array('response' => 400));
        }

        $user = wp_get_current_user();
        $ip = $this->getClientIp();
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field($_SERVER['HTTP_USER_AGENT']) : '';
        $deviceFingerprint = isset($_GET['device_fingerprint']) ? sanitize_text_field(wp_unslash($_GET['device_fingerprint'])) : '';
        if (empty($deviceFingerprint)) {
            $acceptLanguage = isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? sanitize_text_field($_SERVER['HTTP_ACCEPT_LANGUAGE']) : '';
            $deviceFingerprint = DeviceFingerprintService::getInstance()->buildFingerprint($userAgent, $acceptLanguage);
        }

        $authKey = AuthKeyService::getInstance()->generateAuthKey($user, $product, $deviceFingerprint, $ip, $userAgent);
        $redirect = add_query_arg('auth_key', rawurlencode($authKey), $product['page_url']);

        wp_redirect($redirect);
        exit;
    }

    private function getClientIp()
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return sanitize_text_field($_SERVER['HTTP_CLIENT_IP']);
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return sanitize_text_field(trim($parts[0]));
        }
        return isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '';
    }
}
