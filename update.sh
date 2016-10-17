#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

rm .tmp/public/*/*
git pull
pm2 stop gc.prod.config.json && pm2 start maintenance.config.json
npm update
node scripts/migrate.js config/env/production.js
NODE_ENV=production webpack
pm2 stop maintenance.config.json && pm2 start gc.prod.config.json --env production
