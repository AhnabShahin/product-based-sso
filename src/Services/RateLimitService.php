<?php

namespace ProductBasedSSO\Services;

use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class RateLimitService
{
    use Singleton;

    public function isLimited($ip, $settings)
    {
        if (empty($settings['rate_limit_enabled'])) {
            return false;
        }

        $key = $this->getKey($ip);
        $data = get_transient($key);
        if (empty($data) || !is_array($data)) {
            return false;
        }

        if (time() > (int) $data['reset']) {
            delete_transient($key);
            return false;
        }

        return (int) $data['count'] >= (int) $settings['rate_limit_attempts'];
    }

    public function recordFailure($ip, $settings)
    {
        if (empty($settings['rate_limit_enabled'])) {
            return;
        }

        $window = (int) $settings['rate_limit_window'];
        if ($window <= 0) {
            $window = 60;
        }

        $key = $this->getKey($ip);
        $data = get_transient($key);
        if (empty($data) || !is_array($data)) {
            $data = array('count' => 0, 'reset' => time() + $window);
        }

        $data['count'] = (int) $data['count'] + 1;
        set_transient($key, $data, $window);
    }

    private function getKey($ip)
    {
        return 'product_sso_rate_' . md5((string) $ip);
    }
}
