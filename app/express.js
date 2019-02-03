const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const compress = require('compression');
// const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
// const passport = require('passport');
// const strategy = require('ais-auth').strategy;
// const samlStrategy = require('ais-auth').samlStrategy;
const routes = require('./routes/');

// const strategies = require('./passport');
// const error = require('@api/middlewares/error');

function ignoreFavicon(req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({ nope: true });
  } else {
    next();
  }
}

const app = express();

app.use(ignoreFavicon);

// request logging. dev: console | production: file -> replace when we switch to docker
// const logs = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
// app.use(morgan(logs));

// parse body params and attache them to req.body
// TODO: check if 50mb isn't too overkill (it probably is, but we need it for meshes)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// gzip compression
// app.use(compress());

// HTTP verbs such as PUT or DELETE
// app.use(methodOverride());

// auto setting HTTP headers
app.use(helmet());

// enable Cross Origin Resource Sharing
app.use(cors());

// enable authentication
// app.use(passport.initialize());
// passport.use(strategy.create());
// passport.use(samlStrategy.create());
// passport.serializeUser((user, done) => {
//   done(null, user);
// });
// passport.deserializeUser((user, done) => {
//   done(null, user);
// });

// mount api routes
app.use('/v0/', routes);

// catch 404 and forward to error handler
// app.use(error.notFound);

// error handler, send stacktrace only during development
// app.use(error.handler);

app.use('/static', express.static(path.join(__dirname, '../static')))

module.exports = app;
