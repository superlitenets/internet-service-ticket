<?php

namespace Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $connection = null;
    private static bool $enforce_tenant_isolation = true;

    public static function connect(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        try {
            $host = $_ENV['DB_HOST'] ?? 'localhost';
            $port = $_ENV['DB_PORT'] ?? '5432';
            $dbname = $_ENV['DB_NAME'] ?? 'netflow_db';
            $user = $_ENV['DB_USER'] ?? 'netflow_user';
            $password = $_ENV['DB_PASSWORD'] ?? '';
            $type = $_ENV['DB_TYPE'] ?? 'pgsql';

            $dsn = "{$type}:host={$host};port={$port};dbname={$dbname}";

            self::$connection = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT => false,
            ]);

            return self::$connection;
        } catch (PDOException $e) {
            throw new \Exception('Database connection failed: ' . $e->getMessage());
        }
    }

    public static function query(string $sql, array $params = []): \PDOStatement
    {
        $db = self::connect();
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetch(string $sql, array $params = []): ?array
    {
        return self::query($sql, $params)->fetch();
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function execute(string $sql, array $params = []): int
    {
        return self::query($sql, $params)->rowCount();
    }

    public static function lastInsertId(): string
    {
        return self::connect()->lastInsertId();
    }

    public static function beginTransaction(): bool
    {
        return self::connect()->beginTransaction();
    }

    public static function commit(): bool
    {
        return self::connect()->commit();
    }

    public static function rollback(): bool
    {
        return self::connect()->rollBack();
    }

    /**
     * Enable/disable tenant isolation enforcement
     * Useful for setup/installation scripts
     */
    public static function setTenantIsolation(bool $enforce): void
    {
        self::$enforce_tenant_isolation = $enforce;
    }

    /**
     * Tables that support multitenancy
     */
    private static array $tenant_tables = [
        'users', 'leads', 'customers', 'packages', 'customer_packages',
        'invoices', 'payments', 'employees', 'attendance', 'inventory',
        'tickets', 'ticket_replies', 'settings', 'audit_logs',
        'isp_packages', 'isp_services', 'isp_billing_cycles', 'isp_usage_logs',
        'isp_service_logs', 'isp_dunning_logs', 'isp_configurations',
        'mikrotik_connections', 'isp_overage_pricing', 'isp_service_changes',
        'isp_usage_alerts', 'isp_promotions', 'isp_performance_metrics'
    ];

    /**
     * Check if a table supports multitenancy
     */
    private static function supportsMultitenancy(string $table): bool
    {
        return in_array($table, self::$tenant_tables);
    }

    /**
     * Extract table name from SELECT/FROM clause
     */
    private static function extractTableName(string $sql): ?string
    {
        if (preg_match('/FROM\s+(\w+)/i', $sql, $matches)) {
            return $matches[1];
        }
        if (preg_match('/INTO\s+(\w+)/i', $sql, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Add tenant_id filtering to queries
     */
    private static function addTenantFilter(string $sql, array &$params): string
    {
        if (!self::$enforce_tenant_isolation) {
            return $sql;
        }

        $tenant_id = TenantContext::getTenantId();
        if (!$tenant_id) {
            return $sql;
        }

        $table = self::extractTableName($sql);
        if (!$table || !self::supportsMultitenancy($table)) {
            return $sql;
        }

        // For SELECT queries
        if (stripos($sql, 'SELECT') === 0) {
            if (stripos($sql, 'WHERE') !== false) {
                $sql = preg_replace('/WHERE/i', "WHERE {$table}.tenant_id = ? AND ", $sql, 1);
            } else {
                $sql .= " WHERE {$table}.tenant_id = ?";
            }
            array_unshift($params, $tenant_id);
        }

        return $sql;
    }

    /**
     * Tenant-aware query
     */
    public static function queryWithTenant(string $sql, array $params = []): \PDOStatement
    {
        $sql = self::addTenantFilter($sql, $params);
        return self::query($sql, $params);
    }

    /**
     * Tenant-aware fetch
     */
    public static function fetchWithTenant(string $sql, array $params = []): ?array
    {
        return self::queryWithTenant($sql, $params)->fetch();
    }

    /**
     * Tenant-aware fetchAll
     */
    public static function fetchAllWithTenant(string $sql, array $params = []): array
    {
        return self::queryWithTenant($sql, $params)->fetchAll();
    }

    /**
     * Add tenant_id to insert data
     */
    public static function insert(string $table, array $data): bool
    {
        if (!self::$enforce_tenant_isolation) {
            $columns = implode(', ', array_keys($data));
            $placeholders = implode(', ', array_fill(0, count($data), '?'));
            $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
            return self::execute($sql, array_values($data)) > 0;
        }

        $tenant_id = TenantContext::getTenantId();
        if (!$tenant_id || !self::supportsMultitenancy($table)) {
            $columns = implode(', ', array_keys($data));
            $placeholders = implode(', ', array_fill(0, count($data), '?'));
            $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
            return self::execute($sql, array_values($data)) > 0;
        }

        $data['tenant_id'] = $tenant_id;
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";

        return self::execute($sql, array_values($data)) > 0;
    }

    /**
     * Tenant-aware update
     */
    public static function update(string $table, array $data, array $where): bool
    {
        if (!self::$enforce_tenant_isolation || !self::supportsMultitenancy($table)) {
            $set = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($data)));
            $whereClause = implode(' AND ', array_map(fn($k) => "{$k} = ?", array_keys($where)));
            $sql = "UPDATE {$table} SET {$set} WHERE {$whereClause}";
            $params = array_merge(array_values($data), array_values($where));
            return self::execute($sql, $params) > 0;
        }

        $tenant_id = TenantContext::getTenantId();
        if (!$tenant_id) {
            return false;
        }

        $set = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($data)));
        $whereClause = implode(' AND ', array_map(fn($k) => "{$k} = ?", array_keys($where)));
        $sql = "UPDATE {$table} SET {$set} WHERE {$whereClause} AND tenant_id = ?";
        $params = array_merge(array_values($data), array_values($where), [$tenant_id]);

        return self::execute($sql, $params) > 0;
    }

    /**
     * Tenant-aware delete
     */
    public static function delete(string $table, array $where): bool
    {
        if (!self::$enforce_tenant_isolation || !self::supportsMultitenancy($table)) {
            $whereClause = implode(' AND ', array_map(fn($k) => "{$k} = ?", array_keys($where)));
            $sql = "DELETE FROM {$table} WHERE {$whereClause}";
            return self::execute($sql, array_values($where)) > 0;
        }

        $tenant_id = TenantContext::getTenantId();
        if (!$tenant_id) {
            return false;
        }

        $whereClause = implode(' AND ', array_map(fn($k) => "{$k} = ?", array_keys($where)));
        $sql = "DELETE FROM {$table} WHERE {$whereClause} AND tenant_id = ?";
        $params = array_merge(array_values($where), [$tenant_id]);

        return self::execute($sql, $params) > 0;
    }
}
