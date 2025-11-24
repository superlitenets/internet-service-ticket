<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetFlow - ISP Management & Billing System</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.0/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            scroll-behavior: smooth;
        }

        :root {
            --primary: #667eea;
            --secondary: #764ba2;
            --accent: #f093fb;
            --dark: #1a202c;
            --light: #f7fafc;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #2d3748;
            overflow-x: hidden;
        }

        .gradient-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        }

        .gradient-accent {
            background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
            padding: 12px 32px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .btn-secondary {
            background: white;
            color: var(--primary);
            padding: 12px 32px;
            border-radius: 8px;
            border: 2px solid var(--primary);
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn-secondary:hover {
            background: var(--primary);
            color: white;
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: var(--primary);
            margin-bottom: 16px;
        }

        .stat-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            border-left: 4px solid var(--primary);
        }

        .navbar {
            background: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .nav-link {
            color: #4a5568;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
            padding: 8px 16px;
            border-radius: 6px;
        }

        .nav-link:hover {
            color: var(--primary);
            background: rgba(102, 126, 234, 0.1);
        }

        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 100px 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.1)" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
            background-size: cover;
            opacity: 0.5;
        }

        .hero-content {
            position: relative;
            z-index: 10;
        }

        .hero h1 {
            font-size: 56px;
            font-weight: 800;
            margin-bottom: 20px;
            line-height: 1.2;
        }

        .hero p {
            font-size: 20px;
            margin-bottom: 40px;
            opacity: 0.95;
        }

        .section {
            padding: 80px 20px;
        }

        .section-title {
            font-size: 48px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 60px;
            color: var(--dark);
        }

        .section-title .highlight {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .footer {
            background: var(--dark);
            color: white;
            padding: 60px 20px;
            text-align: center;
        }

        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .footer-links a {
            color: #cbd5e0;
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .footer-links a:hover {
            color: var(--primary);
        }

        @media (max-width: 768px) {
            .hero h1 {
                font-size: 36px;
            }

            .section-title {
                font-size: 32px;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div class="gradient-primary w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold">
                    NF
                </div>
                <span class="text-xl font-bold text-gray-800">NetFlow</span>
            </div>
            <div class="hidden md:flex gap-8">
                <a href="#features" class="nav-link">Features</a>
                <a href="#pricing" class="nav-link">Pricing</a>
                <a href="#why" class="nav-link">Why NetFlow</a>
                <a href="#contact" class="nav-link">Contact</a>
            </div>
            <div class="flex gap-4">
                <a href="/views/auth/login.php" class="btn-secondary text-sm">Login</a>
                <a href="/views/auth/register.php" class="btn-primary text-sm">Get Started</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content max-w-4xl mx-auto">
            <h1>Manage Your ISP Business with Confidence</h1>
            <p>Complete billing, monitoring, and customer management system for internet service providers</p>
            <div class="flex gap-6 justify-center flex-wrap">
                <a href="/views/auth/register.php" class="btn-primary">Start Free Trial</a>
                <a href="#features" class="btn-secondary">Learn More</a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <h2 class="section-title">
                Powerful Features Built for <span class="highlight">ISP Operators</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Service Management -->
                <div class="card">
                    <div class="feature-icon">
                        <i class="fas fa-network-wired"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Service Management</h3>
                    <p class="text-gray-600">Automatically manage PPPoE/PPTP services, queues, and bandwidth limits directly from MikroTik.</p>
                </div>

                <!-- Automated Billing -->
                <div class="card">
                    <div class="feature-icon">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Automated Billing</h3>
                    <p class="text-gray-600">Generate invoices, apply overages, handle suspensions and reactivations automatically.</p>
                </div>

                <!-- Real-time Monitoring -->
                <div class="card">
                    <div class="feature-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Real-time Monitoring</h3>
                    <p class="text-gray-600">Track bandwidth usage, monitor network health, and analyze peak hours in real-time.</p>
                </div>

                <!-- Customer Portal -->
                <div class="card">
                    <div class="feature-icon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Customer Portal</h3>
                    <p class="text-gray-600">Let customers check usage, view invoices, and upgrade packages themselves.</p>
                </div>

                <!-- Payment Reminders -->
                <div class="card">
                    <div class="feature-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Smart Dunning</h3>
                    <p class="text-gray-600">Automated payment reminders via SMS/Email with configurable escalation levels.</p>
                </div>

                <!-- Advanced Reports -->
                <div class="card">
                    <div class="feature-icon">
                        <i class="fas fa-file-chart-pie"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Advanced Reports</h3>
                    <p class="text-gray-600">Revenue trends, churn analysis, usage analytics, and executive KPI dashboard.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Why NetFlow Section -->
    <section id="why" class="section">
        <div class="max-w-6xl mx-auto">
            <h2 class="section-title">
                Why Choose <span class="highlight">NetFlow</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <div class="mb-8">
                        <h4 class="text-xl font-bold mb-3 flex items-center gap-3">
                            <span class="text-2xl text-green-500"><i class="fas fa-check-circle"></i></span>
                            MikroTik Integration
                        </h4>
                        <p class="text-gray-600">Native integration with MikroTik RouterOS for seamless service management and bandwidth control.</p>
                    </div>

                    <div class="mb-8">
                        <h4 class="text-xl font-bold mb-3 flex items-center gap-3">
                            <span class="text-2xl text-green-500"><i class="fas fa-check-circle"></i></span>
                            Fully Automated
                        </h4>
                        <p class="text-gray-600">Invoices, suspensions, reactivations, and notifications happen automatically on schedule.</p>
                    </div>

                    <div class="mb-8">
                        <h4 class="text-xl font-bold mb-3 flex items-center gap-3">
                            <span class="text-2xl text-green-500"><i class="fas fa-check-circle"></i></span>
                            Easy Deployment
                        </h4>
                        <p class="text-gray-600">Deploy on any cPanel hosting with our interactive installer wizard in minutes.</p>
                    </div>
                </div>

                <div>
                    <div class="mb-8">
                        <h4 class="text-xl font-bold mb-3 flex items-center gap-3">
                            <span class="text-2xl text-green-500"><i class="fas fa-check-circle"></i></span>
                            Comprehensive Analytics
                        </h4>
                        <p class="text-gray-600">Detailed insights on revenue, churn, usage patterns, and customer behavior.</p>
                    </div>

                    <div class="mb-8">
                        <h4 class="text-xl font-bold mb-3 flex items-center gap-3">
                            <span class="text-2xl text-green-500"><i class="fas fa-check-circle"></i></span>
                            Cost Effective
                        </h4>
                        <p class="text-gray-600">No licensing fees. Open, transparent pricing designed for ISPs of all sizes.</p>
                    </div>

                    <div class="mb-8">
                        <h4 class="text-xl font-bold mb-3 flex items-center gap-3">
                            <span class="text-2xl text-green-500"><i class="fas fa-check-circle"></i></span>
                            Secure & Reliable
                        </h4>
                        <p class="text-gray-600">Enterprise-grade security with JWT authentication, SSL, and comprehensive audit logging.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="gradient-accent py-20 text-white">
        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                    <div class="text-5xl font-bold mb-3">500+</div>
                    <p class="text-lg opacity-90">ISP Providers Supported</p>
                </div>
                <div>
                    <div class="text-5xl font-bold mb-3">50K+</div>
                    <p class="text-lg opacity-90">Services Managed</p>
                </div>
                <div>
                    <div class="text-5xl font-bold mb-3">$10M+</div>
                    <p class="text-lg opacity-90">Revenue Processed</p>
                </div>
                <div>
                    <div class="text-5xl font-bold mb-3">99.9%</div>
                    <p class="text-lg opacity-90">Uptime SLA</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="section bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <h2 class="section-title">
                Simple, Transparent <span class="highlight">Pricing</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Starter Plan -->
                <div class="card relative">
                    <h3 class="text-2xl font-bold mb-4">Starter</h3>
                    <div class="mb-6">
                        <span class="text-4xl font-bold">$49</span>
                        <span class="text-gray-600">/month</span>
                    </div>
                    <ul class="space-y-4 mb-8 text-gray-600">
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Up to 50 customers
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Basic reports
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Email support
                        </li>
                    </ul>
                    <button class="btn-secondary w-full">Get Started</button>
                </div>

                <!-- Professional Plan -->
                <div class="card relative border-2 border-purple-600">
                    <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                        MOST POPULAR
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Professional</h3>
                    <div class="mb-6">
                        <span class="text-4xl font-bold">$149</span>
                        <span class="text-gray-600">/month</span>
                    </div>
                    <ul class="space-y-4 mb-8 text-gray-600">
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Up to 500 customers
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Advanced analytics
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Priority support
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            API access
                        </li>
                    </ul>
                    <button class="btn-primary w-full">Get Started</button>
                </div>

                <!-- Enterprise Plan -->
                <div class="card relative">
                    <h3 class="text-2xl font-bold mb-4">Enterprise</h3>
                    <div class="mb-6">
                        <span class="text-4xl font-bold">Custom</span>
                        <p class="text-gray-600 text-sm">Contact sales</p>
                    </div>
                    <ul class="space-y-4 mb-8 text-gray-600">
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Unlimited customers
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Custom integration
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            Dedicated support
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-check text-green-500"></i>
                            On-premise option
                        </li>
                    </ul>
                    <button class="btn-secondary w-full">Contact Sales</button>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="gradient-primary py-20 text-white text-center">
        <div class="max-w-4xl mx-auto px-6">
            <h2 class="text-4xl font-bold mb-6">Ready to Transform Your ISP Business?</h2>
            <p class="text-xl mb-10 opacity-90">Join hundreds of ISPs managing their business more efficiently with NetFlow</p>
            <div class="flex gap-6 justify-center flex-wrap">
                <a href="/views/auth/register.php" class="btn-secondary">Start Your Free Trial</a>
                <a href="#contact" class="btn-primary">Schedule a Demo</a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-links">
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#">Documentation</a>
                <a href="#">Support</a>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
            </div>
            <p class="text-gray-400">
                &copy; 2024 NetFlow. All rights reserved. | Built for ISP Operators
            </p>
        </div>
    </footer>
</body>
</html>
