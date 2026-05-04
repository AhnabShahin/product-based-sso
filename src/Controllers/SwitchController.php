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

    public function registerRoutes()
    {
        register_rest_route('product-sso/v1', '/switch-token', array(
            array(
                'methods' => 'POST',
                'callback' => array($this, 'createSwitchToken'),
                'permission_callback' => array($this, 'canSwitch'),
            ),
        ));
    }

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
            'restUrl' => esc_url_raw(rest_url('product-sso/v1/')),
            'nonce' => wp_create_nonce('wp_rest'),
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

        $context = $this->buildContext($_GET);
        $this->ensureSwitchAllowed($product);
        $redirect = $this->buildSignedRedirectUrl($product, $context);

        wp_redirect($redirect);
        exit;
    }

    public function createSwitchToken($request)
    {
        $params = $request->get_json_params();
        $params = is_array($params) ? $params : array();
        $settings = SettingsRepository::getInstance()->getSettings();
        $productId = isset($params['product_id']) ? (int) $params['product_id'] : 0;

        if (empty($productId)) {
            return new \WP_Error('invalid_product', 'Missing product ID.', array('status' => 400));
        }

        $product = ProductService::getInstance()->find($productId);
        if (empty($product) || empty($product['is_active'])) {
            return new \WP_Error('invalid_product', 'Invalid product.', array('status' => 400));
        }

        if (empty($product['web_key'])) {
            return new \WP_Error('missing_web_key', 'Missing web key.', array('status' => 400));
        }

        $context = $this->buildContext($params);
        $redirect = $this->buildSignedRedirectUrl($product, $context);
        $authToken = $this->extractQueryValue($redirect, 'auth_token');

        return rest_ensure_response(array(
            'auth_token' => $authToken,
            'redirect_url' => $redirect,
            'open_target' => !empty($settings['open_product_target']) ? $settings['open_product_target'] : 'self',
            'expires_in' => isset($context['token_lifetime']) ? (int) $context['token_lifetime'] : null,
        ));
    }

    public function canSwitch()
    {
        return is_user_logged_in();
    }

    private function buildSignedRedirectUrl($product, $context)
    {
        $user = wp_get_current_user();
        $authKey = AuthKeyService::getInstance()->generateAuthKey($user, $product, $context);

        return add_query_arg(array(
            'auth_token' => $authKey,
            'device_fingerprint' => isset($context['device_fingerprint']) ? $context['device_fingerprint'] : '',
            'browser' => isset($context['browser']) ? $context['browser'] : '',
            'os' => isset($context['os']) ? $context['os'] : '',
            'platform' => isset($context['platform']) ? $context['platform'] : '',
            'screen_resolution' => isset($context['screen_resolution']) ? $context['screen_resolution'] : '',
            'timezone' => isset($context['timezone']) ? $context['timezone'] : '',
            'accept_language' => isset($context['accept_language']) ? $context['accept_language'] : '',
        ), $product['page_url']);
    }

    private function ensureSwitchAllowed($product)
    {
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
    }

    private function buildContext($params = array())
    {
        $params = is_array($params) ? $params : array();
        $userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';
        $acceptLanguage = isset($params['accept_language']) ? sanitize_text_field(wp_unslash($params['accept_language'])) : '';
        if (empty($acceptLanguage) && isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            $acceptLanguage = sanitize_text_field(wp_unslash($_SERVER['HTTP_ACCEPT_LANGUAGE']));
        }

        $platform = isset($params['platform']) ? sanitize_text_field(wp_unslash($params['platform'])) : '';
        $screenResolution = isset($params['screen_resolution']) ? sanitize_text_field(wp_unslash($params['screen_resolution'])) : '';
        $timezone = isset($params['timezone']) ? sanitize_text_field(wp_unslash($params['timezone'])) : '';
        $browser = isset($params['browser']) ? sanitize_text_field(wp_unslash($params['browser'])) : $this->detectBrowser($userAgent);
        $os = isset($params['os']) ? sanitize_text_field(wp_unslash($params['os'])) : $this->detectOs($userAgent, $platform);
        $deviceFingerprint = isset($params['device_fingerprint']) ? sanitize_text_field(wp_unslash($params['device_fingerprint'])) : '';
        if (empty($deviceFingerprint)) {
            $deviceFingerprint = DeviceFingerprintService::getInstance()->buildFingerprint($userAgent, $acceptLanguage, $platform, $screenResolution, $timezone);
        }

        $settings = SettingsRepository::getInstance()->getSettings();

        return array(
            'ip' => $this->getClientIp(),
            'user_agent' => $userAgent,
            'accept_language' => $acceptLanguage,
            'browser' => $browser,
            'os' => $os,
            'platform' => $platform,
            'screen_resolution' => $screenResolution,
            'timezone' => $timezone,
            'device_fingerprint' => $deviceFingerprint,
            'token_lifetime' => isset($settings['token_lifetime']) ? (int) $settings['token_lifetime'] : 30,
        );
    }

    private function detectBrowser($userAgent)
    {
        $map = array(
            'Edg/' => 'Edge',
            'OPR/' => 'Opera',
            'Chrome/' => 'Chrome',
            'Firefox/' => 'Firefox',
            'Safari/' => 'Safari',
        );

        foreach ($map as $needle => $browser) {
            if (strpos($userAgent, $needle) !== false) {
                return $browser;
            }
        }

        return 'Unknown';
    }

    private function detectOs($userAgent, $platform = '')
    {
        $haystack = strtolower($platform . ' ' . $userAgent);
        if (strpos($haystack, 'windows') !== false) {
            return 'Windows';
        }
        if (strpos($haystack, 'mac') !== false || strpos($haystack, 'darwin') !== false) {
            return 'macOS';
        }
        if (strpos($haystack, 'android') !== false) {
            return 'Android';
        }
        if (strpos($haystack, 'iphone') !== false || strpos($haystack, 'ipad') !== false || strpos($haystack, 'ios') !== false) {
            return 'iOS';
        }
        if (strpos($haystack, 'linux') !== false) {
            return 'Linux';
        }

        return 'Unknown';
    }

    private function extractQueryValue($url, $key)
    {
        $query = wp_parse_url($url, PHP_URL_QUERY);
        if (empty($query)) {
            return '';
        }

        parse_str($query, $params);
        return isset($params[$key]) ? (string) $params[$key] : '';
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
