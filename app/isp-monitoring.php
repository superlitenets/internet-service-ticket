<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// ISP Bandwidth Monitoring Routes
$app->group('/api/isp/monitoring', function (RouteCollectorProxy $group) {

    // Log Usage Data (from MikroTik)
    $group->post('/usage', function (Request $request, Response $response) {
        try {
            $data = json_decode($request->getBody(), true);

            if (!isset($data['service_id']) || !isset($data['download_bytes']) || !isset($data['upload_bytes'])) {
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Missing required fields']));
            }

            // Get or create usage log for today
            $existingLog = Database::fetch(
                'SELECT * FROM isp_usage_logs WHERE service_id = ? AND date = CURRENT_DATE',
                [$data['service_id']]
            );

            $totalBytes = ($data['download_bytes'] ?? 0) + ($data['upload_bytes'] ?? 0);
            $averageSpeed = $data['average_speed'] ?? 0;
            $peakSpeed = $data['peak_speed'] ?? 0;

            if ($existingLog) {
                // Update existing log
                Database::execute(
                    'UPDATE isp_usage_logs SET download_bytes = ?, upload_bytes = ?, total_bytes = ?, average_speed = ?, peak_speed = ?, session_count = ?, connection_time = ? WHERE id = ?',
                    [
                        ($existingLog['download_bytes'] ?? 0) + ($data['download_bytes'] ?? 0),
                        ($existingLog['upload_bytes'] ?? 0) + ($data['upload_bytes'] ?? 0),
                        ($existingLog['total_bytes'] ?? 0) + $totalBytes,
                        $averageSpeed,
                        max($existingLog['peak_speed'] ?? 0, $peakSpeed),
                        ($existingLog['session_count'] ?? 0) + 1,
                        ($existingLog['connection_time'] ?? 0) + ($data['connection_time'] ?? 0),
                        $existingLog['id']
                    ]
                );
            } else {
                // Create new log
                $service = Database::fetch('SELECT customer_id FROM isp_services WHERE id = ?', [$data['service_id']]);

                Database::execute(
                    'INSERT INTO isp_usage_logs (service_id, customer_id, date, download_bytes, upload_bytes, total_bytes, average_speed, peak_speed, session_count, connection_time) 
                     VALUES (?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $data['service_id'],
                        $service['customer_id'],
                        $data['download_bytes'] ?? 0,
                        $data['upload_bytes'] ?? 0,
                        $totalBytes,
                        $averageSpeed,
                        $peakSpeed,
                        1,
                        $data['connection_time'] ?? 0
                    ]
                );
            }

            // Check for usage alerts
            $service = Database::fetch(
                'SELECT s.*, p.data_limit FROM isp_services s 
                LEFT JOIN isp_packages p ON s.package_id = p.id 
                WHERE s.id = ?',
                [$data['service_id']]
            );

            if ($service['data_limit']) {
                $monthlyUsage = Database::fetch(
                    'SELECT SUM(total_bytes) as total FROM isp_usage_logs 
                    WHERE service_id = ? AND date >= DATE_TRUNC(\'month\', CURRENT_DATE)',
                    [$data['service_id']]
                );

                $usageGB = ($monthlyUsage['total'] ?? 0) / 1024 / 1024 / 1024;
                $threshold = $service['data_limit'];

                // Alert at 80% and 100%
                if ($usageGB >= ($threshold * 0.80)) {
                    $alertType = $usageGB >= $threshold ? 'data_limit_100' : 'data_limit_80';
                    
                    // Check if alert already exists
                    $existingAlert = Database::fetch(
                        'SELECT * FROM isp_usage_alerts WHERE service_id = ? AND alert_type = ? AND alert_status = ?',
                        [$data['service_id'], $alertType, 'active']
                    );

                    if (!$existingAlert) {
                        Database::execute(
                            'INSERT INTO isp_usage_alerts (service_id, customer_id, alert_type, threshold_value, current_value) 
                             VALUES (?, ?, ?, ?, ?)',
                            [$data['service_id'], $service['customer_id'], $alertType, $threshold, $usageGB]
                        );
                    }
                }
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Usage data recorded'
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

    // Get Usage Stats for Service
    $group->get('/usage/{service_id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $days = $_GET['days'] ?? 30;

            // Daily usage data
            $dailyUsage = Database::fetchAll(
                'SELECT date, download_bytes, upload_bytes, total_bytes, average_speed, peak_speed 
                FROM isp_usage_logs 
                WHERE service_id = ? AND date >= NOW() - INTERVAL ? 
                ORDER BY date ASC',
                [$args['service_id'], $days . ' days']
            );

            // Monthly totals
            $monthlyUsage = Database::fetch(
                'SELECT SUM(total_bytes) as total_bytes, AVG(average_speed) as avg_speed, MAX(peak_speed) as peak_speed 
                FROM isp_usage_logs 
                WHERE service_id = ? AND date >= DATE_TRUNC(\'month\', NOW())',
                [$args['service_id']]
            );

            // Peak hours
            $peakHours = Database::fetchAll(
                'SELECT EXTRACT(HOUR FROM date) as hour, COUNT(*) as connections, AVG(average_speed) as avg_speed 
                FROM isp_usage_logs 
                WHERE service_id = ? AND date >= NOW() - INTERVAL \'7 days\' 
                GROUP BY EXTRACT(HOUR FROM date) 
                ORDER BY avg_speed DESC',
                [$args['service_id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'daily_usage' => $dailyUsage,
                    'monthly_usage' => $monthlyUsage,
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

    // Get Real-time Bandwidth for Service
    $group->get('/bandwidth/{service_id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Get latest usage data (last 24 hours)
            $recentUsage = Database::fetchAll(
                'SELECT * FROM isp_usage_logs 
                WHERE service_id = ? AND date >= NOW() - INTERVAL \'1 day\' 
                ORDER BY date DESC LIMIT 1',
                [$args['service_id']]
            );

            // Get service and package info
            $service = Database::fetch(
                'SELECT s.*, p.download_speed, p.upload_speed, p.data_limit 
                FROM isp_services s 
                LEFT JOIN isp_packages p ON s.package_id = p.id 
                WHERE s.id = ?',
                [$args['service_id']]
            );

            // Calculate monthly usage percentage
            $monthlyUsage = Database::fetch(
                'SELECT SUM(total_bytes) as total FROM isp_usage_logs 
                WHERE service_id = ? AND date >= DATE_TRUNC(\'month\', NOW())',
                [$args['service_id']]
            );

            $usageGB = ($monthlyUsage['total'] ?? 0) / 1024 / 1024 / 1024;
            $usagePercent = $service['data_limit'] ? ($usageGB / $service['data_limit']) * 100 : 0;

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'service' => $service,
                    'recent_usage' => $recentUsage[0] ?? null,
                    'monthly_usage' => [
                        'gb_used' => round($usageGB, 2),
                        'gb_limit' => $service['data_limit'],
                        'percent' => round($usagePercent, 2)
                    ]
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

    // Get Usage Alerts
    $group->get('/alerts/{service_id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $alerts = Database::fetchAll(
                'SELECT * FROM isp_usage_alerts 
                WHERE service_id = ? 
                ORDER BY created_at DESC LIMIT 10',
                [$args['service_id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $alerts
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

    // Acknowledge Alert
    $group->put('/alerts/{id}/acknowledge', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            Database::execute(
                'UPDATE isp_usage_alerts SET alert_status = ? WHERE id = ?',
                ['acknowledged', $args['id']]
            );

            $alert = Database::fetch('SELECT * FROM isp_usage_alerts WHERE id = ?', [$args['id']]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $alert
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

    // Network Health Dashboard
    $group->get('/health', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Online users
            $onlineUsers = Database::fetch(
                'SELECT COUNT(*) as count FROM isp_services WHERE status = ?',
                ['active']
            );

            // Total bandwidth usage (last hour)
            $bandwidthLastHour = Database::fetch(
                'SELECT SUM(total_bytes) as total FROM isp_usage_logs WHERE date >= NOW() - INTERVAL \'1 hour\'',
                []
            );

            // Average connection speed
            $avgSpeed = Database::fetch(
                'SELECT AVG(average_speed) as avg FROM isp_usage_logs WHERE date >= NOW() - INTERVAL \'1 day\'',
                []
            );

            // Peak bandwidth today
            $peakBandwidth = Database::fetch(
                'SELECT MAX(peak_speed) as peak FROM isp_usage_logs WHERE date = CURRENT_DATE',
                []
            );

            $health = [
                'online_users' => $onlineUsers['count'] ?? 0,
                'bandwidth_last_hour_gb' => round((($bandwidthLastHour['total'] ?? 0) / 1024 / 1024 / 1024), 2),
                'average_speed_mbps' => round($avgSpeed['avg'] ?? 0, 2),
                'peak_bandwidth_mbps' => round($peakBandwidth['peak'] ?? 0, 2),
                'network_status' => 'healthy',
                'timestamp' => date('Y-m-d H:i:s')
            ];

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $health
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
