#!/usr/bin/env bash
pm2 stop good-company
pm2 start maintainence.js --name gc-maintainence

sudo -u $1 git pull

sudo -u $1 script

sudo -u $1 NODE_ENV=production webpack

pm2 stop gc-maintainence

pm2 restart good-company