const MongoClient = require('mongodb').MongoClient;

const url = process.env.MONGODB_URL;

function getRole(email) {
  return MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const usersColl = db.collection('users');
      return usersColl.findOne({ email });
    })
    .then(user => {
      if (user) {
        return user.role;
      }
      return 'none';
    })
    .catch(err => {
      console.log(err);
      return 'none';
    });
}

function isRole(req, res, next, role) {
  if (req.user) {
    if (req.user.role === role) {
      next();
    } else {
      res.status(401).json({});
    }
  } else {
    res.status(401).json({});
  }
}

function isPilote(req, res, next) {
  isRole(req, res, next, 'pilote');
}

function isAdmin(req, res, next) {
  isRole(req, res, next, 'copilote');
}

module.exports = {
  getRole,
  isPilote,
  isAdmin,
};
