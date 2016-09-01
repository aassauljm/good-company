#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

rm .tmp/public/*/*
git pull
pm2 stop good_company
pm2 delete good_company
pm2 start maintenance.js --name gc_maintenance
node scripts/migrate.js config/env/production.js
NODE_ENV=production webpack
pm2 stop gc_maintenance
pm2 delete gc_maintenance
pm2 start app.js -f -n good_company -x -- --prod
#pm2 start good_company
