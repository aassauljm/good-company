#Sailsjs, Sequelize Project

[![Build Status](https://travis-ci.org/joshgagnon/good-company.svg)](https://travis-ci.org/joshgagnon/good-company)


* React support
* ES2015 support
* SASS


sudo add-apt-repository ppa:chris-lea/redis-server
sudo apt-get update
sudo apt-get install redis-server libpq-dev imagemagick ghostscript poppler-utils



install node_4.x


### Set Up
npm install

npm test
npm run test-coverage

npm run build-dev



#server

pm2 start app.js -n good_company -x -- --prod


#run single test
SKIP_SAILS=true _mocha --recursive test  --timeout 25000 -g 'SINGLE TEST STRING' --compilers js:babel-core/register