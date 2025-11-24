<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - NetFlow</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.0/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.css" rel="stylesheet">
    <style>
        :root {
            --primary: #667eea;
            --secondary: #764ba2;
        }

        body {
            background: #f7fafc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .sidebar {
            background: white;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
            min-height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            width: 260px;
            overflow-y: auto;
            z-index: 1000;
        }

        .main-content {
            margin-left: 260px;
            padding: 30px;
        }

        .nav-item {
            padding: 14px 20px;
            color: #718096;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s ease;
            border-left: 3px solid transparent;
            font-size: 15px;
        }

        .nav-item:hover {
            background: #f7fafc;
            color: var(--primary);
            border-left-color: var(--primary);
        }

        .nav-item.active {
            background: rgba(102, 126, 234, 0.1);
            color: var(--primary);
            border-left-color: var(--primary);
            font-weight: 600;
        }

        .stat-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border-left: 4px solid var(--primary);
        }

        .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 5px;
        }

        .stat-label {
            color: #718096;
            font-size: 14px;
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .header-bar {
            background: white;
            padding: 20px 30px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 260px;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th {
            background: #f7fafc;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #4a5568;
            border-bottom: 2px solid #e2e8f0;
        }

        .table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background: #c6f6d5;
            color: #22543d;
        }

        .badge-warning {
            background: #feebc8;
            color: #7c2d12;
        }

        .badge-danger {
            background: #fed7d7;
            color: #742a2a;
        }

        @media (max-width: 768px) {
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
            }

            .main-content {
                margin-left: 0;
            }

            .header-bar {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="p-6 border-b">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg" style="background: linear-gradient(135deg, var(--primary), var(--secondary));">
                    <span class="flex items-center justify-center h-full text-white font-bold">NF</span>
                </div>
                <span class="text-xl font-bold text-gray-800">NetFlow</span>
            </div>
        </div>

        <nav class="py-8">
            <a href="#" class="nav-item active">
                <i class="fas fa-dashboard w-5"></i>
                Dashboard
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-users w-5"></i>
                Customers
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-network-wired w-5"></i>
                Services
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-file-invoice w-5"></i>
                Invoices
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-credit-card w-5"></i>
                Payments
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-chart-line w-5"></i>
                Analytics
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-headset w-5"></i>
                Support
            </a>
            <a href="#" class="nav-item">
                <i class="fas fa-cog w-5"></i>
                Settings
            </a>
        </nav>
    </aside>

    <!-- Header -->
    <div class="header-bar">
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div class="flex items-center gap-6">
            <button class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-bell text-xl"></i>
            </button>
            <button class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-user-circle text-2xl"></i>
            </button>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="stat-number">1,250</div>
                        <div class="stat-label">Active Services</div>
                    </div>
                    <div class="text-3xl text-blue-200">
                        <i class="fas fa-network-wired"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card" style="border-left-color: #48bb78;">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="stat-number" style="color: #48bb78;">$45,320</div>
                        <div class="stat-label">Monthly Revenue</div>
                    </div>
                    <div style="color: #c6f6d5; font-size: 28px;">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card" style="border-left-color: #ed8936;">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="stat-number" style="color: #ed8936;">$5,280</div>
                        <div class="stat-label">Pending Invoices</div>
                    </div>
                    <div style="color: #feebc8; font-size: 28px;">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card" style="border-left-color: #f56565;">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="stat-number" style="color: #f56565;">23</div>
                        <div class="stat-label">Suspended Services</div>
                    </div>
                    <div style="color: #fed7d7; font-size: 28px;">
                        <i class="fas fa-ban"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="card">
                <h3 class="text-lg font-bold mb-4">Revenue Trend</h3>
                <canvas id="revenueChart"></canvas>
            </div>
            <div class="card">
                <h3 class="text-lg font-bold mb-4">Service Status Distribution</h3>
                <canvas id="statusChart"></canvas>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
            <h3 class="text-lg font-bold mb-4">Recent Transactions</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>John Doe</td>
                        <td>Invoice</td>
                        <td>$150.00</td>
                        <td><span class="badge badge-success">Paid</span></td>
                        <td>2024-01-15</td>
                    </tr>
                    <tr>
                        <td>Jane Smith</td>
                        <td>Payment</td>
                        <td>$200.00</td>
                        <td><span class="badge badge-success">Completed</span></td>
                        <td>2024-01-15</td>
                    </tr>
                    <tr>
                        <td>Bob Johnson</td>
                        <td>Invoice</td>
                        <td>$100.00</td>
                        <td><span class="badge badge-warning">Pending</span></td>
                        <td>2024-01-14</td>
                    </tr>
                    <tr>
                        <td>Alice Williams</td>
                        <td>Suspension</td>
                        <td>-</td>
                        <td><span class="badge badge-danger">Suspended</span></td>
                        <td>2024-01-14</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script>
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                datasets: [{
                    label: 'Revenue',
                    data: [45000, 48000, 42000, 50000, 45320],
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: 'var(--primary)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        // Status Chart
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Active', 'Suspended', 'Inactive'],
                datasets: [{
                    data: [1250, 23, 45],
                    backgroundColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(245, 101, 101, 1)',
                        'rgba(160, 174, 192, 1)'
                    ],
                    borderColor: 'white',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    </script>
</body>
</html>
