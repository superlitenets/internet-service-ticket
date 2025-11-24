-- NetFlow Multitenancy Migration
-- Adds tenant isolation to single database

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    subdomain VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    is_default BOOLEAN DEFAULT false,
    features TEXT, -- JSON of enabled features
    max_users INTEGER DEFAULT 10,
    max_customers INTEGER DEFAULT 100,
    storage_limit INTEGER DEFAULT 5120, -- MB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Add tenant_id to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);

-- Add tenant_id to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);

-- Add tenant_id to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_packages_tenant_id ON packages(tenant_id);

-- Add tenant_id to customer_packages table
ALTER TABLE customer_packages ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_tenant_id ON customer_packages(tenant_id);

-- Add tenant_id to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);

-- Add tenant_id to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);

-- Add tenant_id to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);

-- Add tenant_id to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON attendance(tenant_id);

-- Add tenant_id to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);

-- Add tenant_id to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);

-- Add tenant_id to ticket_replies table
ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_tenant_id ON ticket_replies(tenant_id);

-- Add tenant_id to settings table (application-wide settings per tenant)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id);

-- Add tenant_id to audit_logs table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- ISP Module multitenancy
ALTER TABLE isp_packages ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_packages_tenant_id ON isp_packages(tenant_id);

ALTER TABLE isp_services ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_services_tenant_id ON isp_services(tenant_id);

ALTER TABLE isp_billing_cycles ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_billing_cycles_tenant_id ON isp_billing_cycles(tenant_id);

ALTER TABLE isp_usage_logs ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_usage_logs_tenant_id ON isp_usage_logs(tenant_id);

ALTER TABLE isp_service_logs ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_service_logs_tenant_id ON isp_service_logs(tenant_id);

ALTER TABLE isp_dunning_logs ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_dunning_logs_tenant_id ON isp_dunning_logs(tenant_id);

ALTER TABLE isp_configurations ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_configurations_tenant_id ON isp_configurations(tenant_id);

ALTER TABLE mikrotik_connections ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_mikrotik_connections_tenant_id ON mikrotik_connections(tenant_id);

ALTER TABLE isp_overage_pricing ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_overage_pricing_tenant_id ON isp_overage_pricing(tenant_id);

ALTER TABLE isp_service_changes ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_service_changes_tenant_id ON isp_service_changes(tenant_id);

ALTER TABLE isp_usage_alerts ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_usage_alerts_tenant_id ON isp_usage_alerts(tenant_id);

ALTER TABLE isp_promotions ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_promotions_tenant_id ON isp_promotions(tenant_id);

ALTER TABLE isp_performance_metrics ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_isp_performance_metrics_tenant_id ON isp_performance_metrics(tenant_id);

-- Create tenant API keys table for multi-tenant authentication
CREATE TABLE IF NOT EXISTS tenant_api_keys (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant_id ON tenant_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_key ON tenant_api_keys(api_key);
