const elasticsearch = require('./elasticsearch');
const agenceMapping = require('./agenceMapping');

const collections = ['pilotes', 'copilotes', 'cooperators'];

const getUserInfo = async (agence, email) => {
  const userInfo = { roles: {} };
  try {
    const userPromises = collections.map(collection =>
      elasticsearch.search(`${agenceMapping[agence].dbPrefix}${collection}`, {
        query: { term: { email } },
      }),
    );
    const users = await Promise.all(userPromises);
    users.forEach(([user], i) => {
      if (typeof user !== 'undefined') {
        const roleName = collections[i].substring(0, collections[i].length - 1);
        userInfo.roles[roleName] = user._id;
        if (roleName === 'pilote') {
          userInfo.pseudo = user.pseudo;
          userInfo.pillar = user.pillar;
          userInfo.level = parseInt(user.level, 10);
        } else if (roleName === 'cooperator') {
          userInfo.titre = user.titre;
        } else {
          userInfo.surnom = `${user.prenom} ${user.nom}`;
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
    if (Object.keys(req.user.roles).indexOf(role) !== -1) {
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

function isCooperator(req, res, next) {
  isRole(req, res, next, 'cooperator');
}

function isAdmin(req, res, next) {
  isRole(req, res, next, 'copilote');
}

const listCooperators = async (req, res) => {
  try {
    const cooperators = await elasticsearch.search(`${agenceMapping[req.agence].dbPrefix}cooperators`, {
      query: { match_all: {} },
    });
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
  isCooperator,
  listCooperators,
};
