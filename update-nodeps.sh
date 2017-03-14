#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

git pull

NODE_ENV=production webpack
rm serviceIsLive.flag
pm2 stop gc.prod.config.json
node scripts/migrate.js config/env/production.js
rm .tmp/public/*/*
pm2 start gc.prod.config.json --env production
