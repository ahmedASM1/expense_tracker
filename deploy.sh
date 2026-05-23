#!/bin/bash

set -e

EC2_USER="ec2-user"
EC2_HOST="3.0.139.53"
KEY_PATH="./expense-tracker-key.pem"
APP_DIR="/home/ec2-user/expense-tracker"

echo "🚀 Deploying backend to EC2..."

# Step 1: SSH into EC2 and install dependencies if first time
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
  # Install Node.js if not installed
  if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
  fi

  # Install PM2 if not installed
  if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
  fi

  # Create app directory
  mkdir -p /home/ec2-user/expense-tracker
ENDSSH

# Step 2: Copy backend files to EC2
echo "📦 Copying files..."
scp -i "$KEY_PATH" -r \
  ./backend \
  ./db \
  "$EC2_USER@$EC2_HOST:$APP_DIR/"

# Step 3: Copy .env file
scp -i "$KEY_PATH" ./.env "$EC2_USER@$EC2_HOST:$APP_DIR/.env"

# Step 4: Install dependencies and restart app
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
  cd /home/ec2-user/expense-tracker/backend
  npm install --production

  # Run DB migrations
  cd /home/ec2-user/expense-tracker
  export $(cat .env | grep -v '#' | xargs)
  
  # Apply schema using psql
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f db/migrations/001_initial_schema.sql

  # Start/restart with PM2
  cd /home/ec2-user/expense-tracker/backend
  pm2 delete expense-tracker 2>/dev/null || true
  pm2 start src/server.js --name expense-tracker
  pm2 save
  pm2 startup | tail -1 | sudo bash
ENDSSH

echo "✅ Deployment complete!"
echo "Backend running at http://$EC2_HOST:8080"