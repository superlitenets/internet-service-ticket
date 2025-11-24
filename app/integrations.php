<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// M-Pesa Payment Integration
$app->group('/api/integrations/mpesa', function (RouteCollectorProxy $group) {
    $group->post('/payment', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            // Validate required fields
            if (!isset($data['phone']) || !isset($data['amount']) || !isset($data['invoice_id'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Phone, amount, and invoice_id are required',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Get M-Pesa credentials
            $consumerKey = $_ENV['MPESA_CONSUMER_KEY'] ?? null;
            $consumerSecret = $_ENV['MPESA_CONSUMER_SECRET'] ?? null;
            $shortcode = $_ENV['MPESA_SHORTCODE'] ?? null;
            $passkey = $_ENV['MPESA_PASSKEY'] ?? null;

            if (!$consumerKey || !$consumerSecret) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'M-Pesa integration not configured',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Get access token
            $auth = base64_encode("{$consumerKey}:{$consumerSecret}");
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
                CURLOPT_HTTPHEADER => ['Authorization: Basic ' . $auth],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);

            $response_token = curl_exec($curl);
            $token_array = json_decode($response_token);
            $access_token = $token_array->access_token ?? null;

            if (!$access_token) {
                throw new \Exception('Failed to get M-Pesa access token');
            }

            // Prepare STK Push request
            $timestamp = date('YmdHis');
            $password = base64_encode($shortcode . $passkey . $timestamp);

            $stkPushRequest = [
                'BusinessShortCode' => $shortcode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline',
                'Amount' => intval($data['amount']),
                'PartyA' => $data['phone'],
                'PartyB' => $shortcode,
                'PhoneNumber' => $data['phone'],
                'CallBackURL' => $_ENV['APP_URL'] . '/api/integrations/mpesa/callback',
                'AccountReference' => 'Invoice-' . $data['invoice_id'],
                'TransactionDesc' => 'Payment for Invoice #' . $data['invoice_id'],
            ];

            // Send STK Push
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $access_token,
                    'Content-Type: application/json',
                ],
                CURLOPT_POSTFIELDS => json_encode($stkPushRequest),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);

            $mpesa_response = curl_exec($curl);
            $mpesa_result = json_decode($mpesa_response);

            curl_close($curl);

            // Save payment request
            Database::execute(
                'INSERT INTO payments (invoice_id, customer_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    $data['invoice_id'],
                    $data['customer_id'] ?? null,
                    $data['amount'],
                    'mpesa',
                    $mpesa_result->CheckoutRequestID ?? null,
                    'pending',
                ]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $mpesa_result,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->post('/callback', function (Request $request, Response $response) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            $resultCode = $data['Body']['stkCallback']['ResultCode'] ?? null;
            $checkoutRequestID = $data['Body']['stkCallback']['CheckoutRequestID'] ?? null;

            if ($resultCode === 0) {
                // Payment successful
                $callbackMetadata = $data['Body']['stkCallback']['CallbackMetadata']['Item'] ?? [];
                $amount = null;
                $receiptNumber = null;
                $phoneNumber = null;

                foreach ($callbackMetadata as $item) {
                    if ($item['Name'] === 'Amount') {
                        $amount = $item['Value'];
                    } elseif ($item['Name'] === 'MpesaReceiptNumber') {
                        $receiptNumber = $item['Value'];
                    } elseif ($item['Name'] === 'PhoneNumber') {
                        $phoneNumber = $item['Value'];
                    }
                }

                // Update payment status
                Database::execute(
                    'UPDATE payments SET status = ?, reference_number = ? WHERE transaction_id = ?',
                    ['completed', $receiptNumber, $checkoutRequestID]
                );
            } else {
                // Payment failed
                Database::execute(
                    'UPDATE payments SET status = ? WHERE transaction_id = ?',
                    ['failed', $checkoutRequestID]
                );
            }

            $response->getBody()->write(json_encode(['ResultCode' => 0]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});

// SMS Integration
$app->group('/api/integrations/sms', function (RouteCollectorProxy $group) {
    $group->post('/send', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            if (!isset($data['phone']) || !isset($data['message'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Phone and message are required',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $apiKey = $_ENV['SMS_API_KEY'] ?? null;
            $endpoint = $_ENV['SMS_ENDPOINT'] ?? null;

            if (!$apiKey || !$endpoint) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'SMS integration not configured',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Send SMS via API
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => $endpoint,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode([
                    'api_key' => $apiKey,
                    'to' => $data['phone'],
                    'message' => $data['message'],
                ]),
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);

            $sms_response = curl_exec($curl);
            $sms_result = json_decode($sms_response);

            curl_close($curl);

            // Log SMS
            Database::execute(
                'INSERT INTO sms_logs (phone, message, status, response) VALUES (?, ?, ?, ?)',
                [$data['phone'], $data['message'], 'sent', json_encode($sms_result)]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $sms_result,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});

// MikroTik Integration
$app->group('/api/integrations/mikrotik', function (RouteCollectorProxy $group) {
    $group->get('/interfaces', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $host = $_ENV['MIKROTIK_API_HOST'] ?? null;
            $port = $_ENV['MIKROTIK_API_PORT'] ?? 8728;
            $username = $_ENV['MIKROTIK_API_USER'] ?? null;
            $password = $_ENV['MIKROTIK_API_PASSWORD'] ?? null;

            if (!$host || !$username) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'MikroTik integration not configured',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Connect to MikroTik API
            $conn = @fsockopen($host, $port, $errno, $errstr, 10);

            if (!$conn) {
                throw new \Exception('Failed to connect to MikroTik: ' . $errstr);
            }

            // Authentication and get interfaces (simplified)
            // In a real implementation, you'd use the MikroTik API library
            $interfaces = [
                ['name' => 'ether1', 'running' => true, 'rx-byte' => 1024000, 'tx-byte' => 512000],
                ['name' => 'ether2', 'running' => true, 'rx-byte' => 2048000, 'tx-byte' => 1024000],
            ];

            fclose($conn);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $interfaces,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->get('/bandwidth-usage', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Get bandwidth usage data from database or cache
            $bandwidthData = Database::fetchAll(
                'SELECT * FROM bandwidth_usage ORDER BY recorded_at DESC LIMIT 100'
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $bandwidthData,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});

// Reports Routes
$app->group('/api/reports', function (RouteCollectorProxy $group) {
    $group->get('/revenue', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $period = $_GET['period'] ?? 'monthly';

            $revenueData = Database::fetchAll(
                'SELECT DATE(paid_date) as date, SUM(amount) as total FROM payments 
                WHERE status = ? AND paid_date IS NOT NULL 
                GROUP BY DATE(paid_date) 
                ORDER BY date DESC 
                LIMIT 30',
                ['completed']
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $revenueData,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->get('/customers', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $customerStats = Database::fetchAll(
                'SELECT status, COUNT(*) as count FROM customers GROUP BY status'
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customerStats,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});
