#!/usr/bin/env bash

# 🛑 Important: This is only used for the bare-metal install 🛑 
# Update /install/start.ubuntu24.sh in most cases is preferred 

# The following variables you can adjust
GIT_REPOSITORY=https://github.com/ingoratsdorf/NetAlertX
GIT_BRANCH=life-version # set this to your desired GIT_BRANCH, typically 'main'


echo "---------------------------------------------------------"
echo "[INSTALL]                         Run install.ubuntu24.sh"
echo "---------------------------------------------------------"


# DO NOT CHANGE ANYTHING BELOW THIS LINE!
BASE_DIR=/app  # Specify the installation directory here, but better do not change this ;-)
# DO NOT CHANGE ANYTHING ABOVE THIS LINE!


# Check if script is run as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root. Please use 'sudo'." 
    exit 1
fi

# Prepare the environment
apt update
apt install -y sudo

# Install Git
apt install -y git

# Clean the directory
rm -R ${BASE_DIR}/

# Clone the application GIT_REPOSITORY
git clone ${GIT_REPOSITORY} "${BASE_DIR}/"
cd "${BASE_DIR}/"
git checkout ${GIT_BRANCH}

# Check for buildtimestamp.txt existence, otherwise create it
if [ ! -f ${BASE_DIR}/front/buildtimestamp.txt ]; then
  date +%s > ${BASE_DIR}/front/buildtimestamp.txt
fi

# Set file permissions
chmod a+x "${BASE_DIR}/install/ubuntu24/start.ubuntu24.sh"

# Start NetAlertX
"${BASE_DIR}/install/ubuntu24/start.ubuntu24.sh"
