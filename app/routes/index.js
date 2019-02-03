const router = require('express').Router();
// const authRoutes = require('ais-auth').routes;
// const passport = require('passport');
const activities = require('./activities.js');
// const utils = require('../utils');

// router.all('/api*', passport.authenticate('jwt', { session: false }));
// router.all('/api/ais*', utils.checkBackOfficeLogin);
router.get('/status', (req, res) => {
  res.json({ message: 'API OK' });
});

activities.create(router);

module.exports = router;
