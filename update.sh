#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

git pull
npm update
rm serviceIsLive.flag
node scripts/migrate.js config/env/production.js
rm .tmp/public/*/*
NODE_ENV=production webpack
pm2 restart gc.prod.config.json --env production
