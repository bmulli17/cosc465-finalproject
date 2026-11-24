// Display user-friendly feedback messages at the top of the page
function showStatus(message, isError = false) {
    const banner = document.getElementById('status-banner');
    banner.textContent = message;
    banner.className = isError ? 'error' : 'success';
    banner.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Helper for making JSON fetch requests
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
    }
    return data;
}

// Populate dropdown menus from the database
async function loadDropdowns() {
    try {
        const { households, staff, inventory } = await apiRequest('/api/lookups');

        // Household dropdowns
        const distHousehold = document.getElementById('distribution-household');
        const filterHousehold = document.getElementById('visit-household-filter');
        distHousehold.innerHTML = '';
        filterHousehold.innerHTML = '<option value="">All Households</option>';

        households.forEach((h) => {
            const label = `${h.first_name} ${h.last_name} (ID: ${h.household_id}, Zip: ${h.zip_code})`;
            distHousehold.add(new Option(label, h.household_id));
            filterHousehold.add(new Option(label, h.household_id));
        });

        // Staff dropdown
        const distStaff = document.getElementById('distribution-staff');
        distStaff.innerHTML = '';
        staff.forEach((s) => {
            distStaff.add(new Option(`${s.first_name} ${s.last_name} (${s.role})`, s.staff_id));
        });

        // Inventory dropdowns
        const distItem = document.getElementById('distribution-item');
        const updateItem = document.getElementById('update-item-select');
        distItem.innerHTML = '';
        updateItem.innerHTML = '';

        inventory.forEach((item) => {
            const label = `${item.item_name} (In Stock: ${item.quantity})`;
            distItem.add(new Option(label, item.inventory_id));
            updateItem.add(new Option(label, item.inventory_id));
        });
    } catch (err) {
        showStatus(err.message, true);
    }
}

// Load and show inventory
async function loadInventory() {
    try {
        const search = document.getElementById('search-input').value;
        const category = document.getElementById('category-filter').value;
        const params = new URLSearchParams({ search, category });

        const items = await apiRequest(`/api/inventory?${params.toString()}`);
        const tbody = document.getElementById('inventory-table-body');
        tbody.innerHTML = '';

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No matching inventory items found.</td></tr>';
            return;
        }

        items.forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.inventory_id}</td>
                <td>${item.item_name}</td>
                <td>${item.category}</td>
                <td>${item.storage_type}</td>
                <td>${item.quantity}</td>
                <td>${item.min_safety_threshold}</td>
                <td>${item.expiration_date || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showStatus(err.message, true);
    }
}

// Load and show visits
async function loadVisits() {
    try {
        const householdId = document.getElementById('visit-household-filter').value;
        const query = householdId ? `?household_id=${encodeURIComponent(householdId)}` : '';
        const visits = await apiRequest(`/api/visits${query}`);

        const tbody = document.getElementById('visits-table-body');
        tbody.innerHTML = '';

        if (visits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No distribution visits found for this selection.</td></tr>';
            return;
        }

        visits.forEach((v) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.visit_id}</td>
                <td>${v.visit_date}</td>
                <td>${v.household_name}</td>
                <td>${v.zip_code}</td>
                <td>${v.staff_name}</td>
                <td>${v.item_name}</td>
                <td>${v.quantity_given}</td>
                <td>${v.notes || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        showStatus(err.message, true);
    }
}

// Load and show reports
async function loadReports() {
    try {
        const { donorSummary, inventoryAlerts, zipDemographics } = await apiRequest('/api/reports');

        // Donor Impact Summary
        const donorsBody = document.getElementById('report-donors-summary');
        donorsBody.innerHTML = donorSummary.map((d) => `
            <tr>
                <td>${d.donor_name}</td>
                <td>${d.donor_type}</td>
                <td>${d.total_donation_batches}</td>
                <td>${d.total_items_donated}</td>
            </tr>
        `).join('');

        // Low stock and Expiration Alerts
        const alertsBody = document.getElementById('report-alerts-body');
        alertsBody.innerHTML = inventoryAlerts.length
            ? inventoryAlerts.map((a) => `
                <tr>
                    <td>${a.item_name}</td>
                    <td>${a.category}</td>
                    <td>${a.storage_type}</td>
                    <td>${a.quantity}</td>
                    <td>${a.min_safety_threshold}</td>
                    <td>${a.expiration_date || 'N/A'}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="6">No low-stock or near-expiration alerts at this time.</td></tr>';

        // Zip Code Demographics
        const zipBody = document.getElementById('report-zip-body');
        zipBody.innerHTML = zipDemographics.map((z) => `
            <tr>
                <td>${z.zip_code}</td>
                <td>${z.registered_households}</td>
                <td>${z.total_visits}</td>
            </tr>
        `).join('');
    } catch (err) {
        showStatus(err.message, true);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadDropdowns();
    await loadInventory();
    await loadVisits();
    await loadReports();

    // Search Inventory
    document.getElementById('invetory-search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        loadInventory();
    });

    // Reset Search
    document.getElementById('reset-search-btn').addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        loadInventory();
    });

    // Filter Visits
    document.getElementById('visit-filter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        loadVisits();
    });

    // Register New Households
    document.getElementById('add-household-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                first_name: document.getElementById('household-first-name').value,
                last_name: document.getElementById('household-last-name').value,
                email: document.getElementById('household-email').value,
                phone_number: document.getElementById('household-phone').value,
                household_size: document.getElementById('household-size').value,
                address: document.getElementById('household-address').value,
                zip_code: document.getElementById('household-zip').value
            };
            const res = await apiRequest('/api/households', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showStatus(res.message);
            e.target.reset();
            await loadDropdowns();
            await loadReports();
        } catch (err) {
            showStatus(err.message, true);
        }
    });

    // Update Inventory Stock
    document.getElementById('update-stock-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const itemId = document.getElementById('update-item-select').value;
            const quantity = document.getElementById('update-item-quantity').value;
            const res = await apiRequest(`/api/inventory/${encodeURIComponent(itemId)}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });
            showStatus(res.message);
            e.target.reset();
            await loadDropdowns();
            await loadInventory();
            await loadReports();
        } catch (err) {
            showStatus(err.message, true);
        }
    });

    // Add New Inventory Items
    document.getElementById('add-inventory-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                item_name: document.getElementById('inventory-item-name').value,
                category: document.getElementById('inventory-category').value,
                storage_type: document.getElementById('inventory-storage').value,
                quantity: document.getElementById('inventory-quantity').value,
                min_safety_threshold: document.getElementById('inventory-threshold').value,
                expiration_date: document.getElementById('inventory-expiration').value
            };
            const res = await apiRequest('/api/inventory', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showStatus(res.message);
            e.target.reset();
            await loadDropdowns();
            await loadInventory();
            await loadReports();
        } catch (err) {
            showStatus(err.message, true);
        }
    });

    //Refresh Reports
    document.getElementById('refresh-reports-btn').addEventListener('click', loadReports);

    // Record Food Distribution Visits
    document.getElementById('distribution-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const payload = {
                household_id: document.getElementById('distribution-household').value,
                staff_id: document.getElementById('distribution-staff').value,
                inventory_id: document.getElementById('distribution-item').value,
                quantity: document.getElementById('distribution-quantity').value,
                notes: document.getElementById('distribution-notes').value
            };
            const res = await apiRequest('/api/distributions', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showStatus(res.message);
            e.target.reset();
            await loadDropdowns();
            await loadInventory();
            await loadVisits();
            await loadReports();
        } catch (err) {
            showStatus(err.message, true);
        }
    });
});

