#!/bin/bash
sleep 3
#unmount and remount usb drive
umount -f /media/pi/AVS
sleep .5
su pi -c "mount /media/pi/AVS"
sleep .5

su pi -c "cd /home/pi/timelapse/ && /usr/bin/node /home/pi/timelapse/app.js >> /media/pi/AVS/timelapse_log.txt"
