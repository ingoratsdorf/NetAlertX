#!/usr/bin/env bash

# 🛑 Important: This is only used for the bare-metal install 🛑 
# Update /install/start.debian.sh in most cases is preferred 

echo "---------------------------------------------------------"
echo "[INSTALL]                         Run install.ubuntu24.sh"
echo "---------------------------------------------------------"

# Set environment variables
INSTALL_DIR=/app  # Specify the installation directory here
REPOSITORY=https://github.com/ingoratsdorf/NetAlertX

# Check if script is run as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root. Please use 'sudo'." 
    exit 1
fi

# Prepare the environment
apt-get update
apt-get install sudo -y

# Install Git
apt-get install -y git

# Clean the directory
rm -R $INSTALL_DIR/

# Clone the application repository
git clone $REPOSITORY "$INSTALL_DIR/"

# Check for buildtimestamp.txt existence, otherwise create it
if [ ! -f $INSTALL_DIR/front/buildtimestamp.txt ]; then
  date +%s > $INSTALL_DIR/front/buildtimestamp.txt
fi

# Set file permissions
chmod +x "$INSTALL_DIR/install/ubuntu24/start.ubuntu24.sh"
chmod +x "$INSTALL_DIR/install/ubuntu24/user-mapping.ubuntu24.sh"
chmod +x "$INSTALL_DIR/install/ubuntu24/install_dependencies.ubuntu24.sh"

# Start NetAlertX
"$INSTALL_DIR/install/ubuntu24/start.ubuntu24.sh"
