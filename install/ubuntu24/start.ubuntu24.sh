#!/usr/bin/env bash

# The following are custom variables that can be set befire this script is called
#
# ALWAYS_FRESH_INSTALL : Deletes existing db and config files and replaces with stock. CAREFUL
# TZ : Sets the timezone, ie "Europe/Berlin" or "Pacific/Auckland" etc
# PORT: Sets the listening port for the web UI, default is 20211
# LISTEN_ADDR : sets the IP to listen on, ie "127.0.0.1", "192.168.1.1" etc. Set to 0.0.0.0 to listen to all interfaces



echo "---------------------------------------------------------"
echo "[INSTALL]                      Run install_s2.ubuntu24.sh"
echo "---------------------------------------------------------"


# DO NOT CHANGE ANYTHING BELOW THIS LINE!
BASE_DIR=/app  # Specify the installation directory here
CONFIG_FILE=app.conf
DB_FILE=app.db
NGINX_CONFIG_FILE=netalertx.ubuntu24.conf
WEB_UI_DIR=/var/www/html/netalertx
NGINX_CONFIG_LINK=/etc/nginx/conf.d/${NGINX_CONFIG_LINK}
OUI_FILE="/usr/share/arp-scan/ieee-oui.txt" # Define the path to ieee-oui.txt and ieee-iab.txt
FILEDB=${BASE_DIR}/db/${DB_FILE}
# DO NOT CHANGE ANYTHING ABOVE THIS LINE!

# if custom variables not set we do not need to do anything
if [ -n "${TZ}" ]; then    
  FILECONF=${BASE_DIR}/config/${CONFIG_FILE} 
  if [ -f "$FILECONF" ]; then
    sed -ie "s|Europe/Berlin|${TZ}|g" ${BASE_DIR}/config/${CONFIG_FILE} 
  else 
    sed -ie "s|Europe/Berlin|${TZ}|g" ${BASE_DIR}/back/${CONFIG_FILE}.bak 
  fi
fi

# Check if script is run as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root. Please use 'sudo'." 
    exit 1
fi

# Run setup scripts
echo "[INSTALL] Run setup scripts"

chmod +x "${BASE_DIR}/install/ubuntu24/user-mapping.ubuntu24.sh"
chmod +x "${BASE_DIR}/install/ubuntu24/install_dependencies.ubuntu24.sh"

"${BASE_DIR}/install/ubuntu24/user-mapping.ubuntu24.sh"
"${BASE_DIR}/install/ubuntu24/install_dependencies.ubuntu24.sh" # if modifying this file transfer the changes into the root Dockerfile.debian as well!

echo "[INSTALL] Setup NGINX"

# Stop services in case they existed
echo "[INSTALL] Stopping services - if they are running"
service nginx stop
service php8.3-fpm stop


# Remove default NGINX site if it is symlinked, or backup it otherwise
if [ -L /etc/nginx/sites-enabled/default ] ; then
  echo "[INSTALL] Disabling default NGINX site, removing sym-link in /etc/nginx/sites-enabled"
  sudo rm /etc/nginx/sites-enabled/default
elif [ -f /etc/nginx/sites-enabled/default ]; then
  echo "[INSTALL] Disabling default NGINX site, moving config to /etc/nginx/sites-available"
  sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default.bkp_netalertx
fi

# Clear existing directories and files
if [ -d ${WEB_UI_DIR} ]; then
  echo "[INSTALL] Removing existing NetAlertX web-UI"
  sudo rm -R ${WEB_UI_DIR}
fi

# Ubuntu24 (at least) return false for -e, -f, or -d. Only -L works
if [ -L ${NGINX_CONFIG_LINK} ]; then
  echo "[INSTALL] Removing existing NetAlertX NGINX config"
  sudo rm ${NGINX_CONFIG_LINK}
fi

# create symbolic link to the install directory
echo "[INSTALL] Setting up web UI directory to serve from"
ln -s ${BASE_DIR}/front ${WEB_UI_DIR}

# create symbolic link to NGINX configuaration coming with NetAlertX
echo "[INSTALL] Registering NetAlextX server config with NGINX"
sudo ln -s ${BASE_DIR}/install/ubuntu24/${NGINX_CONFIG_FILE} ${NGINX_CONFIG_LINK}

# Use user-supplied port if set
if [ -n "${PORT}" ]; then
  echo "[INSTALL] Setting webserver to user-supplied port (${PORT})"
  sudo sed -i 's/listen 20211/listen '"${PORT}"'/g' ${NGINX_CONFIG_LINK}
fi

# Change web interface address if set
if [ -n "${LISTEN_ADDR}" ]; then
  echo "[INSTALL] Setting webserver to user-supplied address (${LISTEN_ADDR})"
  sed -ie 's/listen /listen '"${LISTEN_ADDR}":'/g' ${NGINX_CONFIG_LINK}
fi

# Run the hardware vendors update at least once
echo "[INSTALL] Run the hardware vendors update"

# Check if ieee-oui.txt or ieee-iab.txt exist
if [ -f "${$OUI_FILE}" ]; then
  echo "[INSTALL] The file ieee-oui.txt exists. Skipping update_vendors.sh..."
else
  echo "[INSTALL] The file ieee-oui.txt does not exist. Running update_vendors..."

  # Run the update_vendors.sh script
  chmod a+x "${BASE_DIR}/back/update_vendors.sh"
  if [ -f "${BASE_DIR}/back/update_vendors.sh" ]; then
    "${BASE_DIR}/back/update_vendors.sh"
  else
    echo "[INSTALL] ❗ ALERT update_vendors.sh script not found in ${BASE_DIR}."
  fi
fi

# Create empty log files
# Create the execution_queue.log file if it doesn't exist
touch "${BASE_DIR}"/front/log/{app.log,execution_queue.log,app_front.log,app.php_errors.log,stderr.log,stdout.log,db_is_locked.log}
mkdir "${BASE_DIR}/api"
touch "${BASE_DIR}/api/user_notifications.json"

echo "[INSTALL] Copy starter ${DB_FILE} and ${CONFIG_FILE} if they don't exist"

# DANGER ZONE: ALWAYS_FRESH_INSTALL 
if [ "$ALWAYS_FRESH_INSTALL" = true ]; then
  echo "[INSTALL] ❗ ALERT /db and /config folders are cleared because the ALWAYS_FRESH_INSTALL is set to: ${ALWAYS_FRESH_INSTALL}❗"
  # Delete content of "/config/"
  rm -rf "${BASE_DIR}/config/"*
  
  # Delete content of "/db/"
  rm -rf "${BASE_DIR}/db/"*
fi

# Copy starter ${DB_FILE} and ${CONFIG_FILE} if they don't exist
cp --update=none "${BASE_DIR}/back/${CONFIG_FILE}" "${BASE_DIR}/config/${CONFIG_FILE}" 
cp --update=none "${BASE_DIR}/back/${DB_FILE}"  "$FILEDB"

# Check if buildtimestamp.txt doesn't exist
if [ ! -f "${BASE_DIR}/front/buildtimestamp.txt" ]; then
    # Create buildtimestamp.txt
    date +%s > "${BASE_DIR}/front/buildtimestamp.txt"
fi

# Fixing file permissions
sudo chown -R www-data:www-data  ${BASE_DIR}

chmod -R a=rwX ${BASE_DIR}
chmod a+x "${BASE_DIR}/back/cron_script.sh"
find . -iname '*.sh' -execdir chmod a+x {} + ;

# start PHP
echo "[INSTALL] Starting services"
service php8.3-fpm start
service nginx start

#  Activate the virtual python environment
source ../myenv/bin/activate

echo "[INSTALL] 🚀 Starting app - navigate to your <server IP>:${PORT}"

# Start the NetAlertX python script
# Note: It will run in the background but output to the current console, so don't expect to work in this TTY ;-)
python ${BASE_DIR}/server/ &
