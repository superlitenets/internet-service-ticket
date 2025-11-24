<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Core\Database;

// Load environment variables
$dotenv = new Dotenv(__DIR__ . '/..');
$dotenv->load();

echo "🔄 Starting database migration...\n";

try {
    // Connect to database
    $db = Database::connect();
    echo "✅ Connected to database: " . ($_ENV['DB_NAME'] ?? 'netflow_db') . "\n";

    // Read and execute schema file
    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("Schema file not found: {$schemaFile}");
    }

    $schemaSQL = file_get_contents($schemaFile);
    
    // Split SQL statements and execute them
    $statements = array_filter(
        array_map('trim', preg_split('/;(?=(?:[^\']*\'[^\']*\')*[^\']*$)/', $schemaSQL)),
        function ($stmt) {
            return !empty($stmt) && !preg_match('/^\s*--/', $stmt);
        }
    );

    foreach ($statements as $statement) {
        if (!empty(trim($statement))) {
            try {
                $db->exec($statement . ';');
                echo "✓ Executed statement\n";
            } catch (PDOException $e) {
                // Check if table already exists
                if (strpos($e->getMessage(), 'already exists') !== false) {
                    echo "⚠ Table already exists (skipping)\n";
                } else {
                    throw $e;
                }
            }
        }
    }

    echo "\n✅ Database migration completed successfully!\n";
    echo "📊 All tables created and ready to use.\n";

} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
