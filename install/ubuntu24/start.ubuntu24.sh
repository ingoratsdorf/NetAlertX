#!/usr/bin/env bash

echo "---------------------------------------------------------"
echo "[INSTALL]                           Run start.ubuntu24.sh"
echo "---------------------------------------------------------"


INSTALL_DIR=/app  # Specify the installation directory here

# DO NOT CHANGE ANYTHING BELOW THIS LINE!
CONF_FILE=app.conf
DB_FILE=app.db
NGINX_CONF_FILE=netalertx.ubuntu24.conf
WEB_UI_DIR=/var/www/html/netalertx
NGINX_CONFIG_FILE=/etc/nginx/conf.d/$NGINX_CONF_FILE
OUI_FILE="/usr/share/arp-scan/ieee-oui.txt" # Define the path to ieee-oui.txt and ieee-iab.txt
INSTALL_PATH=$INSTALL_DIR
FILEDB=$INSTALL_PATH/db/$DB_FILE
# DO NOT CHANGE ANYTHING ABOVE THIS LINE!

# if custom variables not set we do not need to do anything
if [ -n "${TZ}" ]; then    
  FILECONF=$INSTALL_PATH/config/$CONF_FILE 
  if [ -f "$FILECONF" ]; then
    sed -ie "s|Europe/Berlin|${TZ}|g" $INSTALL_PATH/config/$CONF_FILE 
  else 
    sed -ie "s|Europe/Berlin|${TZ}|g" $INSTALL_PATH/back/$CONF_FILE.bak 
  fi
fi

# Check if script is run as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root. Please use 'sudo'." 
    exit 1
fi

# Run setup scripts
echo "[INSTALL] Run setup scripts"

"${INSTALL_PATH}/install/ubuntu24/user-mapping.ubuntu24.sh"
"${INSTALL_PATH}/install/ubuntu24/install_dependencies.ubuntu24.sh" # if modifying this file transfer the changes into the root Dockerfile.debian as well!

echo "[INSTALL] Setup NGINX"

# Stop services in case they existed
echo Stopping services
/etc/init.d/php8.3-fpm stop
/etc/init.d/nginx stop

# Remove default NGINX site if it is symlinked, or backup it otherwise
if [ -L /etc/nginx/sites-enabled/default ] ; then
  echo "Disabling default NGINX site, removing sym-link in /etc/nginx/sites-enabled"
  sudo rm /etc/nginx/sites-enabled/default
elif [ -f /etc/nginx/sites-enabled/default ]; then
  echo "Disabling default NGINX site, moving config to /etc/nginx/sites-available"
  sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default.bkp_netalertx
fi

# Clear existing directories and files
if [ -d $WEB_UI_DIR ]; then
  echo "Removing existing NetAlertX web-UI"
  sudo rm -R $WEB_UI_DIR
fi

# Ubuntu24 (at least) return false for -e, -f, or -d. Only -L works
if [ -L $NGINX_CONFIG_FILE ]; then
  echo "Removing existing NetAlertX NGINX config"
  sudo rm $NGINX_CONFIG_FILE
fi

# create symbolic link to the install directory
echo "Setting up web UI directory to server from"
ln -s $INSTALL_PATH/front $WEB_UI_DIR

# create symbolic link to NGINX configuaration coming with NetAlertX
echo "Registering NetAlextX server config with NGINX"
sudo ln -s ${INSTALL_PATH}/install/ubuntu24/$NGINX_CONF_FILE $NGINX_CONFIG_FILE

# Use user-supplied port if set
if [ -n "${PORT}" ]; then
  echo "Setting webserver to user-supplied port ($PORT)"
  sudo sed -i 's/listen 20211/listen '"$PORT"'/g' $NGINX_CONFIG_FILE
fi

# Change web interface address if set
if [ -n "${LISTEN_ADDR}" ]; then
  echo "Setting webserver to user-supplied address (${LISTEN_ADDR})"
  sed -ie 's/listen /listen '"${LISTEN_ADDR}":'/g' $NGINX_CONFIG_FILE
fi

# Run the hardware vendors update at least once
echo "[INSTALL] Run the hardware vendors update"

# Check if ieee-oui.txt or ieee-iab.txt exist
if [ -f "$OUI_FILE" ]; then
  echo "The file ieee-oui.txt exists. Skipping update_vendors.sh..."
else
  echo "The file ieee-oui.txt does not exist. Running update_vendors..."

  # Run the update_vendors.sh script
  if [ -f "${INSTALL_PATH}/back/update_vendors.sh" ]; then
    "${INSTALL_PATH}/back/update_vendors.sh"
  else
    echo "update_vendors.sh script not found in $INSTALL_DIR."
  fi
fi

# Create an empty log files

# Create the execution_queue.log file if it doesn't exist
touch "${INSTALL_DIR}"/front/log/{app.log,execution_queue.log,app_front.log,app.php_errors.log,stderr.log,stdout.log,db_is_locked.log}
touch "${INSTALL_DIR}"/api/{user_notifications.json}

echo "[INSTALL] Copy starter $DB_FILE and $CONF_FILE if they don't exist"

# DANGER ZONE: ALWAYS_FRESH_INSTALL 
if [ "$ALWAYS_FRESH_INSTALL" = true ]; then
  echo "[INSTALL] ❗ ALERT /db and /config folders are cleared because the ALWAYS_FRESH_INSTALL is set to: ${ALWAYS_FRESH_INSTALL}❗"
  # Delete content of "/config/"
  rm -rf "${INSTALL_PATH}/config/"*
  
  # Delete content of "/db/"
  rm -rf "${INSTALL_PATH}/db/"*
fi

# Copy starter $DB_FILE and $CONF_FILE if they don't exist
cp --update=none "${INSTALL_PATH}/back/$CONF_FILE" "${INSTALL_PATH}/config/$CONF_FILE" 
cp --update=none "${INSTALL_PATH}/back/$DB_FILE"  "$FILEDB"

# Check if buildtimestamp.txt doesn't exist
if [ ! -f "${INSTALL_PATH}/front/buildtimestamp.txt" ]; then
    # Create buildtimestamp.txt
    date +%s > "${INSTALL_PATH}/front/buildtimestamp.txt"
fi

# Fixing file permissions
sudo chown -R www-data:www-data  $INSTALL_PATH
chmod -R a=rwX $INSTALL_DIR


# start PHP
/etc/init.d/php8.3-fpm start
/etc/init.d/nginx start

#  Activate the virtual python environment
source ../myenv/bin/activate

echo "[INSTALL] 🚀 Starting app - navigate to your <server IP>:${PORT}"

# Start the NetAlertX python script
python $INSTALL_PATH/server/ &
