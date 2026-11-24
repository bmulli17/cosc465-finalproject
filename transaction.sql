-- Touch Point Food Pantry Ministy Transaction Script
-- Name: Bryan Mullins
-- Course: COSC465
-- Date: 11/2/2026

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Add a new household visit header for a specific household served by a staff member on a given date.
INSERT INTO distribution_visits (household_id, staff_id, visit_date, notes) VALUES
(1, 2, '2026-11-01', 'Needed extra bread and milk for the week.');

-- Record distributed items for the visit
INSERT INTO visit_items (visit_id, inventory_id, quantity) 
VALUES ((SELECT MAX(visit_id) FROM distribution_visits), 7, 2), -- 2 Whole Wheat Bread Loaf
       ((SELECT MAX(visit_id) FROM distribution_visits), 3, 2), -- 2 Whole Milk
       ((SELECT MAX(visit_id) FROM distribution_visits), 1, 3); -- 3 Canned Black Beans

-- Display current inventory before the distribution visit
SELECT item_name AS "Food Item",
        quantity AS "Stock After Distribution"
FROM inventory
WHERE item_name IN ('Whole Wheat Bread Loaf', 'Whole Milk', 'Canned Black Beans');

-- Decrement the inventory quantities for the distributed items
UPDATE inventory
SET quantity = quantity - 2
WHERE item_name = 'Whole Wheat Bread Loaf';

UPDATE inventory
SET quantity = quantity - 2
WHERE item_name = 'Whole Milk';

UPDATE inventory
SET quantity = quantity - 3
WHERE item_name = 'Canned Black Beans';


-- Display the updated inventory after the distribution visit
SELECT item_name AS "Food Item",
        quantity AS "Stock After Distribution"
FROM inventory
WHERE item_name IN ('Whole Wheat Bread Loaf', 'Whole Milk', 'Canned Black Beans');

-- Rollback the transaction to preserve the sample database
ROLLBACK;

-- Verify that the inventory remains unchanged after the rollback
SELECT item_name AS "Food Item",
        quantity AS "Stock After Distribution"
FROM inventory
WHERE item_name IN ('Whole Wheat Bread Loaf', 'Whole Milk', 'Canned Black Beans');