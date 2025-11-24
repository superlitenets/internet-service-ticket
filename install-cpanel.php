<?php
/**
 * NetFlow cPanel Installer Wizard
 * This script provides an interactive installation process for cPanel environments
 */

define('NETFLOW_VERSION', '1.0.0');
define('MIN_PHP_VERSION', '8.1');

class NetFlowInstaller
{
    private $steps = [
        'welcome' => 'Welcome',
        'requirements' => 'Check Requirements',
        'database' => 'Database Configuration',
        'admin' => 'Admin Account',
        'settings' => 'Application Settings',
        'install' => 'Installation',
        'complete' => 'Installation Complete',
    ];

    private $currentStep = 'welcome';
    private $config = [];

    public function run()
    {
        if (php_sapi_name() !== 'cli') {
            $this->runWeb();
        } else {
            $this->runCLI();
        }
    }

    private function runWeb()
    {
        session_start();
        $step = $_GET['step'] ?? 'welcome';

        if ($_POST) {
            $this->handlePostRequest();
            return;
        }

        $this->currentStep = $step;
        $this->renderWebInterface();
    }

    private function runCLI()
    {
        echo "\n";
        echo str_repeat("═", 60) . "\n";
        echo "  NetFlow - ISP Management System v" . NETFLOW_VERSION . "\n";
        echo "  cPanel Installation Wizard\n";
        echo str_repeat("═", 60) . "\n\n";

        $this->stepWelcome();
        $this->stepRequirements();
        $this->stepDatabaseConfig();
        $this->stepAdminAccount();
        $this->stepApplicationSettings();
        $this->stepInstall();
        $this->stepComplete();
    }

    private function stepWelcome()
    {
        echo "Welcome to NetFlow Installation!\n\n";
        echo "This wizard will help you install NetFlow on your server.\n";
        echo "Please ensure you have the following:\n";
        echo "  • PHP " . MIN_PHP_VERSION . " or higher\n";
        echo "  • PostgreSQL or MySQL database\n";
        echo "  • cPanel access (if installing on shared hosting)\n";
        echo "  • Composer installed\n\n";

        $this->pause("Press Enter to continue...");
    }

    private function stepRequirements()
    {
        echo "\n" . str_repeat("─", 60) . "\n";
        echo "Checking System Requirements...\n";
        echo str_repeat("─", 60) . "\n\n";

        $checks = [
            'PHP Version' => version_compare(PHP_VERSION, MIN_PHP_VERSION, '>='),
            'PDO Extension' => extension_loaded('pdo'),
            'PostgreSQL Driver' => extension_loaded('pdo_pgsql'),
            'JSON Extension' => extension_loaded('json'),
            'CURL Extension' => extension_loaded('curl'),
            'OpenSSL Extension' => extension_loaded('openssl'),
            'Composer' => $this->checkComposerInstalled(),
        ];

        $allPass = true;
        foreach ($checks as $requirement => $status) {
            $symbol = $status ? '✓' : '✗';
            $color = $status ? "\033[32m" : "\033[31m"; // Green or Red
            echo "{$color}{$symbol}\033[0m {$requirement}\n";
            if (!$status && $requirement !== 'Composer') {
                $allPass = false;
            }
        }

        if (!$allPass) {
            echo "\n\033[31m❌ Some requirements are not met. Please install them first.\033[0m\n";
            exit(1);
        }

        echo "\n\033[32m✅ All requirements are met!\033[0m\n";
        $this->pause("Press Enter to continue...");
    }

    private function stepDatabaseConfig()
    {
        echo "\n" . str_repeat("─", 60) . "\n";
        echo "Database Configuration\n";
        echo str_repeat("─", 60) . "\n\n";

        $this->config['DB_HOST'] = $this->prompt('Database Host', 'localhost');
        $this->config['DB_PORT'] = $this->prompt('Database Port', '5432');
        $this->config['DB_NAME'] = $this->prompt('Database Name', 'netflow_db');
        $this->config['DB_USER'] = $this->prompt('Database User', 'netflow_user');
        $this->config['DB_PASSWORD'] = $this->promptSecret('Database Password');
        $this->config['DB_TYPE'] = $this->prompt('Database Type (pgsql/mysql)', 'pgsql');

        // Test connection
        echo "\nTesting database connection...\n";
        if ($this->testDatabaseConnection()) {
            echo "\033[32m✅ Database connection successful!\033[0m\n";
        } else {
            echo "\033[31m❌ Database connection failed. Please check your credentials.\033[0m\n";
            $this->stepDatabaseConfig();
            return;
        }

        $this->pause("Press Enter to continue...");
    }

    private function stepAdminAccount()
    {
        echo "\n" . str_repeat("─", 60) . "\n";
        echo "Create Admin Account\n";
        echo str_repeat("─", 60) . "\n\n";

        $this->config['ADMIN_USERNAME'] = $this->prompt('Admin Username', 'admin');
        $this->config['ADMIN_EMAIL'] = $this->prompt('Admin Email', 'admin@example.com');
        $this->config['ADMIN_PASSWORD'] = $this->promptSecret('Admin Password');
        $this->config['ADMIN_FULL_NAME'] = $this->prompt('Admin Full Name', 'Administrator');

        $this->pause("Press Enter to continue...");
    }

    private function stepApplicationSettings()
    {
        echo "\n" . str_repeat("─", 60) . "\n";
        echo "Application Settings\n";
        echo str_repeat("─", 60) . "\n\n";

        $this->config['APP_URL'] = $this->prompt('Application URL', 'https://example.com');
        $this->config['APP_ENV'] = $this->prompt('Environment (production/development)', 'production');
        $this->config['APP_KEY'] = $this->generateRandomKey(32);
        $this->config['JWT_SECRET'] = $this->generateRandomKey(64);

        $this->pause("Press Enter to continue with installation...");
    }

    private function stepInstall()
    {
        echo "\n" . str_repeat("─", 60) . "\n";
        echo "Installing NetFlow...\n";
        echo str_repeat("─", 60) . "\n\n";

        // Create .env file
        echo "Creating .env configuration file...\n";
        $this->createEnvFile();

        // Install composer dependencies
        echo "Installing composer dependencies...\n";
        if (!$this->runCommand('composer install --no-dev --optimize-autoloader')) {
            echo "\033[31m❌ Failed to install dependencies.\033[0m\n";
            exit(1);
        }

        // Run database migrations
        echo "Running database migrations...\n";
        if (!$this->runCommand('php database/migrate.php')) {
            echo "\033[31m❌ Failed to run migrations.\033[0m\n";
            exit(1);
        }

        // Create admin user
        echo "Creating admin account...\n";
        $this->createAdminUser();

        // Create necessary directories
        echo "Creating necessary directories...\n";
        $this->createDirectories();

        // Set permissions
        echo "Setting file permissions...\n";
        $this->setPermissions();

        echo "\n\033[32m✅ Installation completed successfully!\033[0m\n";
    }

    private function stepComplete()
    {
        echo "\n" . str_repeat("═", 60) . "\n";
        echo "Installation Complete!\n";
        echo str_repeat("═", 60) . "\n\n";

        echo "NetFlow is now ready to use!\n\n";

        echo "Next Steps:\n";
        echo "1. Set up your web server (Nginx/Apache)\n";
        echo "2. Configure SSL certificate\n";
        echo "3. Access the application at: " . $this->config['APP_URL'] . "\n";
        echo "4. Login with:\n";
        echo "   Email: " . $this->config['ADMIN_EMAIL'] . "\n";
        echo "   Password: (the one you entered)\n\n";

        echo "For more information, visit: https://netflow.example.com/docs\n\n";
    }

    private function createEnvFile()
    {
        $envContent = <<<ENV
# NetFlow Environment Configuration
APP_ENV={$this->config['APP_ENV']}
APP_DEBUG=false
APP_URL={$this->config['APP_URL']}
APP_KEY={$this->config['APP_KEY']}

# Database Configuration
DB_HOST={$this->config['DB_HOST']}
DB_PORT={$this->config['DB_PORT']}
DB_NAME={$this->config['DB_NAME']}
DB_USER={$this->config['DB_USER']}
DB_PASSWORD={$this->config['DB_PASSWORD']}
DB_TYPE={$this->config['DB_TYPE']}

# JWT Configuration
JWT_SECRET={$this->config['JWT_SECRET']}
JWT_ALGORITHM=HS256
JWT_EXPIRY=86400

# Session Configuration
SESSION_TIMEOUT=3600
SESSION_NAME=netflow_session

# File Uploads
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=storage/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=storage/logs/app.log
ENV;

        file_put_contents('.env', $envContent);
        echo "✓ .env file created\n";
    }

    private function createAdminUser()
    {
        $hashedPassword = password_hash($this->config['ADMIN_PASSWORD'], PASSWORD_BCRYPT);

        try {
            $db = new PDO(
                $this->getDSN(),
                $this->config['DB_USER'],
                $this->config['DB_PASSWORD']
            );

            $stmt = $db->prepare(
                'INSERT INTO users (username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)'
            );

            $stmt->execute([
                $this->config['ADMIN_USERNAME'],
                $this->config['ADMIN_EMAIL'],
                $hashedPassword,
                $this->config['ADMIN_FULL_NAME'],
                'admin',
                'active',
            ]);

            echo "✓ Admin account created\n";
        } catch (\Exception $e) {
            echo "⚠ Admin account already exists or error: " . $e->getMessage() . "\n";
        }
    }

    private function createDirectories()
    {
        $directories = [
            'storage' => 0755,
            'storage/logs' => 0755,
            'storage/uploads' => 0755,
            'storage/cache' => 0755,
        ];

        foreach ($directories as $dir => $perms) {
            if (!is_dir($dir)) {
                mkdir($dir, $perms, true);
                echo "✓ Created {$dir}\n";
            }
        }
    }

    private function setPermissions()
    {
        $paths = [
            'storage' => 0755,
            'storage/logs' => 0755,
            'storage/uploads' => 0755,
            'storage/cache' => 0755,
        ];

        foreach ($paths as $path => $perms) {
            if (is_dir($path)) {
                chmod($path, $perms);
            }
        }

        echo "✓ Permissions set\n";
    }

    private function testDatabaseConnection(): bool
    {
        try {
            $pdo = new PDO(
                $this->getDSN(),
                $this->config['DB_USER'],
                $this->config['DB_PASSWORD']
            );
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function getDSN(): string
    {
        $type = $this->config['DB_TYPE'] ?? 'pgsql';
        $host = $this->config['DB_HOST'] ?? 'localhost';
        $port = $this->config['DB_PORT'] ?? '5432';
        $name = $this->config['DB_NAME'] ?? 'netflow_db';

        return "{$type}:host={$host};port={$port};dbname={$name}";
    }

    private function checkComposerInstalled(): bool
    {
        return $this->runCommand('composer --version > /dev/null 2>&1', true);
    }

    private function runCommand(string $command, bool $silent = false): bool
    {
        if ($silent) {
            exec($command, $output, $exitCode);
            return $exitCode === 0;
        }

        echo "Executing: {$command}\n";
        exec($command, $output, $exitCode);

        if ($exitCode !== 0) {
            echo implode("\n", $output) . "\n";
            return false;
        }

        return true;
    }

    private function prompt(string $question, string $default = ''): string
    {
        if ($default) {
            echo "{$question} [{$default}]: ";
        } else {
            echo "{$question}: ";
        }

        $input = trim(fgets(STDIN));
        return empty($input) ? $default : $input;
    }

    private function promptSecret(string $question): string
    {
        echo "{$question}: ";
        system('stty -echo');
        $password = trim(fgets(STDIN));
        system('stty echo');
        echo "\n";
        return $password;
    }

    private function pause(string $message = '')
    {
        if ($message) {
            echo "\n{$message}";
        }
        fgets(STDIN);
    }

    private function generateRandomKey(int $length): string
    {
        return bin2hex(random_bytes($length / 2));
    }

    private function renderWebInterface()
    {
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NetFlow Installation Wizard</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { font-size: 28px; margin-bottom: 5px; }
                .header p { opacity: 0.9; font-size: 14px; }
                .content { padding: 30px; }
                .steps { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .step { flex: 1; text-align: center; padding: 10px; position: relative; }
                .step.active { background: #667eea; color: white; border-radius: 4px; }
                .step.completed { color: #667eea; }
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 5px; color: #333; font-weight: 500; }
                .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
                .form-group input:focus { outline: none; border-color: #667eea; }
                .buttons { display: flex; gap: 10px; justify-content: flex-end; }
                button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
                .btn-primary { background: #667eea; color: white; }
                .btn-primary:hover { background: #5568d3; }
                .btn-secondary { background: #ddd; color: #333; }
                .btn-secondary:hover { background: #ccc; }
                .alert { padding: 15px; border-radius: 4px; margin-bottom: 20px; }
                .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
                .alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>NetFlow Installation</h1>
                    <p>ISP Management System v<?php echo NETFLOW_VERSION; ?></p>
                </div>
                <div class="content">
                    <div class="steps">
                        <?php foreach ($this->steps as $key => $label): ?>
                            <div class="step <?php echo $key === $this->currentStep ? 'active' : ''; ?>">
                                <?php echo $label; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <?php
                    $method = 'renderStep' . ucfirst($this->currentStep);
                    if (method_exists($this, $method)) {
                        $this->$method();
                    }
                    ?>
                </div>
            </div>
        </body>
        </html>
        <?php
    }

    private function handlePostRequest()
    {
        // Handle form submission
    }
}

// Check if running as CLI
if (php_sapi_name() === 'cli') {
    $installer = new NetFlowInstaller();
    $installer->run();
} else {
    // Web interface
    $installer = new NetFlowInstaller();
    $installer->run();
}
?>
