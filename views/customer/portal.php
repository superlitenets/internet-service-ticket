<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Account - NetFlow</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.0/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary: #667eea;
            --secondary: #764ba2;
        }

        body {
            background: #f7fafc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .header {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 40px 20px;
            text-align: center;
        }

        .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .container {
            max-width: 1200px;
            margin: -40px auto 40px;
            padding: 0 20px;
        }

        .nav-tabs {
            display: flex;
            gap: 20px;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 30px;
            overflow-x: auto;
        }

        .nav-tab {
            padding: 12px 0;
            color: #718096;
            text-decoration: none;
            font-weight: 600;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }

        .nav-tab:hover {
            color: var(--primary);
        }

        .nav-tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
        }

        .service-card {
            border-left: 4px solid var(--primary);
        }

        .service-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
        }

        .status-active {
            background: #c6f6d5;
            color: #22543d;
        }

        .status-suspended {
            background: #fed7d7;
            color: #742a2a;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
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

        .invoice-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #e2e8f0;
        }

        .invoice-item:last-child {
            border-bottom: none;
        }

        .invoice-number {
            font-weight: 600;
            color: var(--primary);
        }

        .invoice-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .status-paid {
            background: #c6f6d5;
            color: #22543d;
        }

        .status-unpaid {
            background: #fed7d7;
            color: #742a2a;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 24px;
            }

            .container {
                margin: -30px auto 30px;
            }

            .invoice-item {
                flex-direction: column;
                text-align: center;
                gap: 12px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>Welcome to Your Account</h1>
        <p>Manage your services, invoices, and usage</p>
    </div>

    <div class="container">
        <!-- Navigation Tabs -->
        <div class="nav-tabs">
            <a href="#services" class="nav-tab active" data-tab="services">
                <i class="fas fa-network-wired mr-2"></i>My Services
            </a>
            <a href="#invoices" class="nav-tab" data-tab="invoices">
                <i class="fas fa-file-invoice mr-2"></i>Invoices
            </a>
            <a href="#usage" class="nav-tab" data-tab="usage">
                <i class="fas fa-chart-line mr-2"></i>Usage
            </a>
            <a href="#payments" class="nav-tab" data-tab="payments">
                <i class="fas fa-credit-card mr-2"></i>Payments
            </a>
            <a href="#account" class="nav-tab" data-tab="account">
                <i class="fas fa-user mr-2"></i>Account Settings
            </a>
        </div>

        <!-- Services Tab -->
        <div id="services" class="tab-content">
            <div class="card service-card">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold">Premium Internet 100Mbps</h3>
                        <p class="text-gray-600 text-sm mt-1">Service ID: #SVC-001</p>
                    </div>
                    <span class="service-status status-active">
                        <i class="fas fa-check-circle mr-1"></i>Active
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 py-4 border-y">
                    <div>
                        <p class="text-gray-600 text-sm">Download Speed</p>
                        <p class="text-2xl font-bold text-primary">100 Mbps</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">Upload Speed</p>
                        <p class="text-2xl font-bold text-primary">50 Mbps</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">Data Limit</p>
                        <p class="text-2xl font-bold text-primary">Unlimited</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">Monthly Cost</p>
                        <p class="text-2xl font-bold text-primary">$99.99</p>
                    </div>
                </div>

                <div>
                    <p class="text-sm font-semibold mb-2">Service activation date: January 15, 2024</p>
                    <p class="text-sm font-semibold">Next billing date: February 15, 2024</p>
                </div>

                <div class="mt-6">
                    <button class="btn-primary">
                        <i class="fas fa-arrow-up mr-2"></i>Upgrade Service
                    </button>
                </div>
            </div>

            <!-- Add more service cards as needed -->
        </div>

        <!-- Invoices Tab -->
        <div id="invoices" class="tab-content hidden">
            <div class="card">
                <h2 class="text-xl font-bold mb-6">Recent Invoices</h2>
                
                <div class="invoice-item">
                    <div>
                        <span class="invoice-number">INV-2024-001</span>
                        <p class="text-gray-600 text-sm">Due: January 15, 2024</p>
                    </div>
                    <div>$99.99</div>
                    <div>
                        <span class="invoice-status status-paid">
                            <i class="fas fa-check mr-1"></i>Paid
                        </span>
                    </div>
                    <div>
                        <a href="#" class="text-primary hover:underline text-sm">
                            <i class="fas fa-download mr-1"></i>Download
                        </a>
                    </div>
                </div>

                <div class="invoice-item">
                    <div>
                        <span class="invoice-number">INV-2024-002</span>
                        <p class="text-gray-600 text-sm">Due: February 15, 2024</p>
                    </div>
                    <div>$99.99</div>
                    <div>
                        <span class="invoice-status status-unpaid">
                            <i class="fas fa-clock mr-1"></i>Pending
                        </span>
                    </div>
                    <div>
                        <a href="#" class="text-primary hover:underline text-sm">
                            <i class="fas fa-credit-card mr-1"></i>Pay Now
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Usage Tab -->
        <div id="usage" class="tab-content hidden">
            <div class="card">
                <h2 class="text-xl font-bold mb-6">Current Month Usage</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <p class="text-gray-600 text-sm">Download Used</p>
                        <p class="text-3xl font-bold">245.5 GB</p>
                        <div class="progress-bar mt-3">
                            <div class="progress-fill" style="width: 45%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">of 500 GB</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">Upload Used</p>
                        <p class="text-3xl font-bold">128.3 GB</p>
                        <div class="progress-bar mt-3">
                            <div class="progress-fill" style="width: 26%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">of 500 GB</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-sm">Average Speed</p>
                        <p class="text-3xl font-bold">85.3 Mbps</p>
                        <div class="progress-bar mt-3">
                            <div class="progress-fill" style="width: 85%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">of 100 Mbps</p>
                    </div>
                </div>

                <p class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-2"></i>
                    You're using 71.8 GB of your total bandwidth this month. Usage resets on February 15, 2024.
                </p>
            </div>
        </div>

        <!-- Payments Tab -->
        <div id="payments" class="tab-content hidden">
            <div class="card">
                <h2 class="text-xl font-bold mb-6">Payment History</h2>
                
                <div class="invoice-item">
                    <div>
                        <p class="font-semibold">Invoice INV-2024-001</p>
                        <p class="text-gray-600 text-sm">Paid on January 20, 2024</p>
                    </div>
                    <div>$99.99</div>
                    <div>
                        <span class="invoice-status status-paid">Completed</span>
                    </div>
                </div>

                <div class="invoice-item">
                    <div>
                        <p class="font-semibold">Invoice INV-2023-012</p>
                        <p class="text-gray-600 text-sm">Paid on December 18, 2023</p>
                    </div>
                    <div>$99.99</div>
                    <div>
                        <span class="invoice-status status-paid">Completed</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Account Settings Tab -->
        <div id="account" class="tab-content hidden">
            <div class="card">
                <h2 class="text-xl font-bold mb-6">Account Information</h2>
                
                <form class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-semibold mb-2">Full Name</label>
                            <input type="text" value="John Doe" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">Email</label>
                            <input type="email" value="john@example.com" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">Phone</label>
                            <input type="tel" value="+254 712 345 678" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">City</label>
                            <input type="text" value="Nairobi" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold mb-2">Address</label>
                        <textarea class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" rows="3">123 Main Street, Nairobi</textarea>
                    </div>

                    <div class="flex gap-4">
                        <button type="submit" class="btn-primary">Save Changes</button>
                        <button type="reset" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                </form>
            </div>

            <div class="card">
                <h2 class="text-xl font-bold mb-4">Change Password</h2>
                
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold mb-2">Current Password</label>
                        <input type="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">New Password</label>
                        <input type="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Confirm Password</label>
                        <input type="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    </div>
                    <button type="submit" class="btn-primary">Update Password</button>
                </form>
            </div>
        </div>
    </div>

    <script>
        // Tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Hide all tabs
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                
                // Remove active class from all nav tabs
                document.querySelectorAll('.nav-tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Show selected tab
                const tabId = this.dataset.tab;
                document.getElementById(tabId).classList.remove('hidden');
                
                // Add active class to clicked tab
                this.classList.add('active');
            });
        });
    </script>
</body>
</html>
