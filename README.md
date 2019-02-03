## nodejs base template ##

This project should be used as a base to integrate every usefull framework for code quality and security.

We tried to follow https://12factor.net/.

### What's inside ###

#### Linter ####

We choose [eslint with prettier](https://prettier.io/docs/en/eslint.html) in fix mode with [airbnb](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb) famous config.

Configuration is explicitly linked to `config/eslintrc.yml`

`yarn run lint`

#### Test ####

We choose [mocha](https://mochajs.org/) with [chai](http://www.chaijs.com/)

`test` directory contains spec tests.

`yarn run test`

#### Code coverage ####

We choose [istanbul with nyc mocha](https://istanbul.js.org/docs/tutorials/mocha/) to produce lcov files.

`yarn run test-report`

#### CI ####

Using [husky](https://github.com/typicode/husky/tree/master) lint and test are run before commit and push to add one level of quality.

Using gitlab-ci we run linter, test and report coverage via [sonar-scanner](https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner)

#### Config ####

Configuration is read from environment variable. We use [dotenv](https://www.npmjs.com/package/dotenv) to facilitate the usage.

You can either run `MY_VARIABLE=test node index.js` or set `MY_VARIABLE=test` in `config/env` file.

Of course this file is ignored by git as it can contain sensitive information. Please be careful to not push any copy of your env file renamed in something else.

#### Logger ####

We choose [winston](https://github.com/winstonjs/winston) as logger output in STDOUT with json format in production mode or simple otherwise.

To use the logger, simply add `const logger = require('./app/utils/logger');` you can then log using [levels](https://github.com/winstonjs/winston#using-logging-levels)

#### Runner ####

We choose [pm2](http://pm2.keymetrics.io/) as it cover a huge list of feature for running processes.

`yarn run pm2` give access to pm2.

As a shortcut to common actions :

`yarn run start` to start the app

`yarn run dev` to start the app with live reload on file modification plus logs viewer.

`yarn run logs` to attach to logs
