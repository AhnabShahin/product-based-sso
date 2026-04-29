<?php

namespace ProductBasedSSO\Traits;

if (!defined('ABSPATH')) {
    exit;
}

trait Singleton
{
    private static $instance;

    public static function getInstance()
    {
        if (null === static::$instance) {
            static::$instance = new static();
            if (method_exists(static::$instance, 'init')) {
                static::$instance->init();
            }
        }

        return static::$instance;
    }

    private function __clone()
    {
    }

    public function __wakeup()
    {
    }
}
