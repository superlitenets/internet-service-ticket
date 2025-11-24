<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Core\Database;

// Load environment variables
$dotenv = new Dotenv(__DIR__ . '/..');
$dotenv->load();

echo "╔═══════════════════════════════════════════════════╗\n";
echo "║  NetFlow - Create Admin User                      ║\n";
echo "╚═══════════════════════════════════════════════════╝\n\n";

try {
    // Connect to database
    $db = Database::connect();
    echo "✅ Connected to database\n\n";

    // Get admin details from command line or prompt
    if (php_sapi_name() === 'cli') {
        // CLI mode
        echo "Enter admin user details:\n";

        echo "Username (default: admin): ";
        $username = trim(fgets(STDIN));
        $username = empty($username) ? 'admin' : $username;

        echo "Email: ";
        $email = trim(fgets(STDIN));

        echo "Full Name (optional): ";
        $fullName = trim(fgets(STDIN));

        echo "Password: ";
        system('stty -echo');
        $password = trim(fgets(STDIN));
        system('stty echo');
        echo "\n";

        echo "Confirm Password: ";
        system('stty -echo');
        $passwordConfirm = trim(fgets(STDIN));
        system('stty echo');
        echo "\n";

        if ($password !== $passwordConfirm) {
            echo "\n❌ Passwords do not match!\n";
            exit(1);
        }
    } else {
        // Web mode (from POST or CLI args)
        $username = $_POST['username'] ?? 'admin';
        $email = $_POST['email'] ?? '';
        $fullName = $_POST['full_name'] ?? '';
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            echo "Error: Email and password are required\n";
            exit(1);
        }
    }

    // Validate inputs
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "\n❌ Invalid email address!\n";
        exit(1);
    }

    if (strlen($password) < 8) {
        echo "\n❌ Password must be at least 8 characters long!\n";
        exit(1);
    }

    // Check if user already exists
    $existing = Database::fetch(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [$email, $username]
    );

    if ($existing) {
        echo "\n❌ User with this email or username already exists!\n";
        exit(1);
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // Create admin user
    Database::execute(
        'INSERT INTO users (username, email, password, full_name, role, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [$username, $email, $hashedPassword, $fullName, 'admin', 'active']
    );

    $userId = Database::lastInsertId();

    echo "\n✅ Admin user created successfully!\n\n";
    echo "User Details:\n";
    echo "  ID: " . $userId . "\n";
    echo "  Username: " . $username . "\n";
    echo "  Email: " . $email . "\n";
    echo "  Role: admin\n";
    echo "  Status: active\n\n";

    echo "You can now log in with these credentials.\n";

} catch (PDOException $e) {
    echo "\n❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
