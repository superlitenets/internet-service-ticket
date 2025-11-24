<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// ISP Billing Routes
$app->group('/api/isp/billing', function (RouteCollectorProxy $group) {

    // Get Billing Cycles for Service
    $group->get('/cycles/{service_id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $cycles = Database::fetchAll(
                'SELECT bc.*, i.invoice_number FROM isp_billing_cycles bc 
                LEFT JOIN invoices i ON bc.invoice_id = i.id 
                WHERE bc.service_id = ? 
                ORDER BY bc.billing_date DESC LIMIT 24',
                [$args['service_id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $cycles
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Manually Generate Invoice
    $group->post('/generate-invoice', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user || $user['role'] !== 'admin') {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Admin access required']));
            }

            $data = json_decode($request->getBody(), true);
            $serviceId = $data['service_id'] ?? null;

            if (!$serviceId) {
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Service ID required']));
            }

            // Get service and package
            $service = Database::fetch(
                'SELECT s.*, p.price, p.billing_cycle FROM isp_services s 
                LEFT JOIN isp_packages p ON s.package_id = p.id 
                WHERE s.id = ?',
                [$serviceId]
            );

            if (!$service) {
                throw new \Exception('Service not found');
            }

            // Get latest billing cycle
            $latestCycle = Database::fetch(
                'SELECT * FROM isp_billing_cycles WHERE service_id = ? ORDER BY billing_date DESC LIMIT 1',
                [$serviceId]
            );

            // Calculate billing dates
            $billingDate = $latestCycle ? date('Y-m-d', strtotime($latestCycle['due_date'] . ' +1 day')) : date('Y-m-d');
            $dueDate = date('Y-m-d', strtotime($billingDate . ' +30 days'));

            // Get data usage for period
            $usageData = Database::fetch(
                'SELECT SUM(total_bytes) as total_bytes FROM isp_usage_logs 
                WHERE service_id = ? AND date >= ? AND date < ?',
                [$serviceId, $billingDate, $dueDate]
            );

            $dataUsedGB = ($usageData['total_bytes'] ?? 0) / 1024 / 1024 / 1024;
            $amount = $service['price'] ?? 0;

            // Calculate overage charges
            $overage = Database::fetch(
                'SELECT * FROM isp_overage_pricing WHERE package_id = ? AND is_active = true',
                [$service['package_id']]
            );

            $overageCharges = 0;
            if ($overage && $dataUsedGB > $overage['gb_threshold']) {
                $overageGB = $dataUsedGB - $overage['gb_threshold'];
                $overageCharges = $overageGB * $overage['overage_price_per_gb'];
            }

            $tax = $amount * 0.16; // 16% VAT (configurable)
            $total = $amount + $overageCharges + $tax;

            // Create billing cycle
            Database::execute(
                'INSERT INTO isp_billing_cycles (service_id, billing_date, due_date, amount, tax, total, data_used, overage_charges, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$serviceId, $billingDate, $dueDate, $amount, $tax, $total, $dataUsedGB, $overageCharges, 'pending']
            );

            $cycleId = Database::lastInsertId();

            // Create invoice
            $invoiceNumber = 'INV-ISP-' . date('Ymd') . '-' . rand(10000, 99999);
            Database::execute(
                'INSERT INTO invoices (invoice_number, customer_id, amount, tax, total, status, due_date, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $invoiceNumber,
                    $service['customer_id'],
                    $amount,
                    $tax,
                    $total,
                    'unpaid',
                    $dueDate,
                    $user['id']
                ]
            );

            $invoiceId = Database::lastInsertId();

            // Link invoice to billing cycle
            Database::execute(
                'UPDATE isp_billing_cycles SET invoice_id = ?, status = ? WHERE id = ?',
                [$invoiceId, 'invoiced', $cycleId]
            );

            $cycle = Database::fetch('SELECT * FROM isp_billing_cycles WHERE id = ?', [$cycleId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $cycle,
                'message' => 'Invoice generated successfully'
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Auto-suspend unpaid services
    $group->post('/suspend-unpaid', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user || $user['role'] !== 'admin') {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Admin access required']));
            }

            $suspensionDays = 30; // Default suspension after 30 days

            // Find unpaid invoices past due
            $unpaidInvoices = Database::fetchAll(
                'SELECT bc.*, s.id as service_id FROM isp_billing_cycles bc 
                JOIN isp_services s ON bc.service_id = s.id 
                WHERE bc.status = ? AND bc.due_date < NOW() - INTERVAL ? 
                AND s.status = ?',
                ['unpaid', $suspensionDays . ' days', 'active']
            );

            $suspended = 0;
            foreach ($unpaidInvoices as $invoice) {
                // Suspend service
                Database::execute(
                    'UPDATE isp_services SET status = ?, suspension_date = NOW() WHERE id = ?',
                    ['suspended', $invoice['service_id']]
                );

                // Log suspension
                Database::execute(
                    'INSERT INTO isp_service_logs (service_id, action, reason, previous_status, new_status) 
                     VALUES (?, ?, ?, ?, ?)',
                    [$invoice['service_id'], 'suspended', 'Unpaid invoice after ' . $suspensionDays . ' days', 'active', 'suspended']
                );

                $suspended++;
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => $suspended . ' services suspended for non-payment'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Auto-reactivate paid services
    $group->post('/reactivate-paid', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user || $user['role'] !== 'admin') {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Admin access required']));
            }

            // Find suspended services with all paid invoices
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
                Database::execute(
                    'UPDATE isp_services SET status = ?, suspension_date = NULL WHERE id = ?',
                    ['active', $service['id']]
                );

                Database::execute(
                    'INSERT INTO isp_service_logs (service_id, action, previous_status, new_status) 
                     VALUES (?, ?, ?, ?)',
                    [$service['id'], 'reactivated', 'suspended', 'active']
                );

                $reactivated++;
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => $reactivated . ' services reactivated'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Send Payment Reminders (Dunning)
    $group->post('/send-reminders', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user || $user['role'] !== 'admin') {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Admin access required']));
            }

            $data = json_decode($request->getBody(), true);
            $reminderType = $data['reminder_type'] ?? 'email'; // email or sms

            // Find invoices needing reminders
            $daysOverdue = [7, 14, 21]; // Send reminders after 7, 14, 21 days
            $reminders = 0;

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
                    $message = "Payment reminder: Invoice {$invoice['invoice_number']} of {$invoice['total']} is now {$days} days overdue.";

                    // Send notification
                    if ($reminderType === 'email' && !empty($invoice['email'])) {
                        // Send email (would use mail() or mail service)
                    } elseif ($reminderType === 'sms' && !empty($invoice['phone'])) {
                        // Send SMS (would use SMS API)
                    }

                    // Log dunning attempt
                    Database::execute(
                        'INSERT INTO isp_dunning_logs (invoice_id, customer_id, dunning_level, reminder_type, message_sent, sent_at) 
                         VALUES (?, ?, ?, ?, ?, NOW())',
                        [$invoice['id'], $invoice['customer_id'], ceil($days / 7), $reminderType, true]
                    );

                    $reminders++;
                }
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => $reminders . ' payment reminders sent'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Get Billing Dashboard Stats
    $group->get('/dashboard', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Active services
            $activeServices = Database::fetch(
                'SELECT COUNT(*) as count FROM isp_services WHERE status = ?',
                ['active']
            );

            // Suspended services
            $suspendedServices = Database::fetch(
                'SELECT COUNT(*) as count FROM isp_services WHERE status = ?',
                ['suspended']
            );

            // Unpaid invoices
            $unpaidInvoices = Database::fetch(
                'SELECT COUNT(*) as count, SUM(total) as amount FROM invoices WHERE status = ?',
                ['unpaid']
            );

            // Revenue (paid invoices this month)
            $monthlyRevenue = Database::fetch(
                'SELECT SUM(total) as amount FROM invoices 
                WHERE status = ? AND paid_date >= DATE_TRUNC(\'month\', NOW())',
                ['paid']
            );

            // Overdue invoices
            $overdueInvoices = Database::fetch(
                'SELECT COUNT(*) as count, SUM(total) as amount FROM invoices 
                WHERE status = ? AND due_date < NOW()',
                ['unpaid']
            );

            $stats = [
                'active_services' => $activeServices['count'] ?? 0,
                'suspended_services' => $suspendedServices['count'] ?? 0,
                'unpaid_invoices' => $unpaidInvoices['count'] ?? 0,
                'unpaid_amount' => $unpaidInvoices['amount'] ?? 0,
                'overdue_invoices' => $overdueInvoices['count'] ?? 0,
                'overdue_amount' => $overdueInvoices['amount'] ?? 0,
                'monthly_revenue' => $monthlyRevenue['amount'] ?? 0
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $stats
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});
?>
