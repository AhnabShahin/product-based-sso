<?php

namespace ProductBasedSSO\Core;

use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class Database
{
    use Singleton;

    private $tableAuthKeys;
    private $tableLogs;

    protected function init()
    {
        global $wpdb;
        $this->tableAuthKeys = $wpdb->prefix . 'sso_auth_keys';
        $this->tableLogs = $wpdb->prefix . 'sso_logs';
    }

    public function getAuthKeysTable()
    {
        return $this->tableAuthKeys;
    }

    public function getLogsTable()
    {
        return $this->tableLogs;
    }

    public static function createTables()
    {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $auth_table = $wpdb->prefix . 'sso_auth_keys';
        $logs_table = $wpdb->prefix . 'sso_logs';

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $sql_auth = "CREATE TABLE IF NOT EXISTS {$auth_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            auth_key_hash varchar(255) NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            email varchar(255) NOT NULL,
            ip_address varchar(45) DEFAULT NULL,
            device_fingerprint varchar(255) DEFAULT NULL,
            user_agent text DEFAULT NULL,
            source_product varchar(255) DEFAULT NULL,
            target_product varchar(255) DEFAULT NULL,
            redirect_url text DEFAULT NULL,
            expires_at datetime NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY auth_key_hash (auth_key_hash),
            KEY email (email),
            KEY expires_at (expires_at)
        ) {$charset_collate};";

        $sql_logs = "CREATE TABLE IF NOT EXISTS {$logs_table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            event_type varchar(50) NOT NULL,
            user_email varchar(255) DEFAULT NULL,
            source_product varchar(255) DEFAULT NULL,
            target_product varchar(255) DEFAULT NULL,
            ip_address varchar(45) DEFAULT NULL,
            device_fingerprint varchar(255) DEFAULT NULL,
            error_reason text DEFAULT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY created_at (created_at),
            KEY user_email (user_email),
            KEY event_type (event_type)
        ) {$charset_collate};";

        dbDelta($sql_auth);
        dbDelta($sql_logs);
    }
}
