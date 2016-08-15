#!/usr/bin/env bash
#pm2 start app.js -f -n good_company -x -- --prod

rm .tmp/public/*/*
pm2 stop good_company
pm2 start maintanence.js --name gc-maintanence
git pull
NODE_ENV=production webpack
pm2 stop gc-maintanence
pm2 start app.js -f -n good_company -x -- --prod
