const PORT = 3000;
const express = require('express');
const { dbAll, dbGet, dbRun, runTransaction } = require('./db');
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Format Error Handling
function formatDbError(err){
  if(err && err.code === 'SQLUTE_CONSTRAINT_UNIQUE'){
    return 'A record with those details already exist';
  }
  if(err && typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')){
    return 'The supplied data violates database rule';
  }
  return (err && err.message) || 'database operation failed';
}


// Load dropdown options
app.get('/api/lookups', async (req, res) => {
  try {
        const [households, staff, inventory] = await Promise.all([
            dbAll('SELECT household_id, first_name, last_name, zip_code FROM households ORDER BY last_name, first_name;'),
            dbAll('SELECT staff_id, first_name, last_name, role FROM staff ORDER BY last_name, first_name;'),
            dbAll('SELECT inventory_id, item_name, category, quantity FROM inventory ORDER BY item_name ASC;')
        ]);
        res.json({ households, staff, inventory });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load lookup lists from database.' });
    }
});

// Search Inventory
app.get('/api/inventory', async (req, res) => {
  try {
        const search = (req.query.search || '').trim();
        const category = (req.query.category || '').trim();

        const sql = `
            SELECT inventory_id, item_name, category, storage_type, quantity, min_safety_threshold, expiration_date
            FROM inventory
            WHERE item_name LIKE ?
              AND (? = '' OR category = ?)
            ORDER BY item_name ASC;
        `;
        const items = await dbAll(sql, [`%${search}%`, category, category]);
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to retrieve inventory records.' });
    }
});

// Add New Inventory Items
app.post('/api/inventory', async (req, res) => {
    try {
        const itemName = (req.body.item_name || '').trim();
        const category = (req.body.category || '').trim();
        const storageType = (req.body.storage_type || '').trim();
        const quantity = req.body.quantity ? Number(req.body.quantity) : 0;
        const minSafetyThreshold = req.body.min_safety_threshold ? Number(req.body.min_safety_threshold) : 10;
        const expirationDate = (req.body.expiration_date || '').trim() || null;

        // Input validation
        const categories = ['Canned Goods', 'Dry Goods', 'Fresh Produce', 'Frozen Foods', 'Beverages', 'Other'];
        const storageTypes = ['Dry Storage', 'Refrigerated', 'Freezer'];
        if (!itemName) {
            return res.status(400).json({ error: 'Item name is required.' });
        }
        if (!categories.includes(category)) {
            return res.status(400).json({ error: 'Please select a valid category.' });
        }
        if (!storageTypes.includes(storageType)) {
            return res.status(400).json({ error: 'Please select a valid storage type.' });
        }
        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ error: 'Quantity must be a whole number of 0 or greater.' });
        }
        if (!Number.isInteger(minSafetyThreshold) || minSafetyThreshold < 0) {
            return res.status(400).json({ error: 'Minimum safety threshold must be a whole number of 0 or greater.' });
        }
        if (expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            return res.status(400).json({ error: 'Expiration date must use the YYYY-MM-DD format.' });
        }

        const sql = `
            INSERT INTO inventory (item_name, category, storage_type, quantity, min_safety_threshold, expiration_date)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const result = await dbRun(sql, [itemName, category, storageType, quantity, minSafetyThreshold, expirationDate]);

        res.status(201).json({
            message: `Inventory item "${itemName}" added successfully (ID: ${result.lastID}).`,
            inventory_id: result.lastID
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: formatDbError(err) });
    }
});

// Display data for visit history
app.get('/api/visits', async (req, res) => {
    try {
        const householdId = req.query.household_id ? Number(req.query.household_id) : null;

        if (req.query.household_id && (!Number.isInteger(householdId) || householdId <= 0)) {
            return res.status(400).json({ error: 'Invalid household ID filter.' });
        }

        const sql = `
            SELECT 
                v.visit_id,
                v.visit_date,
                (h.first_name || ' ' || h.last_name) AS household_name,
                h.zip_code,
                (s.first_name || ' ' || s.last_name) AS staff_name,
                i.item_name,
                i.category,
                vi.quantity AS quantity_given,
                v.notes
            FROM distribution_visits v
            INNER JOIN households h ON v.household_id = h.household_id
            INNER JOIN staff s ON v.staff_id = s.staff_id
            INNER JOIN visit_items vi ON v.visit_id = vi.visit_id
            INNER JOIN inventory i ON vi.inventory_id = i.inventory_id
            WHERE (? IS NULL OR v.household_id = ?)
            ORDER BY v.visit_date DESC, v.visit_id DESC;
        `;
        const rows = await dbAll(sql, [householdId, householdId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to retrieve related distribution history.' });
    }
});

// Add New Households
app.post('/api/households', async (req, res) => {
    try {
        const firstName = (req.body.first_name || '').trim();
        const lastName = (req.body.last_name || '').trim();
        const email = req.body.email && req.body.email.trim() !== '' ? req.body.email.trim() : null;
        const phoneNumber = (req.body.phone_number || '').trim();
        const householdSize = Number(req.body.household_size);
        const address = (req.body.address || '').trim();
        const zipCode = (req.body.zip_code || '').trim();

        // Input validation
        if (!firstName || !lastName || !phoneNumber || !address || !zipCode) {
            return res.status(400).json({ error: 'First name, last name, phone number, address, and zip code are required.' });
        }
        if (!Number.isInteger(householdSize) || householdSize <= 0) {
            return res.status(400).json({ error: 'Household size must be a whole number greater than 0.' });
        }

        const sql = `
            INSERT INTO households (first_name, last_name, email, phone_number, household_size, address, zip_code, registered_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'));
        `;
        const result = await dbRun(sql, [firstName, lastName, email, phoneNumber, householdSize, address, zipCode]);

        res.status(201).json({
            message: `Household for ${firstName} ${lastName} registered successfully (ID: ${result.lastID}).`,
            household_id: result.lastID
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: formatDbError(err) });
    }
});

// Update Inventory stock
app.put('/api/inventory/:id', async (req, res) => {
    try {
        const inventoryId = Number(req.params.id);
        const newQuantity = Number(req.body.quantity);

        if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
            return res.status(400).json({ error: 'Please select a valid inventory item.' });
        }
        if (!Number.isInteger(newQuantity) || newQuantity < 0) {
            return res.status(400).json({ error: 'New stock quantity must be a whole number of 0 or greater.' });
        }

        const sql = `UPDATE inventory SET quantity = ? WHERE inventory_id = ?;`;
        const result = await dbRun(sql, [newQuantity, inventoryId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Inventory item not found.' });
        }

        res.json({ message: `Inventory stock updated to ${newQuantity} units.` });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: formatDbError(err) });
    }
});


app.get('/api/reports', async (req, res) => {
    try {
        // Query the donor impact summary view
        const donorSummary = await dbAll(`
            SELECT donor_name, donor_type, total_donation_batches, total_items_donated
            FROM view_donor_impact_summary
            ORDER BY total_items_donated DESC;
        `);

        // Low stock and upcoming expiration report
        const inventoryAlerts = await dbAll(`
            SELECT item_name, category, storage_type, quantity, min_safety_threshold, expiration_date
            FROM inventory
            WHERE quantity <= min_safety_threshold
               OR expiration_date <= DATE('now', '+30 days')
            ORDER BY expiration_date ASC;
        `);

        // Aggregate and GROUP BY report of visits by zip code
        const zipDemographics = await dbAll(`
            SELECT 
                h.zip_code,
                COUNT(DISTINCT h.household_id) AS registered_households,
                COUNT(v.visit_id) AS total_visits
            FROM households h
            LEFT JOIN distribution_visits v ON h.household_id = v.household_id
            GROUP BY h.zip_code
            ORDER BY total_visits DESC;
        `);

        res.json({ donorSummary, inventoryAlerts, zipDemographics });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate pantry reports.' });
    }
});

// Add distribution visits
app.post('/api/distributions', async (req, res) => {
    try {
        const householdId = Number(req.body.household_id);
        const staffId = Number(req.body.staff_id);
        const inventoryId = Number(req.body.inventory_id);
        const quantity = Number(req.body.quantity);
        const notes = (req.body.notes || '').trim() || 'N/A';

        if (!Number.isInteger(householdId) || householdId <= 0 ||
            !Number.isInteger(staffId) || staffId <= 0 ||
            !Number.isInteger(inventoryId) || inventoryId <= 0) {
            return res.status(400).json({ error: 'Please select a valid household, staff member, and inventory item.' });
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({ error: 'Distribution quantity must be at least 1.' });
        }

        const result = await runTransaction(async () => {
            // Check current stock inside the transaction
            const item = await dbGet('SELECT item_name, quantity FROM inventory WHERE inventory_id = ?;', [inventoryId]);
            if (!item) {
                throw new Error('NOT_FOUND:Selected inventory item does not exist.');
            }
            if (item.quantity < quantity) {
                throw new Error(`INSUFFICIENT_STOCK:Only ${item.quantity} units of "${item.item_name}" are available in stock.`);
            }

            // Insert visit header
            const visitRes = await dbRun(
                `INSERT INTO distribution_visits (household_id, staff_id, visit_date, notes)
                 VALUES (?, ?, DATETIME('now', 'localtime'), ?);`,
                [householdId, staffId, notes]
            );

            // Insert junction record in visit_items
            await dbRun(
                `INSERT INTO visit_items (visit_id, inventory_id, quantity)
                 VALUES (?, ?, ?);`,
                [visitRes.lastID, inventoryId, quantity]
            );

            // Decrement active stock in inventory
            await dbRun(
                `UPDATE inventory SET quantity = quantity - ? WHERE inventory_id = ?;`,
                [quantity, inventoryId]
            );

            return { visitId: visitRes.lastID, itemName: item.item_name };
        });

        res.status(201).json({
            message: `Visit #${result.visitId} recorded! Distributed ${quantity} unit(s) of ${result.itemName} and updated inventory.`
        });
    } catch (err) {
        console.error(err);
        if (err.message.startsWith('NOT_FOUND:')) {
            return res.status(404).json({ error: err.message.replace('NOT_FOUND:', '') });
        }
        if (err.message.startsWith('INSUFFICIENT_STOCK:')) {
            return res.status(400).json({ error: err.message.replace('INSUFFICIENT_STOCK:', '') });
        }
        res.status(400).json({ error: formatDbError(err) });
    }
});

const server = app.listen(PORT, () => {
    console.log(`TouchPoint Food Pantry App running at http://localhost:${PORT}`);
});