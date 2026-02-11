#!/bin/bash
# MongoDB Setup Script for macOS/Linux
# This script initializes the Plaid Financcer database

echo "===================================="
echo "Plaid Financcer - Database Setup"
echo "===================================="
echo ""

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    echo "ERROR: mongosh is not installed or not in PATH"
    echo "Please install MongoDB Shell from: https://www.mongodb.com/try/download/shell"
    echo ""
    exit 1
fi

echo "MongoDB Shell found!"
echo ""

echo "Step 1: Initializing database..."
echo "Running init-db.js..."
mongosh plaid-financcer < mongodb/init-db.js
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to initialize database"
    exit 1
fi
echo ""

# Ask about sample data
while true; do
    read -p "Do you want to load sample data for testing? (Y/N): " yn
    case $yn in
        [Yy]* )
            echo ""
            echo "Step 2: Loading sample data..."
            echo "Running sample-data.js..."
            mongosh plaid-financcer < mongodb/sample-data.js
            echo ""
            break
            ;;
        [Nn]* )
            echo ""
            echo "Skipping sample data..."
            echo ""
            break
            ;;
        * )
            echo "Invalid input. Please enter Y or N."
            ;;
    esac
done

echo "===================================="
echo "Database Setup Complete!"
echo "===================================="
echo ""
echo "Your database is ready to use."
echo ""
echo "Next steps:"
echo "1. Update your .env file with MongoDB URI and Plaid credentials"
echo "2. Run: yarn install"
echo "3. Run: yarn start:dev"
echo ""
echo "To view your data:"
echo "- MongoDB Compass: mongodb://localhost:27017/plaid-financcer"
echo "- Or run: mongosh plaid-financcer"
echo ""
