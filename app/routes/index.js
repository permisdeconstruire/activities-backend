const jwt = require('jsonwebtoken');
const passport = require('passport');
const router = require('express').Router();
const activities = require('./activities');
const forms = require('./forms');
const users = require('./users');
const pedagogy = require('./pedagogy');
const events = require('./events');
const roles = require('../utils/roles');

const tokenOptions = {};
tokenOptions.issuer = process.env.JWT_ISSUER;
tokenOptions.audience = process.env.JWT_AUDIENCE;
tokenOptions.expiresIn = process.env.JWT_TTL;

router.get('/callback', (req, res, next) => {
  passport.authenticate('auth0', (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/v0/login');
    }
    return req.logIn(user, err2 => {
      if (err2) {
        return next(err2);
      }
      return res.redirect(
        `${req.session.returnTo}/?token=${encodeURIComponent(
          jwt.sign(user, process.env.JWT_SECRET, tokenOptions),
        )}`,
      );
    });
  })(req, res, next);
});

function saveOrigin(req, res, next) {
  req.session.returnTo = req.header('Referer');
  next();
}

router.all('/undefined', (req, res) => {
  res.type('text/html');
  res.status(200);
  res.send('<script>window.history.go(-4);</script>');
});

router.get(
  '/login',
  saveOrigin,
  passport.authenticate('auth0', { scope: 'openid email profile' }),
);

router.all(
  '/pilote/*',
  passport.authenticate('jwt', { session: false }),
  roles.isPilote,
);

router.all(
  '/admin/*',
  passport.authenticate('jwt', { session: false }),
  roles.isAdmin,
);

router.all(
  '/cooperator/*',
  passport.authenticate('jwt', { session: false }),
  roles.isCooperator,
);

router.get(
  '/whoami',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  },
);

router.get(
  '/admin/options',
  passport.authenticate('jwt', { session: false }),
  roles.isAdmin,
  (req, res) => {
    res.json({
      kibana: process.env.PDC_KIBANA_DASHBOARD_LINK,
    });
  },
);

router.get('/status', (req, res) => {
  res.json({ message: 'API OK' });
});

router.get('/cooperators', roles.listCooperators);

activities.create(router);
forms.create(router);
users.create(router);
pedagogy.create(router);
events.create(router);

module.exports = router;
