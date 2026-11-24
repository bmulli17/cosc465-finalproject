# TouchPoint Food Pantry Ministry System — Application

## Project Overview
This is a database management system designed to fullfill the needs of a food pantry ministry. The system allows a user to record food distributions, inventory updates, view households visit history, register new households, 
etc. The purpose of this system is for food pantries and similar charities to be able to quickly view and update any necessary records for distribution visits or inventory changes.

## DBMS
The database management system uses SQLite3 with Node.js express

## 1. Requirements
* Node.Js v18+
* Express - Backend
* Sqlite3 - Database
* HTML + Javascript - Frontend

## 2. Setting Up The Database
1. Remove the database if it already exists
```
rm -f touch_point_food_pantry.db
```
2. Populate the Database with the provided scripts
```
sqlite3 touch_point_food_pantry.db < schema.sql
sqlite3 touch_point_food_pantry.db < insert_data.sql
```

## 3. Installation and Running
1. Install Node.js
2. Install express and sqlite
```
npm install express sqlite3
```
3. Launch with 
```
npm start
```
4. Go to http://localhost:3000 to access the website
5. Use ctl+c in the console to safely close the database

## 4. User Operations
1. Search & Browse Data (GET /api/inventory):
  * Searches inventory items by keywords and filters by food category directly in sqlite
2. Display Related Data (GET /api/visits):
  * Executes a 5-table INNER JOIN (distribution_visits, households, staff, visit_items, and inventory) to show itemized aid given per visit, filterable by household.
3. Add Data (POST /api/households):
  * Validates user input and adds data into the households table
4. Update Data (PUT /api/inventory/:id):
  * Updates stock quantities on the inventory table 
5. Summary & Reports (GET /api/reports):
  * Queries the view_donor_impact_summary databse view, filters low stock or expiring items, and gets a total visits per zipcode
6. Transactional Food Distribution (POST /api/distributions):
  * Executes BEGIN TRANSACTION/COMMIT/ROLLBACK that verifies the inventory stock, inserts new distribution visit records, inserts items into visit items, and decrements item quantity

## Known Limitations
* There is not a user friendly way to add donors or staff to the registry.
* No known problems.