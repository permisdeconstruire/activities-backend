const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const Auth0Strategy = require('passport-auth0');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const routes = require('./routes/');

function ignoreFavicon(req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({ nope: true });
  } else {
    next();
  }
}

const app = express();

app.use(ignoreFavicon);
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(
  expressSession({
    secret: process.env.EXPRESS_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

const strategyOpts = {};
strategyOpts.jwtFromRequest = ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),
  ExtractJwt.fromUrlQueryParameter('token'),
]);
strategyOpts.secretOrKey = process.env.JWT_SECRET;
strategyOpts.issuer = process.env.JWT_ISSUER;
strategyOpts.audience = process.env.JWT_AUDIENCE;

passport.use(
  new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENTID,
      clientSecret: process.env.AUTH0_CLIENTSECRET,
      callbackURL: '/v0/callback',
    },
    (accessToken, refreshToken, extraParams, profile, done) =>
      done(null, { email: profile.emails[0].value, id: profile.id }),
  ),
);

passport.use(
  new JwtStrategy(strategyOpts, (jwtPayload, done) => done(null, jwtPayload)),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use('/v0/', routes);
app.use('/static', express.static(path.join(__dirname, '../static')));

module.exports = app;
