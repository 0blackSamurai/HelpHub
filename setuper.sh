#!/bin/bash

# HelpDesk Application Setup Script
# This script sets up the complete environment for running the HelpDesk application
# Designed for Ubuntu 22.04 Server from a user's home directory

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to echo with timestamp
function log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

function warn() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

function error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
  exit 1
}

# Function to run commands with sudo
function sudo_run() {
  if sudo -n true 2>/dev/null; then
    sudo "$@"
  else
    echo -e "${YELLOW}Sudo password required for: $*${NC}"
    sudo "$@"
  fi
}

# Get server's IP address
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
  error "Could not determine server IP address"
fi

# Split IP into parts and increment the last octet
IFS='.' read -r -a IP_PARTS <<< "$SERVER_IP"
if [ ${#IP_PARTS[@]} -ne 4 ]; then
  error "Invalid IP address format: $SERVER_IP"
fi

LAST_OCTET=$((IP_PARTS[3] + 1))
MONGO_HOST="${IP_PARTS[0]}.${IP_PARTS[1]}.${IP_PARTS[2]}.$LAST_OCTET"

log "Server IP: $SERVER_IP"
log "MongoDB Host will be set to: $MONGO_HOST"

# Update package lists
log "Updating package lists..."
sudo_run apt-get update

# Check and install Nginx
if command -v nginx &> /dev/null; then
  log "Nginx is already installed"
else
  log "Installing Nginx..."
  sudo_run DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
fi

# Check and install Node Version Manager (NVM)
if [ -d "$HOME/.nvm" ]; then
  log "NVM is already installed"
else
  log "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  
  # Add NVM to shell profile if not already there
  if ! grep -q NVM_DIR "$HOME/.bashrc"; then
    echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.bashrc"
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> "$HOME/.bashrc"
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> "$HOME/.bashrc"
  fi
fi

# Make sure NVM is loaded in the current shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check and install Node.js LTS version
if command -v node &> /dev/null; then
  log "Node.js is already installed: $(node -v)"
else
  log "Installing Node.js LTS version..."
  nvm install --lts
  nvm use --lts
fi

# Check and install PM2
if command -v pm2 &> /dev/null; then
  log "PM2 is already installed"
else
  log "Installing PM2 globally..."
  npm install -g pm2
fi

# Create application directory in user's home
APP_DIR="$HOME/helpdesk"
log "Setting up application in $APP_DIR"

# Clone the repository if not already cloned
if [ -d "$APP_DIR" ]; then
  warn "Application directory already exists. Pulling latest changes..."
  cd "$APP_DIR"
  git pull
else
  log "Cloning repository..."
  git clone https://github.com/0blackSamurai/HelpHub.git "$APP_DIR"
  cd "$APP_DIR"
fi



# Generate session secret
log "Generating session secret..."
SESSION_SECRET=$(node super-secret.js)

# Create .env file
log "Creating .env file..."
cat > .env << EOL
PORT=3005
DB_URL=mongodb://$MONGO_HOST:27017/Githelp
saltrounds=15
JWT_SECRET=MRdangeresddddefweerwer
EOL

# Install dependencies
log "Installing application dependencies..."
npm install

# Configure Nginx as reverse proxy
log "Configuring Nginx as reverse proxy..."
NGINX_CONFIG_PATH="/tmp/helpdesk.conf"
cat > "$NGINX_CONFIG_PATH" << EOL
# /etc/nginx/sites-available/nodeapp
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Move the config file to the correct location with sudo
sudo_run mv "$NGINX_CONFIG_PATH" /etc/nginx/sites-available/helpdesk

# Enable the site by creating a symlink
if sudo_run test -f "/etc/nginx/sites-enabled/default"; then
  log "Removing default Nginx site..."
  sudo_run rm /etc/nginx/sites-enabled/default
fi

log "Enabling HelpDesk site..."
sudo_run ln -sf /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo_run nginx -t || error "Nginx configuration test failed"

# Restart Nginx
log "Restarting Nginx..."
sudo_run systemctl restart nginx

# Start application with PM2
log "Starting application with PM2..."
cd "$APP_DIR"
PM2_PATH=$(which pm2)
if [ -z "$PM2_PATH" ]; then
  PM2_PATH="$NVM_DIR/versions/node/$(node -v)/bin/pm2"
fi

$PM2_PATH start server.js --name "helpdesk"
$PM2_PATH save

# Configure PM2 to start on system boot (with sudo for the startup script)
log "Setting up PM2 to start on system boot..."
$PM2_PATH startup | grep "sudo" > /tmp/pm2-startup-command.sh
chmod +x /tmp/pm2-startup-command.sh
sudo_run bash /tmp/pm2-startup-command.sh
$PM2_PATH save



# Set proper permissions
log "Setting correct file permissions..."
chmod 755 "$APP_DIR/public/assets/uploads" -R

log "Application setup complete!"
log "Server should be available at: http://$SERVER_IP"

# Display important information
cat << EOL

====================================
 HelpDesk Application Deployed!
====================================
- Web Interface: http://$SERVER_IP
- Application Directory: $APP_DIR  
- Logs: Check PM2 logs with 'pm2 logs helpdesk'
- Restart: 'pm2 restart helpdesk'

Make sure MongoDB is running at $MONGO_HOST:27017!

IMPORTANT NEXT STEPS:
1. Run the mock data script to populate categories and professions:
   cd $APP_DIR && node mockdata.js

2. Register a user at http://$SERVER_IP/register
   The first user will be able to create an organization
====================================

EOL