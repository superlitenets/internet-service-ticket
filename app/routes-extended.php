<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// Invoices Routes
$app->group('/api/invoices', function (RouteCollectorProxy $group) {
    $group->get('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $invoices = Database::fetchAll(
                'SELECT i.*, c.name as customer_name, c.email as customer_email FROM invoices i 
                LEFT JOIN customers c ON i.customer_id = c.id 
                ORDER BY i.created_at DESC LIMIT 100'
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $invoices,
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

    $group->post('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            // Generate invoice number
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . rand(1000, 9999);

            Database::execute(
                'INSERT INTO invoices (invoice_number, customer_id, amount, tax, total, status, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $invoiceNumber,
                    $data['customer_id'],
                    $data['amount'] ?? 0,
                    $data['tax'] ?? 0,
                    $data['total'] ?? $data['amount'] ?? 0,
                    $data['status'] ?? 'unpaid',
                    $data['due_date'] ?? null,
                    $user['id'],
                ]
            );

            $invoiceId = Database::lastInsertId();
            $invoice = Database::fetch('SELECT * FROM invoices WHERE id = ?', [$invoiceId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $invoice,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->get('/{id}', function (Request $request, Response $response, array $args) {
        try {
            $invoice = Database::fetch('SELECT * FROM invoices WHERE id = ?', [$args['id']]);

            if (!$invoice) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Invoice not found',
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $invoice,
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

// Tickets Routes
$app->group('/api/tickets', function (RouteCollectorProxy $group) {
    $group->get('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $tickets = Database::fetchAll(
                'SELECT t.*, c.name as customer_name, u.username as assigned_username FROM tickets t 
                LEFT JOIN customers c ON t.customer_id = c.id 
                LEFT JOIN users u ON t.assigned_to = u.id 
                ORDER BY t.created_at DESC LIMIT 50'
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tickets,
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

    $group->post('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            $ticketNumber = 'TKT-' . date('Ymd') . '-' . rand(1000, 9999);

            Database::execute(
                'INSERT INTO tickets (ticket_number, customer_id, subject, description, category, priority, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $ticketNumber,
                    $data['customer_id'] ?? null,
                    $data['subject'],
                    $data['description'] ?? null,
                    $data['category'] ?? null,
                    $data['priority'] ?? 'medium',
                    'open',
                    $user['id'],
                ]
            );

            $ticketId = Database::lastInsertId();
            $ticket = Database::fetch('SELECT * FROM tickets WHERE id = ?', [$ticketId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $ticket,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->get('/{id}', function (Request $request, Response $response, array $args) {
        try {
            $ticket = Database::fetch('SELECT * FROM tickets WHERE id = ?', [$args['id']]);

            if (!$ticket) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Ticket not found',
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Fetch ticket replies
            $replies = Database::fetchAll(
                'SELECT tr.*, u.username, u.full_name FROM ticket_replies tr 
                LEFT JOIN users u ON tr.user_id = u.id 
                WHERE tr.ticket_id = ? 
                ORDER BY tr.created_at ASC',
                [$args['id']]
            );

            $ticket['replies'] = $replies;

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $ticket,
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

    $group->post('/{id}/replies', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            Database::execute(
                'INSERT INTO ticket_replies (ticket_id, user_id, message, is_internal) VALUES (?, ?, ?, ?)',
                [$args['id'], $user['id'], $data['message'], $data['is_internal'] ?? false]
            );

            $replyId = Database::lastInsertId();
            $reply = Database::fetch('SELECT * FROM ticket_replies WHERE id = ?', [$replyId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $reply,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});

// Payments Routes
$app->group('/api/payments', function (RouteCollectorProxy $group) {
    $group->get('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $payments = Database::fetchAll(
                'SELECT p.*, c.name as customer_name FROM payments p 
                LEFT JOIN customers c ON p.customer_id = c.id 
                ORDER BY p.created_at DESC LIMIT 100'
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $payments,
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

    $group->post('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            Database::execute(
                'INSERT INTO payments (invoice_id, customer_id, amount, payment_method, transaction_id, reference_number, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    $data['invoice_id'] ?? null,
                    $data['customer_id'],
                    $data['amount'],
                    $data['payment_method'] ?? null,
                    $data['transaction_id'] ?? null,
                    $data['reference_number'] ?? null,
                    $data['status'] ?? 'pending',
                ]
            );

            $paymentId = Database::lastInsertId();
            $payment = Database::fetch('SELECT * FROM payments WHERE id = ?', [$paymentId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $payment,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});

// Settings Routes
$app->group('/api/settings', function (RouteCollectorProxy $group) {
    $group->get('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $settings = Database::fetchAll('SELECT key, value, group_name FROM settings ORDER BY group_name');

            // Convert to key-value array
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting['key']] = $setting['value'];
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $result,
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

    $group->put('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user || $user['role'] !== 'admin') {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            foreach ($data as $key => $value) {
                Database::execute(
                    'INSERT INTO settings (key, value, group_name, updated_at) VALUES (?, ?, ?, NOW()) 
                    ON CONFLICT (key) DO UPDATE SET value = ?, updated_at = NOW()',
                    [$key, $value, 'general', $value]
                );
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Settings updated',
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

// Statistics Routes
$app->group('/api/stats', function (RouteCollectorProxy $group) {
    $group->get('/dashboard', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $stats = [];

            // Total customers
            $customers = Database::fetch('SELECT COUNT(*) as count FROM customers WHERE status = ?', ['active']);
            $stats['total_customers'] = $customers['count'] ?? 0;

            // Total invoices
            $invoices = Database::fetch('SELECT COUNT(*) as count FROM invoices');
            $stats['total_invoices'] = $invoices['count'] ?? 0;

            // Unpaid invoices
            $unpaid = Database::fetch('SELECT COUNT(*) as count FROM invoices WHERE status = ?', ['unpaid']);
            $stats['unpaid_invoices'] = $unpaid['count'] ?? 0;

            // Total payments
            $payments = Database::fetch('SELECT SUM(amount) as total FROM payments WHERE status = ?', ['completed']);
            $stats['total_payments'] = $payments['total'] ?? 0;

            // Open tickets
            $tickets = Database::fetch('SELECT COUNT(*) as count FROM tickets WHERE status = ?', ['open']);
            $stats['open_tickets'] = $tickets['count'] ?? 0;

            // Recent leads
            $leads = Database::fetchAll('SELECT id, name, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5');
            $stats['recent_leads'] = $leads;

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $stats,
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
