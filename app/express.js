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
const roles = require('./utils/roles');
const routes = require('./routes/');

function agenceSelector(req, res, next) {
  req.agence = req.header('X-pdc-agence') || 'nantes';
  next();
}

function ignoreFavicon(req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({ nope: true });
  } else {
    next();
  }
}

const app = express();

app.use(agenceSelector);
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
      proxy: process.env.BEHIND_PROXY === 'true',
    },
    (accessToken, refreshToken, extraParams, profile, done) =>
      done(null, { email: profile.emails[0].value, id: profile.id }),
  ),
);

passport.use(
  new JwtStrategy({...strategyOpts, passReqToCallback: true}, async (req, jwtPayload, done) => {
    const userInfo = await roles.getUserInfo(req.agence, jwtPayload.email);
    done(null, { ...jwtPayload, ...userInfo });
  }),
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
