const mongodb = require('./mongodb');

const collections = ['pilotes', 'copilotes', 'cooperators'];

const getUserInfo = async email => {
  const userInfo = { roles: [] };
  try {
    const userPromises = collections.map(collection =>
      mongodb.findOne(collection, { email }),
    );
    const users = await Promise.all(userPromises);
    users.forEach((user, i) => {
      if (user !== null) {
        userInfo.roles.push(
          collections[i].substring(0, collections[i].length - 1),
        );
        if (collections[i] === 'pilotes') {
          userInfo.levels = user.levels;
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
  return userInfo;
};

function isRole(req, res, next, role) {
  if (req.user) {
    if (req.user.roles.indexOf(role) !== -1) {
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

const listCooperators = async (req, res) => {
  try {
    const cooperators = await mongodb.find('cooperators');
    res.json(cooperators);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

module.exports = {
  getUserInfo,
  isPilote,
  isAdmin,
  listCooperators,
};
