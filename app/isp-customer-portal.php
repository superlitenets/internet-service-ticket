<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// Customer Portal Routes (Self-Service)
$app->group('/api/customer/portal', function (RouteCollectorProxy $group) {

    // Get My Services
    $group->get('/services', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Get customer ID from user email
            $customer = Database::fetch(
                'SELECT id FROM customers WHERE email = ? OR id = ?',
                [$user['email'], $user['id'] ?? null]
            );

            if (!$customer) {
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Customer record not found']));
            }

            $services = Database::fetchAll(
                'SELECT s.*, p.name as package_name, p.download_speed, p.upload_speed, p.data_limit 
                FROM isp_services s 
                LEFT JOIN isp_packages p ON s.package_id = p.id 
                WHERE s.customer_id = ?',
                [$customer['id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $services
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

    // Get My Service Details
    $group->get('/services/{service_id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $service = Database::fetch(
                'SELECT s.*, p.name, p.download_speed, p.upload_speed, p.data_limit, p.price 
                FROM isp_services s 
                LEFT JOIN isp_packages p ON s.package_id = p.id 
                WHERE s.id = ?',
                [$args['service_id']]
            );

            if (!$service) {
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Service not found']));
            }

            // Get current month usage
            $usage = Database::fetch(
                'SELECT SUM(total_bytes) as total FROM isp_usage_logs 
                WHERE service_id = ? AND date >= DATE_TRUNC(\'month\', NOW())',
                [$args['service_id']]
            );

            $usageGB = ($usage['total'] ?? 0) / 1024 / 1024 / 1024;
            $usagePercent = $service['data_limit'] ? ($usageGB / $service['data_limit']) * 100 : 0;

            $serviceData = array_merge($service, [
                'current_usage_gb' => round($usageGB, 2),
                'usage_percent' => round($usagePercent, 2)
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $serviceData
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

    // Get My Invoices
    $group->get('/invoices', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $customer = Database::fetch(
                'SELECT id FROM customers WHERE email = ?',
                [$user['email']]
            );

            if (!$customer) {
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Customer record not found']));
            }

            $invoices = Database::fetchAll(
                'SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC LIMIT 24',
                [$customer['id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $invoices
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

    // Get Invoice Details
    $group->get('/invoices/{invoice_id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $invoice = Database::fetch('SELECT * FROM invoices WHERE id = ?', [$args['invoice_id']]);

            if (!$invoice) {
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Invoice not found']));
            }

            // Get payments for this invoice
            $payments = Database::fetchAll(
                'SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC',
                [$invoice['id']]
            );

            $invoiceData = array_merge($invoice, ['payments' => $payments]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $invoiceData
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

    // Get Usage Dashboard
    $group->get('/usage-dashboard/{service_id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $days = $_GET['days'] ?? 30;

            // Service info
            $service = Database::fetch(
                'SELECT s.*, p.download_speed, p.upload_speed, p.data_limit 
                FROM isp_services s 
                LEFT JOIN isp_packages p ON s.package_id = p.id 
                WHERE s.id = ?',
                [$args['service_id']]
            );

            // Daily usage
            $dailyUsage = Database::fetchAll(
                'SELECT date, total_bytes, average_speed, peak_speed 
                FROM isp_usage_logs 
                WHERE service_id = ? AND date >= NOW() - INTERVAL ? 
                ORDER BY date DESC',
                [$args['service_id'], $days . ' days']
            );

            // Monthly summary
            $monthlyUsage = Database::fetch(
                'SELECT SUM(total_bytes) as total, AVG(average_speed) as avg_speed, MAX(peak_speed) as peak_speed 
                FROM isp_usage_logs 
                WHERE service_id = ? AND date >= DATE_TRUNC(\'month\', NOW())',
                [$args['service_id']]
            );

            $usageGB = ($monthlyUsage['total'] ?? 0) / 1024 / 1024 / 1024;
            $usagePercent = $service['data_limit'] ? ($usageGB / $service['data_limit']) * 100 : 0;

            $dashboard = [
                'service' => $service,
                'daily_usage' => $dailyUsage,
                'monthly_usage' => [
                    'total_gb' => round($usageGB, 2),
                    'limit_gb' => $service['data_limit'],
                    'percent' => round($usagePercent, 2),
                    'average_speed_mbps' => round($monthlyUsage['avg_speed'] ?? 0, 2),
                    'peak_speed_mbps' => round($monthlyUsage['peak_speed'] ?? 0, 2)
                ]
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $dashboard
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

    // Upgrade/Downgrade Service
    $group->post('/services/{service_id}/change-package', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            if (!isset($data['new_package_id'])) {
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Package ID required']));
            }

            // Get current service and package
            $currentService = Database::fetch('SELECT * FROM isp_services WHERE id = ?', [$args['service_id']]);
            $currentPackage = Database::fetch('SELECT * FROM isp_packages WHERE id = ?', [$currentService['package_id']]);
            $newPackage = Database::fetch('SELECT * FROM isp_packages WHERE id = ?', [$data['new_package_id']]);

            if (!$currentService || !$newPackage) {
                throw new \Exception('Service or package not found');
            }

            // Calculate proration credit
            $daysUsed = (time() - strtotime($currentService['activation_date'])) / 86400;
            $daysRemaining = 30 - $daysUsed;
            $dailyRate = $currentPackage['price'] / 30;
            $provisionCredit = round($daysRemaining * $dailyRate, 2);

            // Record change
            Database::execute(
                'INSERT INTO isp_service_changes (service_id, customer_id, old_package_id, new_package_id, change_type, proration_credit, effective_date) 
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)',
                [
                    $args['service_id'],
                    $currentService['customer_id'],
                    $currentService['package_id'],
                    $data['new_package_id'],
                    $newPackage['price'] > $currentPackage['price'] ? 'upgrade' : 'downgrade',
                    $provisionCredit
                ]
            );

            // Update service package (in real system, would update MikroTik queue too)
            Database::execute(
                'UPDATE isp_services SET package_id = ? WHERE id = ?',
                [$data['new_package_id'], $args['service_id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Service upgraded/downgraded successfully',
                'proration_credit' => $provisionCredit
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

    // Get Available Packages
    $group->get('/packages', function (Request $request, Response $response) {
        try {
            $packages = Database::fetchAll(
                'SELECT * FROM isp_packages WHERE is_active = true ORDER BY price'
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $packages
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

    // Account Summary
    $group->get('/summary', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $customer = Database::fetch(
                'SELECT * FROM customers WHERE email = ?',
                [$user['email']]
            );

            if (!$customer) {
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Customer record not found']));
            }

            // Services count
            $services = Database::fetch(
                'SELECT COUNT(*) as active FROM isp_services WHERE customer_id = ? AND status = ?',
                [$customer['id'], 'active']
            );

            // Outstanding balance
            $balance = Database::fetch(
                'SELECT SUM(total) as amount FROM invoices WHERE customer_id = ? AND status IN (?, ?)',
                [$customer['id'], 'unpaid', 'overdue']
            );

            // Recent payment
            $lastPayment = Database::fetch(
                'SELECT amount, paid_date FROM payments WHERE customer_id = ? AND status = ? ORDER BY paid_date DESC LIMIT 1',
                [$customer['id'], 'completed']
            );

            $summary = [
                'customer' => $customer,
                'active_services' => $services['active'] ?? 0,
                'outstanding_balance' => round($balance['amount'] ?? 0, 2),
                'last_payment' => $lastPayment
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $summary
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
