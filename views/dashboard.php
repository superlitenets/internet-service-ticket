<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Total Customers -->
    <div class="stat-card">
        <div class="flex justify-between items-start">
            <div>
                <div class="stat-number"><?php echo $stats['total_customers'] ?? 0; ?></div>
                <div class="stat-label">Total Customers</div>
            </div>
            <div style="color: var(--primary); font-size: 28px;">
                <i class="fas fa-users"></i>
            </div>
        </div>
    </div>

    <!-- Active Invoices -->
    <div class="stat-card" style="border-left-color: var(--warning);">
        <div class="flex justify-between items-start">
            <div>
                <div class="stat-number" style="color: var(--warning);"><?php echo $stats['unpaid_invoices'] ?? 0; ?></div>
                <div class="stat-label">Unpaid Invoices</div>
            </div>
            <div style="color: var(--warning); font-size: 28px;">
                <i class="fas fa-file-invoice"></i>
            </div>
        </div>
    </div>

    <!-- Total Revenue -->
    <div class="stat-card" style="border-left-color: var(--success);">
        <div class="flex justify-between items-start">
            <div>
                <div class="stat-number" style="color: var(--success);">$<?php echo number_format($stats['total_payments'] ?? 0, 0); ?></div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div style="color: var(--success); font-size: 28px;">
                <i class="fas fa-credit-card"></i>
            </div>
        </div>
    </div>

    <!-- Open Tickets -->
    <div class="stat-card" style="border-left-color: var(--danger);">
        <div class="flex justify-between items-start">
            <div>
                <div class="stat-number" style="color: var(--danger);"><?php echo $stats['open_tickets'] ?? 0; ?></div>
                <div class="stat-label">Open Tickets</div>
            </div>
            <div style="color: var(--danger); font-size: 28px;">
                <i class="fas fa-ticket-alt"></i>
            </div>
        </div>
    </div>
</div>

<!-- Charts Section -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
    <!-- Revenue Chart -->
    <div class="card">
        <h3 class="text-lg font-semibold mb-4">Revenue Trend</h3>
        <canvas id="revenueChart"></canvas>
    </div>

    <!-- Customer Status Chart -->
    <div class="card">
        <h3 class="text-lg font-semibold mb-4">Customer Status</h3>
        <canvas id="customerChart"></canvas>
    </div>
</div>

<!-- Recent Leads Section -->
<div class="card mt-6">
    <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Recent Leads</h3>
        <a href="/leads" class="btn-primary text-sm">View All</a>
    </div>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <?php if (isset($recent_leads) && count($recent_leads) > 0): ?>
                <?php foreach ($recent_leads as $lead): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($lead['name'] ?? ''); ?></td>
                        <td><?php echo htmlspecialchars($lead['company'] ?? '-'); ?></td>
                        <td><?php echo htmlspecialchars($lead['phone'] ?? '-'); ?></td>
                        <td>
                            <span class="badge badge-success">
                                <?php echo htmlspecialchars(ucfirst($lead['status'] ?? 'new')); ?>
                            </span>
                        </td>
                        <td><?php echo date('M d, Y', strtotime($lead['created_at'])); ?></td>
                        <td>
                            <a href="/leads/<?php echo $lead['id']; ?>" class="text-blue-600 hover:underline">
                                <i class="fas fa-eye"></i>
                            </a>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td colspan="6" class="text-center text-gray-500 py-4">No leads yet</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<!-- Quick Actions -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div class="card text-center">
        <i class="fas fa-user-plus text-3xl text-blue-600 mb-2"></i>
        <h4 class="font-semibold mb-2">Add Customer</h4>
        <a href="/customers/new" class="btn-primary text-sm">Create New</a>
    </div>

    <div class="card text-center">
        <i class="fas fa-file-invoice text-3xl text-green-600 mb-2"></i>
        <h4 class="font-semibold mb-2">Create Invoice</h4>
        <a href="/invoices/new" class="btn-primary text-sm">Create New</a>
    </div>

    <div class="card text-center">
        <i class="fas fa-ticket-alt text-3xl text-purple-600 mb-2"></i>
        <h4 class="font-semibold mb-2">Support Ticket</h4>
        <a href="/tickets/new" class="btn-primary text-sm">Create New</a>
    </div>
</div>

<script>
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
            datasets: [{
                label: 'Revenue',
                data: [1200, 1900, 3000, 2500, 2200, 2800, 3200],
                borderColor: 'var(--primary)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
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
                    beginAtZero: true
                }
            }
        }
    });

    // Customer Status Chart
    const customerCtx = document.getElementById('customerChart').getContext('2d');
    new Chart(customerCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive', 'Suspended'],
            datasets: [{
                data: [<?php echo $stats['total_customers'] ?? 100; ?>, 20, 5],
                backgroundColor: [
                    'var(--success)',
                    '#fbbf24',
                    'var(--danger)'
                ],
                borderColor: ['white'],
                borderWidth: 2
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
