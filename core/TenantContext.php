<?php

namespace Core;

use Helpers\Auth;

class TenantContext
{
    private static ?array $current_tenant = null;
    private static ?int $current_tenant_id = null;

    /**
     * Identify tenant from various sources:
     * 1. JWT token (tenant_id claim)
     * 2. API key header
     * 3. Subdomain
     * 4. Request header
     */
    public static function identify(): ?int
    {
        if (self::$current_tenant_id !== null) {
            return self::$current_tenant_id;
        }

        // Try to get tenant_id from JWT token
        $tenant_id = self::getTenantFromJWT();
        if ($tenant_id) {
            self::$current_tenant_id = $tenant_id;
            return $tenant_id;
        }

        // Try to get tenant_id from API key
        $tenant_id = self::getTenantFromAPIKey();
        if ($tenant_id) {
            self::$current_tenant_id = $tenant_id;
            return $tenant_id;
        }

        // Try to get tenant_id from subdomain
        $tenant_id = self::getTenantFromSubdomain();
        if ($tenant_id) {
            self::$current_tenant_id = $tenant_id;
            return $tenant_id;
        }

        // Try to get tenant_id from X-Tenant-ID header
        $tenant_id = self::getTenantFromHeader();
        if ($tenant_id) {
            self::$current_tenant_id = $tenant_id;
            return $tenant_id;
        }

        return null;
    }

    /**
     * Get tenant_id from JWT token
     */
    private static function getTenantFromJWT(): ?int
    {
        $token = Auth::getTokenFromHeader();
        if (!$token) {
            return null;
        }

        $decoded = Auth::verifyToken($token);
        if (!$decoded || !isset($decoded['tenant_id'])) {
            return null;
        }

        return (int) $decoded['tenant_id'];
    }

    /**
     * Get tenant_id from API key in Authorization header
     */
    private static function getTenantFromAPIKey(): ?int
    {
        $headers = apache_request_headers();
        if (!isset($headers['X-API-Key'])) {
            return null;
        }

        try {
            $apiKey = $headers['X-API-Key'];
            $keyData = Database::fetch(
                'SELECT tenant_id FROM tenant_api_keys WHERE api_key = ? AND is_active = true',
                [$apiKey]
            );

            return $keyData ? (int) $keyData['tenant_id'] : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get tenant_id from subdomain
     * Example: tenant1.myapp.com -> tenant1
     */
    private static function getTenantFromSubdomain(): ?int
    {
        try {
            $host = $_SERVER['HTTP_HOST'] ?? '';
            $parts = explode('.', $host);

            // Skip localhost and IP addresses
            if (count($parts) < 2 || in_array($host, ['localhost', '127.0.0.1'])) {
                return null;
            }

            $subdomain = $parts[0];

            // Skip common subdomains
            if (in_array($subdomain, ['www', 'api', 'admin', 'mail', 'ftp'])) {
                return null;
            }

            $tenant = Database::fetch(
                'SELECT id FROM tenants WHERE subdomain = ? AND status = ?',
                [$subdomain, 'active']
            );

            return $tenant ? (int) $tenant['id'] : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get tenant_id from X-Tenant-ID header
     */
    private static function getTenantFromHeader(): ?int
    {
        $headers = apache_request_headers();
        if (!isset($headers['X-Tenant-ID'])) {
            return null;
        }

        return (int) $headers['X-Tenant-ID'];
    }

    /**
     * Get current tenant_id
     */
    public static function getTenantId(): ?int
    {
        return self::identify();
    }

    /**
     * Get full tenant data
     */
    public static function getTenant(): ?array
    {
        $tenant_id = self::identify();
        if (!$tenant_id) {
            return null;
        }

        if (self::$current_tenant !== null) {
            return self::$current_tenant;
        }

        try {
            $tenant = Database::fetch(
                'SELECT * FROM tenants WHERE id = ? AND status = ?',
                [$tenant_id, 'active']
            );

            self::$current_tenant = $tenant;
            return $tenant;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Set tenant context manually (useful for CLI/cron jobs)
     */
    public static function setTenant(int $tenant_id): void
    {
        self::$current_tenant_id = $tenant_id;
        self::$current_tenant = null;
    }

    /**
     * Check if user belongs to current tenant
     */
    public static function userBelongsToTenant(int $user_id, ?int $tenant_id = null): bool
    {
        if (!$tenant_id) {
            $tenant_id = self::identify();
        }

        if (!$tenant_id) {
            return false;
        }

        try {
            $user = Database::fetch(
                'SELECT id FROM users WHERE id = ? AND tenant_id = ?',
                [$user_id, $tenant_id]
            );

            return $user !== null;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Create new tenant
     */
    public static function createTenant(array $data): ?array
    {
        try {
            $slug = $data['slug'] ?? strtolower(preg_replace('/[^a-z0-9]+/', '-', $data['name']));
            $subdomain = $data['subdomain'] ?? $slug;

            Database::execute(
                'INSERT INTO tenants (name, slug, subdomain, status) VALUES (?, ?, ?, ?)',
                [$data['name'], $slug, $subdomain, 'active']
            );

            $tenant_id = Database::lastInsertId();

            return Database::fetch(
                'SELECT * FROM tenants WHERE id = ?',
                [$tenant_id]
            );
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get tenant by slug
     */
    public static function getTenantBySlug(string $slug): ?array
    {
        try {
            return Database::fetch(
                'SELECT * FROM tenants WHERE slug = ? AND status = ?',
                [$slug, 'active']
            );
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Clear cached tenant data (useful for testing)
     */
    public static function clearCache(): void
    {
        self::$current_tenant = null;
        self::$current_tenant_id = null;
    }
}
