#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

rm .tmp/public/*/*
git pull
pm2 stop gc.config.json --only good-company && pm2 start gc.config.json --only maintenance
node scripts/migrate.js config/env/production.js
NODE_ENV=production webpack
pm2 stop gc.config.json --only maintenance && pm2 start gc.config.json --only good-company
pm2 gracefulRestart gc.config.json --only workers
