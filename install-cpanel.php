<?php
/**
 * NetFlow cPanel Installation Wizard
 * 
 * Usage: Access via browser at: https://your-domain.com/install-cpanel.php
 */

session_start();

// Check if installation is already complete
if (file_exists(__DIR__ . '/.installed')) {
    die('NetFlow is already installed. Delete the .installed file to reinstall.');
}

// Define base path
define('BASE_PATH', __DIR__);

// Get current step
$step = $_GET['step'] ?? 1;
$step = (int)$step;

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    switch ($step) {
        case 1:
            handleSystemCheck();
            break;
        case 2:
            handleDatabaseSetup();
            break;
        case 3:
            handleAdminSetup();
            break;
    }
}

function handleSystemCheck() {
    // Check PHP version
    $phpVersion = PHP_VERSION_ID;
    if ($phpVersion < 70400) {
        setError('PHP 7.4+ is required. Current version: ' . PHP_VERSION);
        return;
    }
    
    // Check extensions
    $required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'curl'];
    foreach ($required_extensions as $ext) {
        if (!extension_loaded($ext)) {
            setError("PHP extension required: $ext");
            return;
        }
    }
    
    // Check writable directories
    $writable = ['storage', 'storage/logs'];
    foreach ($writable as $dir) {
        if (!is_writable(BASE_PATH . '/' . $dir)) {
            setError("Directory not writable: $dir");
            return;
        }
    }
    
    $_SESSION['system_check'] = true;
    setSuccess('System check passed!');
}

function handleDatabaseSetup() {
    $dbHost = $_POST['db_host'] ?? '';
    $dbName = $_POST['db_name'] ?? '';
    $dbUser = $_POST['db_user'] ?? '';
    $dbPassword = $_POST['db_password'] ?? '';
    
    // Validate inputs
    if (empty($dbHost) || empty($dbName) || empty($dbUser)) {
        setError('All database fields are required.');
        return;
    }
    
    // Try to connect
    try {
        $dsn = "mysql:host=$dbHost;charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPassword);
        
        // Create database
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        // Select database
        $pdo->exec("USE `$dbName`");
        
        // Load and execute schema
        $schema = file_get_contents(BASE_PATH . '/database/schema.sql');
        $pdo->exec($schema);
        
        // Create .env file
        $envContent = file_get_contents(BASE_PATH . '/.env.example');
        $envContent = str_replace(
            ['DB_HOST=localhost', 'DB_NAME=netflow_db', 'DB_USER=netflow_user', 'DB_PASSWORD=secure_password_here'],
            ["DB_HOST=$dbHost", "DB_NAME=$dbName", "DB_USER=$dbUser", "DB_PASSWORD=$dbPassword"],
            $envContent
        );
        
        // Add JWT secret
        $jwtSecret = bin2hex(random_bytes(32));
        $envContent = str_replace('JWT_SECRET=your_jwt_secret_key_here_change_in_production', "JWT_SECRET=$jwtSecret", $envContent);
        
        file_put_contents(BASE_PATH . '/.env', $envContent);
        
        $_SESSION['database_setup'] = true;
        setSuccess('Database setup complete!');
    } catch (PDOException $e) {
        setError('Database error: ' . $e->getMessage());
    }
}

function handleAdminSetup() {
    $email = $_POST['admin_email'] ?? '';
    $password = $_POST['admin_password'] ?? '';
    $fullName = $_POST['admin_name'] ?? '';
    
    // Validate inputs
    if (empty($email) || empty($password) || empty($fullName)) {
        setError('All admin fields are required.');
        return;
    }
    
    if (strlen($password) < 8) {
        setError('Password must be at least 8 characters.');
        return;
    }
    
    try {
        // Load .env
        $env = parse_ini_file(BASE_PATH . '/.env');
        
        // Connect to database
        $dsn = "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset=utf8mb4";
        $pdo = new PDO($dsn, $env['DB_USER'], $env['DB_PASSWORD']);
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert admin user
        $stmt = $pdo->prepare(
            'INSERT INTO users (tenant_id, email, password, full_name, username, role, status) 
             VALUES (1, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$email, $hashedPassword, $fullName, $email, 'admin', 'active']);
        
        // Mark installation as complete
        touch(BASE_PATH . '/.installed');
        
        $_SESSION['installation_complete'] = true;
        setSuccess('Installation complete! You can now login with your admin credentials.');
    } catch (PDOException $e) {
        setError('Error creating admin user: ' . $e->getMessage());
    }
}

function setError($message) {
    $_SESSION['error'] = $message;
}

function setSuccess($message) {
    $_SESSION['success'] = $message;
}

function getError() {
    $error = $_SESSION['error'] ?? '';
    unset($_SESSION['error']);
    return $error;
}

function getSuccess() {
    $success = $_SESSION['success'] ?? '';
    unset($_SESSION['success']);
    return $success;
}

// HTML output
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetFlow Installation Wizard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 3rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .header h1 {
            font-size: 2rem;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            color: #666;
        }
        
        .progress {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;
        }
        
        .step {
            flex: 1;
            text-align: center;
            position: relative;
        }
        
        .step::before {
            content: attr(data-step);
            display: block;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #e5e7eb;
            color: #666;
            margin: 0 auto 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .step.active::before {
            background: #667eea;
            color: white;
        }
        
        .step.completed::before {
            background: #10b981;
            color: white;
            content: '✓';
        }
        
        .step p {
            font-size: 0.875rem;
            color: #666;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }
        
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            font-size: 1rem;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .alert {
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
        }
        
        .alert-error {
            background: #fee2e2;
            color: #991b1b;
            border-left: 4px solid #ef4444;
        }
        
        .alert-success {
            background: #d1fae5;
            color: #047857;
            border-left: 4px solid #10b981;
        }
        
        .buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }
        
        button {
            flex: 1;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5568d3;
        }
        
        .btn-secondary {
            background: #e5e7eb;
            color: #333;
        }
        
        .btn-secondary:hover {
            background: #d1d5db;
        }
        
        .complete-message {
            text-align: center;
            padding: 2rem 0;
        }
        
        .complete-message h2 {
            color: #10b981;
            margin-bottom: 1rem;
        }
        
        .complete-message p {
            color: #666;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NetFlow</h1>
            <p>ISP Management System Installation Wizard</p>
        </div>
        
        <?php if (isset($_SESSION['installation_complete'])): ?>
            <div class="complete-message">
                <h2>✓ Installation Complete</h2>
                <p>NetFlow has been successfully installed!</p>
                <p>You can now login with your admin credentials.</p>
                <a href="/login" style="display: inline-block; padding: 0.75rem 1.5rem; background: #667eea; color: white; text-decoration: none; border-radius: 4px;">Go to Login</a>
            </div>
            <?php unset($_SESSION['installation_complete']); ?>
        <?php else: ?>
            <div class="progress">
                <div class="step <?php echo $step >= 1 ? 'active' : ''; ?> <?php echo $step > 1 ? 'completed' : ''; ?>" data-step="1">
                    <p>System Check</p>
                </div>
                <div class="step <?php echo $step >= 2 ? 'active' : ''; ?> <?php echo $step > 2 ? 'completed' : ''; ?>" data-step="2">
                    <p>Database</p>
                </div>
                <div class="step <?php echo $step >= 3 ? 'active' : ''; ?>" data-step="3">
                    <p>Admin User</p>
                </div>
            </div>
            
            <?php if ($error = getError()): ?>
                <div class="alert alert-error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <?php if ($success = getSuccess()): ?>
                <div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            
            <!-- Step 1: System Check -->
            <?php if ($step === 1): ?>
                <h2 style="margin-bottom: 1rem;">System Check</h2>
                <p style="margin-bottom: 2rem; color: #666;">Verifying your server meets the requirements...</p>
                
                <form method="POST">
                    <div class="form-group">
                        <label style="font-weight: 600;">PHP Version: <?php echo phpversion(); ?></label>
                        <p style="font-size: 0.875rem; color: #666; margin: 0.5rem 0;">
                            <?php echo PHP_VERSION_ID >= 70400 ? '✓ OK' : '✗ PHP 7.4+ required'; ?>
                        </p>
                    </div>
                    
                    <div class="form-group">
                        <label style="font-weight: 600;">Required Extensions</label>
                        <div style="font-size: 0.875rem; color: #666;">
                            <?php
                            $extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'curl'];
                            foreach ($extensions as $ext) {
                                $status = extension_loaded($ext) ? '✓' : '✗';
                                echo "<p>$status $ext</p>";
                            }
                            ?>
                        </div>
                    </div>
                    
                    <div class="buttons">
                        <button type="submit" class="btn-primary">Proceed to Next Step</button>
                    </div>
                </form>
            <?php endif; ?>
            
            <!-- Step 2: Database Setup -->
            <?php if ($step === 2): ?>
                <h2 style="margin-bottom: 1rem;">Database Configuration</h2>
                <p style="margin-bottom: 2rem; color: #666;">Enter your MySQL database credentials...</p>
                
                <form method="POST">
                    <input type="hidden" name="step" value="2">
                    
                    <div class="form-group">
                        <label for="db_host">Database Host</label>
                        <input type="text" id="db_host" name="db_host" value="localhost" required>
                        <small style="color: #666; margin-top: 0.25rem; display: block;">Usually localhost</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="db_name">Database Name</label>
                        <input type="text" id="db_name" name="db_name" value="netflow_db" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="db_user">Database User</label>
                        <input type="text" id="db_user" name="db_user" value="netflow_user" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="db_password">Database Password</label>
                        <input type="password" id="db_password" name="db_password" required>
                    </div>
                    
                    <div class="buttons">
                        <button type="button" class="btn-secondary" onclick="history.back();">Back</button>
                        <button type="submit" class="btn-primary">Create Database</button>
                    </div>
                </form>
            <?php endif; ?>
            
            <!-- Step 3: Admin Setup -->
            <?php if ($step === 3): ?>
                <h2 style="margin-bottom: 1rem;">Create Admin User</h2>
                <p style="margin-bottom: 2rem; color: #666;">Create your administrator account...</p>
                
                <form method="POST">
                    <input type="hidden" name="step" value="3">
                    
                    <div class="form-group">
                        <label for="admin_name">Full Name</label>
                        <input type="text" id="admin_name" name="admin_name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="admin_email">Email Address</label>
                        <input type="email" id="admin_email" name="admin_email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="admin_password">Password</label>
                        <input type="password" id="admin_password" name="admin_password" required>
                        <small style="color: #666; margin-top: 0.25rem; display: block;">Minimum 8 characters</small>
                    </div>
                    
                    <div class="buttons">
                        <button type="button" class="btn-secondary" onclick="history.back();">Back</button>
                        <button type="submit" class="btn-primary">Complete Installation</button>
                    </div>
                </form>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</body>
</html>
