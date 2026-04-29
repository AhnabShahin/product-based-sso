<?php

namespace ProductBasedSSO\Controllers;

use ProductBasedSSO\Services\ProductService;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class ProductsController
{
    use Singleton;

    public function registerRoutes()
    {
        register_rest_route('product-sso/v1', '/products', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'getProducts'),
                'permission_callback' => array($this, 'canManage'),
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'createProduct'),
                'permission_callback' => array($this, 'canManage'),
            ),
        ));

        register_rest_route('product-sso/v1', '/products/(?P<id>\\d+)', array(
            array(
                'methods' => 'PUT',
                'callback' => array($this, 'updateProduct'),
                'permission_callback' => array($this, 'canManage'),
            ),
            array(
                'methods' => 'DELETE',
                'callback' => array($this, 'deleteProduct'),
                'permission_callback' => array($this, 'canManage'),
            ),
        ));
    }

    public function getProducts()
    {
        return rest_ensure_response(ProductService::getInstance()->all());
    }

    public function createProduct($request)
    {
        $data = $this->sanitizeProduct($request->get_json_params());
        $created = ProductService::getInstance()->add($data);
        return rest_ensure_response($created);
    }

    public function updateProduct($request)
    {
        $id = (int) $request['id'];
        $data = $this->sanitizeProduct($request->get_json_params());
        $updated = ProductService::getInstance()->update($id, $data);
        return rest_ensure_response($updated);
    }

    public function deleteProduct($request)
    {
        $id = (int) $request['id'];
        $products = ProductService::getInstance()->delete($id);
        return rest_ensure_response($products);
    }

    private function sanitizeProduct($data)
    {
        $data = is_array($data) ? $data : array();
        return array(
            'name' => isset($data['name']) ? sanitize_text_field($data['name']) : '',
            'logo_url' => isset($data['logo_url']) ? esc_url_raw($data['logo_url']) : '',
            'page_url' => isset($data['page_url']) ? esc_url_raw($data['page_url']) : '',
            'web_key' => isset($data['web_key']) ? sanitize_text_field($data['web_key']) : '',
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true,
        );
    }

    public function canManage()
    {
        return current_user_can('manage_options');
    }
}
