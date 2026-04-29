<?php

namespace ProductBasedSSO\Services;

use ProductBasedSSO\Repositories\ProductRepository;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class ProductService
{
    use Singleton;

    public function all()
    {
        return ProductRepository::getInstance()->all();
    }

    public function find($id)
    {
        return ProductRepository::getInstance()->find($id);
    }

    public function add($data)
    {
        return ProductRepository::getInstance()->create($data);
    }

    public function update($id, $data)
    {
        return ProductRepository::getInstance()->update($id, $data);
    }

    public function delete($id)
    {
        return ProductRepository::getInstance()->delete($id);
    }

    public function findByHost($host)
    {
        $products = $this->all();
        foreach ($products as $product) {
            if (empty($product['page_url'])) {
                continue;
            }
            $productHost = wp_parse_url($product['page_url'], PHP_URL_HOST);
            if ($productHost && strtolower($productHost) === strtolower($host)) {
                return $product;
            }
        }
        return null;
    }
}
