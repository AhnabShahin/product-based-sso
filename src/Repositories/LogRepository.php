<?php

namespace ProductBasedSSO\Repositories;

use ProductBasedSSO\Core\Database;
use ProductBasedSSO\Traits\Singleton;

if (!defined('ABSPATH')) {
    exit;
}

class LogRepository
{
    use Singleton;

    public function insert($data)
    {
        global $wpdb;
        $table = Database::getInstance()->getLogsTable();
        return $wpdb->insert($table, $data, array(
            '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'
        ));
    }

    public function getLogs($args = array())
    {
        global $wpdb;
        $table = Database::getInstance()->getLogsTable();
        $limit = isset($args['limit']) ? (int) $args['limit'] : 50;
        $offset = isset($args['offset']) ? (int) $args['offset'] : 0;
        $filter = isset($args['filter']) ? sanitize_text_field($args['filter']) : '';

        $where = '1=1';
        $params = array();

        if (!empty($filter) && $filter !== 'all') {
            $where .= ' AND (event_type = %s OR error_reason = %s)';
            $params[] = $filter;
            $params[] = $filter;
        }

        $sql = "SELECT * FROM {$table} WHERE {$where} ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $params[] = $limit;
        $params[] = $offset;

        return $wpdb->get_results($wpdb->prepare($sql, $params), ARRAY_A);
    }

    public function clear()
    {
        global $wpdb;
        $table = Database::getInstance()->getLogsTable();
        return $wpdb->query("TRUNCATE TABLE {$table}");
    }
}
