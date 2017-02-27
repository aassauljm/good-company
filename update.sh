#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

git pull

rm -rf node_modules/good-companies-templates
rm -rf node_modules/json-schemer

npm install
npm update
rm serviceIsLive.flag
pm2 stop gc.prod.config.json
node scripts/migrate.js config/env/production.js
rm .tmp/public/*/*
NODE_ENV=production webpack
pm2 start gc.prod.config.json --env production
