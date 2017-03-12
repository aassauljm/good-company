#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

git pull
NODE_ENV=production webpack
rm serviceIsLive.flag
pm2 restart gc.prod.config.json --env production
