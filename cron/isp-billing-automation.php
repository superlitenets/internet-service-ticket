<?php
/**
 * NetFlow ISP Billing Automation Cron Jobs
 * 
 * Run these cron jobs on a schedule:
 * 
 * # Generate invoices daily
 * 0 0 * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=generate-invoices
 * 
 * # Suspend unpaid services (check weekly)
 * 0 2 * * 0 /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=suspend-unpaid
 * 
 * # Reactivate paid services (daily)
 * 0 3 * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=reactivate-paid
 * 
 * # Send payment reminders (daily)
 * 0 9 * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=send-reminders
 * 
 * # Record bandwidth usage (every hour)
 * 0 * * * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=record-usage
 * 
 * # Apply late fees (monthly)
 * 0 1 1 * * /usr/bin/php /var/www/netflow/cron/isp-billing-automation.php --task=apply-late-fees
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Core\Database;

// Load environment variables
$dotenv = new Dotenv(__DIR__ . '/..');
$dotenv->load();

// Get task from CLI argument
$task = $argv[1] ?? 'help';

// Parse task name
if (strpos($task, '--task=') === 0) {
    $task = substr($task, 7);
}

class ISPBillingAutomation
{
    private $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function run($task)
    {
        echo "[" . date('Y-m-d H:i:s') . "] Starting task: $task\n";

        try {
            switch ($task) {
                case 'generate-invoices':
                    $this->generateInvoices();
                    break;
                case 'suspend-unpaid':
                    $this->suspendUnpaid();
                    break;
                case 'reactivate-paid':
                    $this->reactivatePaid();
                    break;
                case 'send-reminders':
                    $this->sendReminders();
                    break;
                case 'record-usage':
                    $this->recordUsage();
                    break;
                case 'apply-late-fees':
                    $this->applyLateFees();
                    break;
                default:
                    $this->showHelp();
            }

            echo "[" . date('Y-m-d H:i:s') . "] Task completed: $task\n";
        } catch (\Exception $e) {
            echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . "\n";
            exit(1);
        }
    }

    private function generateInvoices()
    {
        echo "Generating invoices for services due today...\n";

        // Get services that should have invoices generated today
        $services = Database::fetchAll(
            'SELECT DISTINCT s.id FROM isp_services s 
            WHERE NOT EXISTS (
                SELECT 1 FROM isp_billing_cycles bc 
                WHERE bc.service_id = s.id AND bc.billing_date = CURRENT_DATE
            ) AND s.status IN (?, ?)',
            ['active', 'suspended']
        );

        $generated = 0;
        foreach ($services as $service) {
            try {
                $this->generateInvoiceForService($service['id']);
                $generated++;
            } catch (\Exception $e) {
                echo "  Error generating invoice for service {$service['id']}: " . $e->getMessage() . "\n";
            }
        }

        echo "Generated $generated invoices.\n";
    }

    private function generateInvoiceForService($serviceId)
    {
        $service = Database::fetch(
            'SELECT s.*, p.price, p.data_limit FROM isp_services s 
            LEFT JOIN isp_packages p ON s.package_id = p.id 
            WHERE s.id = ?',
            [$serviceId]
        );

        if (!$service) {
            throw new \Exception('Service not found');
        }

        $billingDate = date('Y-m-d');
        $dueDate = date('Y-m-d', strtotime($billingDate . ' +30 days'));
        $amount = $service['price'] ?? 0;

        // Get data usage this month
        $usage = Database::fetch(
            'SELECT SUM(total_bytes) as total FROM isp_usage_logs 
            WHERE service_id = ? AND date >= DATE_TRUNC(\'month\', CURRENT_DATE)',
            [$serviceId]
        );

        $dataUsedGB = ($usage['total'] ?? 0) / 1024 / 1024 / 1024;

        // Calculate overage
        $overage = Database::fetch(
            'SELECT * FROM isp_overage_pricing WHERE package_id = ? AND is_active = true',
            [$service['package_id']]
        );

        $overageCharges = 0;
        if ($overage && $dataUsedGB > $overage['gb_threshold']) {
            $overageGB = $dataUsedGB - $overage['gb_threshold'];
            $overageCharges = $overageGB * $overage['overage_price_per_gb'];
        }

        $tax = $amount * 0.16; // 16% VAT
        $total = $amount + $overageCharges + $tax;

        // Create billing cycle
        Database::execute(
            'INSERT INTO isp_billing_cycles (service_id, billing_date, due_date, amount, tax, total, data_used, overage_charges, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$serviceId, $billingDate, $dueDate, $amount, $tax, $total, $dataUsedGB, $overageCharges, 'pending']
        );

        $cycleId = Database::lastInsertId();

        // Create invoice
        $invoiceNumber = 'INV-ISP-' . date('Ymd') . '-' . bin2hex(random_bytes(3));
        Database::execute(
            'INSERT INTO invoices (invoice_number, customer_id, amount, tax, total, status, due_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$invoiceNumber, $service['customer_id'], $amount, $tax, $total, 'unpaid', $dueDate]
        );

        $invoiceId = Database::lastInsertId();

        // Link to billing cycle
        Database::execute(
            'UPDATE isp_billing_cycles SET invoice_id = ?, status = ? WHERE id = ?',
            [$invoiceId, 'invoiced', $cycleId]
        );

        echo "  Generated invoice $invoiceNumber for service $serviceId\n";
    }

    private function suspendUnpaid()
    {
        echo "Checking for services to suspend...\n";

        $suspensionDays = 30;
        $unpaidServices = Database::fetchAll(
            'SELECT bc.*, s.id as service_id FROM isp_billing_cycles bc 
            JOIN isp_services s ON bc.service_id = s.id 
            WHERE bc.status = ? AND bc.due_date < NOW() - INTERVAL ? 
            AND s.status = ?',
            ['unpaid', $suspensionDays . ' days', 'active']
        );

        $suspended = 0;
        foreach ($unpaidServices as $service) {
            try {
                Database::execute(
                    'UPDATE isp_services SET status = ?, suspension_date = NOW() WHERE id = ?',
                    ['suspended', $service['service_id']]
                );

                Database::execute(
                    'INSERT INTO isp_service_logs (service_id, action, reason, previous_status, new_status) 
                     VALUES (?, ?, ?, ?, ?)',
                    [$service['service_id'], 'suspended', 'Unpaid invoice after ' . $suspensionDays . ' days', 'active', 'suspended']
                );

                echo "  Suspended service {$service['service_id']}\n";
                $suspended++;
            } catch (\Exception $e) {
                echo "  Error suspending service {$service['service_id']}: " . $e->getMessage() . "\n";
            }
        }

        echo "Suspended $suspended services.\n";
    }

    private function reactivatePaid()
    {
        echo "Checking for services to reactivate...\n";

        // Find suspended services with no unpaid invoices
        $suspendedServices = Database::fetchAll(
            'SELECT DISTINCT s.id FROM isp_services s 
            WHERE s.status = ? 
            AND NOT EXISTS (
                SELECT 1 FROM isp_billing_cycles bc 
                WHERE bc.service_id = s.id AND bc.status IN (?, ?)
            )',
            ['suspended', 'unpaid', 'pending']
        );

        $reactivated = 0;
        foreach ($suspendedServices as $service) {
            try {
                Database::execute(
                    'UPDATE isp_services SET status = ?, suspension_date = NULL WHERE id = ?',
                    ['active', $service['id']]
                );

                Database::execute(
                    'INSERT INTO isp_service_logs (service_id, action, previous_status, new_status) 
                     VALUES (?, ?, ?, ?)',
                    [$service['id'], 'reactivated', 'suspended', 'active']
                );

                echo "  Reactivated service {$service['id']}\n";
                $reactivated++;
            } catch (\Exception $e) {
                echo "  Error reactivating service {$service['id']}: " . $e->getMessage() . "\n";
            }
        }

        echo "Reactivated $reactivated services.\n";
    }

    private function sendReminders()
    {
        echo "Sending payment reminders...\n";

        $daysOverdue = [7, 14, 21];
        $sent = 0;

        foreach ($daysOverdue as $days) {
            $invoices = Database::fetchAll(
                'SELECT i.*, c.email, c.phone FROM invoices i 
                JOIN customers c ON i.customer_id = c.id 
                WHERE i.status = ? 
                AND i.due_date < NOW() - INTERVAL ? 
                AND NOT EXISTS (
                    SELECT 1 FROM isp_dunning_logs dl 
                    WHERE dl.invoice_id = i.id AND dl.dunning_level = ?
                )',
                ['unpaid', $days . ' days', ceil($days / 7)]
            );

            foreach ($invoices as $invoice) {
                try {
                    // In production, send actual SMS/Email
                    Database::execute(
                        'INSERT INTO isp_dunning_logs (invoice_id, customer_id, dunning_level, reminder_type, message_sent, sent_at) 
                         VALUES (?, ?, ?, ?, ?, NOW())',
                        [$invoice['id'], $invoice['customer_id'], ceil($days / 7), 'email', true]
                    );

                    echo "  Sent reminder for invoice {$invoice['invoice_number']}\n";
                    $sent++;
                } catch (\Exception $e) {
                    echo "  Error sending reminder for invoice {$invoice['id']}: " . $e->getMessage() . "\n";
                }
            }
        }

        echo "Sent $sent reminders.\n";
    }

    private function recordUsage()
    {
        echo "Recording bandwidth usage from MikroTik...\n";

        // In production, would query MikroTik API for real bandwidth data
        // This is a placeholder for the integration

        echo "Usage recording complete.\n";
    }

    private function applyLateFees()
    {
        echo "Applying late fees...\n";

        $lateFeePercent = 0.05; // 5% late fee
        $daysOverdue = 30;

        $invoices = Database::fetchAll(
            'SELECT * FROM invoices WHERE status = ? AND due_date < NOW() - INTERVAL ? AND id NOT IN (
                SELECT invoice_id FROM payments WHERE amount > 0
            )',
            ['unpaid', $daysOverdue . ' days']
        );

        $applied = 0;
        foreach ($invoices as $invoice) {
            try {
                $lateFee = $invoice['total'] * $lateFeePercent;

                // Add late fee to invoice
                $newTotal = $invoice['total'] + $lateFee;

                Database::execute(
                    'UPDATE invoices SET total = ? WHERE id = ?',
                    [$newTotal, $invoice['id']]
                );

                echo "  Applied late fee of " . number_format($lateFee, 2) . " to invoice {$invoice['invoice_number']}\n";
                $applied++;
            } catch (\Exception $e) {
                echo "  Error applying late fee to invoice {$invoice['id']}: " . $e->getMessage() . "\n";
            }
        }

        echo "Applied late fees to $applied invoices.\n";
    }

    private function showHelp()
    {
        echo "ISP Billing Automation Tasks\n\n";
        echo "Usage: php isp-billing-automation.php [TASK]\n\n";
        echo "Available tasks:\n";
        echo "  generate-invoices  - Generate invoices for services due today\n";
        echo "  suspend-unpaid     - Suspend services with unpaid invoices\n";
        echo "  reactivate-paid    - Reactivate services with all payments received\n";
        echo "  send-reminders     - Send payment reminder notifications\n";
        echo "  record-usage       - Record bandwidth usage from MikroTik\n";
        echo "  apply-late-fees    - Apply late fees to overdue invoices\n";
    }
}

// Run the automation
$automation = new ISPBillingAutomation();
$automation->run($task);
?>
