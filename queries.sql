-- Touch Point Food Pantry Ministy Queries Script
-- Name: Bryan Mullins
-- Course: COSC465
-- Date: 11/2/2026

-- Requirement 1: Filter and Sorting
-- Retrieve all inventory expiring before a specific date, sorted by expiration date in ascending order.
-- This query helps the pantry identify items that need to be distributed or used before they expire.
SELECT item_name AS "Food Item",
        category AS "Category",
        storage_type AS "Storage Type",
        quantity AS "Current Stock",
        min_safety_threshold AS "Safety Threshold",
        expiration_date AS "Expiration Date"
FROM inventory
WHERE expiration_date < '2026-11-30'
ORDER BY expiration_date ASC;

-- Requirement 2: INNER JOIN
-- Combines donation drop-off headers with donor details and receiving staff members to display complete intake information.
SELECT ddo.donation_id AS "Donation ID",
        ddo.donation_date AS "Donation Date",
        d.donor_name AS "Donor Name",
        d.donor_type AS "Donor Type",
        s.first_name || ' ' || s.last_name AS "Receiving Staff"
FROM donation_drop_offs AS ddo
INNER JOIN donors AS d ON ddo.donor_id = d.donor_id
INNER JOIN staff AS s ON ddo.staff_id = s.staff_id
ORDER BY ddo.donation_date DESC;

-- Requirement 3: LEFT JOIN
-- Displays all registered donors and their recorded donations, including corporate and individual donors, even if they have not made any donations.
SELECT d.donor_id AS "Donor ID",
        d.donor_name AS "Donor Name",
        d.donor_type AS "Donor Type",
        ddo.donation_id AS "Donation ID",
        COALESCE(ddo.donation_date, 'No Donations') AS "Donation Date"
FROM donors AS d
LEFT JOIN donation_drop_offs AS ddo ON d.donor_id = ddo.donor_id
ORDER BY d.donor_name ASC;

-- Requirement 4: Three-Table Join
-- Joins distribution visits, client households, visit items, and inventory to provide an itemized log of distributed items to families.
-- This query helps track what food items were provided to each household during their visits, along with the quantities given.
SELECT v.visit_id AS "Visit ID",
    v.visit_date AS "Visit Timestamp",
    (h.first_name || ' ' || h.last_name) AS "Household Name",
    i.item_name AS "Food Provided",
    vi.quantity AS "Quantity Given"
FROM distribution_visits AS v
INNER JOIN households AS h ON v.household_id = h.household_id
INNER JOIN visit_items AS vi ON v.visit_id = vi.visit_id
INNER JOIN inventory AS i ON vi.inventory_id = i.inventory_id
ORDER BY v.visit_date DESC, h.last_name ASC;

-- Requirement 5: Aggregate Query
-- Calculates donation totals for items like total quantity received, total items, and average quantity per donation.
SELECT  COUNT(DISTINCT donation_id) AS "Total Donation Batches",
    SUM(quantity_received) AS "Total Food Items Received",
    ROUND(AVG(quantity_received), 1) AS "Avg Items Per Line Item",
    MAX(quantity_received) AS "Largest Single Line Intake"
FROM donation_items;


-- Requirement 6: GROUP BY and HAVING
-- Groups visits by zip codes and filters for zip codes accounting for at least 2 visits to identify high-needs areas.
-- This helps the pantry focus outreach and support efforts in those communities.
SELECT h.zip_code AS "Zip Code",
    COUNT(DISTINCT h.household_id) AS "Unique Households Served",
    COUNT(v.visit_id) AS "Total Visits"
FROM households AS h
INNER JOIN distribution_visits AS v ON h.household_id = v.household_id
GROUP BY h.zip_code
HAVING COUNT(v.visit_id) >= 2
ORDER BY "Total Visits" DESC;

--Requirement 7: Subquery
-- Subquery to find all food items whose current stock is below the overall average stock level
-- This helps identify which items may need to be restocked and acts as a Low-Stock Alert for the pantry.
SELECT item_name AS "Food Item",
    category AS "Category",
    quantity AS "Current Stock",
    min_safety_threshold AS "Safety Threshold"
FROM inventory
WHERE quantity < (SELECT AVG(quantity) FROM inventory)
ORDER BY quantity ASC;

-- Requirement 8: Set Operation
-- Combines email addresses from both households and donors into a single list of unique contacts for outreach purposes.
SELECT (first_name || ' ' || last_name) AS "Contact Name",
    email AS "Email Address",
    'Client Household' AS "Contact Type"
FROM households
WHERE email IS NOT NULL
UNION
SELECT donor_name AS "Contact Name",
    email AS "Email Address",
    'Donor Entity' AS "Contact Type"
FROM donors
WHERE email IS NOT NULL
ORDER BY "Contact Name" ASC;

-- Requirement 9: Query Using View
-- Uses the view_donor_impact_summary view to rank active donors by their total items contributed
SELECT donor_name AS "Donor Name",
    donor_type AS "Donor Type",
    total_items_donated AS "Total Items Contributed",
    total_donation_batches AS "Total Donations Made"
FROM view_donor_impact_summary
WHERE total_items_donated > 0
ORDER BY total_items_donated DESC;

