<?php

namespace ProductBasedSSO\Repositories;

use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class ProductRepository
{
    use Singleton;

    public function all()
    {
        return SettingsRepository::getInstance()->getProducts();
    }

    public function find($id)
    {
        $products = $this->all();
        foreach ($products as $product) {
            if ((int) $product['id'] === (int) $id) {
                return $product;
            }
        }
        return null;
    }

    public function create($data)
    {
        $products = $this->all();
        $data['id'] = isset($data['id']) ? (int) $data['id'] : time();
        $data['created_at'] = isset($data['created_at']) ? $data['created_at'] : gmdate('Y-m-d H:i:s');
        $data['updated_at'] = gmdate('Y-m-d H:i:s');
        $products[] = $data;
        SettingsRepository::getInstance()->saveProducts($products);
        return $data;
    }

    public function update($id, $data)
    {
        $products = $this->all();
        $updated = null;
        foreach ($products as $index => $product) {
            if ((int) $product['id'] === (int) $id) {
                $updated = array_merge($product, $data);
                $updated['id'] = (int) $id;
                $updated['updated_at'] = gmdate('Y-m-d H:i:s');
                $products[$index] = $updated;
                break;
            }
        }
        SettingsRepository::getInstance()->saveProducts($products);
        return $updated;
    }

    public function delete($id)
    {
        $products = $this->all();
        $products = array_values(array_filter($products, function ($product) use ($id) {
            return (int) $product['id'] !== (int) $id;
        }));
        SettingsRepository::getInstance()->saveProducts($products);
        return $products;
    }
}
