<?php

namespace ProductBasedSSO\Repositories;

use ProductBasedSSO\Core\Database;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class AuthKeyRepository
{
    use Singleton;

    public function hashAuthKey($authKey)
    {
        return hash('sha256', (string) $authKey);
    }

    public function findValidByHash($authHash)
    {
        global $wpdb;
        $table = Database::getInstance()->getAuthKeysTable();
        $now = gmdate('Y-m-d H:i:s');

        $sql = $wpdb->prepare(
            "SELECT * FROM {$table} WHERE auth_key_hash = %s AND expires_at >= %s ORDER BY id DESC LIMIT 1",
            $authHash,
            $now
        );

        return $wpdb->get_row($sql, ARRAY_A);
    }

    public function insert($data)
    {
        global $wpdb;
        $table = Database::getInstance()->getAuthKeysTable();

        return $wpdb->insert($table, $data, array(
            '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'
        ));
    }

    public function cleanupExpired()
    {
        global $wpdb;
        $table = Database::getInstance()->getAuthKeysTable();
        $now = gmdate('Y-m-d H:i:s');

        return $wpdb->query($wpdb->prepare(
            "DELETE FROM {$table} WHERE expires_at < %s",
            $now
        ));
    }
}
