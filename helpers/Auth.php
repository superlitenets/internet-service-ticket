<?php

namespace Helpers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Core\Database;

class Auth
{
    private static ?array $user = null;

    /**
     * Generate JWT token
     */
    public static function generateToken(array $userData): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'your_secret_key';
        $algorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';
        $expiryTime = $_ENV['JWT_EXPIRY'] ?? 86400;

        $issuedAt = time();
        $expiration = $issuedAt + $expiryTime;

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expiration,
            'user_id' => $userData['id'],
            'username' => $userData['username'],
            'email' => $userData['email'],
            'role' => $userData['role'] ?? 'user',
            'tenant_id' => $userData['tenant_id'] ?? null,
        ];

        return JWT::encode($payload, $secret, $algorithm);
    }

    /**
     * Verify JWT token
     */
    public static function verifyToken(string $token): ?array
    {
        try {
            $secret = $_ENV['JWT_SECRET'] ?? 'your_secret_key';
            $algorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';

            $decoded = JWT::decode($token, new Key($secret, $algorithm));
            return (array) $decoded;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get token from Authorization header
     */
    public static function getTokenFromHeader(): ?string
    {
        $headers = apache_request_headers();
        if (!isset($headers['Authorization'])) {
            return null;
        }

        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)/', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Get current authenticated user
     */
    public static function user(): ?array
    {
        if (self::$user !== null) {
            return self::$user;
        }

        $token = self::getTokenFromHeader();
        if (!$token) {
            return null;
        }

        $decoded = self::verifyToken($token);
        if (!$decoded) {
            return null;
        }

        // Set tenant context from JWT
        if (isset($decoded['tenant_id']) && $decoded['tenant_id']) {
            \Core\TenantContext::setTenant($decoded['tenant_id']);
        }

        // Fetch full user data from database
        try {
            $user = Database::fetch(
                'SELECT id, username, email, full_name, role, status, tenant_id FROM users WHERE id = ?',
                [$decoded['user_id']]
            );

            self::$user = $user;
            return $user;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    public static function isAuthenticated(): bool
    {
        return self::user() !== null;
    }

    /**
     * Check if user has a specific role
     */
    public static function hasRole(string $role): bool
    {
        $user = self::user();
        return $user && $user['role'] === $role;
    }

    /**
     * Hash password
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Login user
     */
    public static function login(string $email, string $password): ?array
    {
        try {
            // Disable tenant isolation for login query (we need to search all tenants to find the user)
            Database::setTenantIsolation(false);

            $user = Database::fetch(
                'SELECT id, username, email, password, full_name, role, status, tenant_id FROM users WHERE email = ?',
                [$email]
            );

            Database::setTenantIsolation(true);

            if (!$user) {
                return null;
            }

            if ($user['status'] !== 'active') {
                return null;
            }

            if (!self::verifyPassword($password, $user['password'])) {
                return null;
            }

            // Set tenant context
            if ($user['tenant_id']) {
                \Core\TenantContext::setTenant($user['tenant_id']);
            }

            // Update last login
            Database::execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [$user['id']]
            );

            // Generate token
            $token = self::generateToken($user);

            return [
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role'],
                    'tenant_id' => $user['tenant_id'],
                ],
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Register new user
     */
    public static function register(array $data): ?array
    {
        try {
            // Disable tenant isolation for registration
            Database::setTenantIsolation(false);

            // Check if user exists
            $existing = Database::fetch(
                'SELECT id FROM users WHERE email = ? OR username = ?',
                [$data['email'], $data['username']]
            );

            if ($existing) {
                Database::setTenantIsolation(true);
                return null;
            }

            // Get tenant context - either from request or use default tenant
            $tenant_id = \Core\TenantContext::getTenantId();
            if (!$tenant_id) {
                // Try to get or create default tenant
                $defaultTenant = Database::fetch(
                    'SELECT id FROM tenants WHERE is_default = true LIMIT 1'
                );
                if ($defaultTenant) {
                    $tenant_id = $defaultTenant['id'];
                } else {
                    // Create default tenant if it doesn't exist
                    Database::execute(
                        'INSERT INTO tenants (name, slug, subdomain, is_default, status) VALUES (?, ?, ?, ?, ?)',
                        ['Default', 'default', 'default', true, 'active']
                    );
                    $tenant_id = Database::lastInsertId();
                }
            }

            Database::setTenantIsolation(true);
            \Core\TenantContext::setTenant($tenant_id);

            // Insert new user
            $hashedPassword = self::hashPassword($data['password']);
            Database::insert('users', [
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => $hashedPassword,
                'full_name' => $data['full_name'] ?? '',
                'role' => 'user',
                'tenant_id' => $tenant_id
            ]);

            $userId = Database::lastInsertId();

            // Fetch created user
            $user = Database::fetch(
                'SELECT id, username, email, full_name, role, tenant_id FROM users WHERE id = ?',
                [$userId]
            );

            if (!$user) {
                return null;
            }

            // Generate token
            $token = self::generateToken($user);

            return [
                'token' => $token,
                'user' => $user,
            ];
        } catch (\Exception $e) {
            Database::setTenantIsolation(true);
            return null;
        }
    }
}
