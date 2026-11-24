#!/bin/bash

# Touch Point Food Pantry Ministy Run Queries Script
# Name: Bryan Mullins
# Course: COSC465
# Date: 11/2/2026

DB="touch_point_food_pantry.db"

# Recreate the database if it exists
echo "Recreating the database..."

rm -f $DB

# Initialize the database with the schema
echo "Initializing the database with the schema..."
sqlite3 $DB < schema.sql
sqlite3 $DB < insert_data.sql

# Run the queries
echo "Running the queries..."
sqlite3 -header -column $DB < queries.sql

# Run the transaction
echo "Running the transaction..."
sqlite3 -header -column -bail $DB < transaction.sql
status=$?

if [ $status -eq 0 ]; then
    echo "Transaction completed successfully."
else
    echo "Transaction failed."
fi

echo "Queries and transaction execution completed."