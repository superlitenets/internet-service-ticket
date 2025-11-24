-- NetFlow Database Schema (PostgreSQL)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    phone VARCHAR(20),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'new',
    source VARCHAR(100),
    notes TEXT,
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    account_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    account_type VARCHAR(50),
    balance DECIMAL(15, 2) DEFAULT 0,
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    speed_mbps INTEGER,
    price DECIMAL(15, 2),
    billing_cycle VARCHAR(50),
    features TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_packages table
CREATE TABLE IF NOT EXISTS customer_packages (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    package_id INTEGER NOT NULL REFERENCES packages(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    amount DECIMAL(15, 2),
    tax DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'unpaid',
    due_date DATE,
    paid_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    amount DECIMAL(15, 2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    reference_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    employee_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    salary DECIMAL(15, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    hours_worked DECIMAL(5, 2),
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    unit_cost DECIMAL(15, 2),
    selling_price DECIMAL(15, 2),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ticket_replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    group_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ==============================================
-- NetFlow ISP Billing Module Schema
-- ==============================================

-- ISP Service Packages
CREATE TABLE IF NOT EXISTS isp_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    download_speed INTEGER NOT NULL, -- Mbps
    upload_speed INTEGER NOT NULL, -- Mbps
    data_limit INTEGER, -- GB per month (NULL = unlimited)
    price DECIMAL(15, 2) NOT NULL,
    setup_fee DECIMAL(15, 2) DEFAULT 0,
    billing_cycle VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, yearly
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ISP Services (Per Customer)
CREATE TABLE IF NOT EXISTS isp_services (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    package_id INTEGER NOT NULL REFERENCES isp_packages(id),
    service_type VARCHAR(50), -- pppoe, pptp, l2tp, hotspot, etc
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    mac_address VARCHAR(17),
    ip_address VARCHAR(45),
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, terminated, inactive
    activation_date DATE,
    suspension_date DATE,
    termination_date DATE,
    mikrotik_user_id VARCHAR(255), -- MikroTik internal ID
    mikrotik_queue_id VARCHAR(255), -- MikroTik queue ID
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ISP Billing Cycles
CREATE TABLE IF NOT EXISTS isp_billing_cycles (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES isp_services(id),
    billing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15, 2),
    tax DECIMAL(15, 2),
    total DECIMAL(15, 2),
    data_used DECIMAL(10, 2), -- GB
    overage_charges DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, invoiced, paid, overdue, suspended
    invoice_id INTEGER REFERENCES invoices(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ISP Usage Tracking (Bandwidth monitoring)
CREATE TABLE IF NOT EXISTS isp_usage_logs (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES isp_services(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    date DATE NOT NULL,
    download_bytes BIGINT,
    upload_bytes BIGINT,
    total_bytes BIGINT,
    average_speed DECIMAL(10, 2), -- Mbps
    peak_speed DECIMAL(10, 2), -- Mbps
    session_count INTEGER,
    connection_time INTEGER, -- seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, date)
);

-- ISP Suspension/Reactivation Log
CREATE TABLE IF NOT EXISTS isp_service_logs (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES isp_services(id),
    action VARCHAR(100), -- suspended, reactivated, throttled, quota_exceeded, etc
    reason VARCHAR(255),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    admin_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Dunning (Payment reminders and attempts)
CREATE TABLE IF NOT EXISTS isp_dunning_logs (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    service_id INTEGER REFERENCES isp_services(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    dunning_level INTEGER DEFAULT 1, -- 1st, 2nd, 3rd notice
    reminder_type VARCHAR(50), -- sms, email, both
    message_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    response VARCHAR(50), -- viewed, responded, paid, ignored
    next_reminder_date DATE,
    is_suspended BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ISP Configurations
CREATE TABLE IF NOT EXISTS isp_configurations (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(100), -- billing, suspension, notification, mikrotik
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MikroTik Connection Credentials
CREATE TABLE IF NOT EXISTS mikrotik_connections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 8728,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    ssl_enabled BOOLEAN DEFAULT false,
    last_connection_test TIMESTAMP,
    connection_status VARCHAR(50), -- connected, disconnected, error
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Overage Pricing
CREATE TABLE IF NOT EXISTS isp_overage_pricing (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES isp_packages(id),
    gb_threshold DECIMAL(10, 2), -- GB limit before overage pricing applies
    overage_price_per_gb DECIMAL(15, 2), -- Price per additional GB
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Upgrade/Downgrade History
CREATE TABLE IF NOT EXISTS isp_service_changes (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES isp_services(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    old_package_id INTEGER REFERENCES isp_packages(id),
    new_package_id INTEGER NOT NULL REFERENCES isp_packages(id),
    change_type VARCHAR(50), -- upgrade, downgrade
    proration_credit DECIMAL(15, 2),
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Usage Alerts
CREATE TABLE IF NOT EXISTS isp_usage_alerts (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES isp_services(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    alert_type VARCHAR(100), -- data_limit_80, data_limit_100, speed_degraded, etc
    threshold_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    alert_status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, resolved
    notification_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ISP Promotions & Discounts
CREATE TABLE IF NOT EXISTS isp_promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    discount_type VARCHAR(50), -- percentage, fixed_amount
    discount_value DECIMAL(15, 2),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    applicable_packages TEXT, -- JSON array of package IDs
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ISP Performance Metrics (For reporting)
CREATE TABLE IF NOT EXISTS isp_performance_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    metric_type VARCHAR(100), -- daily_active, revenue, churn, etc
    metric_value DECIMAL(15, 2),
    additional_data TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, metric_type)
);

-- ISP Module Indexes
CREATE INDEX idx_isp_services_customer_id ON isp_services(customer_id);
CREATE INDEX idx_isp_services_status ON isp_services(status);
CREATE INDEX idx_isp_usage_logs_service_date ON isp_usage_logs(service_id, date);
CREATE INDEX idx_isp_billing_cycles_status ON isp_billing_cycles(status);
CREATE INDEX idx_isp_billing_cycles_service_id ON isp_billing_cycles(service_id);
CREATE INDEX idx_isp_dunning_logs_customer_id ON isp_dunning_logs(customer_id);
CREATE INDEX idx_isp_dunning_logs_status ON isp_dunning_logs(invoice_id);
CREATE INDEX idx_isp_service_logs_service_id ON isp_service_logs(service_id);
CREATE INDEX idx_isp_service_changes_service_id ON isp_service_changes(service_id);
CREATE INDEX idx_isp_usage_alerts_service_id ON isp_usage_alerts(service_id);
CREATE INDEX idx_isp_performance_metrics_date ON isp_performance_metrics(date, metric_type);
