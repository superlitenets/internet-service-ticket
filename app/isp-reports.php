<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// ISP Reports & Analytics Routes
$app->group('/api/isp/reports', function (RouteCollectorProxy $group) {

    // Revenue Report
    $group->get('/revenue', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $period = $_GET['period'] ?? 'monthly'; // daily, weekly, monthly, yearly
            $months = $_GET['months'] ?? 12;

            $revenueData = Database::fetchAll(
                'SELECT DATE_TRUNC(\'month\', paid_date)::date as period, SUM(total) as revenue, COUNT(*) as invoice_count 
                FROM invoices 
                WHERE status = ? AND paid_date >= NOW() - INTERVAL ? 
                GROUP BY DATE_TRUNC(\'month\', paid_date) 
                ORDER BY period DESC',
                ['paid', $months . ' months']
            );

            // Calculate metrics
            $totalRevenue = 0;
            $avgRevenue = 0;
            foreach ($revenueData as $data) {
                $totalRevenue += $data['revenue'] ?? 0;
            }
            $avgRevenue = count($revenueData) > 0 ? $totalRevenue / count($revenueData) : 0;

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'revenue_data' => $revenueData,
                    'total_revenue' => $totalRevenue,
                    'average_monthly_revenue' => round($avgRevenue, 2),
                    'period' => $period
                ]
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

    // Customer Churn Analysis
    $group->get('/churn', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $months = $_GET['months'] ?? 12;

            // Churned customers (terminated services)
            $churnedData = Database::fetchAll(
                'SELECT DATE_TRUNC(\'month\', termination_date)::date as period, COUNT(*) as churned_count 
                FROM isp_services 
                WHERE status = ? AND termination_date >= NOW() - INTERVAL ? 
                GROUP BY DATE_TRUNC(\'month\', termination_date) 
                ORDER BY period DESC',
                ['terminated', $months . ' months']
            );

            // Total active services by month
            $activeData = Database::fetchAll(
                'SELECT DATE_TRUNC(\'month\', activation_date)::date as period, COUNT(*) as activated_count 
                FROM isp_services 
                WHERE status IN (?, ?) AND activation_date >= NOW() - INTERVAL ? 
                GROUP BY DATE_TRUNC(\'month\', activation_date) 
                ORDER BY period DESC',
                ['active', 'suspended', $months . ' months']
            );

            // Calculate churn rate
            $totalChurned = 0;
            $totalActivated = 0;
            foreach ($churnedData as $data) {
                $totalChurned += $data['churned_count'] ?? 0;
            }
            foreach ($activeData as $data) {
                $totalActivated += $data['activated_count'] ?? 0;
            }

            $churnRate = $totalActivated > 0 ? ($totalChurned / $totalActivated) * 100 : 0;

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'churned_services' => $churnedData,
                    'activated_services' => $activeData,
                    'total_churned' => $totalChurned,
                    'total_activated' => $totalActivated,
                    'churn_rate_percent' => round($churnRate, 2)
                ]
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

    // Payment Analysis
    $group->get('/payments', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $months = $_GET['months'] ?? 12;

            // Payment trends
            $paymentTrends = Database::fetchAll(
                'SELECT DATE_TRUNC(\'month\', paid_date)::date as period, payment_method, COUNT(*) as count, SUM(amount) as total 
                FROM payments 
                WHERE status = ? AND paid_date >= NOW() - INTERVAL ? 
                GROUP BY DATE_TRUNC(\'month\', paid_date), payment_method 
                ORDER BY period DESC',
                ['completed', $months . ' months']
            );

            // Payment method breakdown
            $methodBreakdown = Database::fetchAll(
                'SELECT payment_method, COUNT(*) as count, SUM(amount) as total 
                FROM payments 
                WHERE status = ? 
                GROUP BY payment_method',
                ['completed']
            );

            // Overdue analysis
            $overdueAnalysis = Database::fetch(
                'SELECT COUNT(*) as count, SUM(total) as amount FROM invoices 
                WHERE status = ? AND due_date < NOW()',
                ['unpaid']
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'payment_trends' => $paymentTrends,
                    'method_breakdown' => $methodBreakdown,
                    'overdue_invoices' => $overdueAnalysis
                ]
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

    // Usage Analytics
    $group->get('/usage-analytics', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $days = $_GET['days'] ?? 30;

            // Daily total usage
            $dailyUsage = Database::fetchAll(
                'SELECT date, SUM(total_bytes) as total_bytes, AVG(average_speed) as avg_speed, MAX(peak_speed) as peak_speed 
                FROM isp_usage_logs 
                WHERE date >= NOW() - INTERVAL ? 
                GROUP BY date 
                ORDER BY date DESC',
                [$days . ' days']
            );

            // Top users by usage
            $topUsers = Database::fetchAll(
                'SELECT s.id, c.name, SUM(ul.total_bytes) as total_bytes 
                FROM isp_usage_logs ul 
                JOIN isp_services s ON ul.service_id = s.id 
                JOIN customers c ON s.customer_id = c.id 
                WHERE ul.date >= NOW() - INTERVAL ? 
                GROUP BY s.id, c.name 
                ORDER BY total_bytes DESC LIMIT 10',
                [$days . ' days']
            );

            // Peak hours analysis
            $peakHours = Database::fetchAll(
                'SELECT EXTRACT(HOUR FROM date) as hour, SUM(total_bytes) as total_bytes, COUNT(*) as session_count 
                FROM isp_usage_logs 
                WHERE date >= NOW() - INTERVAL \'7 days\' 
                GROUP BY EXTRACT(HOUR FROM date) 
                ORDER BY total_bytes DESC',
                []
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'daily_usage' => $dailyUsage,
                    'top_users' => $topUsers,
                    'peak_hours' => $peakHours
                ]
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

    // Service Health Report
    $group->get('/service-health', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Services by status
            $byStatus = Database::fetchAll(
                'SELECT status, COUNT(*) as count FROM isp_services GROUP BY status'
            );

            // Services by package
            $byPackage = Database::fetchAll(
                'SELECT p.name, COUNT(s.id) as count 
                FROM isp_services s 
                JOIN isp_packages p ON s.package_id = p.id 
                GROUP BY p.name'
            );

            // Average usage by package
            $usageByPackage = Database::fetchAll(
                'SELECT p.name, AVG(ul.total_bytes) as avg_bytes, AVG(ul.average_speed) as avg_speed 
                FROM isp_usage_logs ul 
                JOIN isp_services s ON ul.service_id = s.id 
                JOIN isp_packages p ON s.package_id = p.id 
                WHERE ul.date >= NOW() - INTERVAL \'30 days\' 
                GROUP BY p.name'
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'by_status' => $byStatus,
                    'by_package' => $byPackage,
                    'usage_by_package' => $usageByPackage
                ]
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

    // Executive Dashboard Summary
    $group->get('/executive-summary', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // KPIs
            $totalCustomers = Database::fetch('SELECT COUNT(*) as count FROM customers WHERE status = ?', ['active']);
            $activeServices = Database::fetch('SELECT COUNT(*) as count FROM isp_services WHERE status = ?', ['active']);
            $monthlyRevenue = Database::fetch(
                'SELECT SUM(total) as amount FROM invoices WHERE status = ? AND paid_date >= DATE_TRUNC(\'month\', NOW())',
                ['paid']
            );
            $arpu = Database::fetch(
                'SELECT AVG(total) as avg FROM invoices WHERE status = ? AND paid_date >= NOW() - INTERVAL \'30 days\'',
                ['paid']
            );

            $summary = [
                'total_customers' => $totalCustomers['count'] ?? 0,
                'active_services' => $activeServices['count'] ?? 0,
                'monthly_revenue' => round($monthlyRevenue['amount'] ?? 0, 2),
                'arpu' => round($arpu['avg'] ?? 0, 2),
                'timestamp' => date('Y-m-d H:i:s')
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
