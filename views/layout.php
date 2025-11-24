<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($title) ? htmlspecialchars($title) . ' - NetFlow' : 'NetFlow - ISP Management System'; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary: #667eea;
            --secondary: #764ba2;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f9fafb;
        }

        .navbar {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .sidebar {
            background: #ffffff;
            border-right: 1px solid #e5e7eb;
            min-height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            width: 250px;
            margin-top: 70px;
            overflow-y: auto;
        }

        .main-content {
            margin-left: 250px;
            margin-top: 70px;
            padding: 20px;
        }

        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.3s;
        }

        .btn-primary:hover {
            background: #5568d3;
        }

        .btn-secondary {
            background: #e5e7eb;
            color: #1f2937;
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 500;
        }

        .nav-item {
            display: block;
            padding: 12px 20px;
            color: #6b7280;
            text-decoration: none;
            border-left: 4px solid transparent;
            transition: all 0.3s;
        }

        .nav-item:hover,
        .nav-item.active {
            background: #f3f4f6;
            color: var(--primary);
            border-left-color: var(--primary);
        }

        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 4px solid var(--primary);
        }

        .stat-number {
            font-size: 28px;
            font-weight: bold;
            color: var(--primary);
        }

        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        table th {
            background: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
        }

        table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }

        table tr:hover {
            background: #f9fafb;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-danger {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }

        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
        }

        .alert-success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }

        .alert-danger {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #374151;
        }

        .form-control {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-family: inherit;
        }

        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        @media (max-width: 768px) {
            .sidebar {
                position: relative;
                width: 100%;
                margin-top: 0;
                border-right: none;
                border-bottom: 1px solid #e5e7eb;
            }

            .main-content {
                margin-left: 0;
                margin-top: 0;
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar fixed top-0 w-full z-50">
        <div class="flex justify-between items-center px-6 py-4">
            <div class="flex items-center gap-3">
                <i class="fas fa-globe text-white text-2xl"></i>
                <span class="text-white font-bold text-2xl">NetFlow</span>
            </div>
            <div class="flex items-center gap-4">
                <button class="text-white hover:opacity-80 transition">
                    <i class="fas fa-bell"></i>
                </button>
                <button class="text-white hover:opacity-80 transition">
                    <i class="fas fa-user-circle text-2xl"></i>
                </button>
                <a href="/api/auth/logout" class="text-white hover:opacity-80 transition" title="Logout">
                    <i class="fas fa-sign-out-alt"></i>
                </a>
            </div>
        </div>
    </nav>

    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="border-b border-gray-200 p-4">
            <div class="text-sm text-gray-600">
                <p class="font-semibold">Welcome</p>
                <p><?php echo isset($user) ? htmlspecialchars($user['full_name']) : 'User'; ?></p>
            </div>
        </div>

        <nav>
            <a href="/dashboard" class="nav-item" title="Dashboard">
                <i class="fas fa-chart-line mr-2"></i> Dashboard
            </a>
            <a href="/customers" class="nav-item" title="Customers">
                <i class="fas fa-users mr-2"></i> Customers
            </a>
            <a href="/leads" class="nav-item" title="Leads">
                <i class="fas fa-handshake mr-2"></i> Leads
            </a>
            <a href="/invoices" class="nav-item" title="Invoices">
                <i class="fas fa-file-invoice mr-2"></i> Invoices
            </a>
            <a href="/payments" class="nav-item" title="Payments">
                <i class="fas fa-credit-card mr-2"></i> Payments
            </a>
            <a href="/tickets" class="nav-item" title="Tickets">
                <i class="fas fa-ticket-alt mr-2"></i> Tickets
            </a>
            <a href="/employees" class="nav-item" title="Employees">
                <i class="fas fa-id-badge mr-2"></i> Employees
            </a>
            <a href="/inventory" class="nav-item" title="Inventory">
                <i class="fas fa-boxes mr-2"></i> Inventory
            </a>
            <a href="/reports" class="nav-item" title="Reports">
                <i class="fas fa-chart-bar mr-2"></i> Reports
            </a>
            <a href="/settings" class="nav-item" title="Settings">
                <i class="fas fa-cog mr-2"></i> Settings
            </a>
        </nav>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
        <?php if (isset($error)): ?>
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <?php if (isset($success)): ?>
            <div class="alert alert-success">
                <i class="fas fa-check-circle mr-2"></i>
                <?php echo htmlspecialchars($success); ?>
            </div>
        <?php endif; ?>

        <?php echo $content ?? ''; ?>
    </div>

    <!-- Footer -->
    <footer class="text-center text-gray-600 py-4 mt-20 border-t border-gray-200">
        <p>&copy; 2024 NetFlow ISP Management System. All rights reserved.</p>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script>
        // Mark current page in navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.href === window.location.href) {
                item.classList.add('active');
            }
        });
    </script>
</body>
</html>
