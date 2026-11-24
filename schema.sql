-- Touch Point Food Pantry Ministy Database Schema
-- Name: Bryan Mullins
-- Course: COSC465
-- Date: 10/22/2026

PRAGMA foreign_keys = ON;

-- DROP TABLES
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS donors;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS donation_items;
DROP TABLE IF EXISTS donation_drop_offs;
DROP TABLE IF EXISTS distribution_visits;
DROP TABLE IF EXISTS visit_items;

--DROP VIEWS
DROP VIEW IF EXISTS view_donor_impact_summary;
DROP VIEW IF EXISTS view_visit_history_details;


--CREATE TABLES
--Households table will store information about the households that receive assistance from the food pantry. 
CREATE TABLE households (
    household_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone_number TEXT NOT NULL,
    household_size INTEGER NOT NULL CHECK (household_size > 0), -- Must be positive
    address TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    registered_date TEXT NOT NULL
);

--Donors table will store information about the donors who contribute to the food pantry.
CREATE TABLE donors (
    donor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name TEXT NOT NULL,
    donor_type TEXT NOT NULL CHECK (donor_type IN ('Individual', 'Corporate', 'Community Organization')),
    email TEXT UNIQUE,
    phone_number TEXT
);

--Staff table will store information about the staff members who work at the food pantry.
CREATE TABLE staff (
    staff_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Administrator', 'Volunteer', 'Receiving Staff')),
    phone_number TEXT
);


--Inventory table will store information about the items available in the food pantry's inventory and storage conditions.
CREATE TABLE inventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('Canned Goods', 'Dry Goods', 'Fresh Produce', 'Frozen Foods', 'Beverages', 'Other')),
    storage_type TEXT NOT NULL CHECK (storage_type IN ('Dry Storage', 'Refrigerated', 'Freezer')),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0), --Must not be negative
    min_safety_threshold INTEGER NOT NULL DEFAULT 10 CHECK (min_safety_threshold >= 0), -- Must not be negative
    expiration_date TEXT -- Format: YYYY-MM-DD
);

--Donation Drop Offs log the intake of donations from donors.
CREATE TABLE donation_drop_offs (
    donation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    donation_date TEXT NOT NULL DEFAULT (DATE('now')),
    FOREIGN KEY (donor_id) REFERENCES donors (donor_id),
    FOREIGN KEY (staff_id) REFERENCES staff (staff_id)
);

--Donation Items table will store information about the items donated during each donation drop-off.
--Serves as a junction table between donation_drop_offs and inventory.
CREATE TABLE donation_items (
    donation_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_id INTEGER NOT NULL,
    inventory_id INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
    FOREIGN KEY (donation_id) REFERENCES donation_drop_offs (donation_id),
    FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id)
);

--Distribution Visits table will store information about the visits made by households to receive assistance from the food pantry.
CREATE TABLE distribution_visits (
    visit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    visit_date TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    notes TEXT,
    FOREIGN KEY (household_id) REFERENCES households (household_id),
    FOREIGN KEY (staff_id) REFERENCES staff (staff_id)
);


--Visit Items table will store information about the items distributed to households during each visit.
--Serves as a junction table between distribution_visits and inventory.
CREATE TABLE visit_items (
    visit_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    inventory_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0), -- Non-key constraint
    FOREIGN KEY (visit_id) REFERENCES distribution_visits (visit_id),
    FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id)
);

--CREATE INDEXES
--Index on expiration_date to help alert for items that are nearing expiration.
CREATE INDEX index_inventory_expiration_date ON inventory (expiration_date);

--Index on household_id in distribution_visits for quick lookup of visits by household.
CREATE INDEX index_visits_household_date ON distribution_visits(household_id, visit_date);

--CREATE VIEWS
--Provides a summary and itemized audit log of distributed food items.
CREATE VIEW view_visit_history_details AS
SELECT 
    v.visit_id,
    v.visit_date,
    h.household_id,
    (h.first_name || ' ' || h.last_name) AS household_name,
    h.zip_code,
    (s.first_name || ' ' || s.last_name) AS served_by_staff,
    i.item_name,
    i.category,
    vi.quantity AS quantity_given
FROM distribution_visits v
JOIN households h ON v.household_id = h.household_id
JOIN staff s ON v.staff_id = s.staff_id
JOIN visit_items vi ON v.visit_id = vi.visit_id
JOIN inventory i ON vi.inventory_id = i.inventory_id;

--Summary of total food items and their quantities distributed to households.
CREATE VIEW view_donor_impact_summary AS
SELECT 
    d.donor_id,
    d.donor_name,
    d.donor_type,
    COUNT(DISTINCT ddo.donation_id) AS total_donation_batches,
    COALESCE(SUM(di.quantity_received), 0) AS total_items_donated
FROM donors d
LEFT JOIN donation_drop_offs ddo ON d.donor_id = ddo.donor_id
LEFT JOIN donation_items di ON ddo.donation_id = di.donation_id
GROUP BY d.donor_id, d.donor_name, d.donor_type;

