#!/bin/bash

# This script will install docker on a CentOS / RHEL Linux (such as Predix DevBox).
# Is will also set the docker permissions to allow the user who run this to 
# user docker commands without being root.

# The following command will remove docker from the system if it exists:
# It is saved in this script ifor reference just in case you need to reinstall 
# docker
#
# yum remove docker docker-client docker-client-latest docker-common \
#                  docker-latest docker-latest-logrotate docker-logrotate \
#                  docker-selinux docker-engine-selinux docker-engine


# Check to see if we are running as root; if not exit
uid=$(id | sed 's/^uid=\([0-9][0-9]*\).*/\1/' )
if [ $uid -ne 0 ] ; then
  echo 'you must run setup script as root.  Try:'
  echo "  sudo $0"
  exit 1
fi

# Check to see if you already have docker; if yes exit
$(docker >& /dev/null )
rv=$?
if [ $rv -ne 127 ] ; then
	echo Docker is already installed!  Nothing more to set up.
	exit 0
fi

# This setting causes the script to exit if any errors occur
set -e

# Install Docker
yum -y install docker
systemctl enable docker
systemctl start docker
user_grp=$(groups $(logname) | cut -d : -f 1)
chown root:${user_grp} /var/run/docker.sock

# Or to do the chown with the docker group, use the code below
# groupadd docker
# chown root:docker /var/run/docker.sock
# groupadd docker
# usermod -aG docker $(logname)
# newgrp docker $(logname)
# newgrp $user_grp $(logname)
