#!/usr/bin/env bash

echo "---------------------------------------------------------"
echo "[INSTALL]            Run install_dependencies.ubuntu24.sh"
echo "---------------------------------------------------------"

# ❗ IMPORTANT - if you modify this file modify the root Dockerfile as well ❗

# Check if script is run as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root. Please use 'sudo'." 
    exit 1
fi

# Install dependencies
apt install -y \
    tini snmp ca-certificates curl libwww-perl arp-scan perl apt-utils cron sudo \
    libssl-dev libffi-dev openssl sqlite3 dnsutils net-tools \
    nginx php8.3-fpm php8.3 mtr php-cli php8.3-sqlite3 php-sqlite3 php-cgi php-curl \
    python3 python3-dev iproute2 nmap python3-pip zip usbutils traceroute nbtscan build-essential

sudo phpenmod -v 8.3 sqlite3 

# setup virtual python environment so we can use pip3 to install packages
apt -y install python3-venv
python3 -m venv ../myenv
source ../myenv/bin/activate

update-alternatives --install /usr/bin/python python /usr/bin/python3 10

#  install packages thru pip3
pip3 install graphene flask netifaces tplink-omada-client pycryptodome requests paho-mqtt scapy cron-converter pytz json2table dhcp-leases pyunifi speedtest-cli chardet python-nmap dnspython librouteros

