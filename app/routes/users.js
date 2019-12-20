const moment = require('moment');
const jwt = require('jsonwebtoken');
const elasticsearch = require('../utils/elasticsearch');
const event = require('../utils/event');

const alreadyExistQuery = ({prenom, nom, ph_datenaissance}) => ({
  query: {
    bool: {
      must: [
        {
          term: {
            prenom,
          },
        },
        {
          term: {
            nom,
          }
        },
        {
          term: {
            ph_datenaissance,
          }
        }
      ]
    }
  }
});

const listUsers = async (req, res, collection) => {
  try {
    if (typeof req.query.filter === 'undefined') {
      const users = await elasticsearch.search(`mongodb_${collection}`, {
        query: { match_all: {} },
      });
      res.json(users);
    } else {
      const users = await elasticsearch.search(
        `mongodb_${collection}`,
        req.query.filter,
      );
      res.json(users);
    }
  } catch (err) {
    console.error(JSON.stringify(err, '', 2));
    res.json(500, 'Error');
  }
};

const cooperatorListPilotes = async (req, res) => {
  try {
    let pilotes;
    if (typeof req.query.filter === 'undefined') {
      pilotes = await elasticsearch.search(`mongodb_pilotes`, {
        query: { match_all: {} },
      });
    } else {
      pilotes = await elasticsearch.search(`mongodb_pilotes`, req.query.filter);
    }
    res.json(
      pilotes.map(rPilote => {
        const pilote = {
          pseudo: rPilote.pseudo,
          _id: rPilote._id,
        };
        return pilote;
      }),
    );
  } catch (err) {
    console.error(JSON.stringify(err, '', 2));
    res.json(500, 'Error');
  }
};

const newUser = async (req, res, collection) => {
  try {
    if (collection === 'pilotes') {
      let pseudo = `${req.body.prenom} ${req.body.nom}`;
      if(req.body.pseudo !== '') {
        pseudo = req.body.pseudo;
      }
      const fullUser = req.body;
      Object.keys(fullUser).forEach(key => {
        if (key.startsWith('ph_date') || key.startsWith('date')) {
          if (moment(fullUser[key]).isValid()) {
            fullUser[key] = moment(fullUser[key]).format('YYYY-MM-DD');
          } else {
            fullUser[key] = moment('1900-01-01').format('YYYY-MM-DD');
          }
        } else {
          fullUser[key] = fullUser[key];
        }
      });
      let alreadyExist = [];
      try {
        alreadyExist = await elasticsearch.search(`mongodb_${collection}`, alreadyExistQuery(fullUser));
      } catch(e) {
      }
      if(alreadyExist.length === 0) {
        const {
          body: { _id },
        } = await elasticsearch.index(`mongodb_${collection}`, {
          ...fullUser,
          pseudo,
        });
        res.json(_id);
      } else {
        throw new Error('PiloteAlreadyExists');
      }
    } else if (collection === 'cooperators') {
      let titre = `${req.body.prenom} ${req.body.nom}, ${req.body.fonction}`;
      if(req.body.titre !== '') {
        titre = req.body.titre;
      }
      const {
        body: { _id },
      } = await elasticsearch.index(`mongodb_${collection}`, {
        ...req.body,
        titre,
      });
      res.json(_id);
    } else {
      const {
        body: { _id },
      } = await elasticsearch.index(`mongodb_${collection}`, req.body);
      res.json(_id);
    }
  } catch (err) {
    if(err.message === 'PiloteAlreadyExists') {
      res.json(500, 'PiloteAlreadyExists');
    } else {
      console.error(err);
      res.json(500, 'Error');
    }
  }
};

const editUser = async (req, res, collection) => {
  try {
    const oldUser = await elasticsearch.get(
      `mongodb_${collection}`,
      req.params.id,
    );

    const fullUser = req.body;
    Object.keys(fullUser).forEach(key => {
      if (key.startsWith('ph_date') || key.startsWith('date')) {
        if (moment(fullUser[key]).isValid()) {
          fullUser[key] = moment(fullUser[key]).format('YYYY-MM-DD');
        } else {
          fullUser[key] = moment('1900-01-01').format('YYYY-MM-DD');
        }
      } else {
        fullUser[key] = fullUser[key];
      }
    });

    if (collection === 'cooperators') {
      if(req.body.titre === '') {
        fullUser.titre = `${req.body.prenom} ${req.body.nom}, ${req.body.fonction}`;
      }
    } else if (collection === 'pilotes') {
      let alreadyExist = [];
      try {
        alreadyExist = await elasticsearch.search(`mongodb_${collection}`, alreadyExistQuery(fullUser));
      } catch(e) {
      }
      if(alreadyExist.length === 0 || (alreadyExist.length === 1 && alreadyExist[0]._id === req.params.id)) {
        const eventPromises = [];
        Object.keys(fullUser).forEach(field => {
          if (typeof oldUser[field] === 'undefined') {
            eventPromises.push(
              event.fire(
                { _id: req.params.id },
                { _id: req.user.roles.copilote, email: req.user.email },
                'profileUpdate',
                '',
                {
                  field,
                  newValue: fullUser[field],
                },
              ),
            );
          } else if (oldUser[field].toString() !== fullUser[field].toString()) {
            eventPromises.push(
              event.fire(
                { _id: req.params.id },
                { _id: req.user.roles.copilote, email: req.user.email },
                'profileUpdate',
                '',
                {
                  field,
                  oldValue: oldUser[field].toString(),
                  newValue: fullUser[field].toString(),
                },
              ),
            );
          }
        });
        await Promise.all(eventPromises);
        if(req.body.pseudo === '') {
          fullUser.pseudo = `${req.body.prenom} ${req.body.nom}`;
        }
      } else {
        throw new Error('PiloteAlreadyExists');
      }
    }

    const result = await elasticsearch.update(
      `mongodb_${collection}`,
      req.params.id,
      fullUser,
    );
    res.json(result);
  } catch (err) {
    if(err.message === 'PiloteAlreadyExists') {
      res.json(500, 'PiloteAlreadyExists');
    } else {
      console.error(err);
      if(typeof(err.meta) !== 'undefined') {
        console.log(err.meta.body.error);
      }
      res.json(500, 'Error');
    }
  }
};

const deleteUser = async (req, res, collection) => {
  try {
    const result = await elasticsearch.delete(
      `mongodb_${collection}`,
      req.params.id,
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const impersonateCooperator = async(req, res) => {
  try {
    const tokenOptions = {};
    tokenOptions.issuer = process.env.JWT_ISSUER;
    tokenOptions.audience = process.env.JWT_AUDIENCE;
    tokenOptions.expiresIn = process.env.JWT_TTL;
    const cooperator = await elasticsearch.get(
      'mongodb_cooperators',
      req.params.id,
    );
    const token = encodeURIComponent(jwt.sign({email: cooperator.email, id: 'impersonate'}, process.env.JWT_SECRET, tokenOptions))
    res.redirect(`https://cooperateur.pdc.bug.builders/?token=${token}`);
  } catch(err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const getPilote = async (req, res) => {
  try {
    const {pillar, level} = await elasticsearch.get(`mongodb_pilotes`, req.params.id);
    const objectives = await elasticsearch.search('mongodb_pedagogy', {
      query: {
        bool: {
          must: [
            {
              term: {
                pillar,
              },
            },
            {
              term: {
                level,
              }
            }
          ]
        }
      }
    });

    const evaluated = await elasticsearch.search('pdc', {
      query: {
        bool: {
          must: [
            {
              term: {
                type: 'evaluation',
              },
            },
            {
              term: {
                'data.activity.status': pillar,
              }
            },
            {
              term: {
                'data.activity.level': level,
              }
            },
            {
              term: {
                'pilote._id': req.params.id,
              }
            }
          ]
        }
      }
    })
    res.json({evaluated: evaluated.map(e => ({objective: e.data.objective, evaluation: e.data.evaluation})), objectives});
  } catch(err) {
    console.error(err);
    res.json({evaluated: [], objectives: []});
  }
}

const listPilotes = async (req, res) => {
  listUsers(req, res, 'pilotes');
};

const newPilote = async (req, res) => {
  newUser(req, res, 'pilotes');
};

const editPilote = async (req, res) => {
  editUser(req, res, 'pilotes');
};

const deletePilote = async (req, res) => {
  deleteUser(req, res, 'pilotes');
};

const listCooperators = async (req, res) => {
  listUsers(req, res, 'cooperators');
};

const newCooperator = async (req, res) => {
  newUser(req, res, 'cooperators');
};

const editCooperator = async (req, res) => {
  editUser(req, res, 'cooperators');
};

const deleteCooperator = async (req, res) => {
  deleteUser(req, res, 'cooperators');
};

module.exports = {
  create: router => {
    router.get('/admin/pilotes', listPilotes);
    router.get('/cooperator/pilotes', cooperatorListPilotes);
    router.post('/admin/pilotes', newPilote);
    router.get('/admin/pilotes/id/:id', getPilote);
    router.put('/admin/pilotes/id/:id', editPilote);
    router.delete('/admin/pilotes/id/:id', deletePilote);

    router.get('/admin/cooperators', listCooperators);
    router.post('/admin/cooperators', newCooperator);
    router.put('/admin/cooperators/id/:id', editCooperator);
    router.delete('/admin/cooperators/id/:id', deleteCooperator);
    router.get('/admin/cooperators/id/:id', impersonateCooperator);

    router.get('/admin/users', listUsers);
    router.post('/admin/users', newUser);
    router.put('/admin/users/id/:id', editUser);
    router.delete('/admin/users/id/:id', deleteUser);
  },
};
