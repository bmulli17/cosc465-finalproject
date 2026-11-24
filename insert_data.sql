-- Touch Point Food Pantry Ministy Insert Data Script
-- Name: Bryan Mullins
-- Course: COSC465
-- Date: 10/22/2026

PRAGMA foreign_keys = ON;

--Insert households
INSERT INTO households (first_name, last_name, email, phone_number, household_size, address, zip_code, registered_date) VALUES
('Bob', 'Jones', 'bjones@yahoo.com', '555-1234', 3, '123 Gay Street', '12345', '2026-10-01'),
('Alice', 'Smith', 'asmith@gmail.com', '123-4567', 2, '456 Main Street', '67890', '2026-10-05'),
('Carol', 'Brown', 'cbrown@hotmail.com', '987-6543', 4, '789 Oak Avenue', '54321', '2026-10-10'),
('David', 'Johnson', 'djohnson@gmail.com', '555-9876', 2, '321 Pine Road', '09876', '2026-10-15');

--Insert donors
INSERT INTO donors (donor_name, donor_type, email, phone_number) VALUES
('John Doe', 'Individual', 'jdoe@gmail.com', '555-1111'),
('Acme Corporation', 'Corporate', 'acme@gmail.com', '555-2222'),
('First Baptist Church', 'Community Organization', 'firstbaptist@gmail.com', '555-3333'),
('Second Harvest Food Bank', 'Community Organization', 'info@secondharvestmidtn.org', '615-329-3491'),
('Food City', 'Corporate', 'foodcity@gmail.com', '555-4444');

--Insert staff
INSERT INTO staff (first_name, last_name, email, role, phone_number) VALUES
('Bryan', 'Mullins', 'bmullins@fakemail.com', 'Administrator', '123-456-7890'),
('Michael', 'Perry', 'mperry@gmail.com', 'Volunteer', '555-1234'),
('Sarah', 'Johnson', 'sjohnson@yahoo.com', 'Receiving Staff', '555-5678'),
('Emily', 'Davis', 'edavis@gmail.com', 'Receiving Staff', '555-9012'),
('David', 'Wilson', 'dwilson@gmail.com', 'Receiving Staff', '555-3456');

--Insert inventory
INSERT INTO inventory (item_name, category, storage_type, quantity, min_safety_threshold, expiration_date) VALUES
('Canned Black Beans 15oz', 'Canned Goods', 'Dry Storage', 140, 30, '2027-08-15'),
('Whole White Rice 5lb', 'Dry Goods', 'Dry Storage', 45, 15, '2027-12-01'),
('Whole Milk 1 Gal', 'Beverages', 'Refrigerated', 8, 10, '2026-10-28'),
('Frozen Chicken Breasts 3lb', 'Frozen Foods', 'Freezer', 25, 12, '2027-03-10'),
('Canned Sweet Corn 15oz', 'Canned Goods', 'Dry Storage', 110, 25, '2027-06-20'),
('Golden Delicious Apples 3lb bag', 'Fresh Produce', 'Refrigerated', 12, 15, '2026-10-26'),
('Whole Wheat Bread Loaf', 'Dry Goods', 'Dry Storage', 18, 10, '2026-10-24'),
('Peanut Butter 16oz', 'Dry Goods', 'Dry Storage', 60, 20, '2028-01-15'),
('Spaghetti Pasta 16oz', 'Dry Goods', 'Dry Storage', 85, 20, '2027-11-30'),
('Apple Juice 64oz', 'Beverages', 'Dry Storage', 30, 10, '2027-05-18');

--Donation Drop Offs
INSERT INTO donation_drop_offs (donor_id, staff_id, donation_date) VALUES
(1, 3, '2026-9-01'),
(2, 3, '2026-9-05'),
(3, 3, '2026-9-10'),
(4, 1, '2026-10-12'),
(1, 3, '2026-10-15'),
(5, 2, '2026-10-18');


--Donation Items
INSERT INTO donation_items (donation_id, inventory_id, quantity_received) VALUES
(1, 1, 100),
(1, 5, 80),
(2, 2, 30),
(2, 8, 40),
(3, 3, 15),
(3, 6, 20),
(3, 7, 25),
(4, 4, 30),
(4, 9, 50),
(5, 1, 50),
(5, 5, 50),
(6, 10, 35);

--Distribution Visits
INSERT INTO distribution_visits (household_id, staff_id, visit_date, notes) VALUES
(1, 2, '2026-10-02 10:15:00', 'N/A'),
(2, 4, '2026-10-03 11:30:00', 'Individual requested extra dairy if available.'),
(3, 2, '2026-10-06 09:45:00', 'Single individual package.'),
(4, 4, '2026-10-11 14:00:00', 'Large family package with fresh produce.'),
(1, 2, '2026-10-16 10:30:00', 'Second visit in month; verified eligibility.'),
(3, 4, '2026-10-17 13:15:00', 'First-time visit intake completed.'),
(1, 2, '2026-10-19 09:00:00', 'Third visit in month; provided additional canned goods.'),
(2, 4, '2026-10-20 15:20:00', 'Refused some items due to allergies.');

--Visit Items
INSERT INTO visit_items (visit_id, inventory_id, quantity) VALUES
(1, 1, 4), (1, 2, 1), (1, 5, 4), (1, 8, 1),
(2, 3, 1), (2, 6, 1), (2, 7, 1),
(3, 1, 2), (3, 9, 1),
(4, 4, 2), (4, 6, 2), (4, 2, 2), (4, 10, 1),
(5, 5, 3), (5, 9, 2),
(6, 1, 3), (6, 8, 1),
(7, 4, 3), (7, 5, 5), (7, 2, 2),
(8, 3, 1), (8, 7, 1), (8, 10, 1);


