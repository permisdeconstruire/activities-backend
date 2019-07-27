const moment = require('moment');
const elasticsearch = require('../utils/elasticsearch');
const event = require('../utils/event');

const listUsers = async (req, res, collection) => {
  try {
    if(typeof(req.query.filter) === 'undefined'){
      const users = await elasticsearch.search(`mongodb_${collection}`, {
        query: { match_all: {} },
      });
      res.json(users);
    } else {
      const users = await elasticsearch.search(`mongodb_${collection}`, req.query.filter);
      res.json(users);
    }
  } catch (err) {
    console.error(JSON.stringify(err, '', 2));
    res.json(500, 'Error');
  }
};

const cooperatorListPilotes = async (req, res) => {
  try {
    let pilotes
    if(typeof(req.query.filter) === 'undefined'){
      pilotes = await elasticsearch.search(`mongodb_pilotes`, {
        query: { match_all: {} },
      });
    } else {
      pilotes = await elasticsearch.search(`mongodb_pilotes`, req.query.filter);

    }
    res.json(
      pilotes
        .map(rPilote => {
          const pilote = {level: rPilote.level, pillar: rPilote.pillar, pseudo: rPilote.pseudo, _id: rPilote._id};
          return pilote;
        })
    )
  } catch (err) {
    console.error(JSON.stringify(err, '', 2));
    res.json(500, 'Error');
  }
};

const newUser = async (req, res, collection) => {
  try {
    if (collection === 'pilotes') {
      const pseudo = `${req.body.prenom} ${req.body.nom}`;
      const fullUser = req.body;
      Object.keys(fullUser)
        .forEach(key => {
          if (key.startsWith('ph_date') || key.startsWith('date')) {
            if (moment(fullUser[key]).isValid()) {
              fullUser[key] = moment(fullUser[key]).format("YYYY-MM-DD");
            } else {
              fullUser[key] = moment('1900-01-01').format("YYYY-MM-DD");
            }
          } else {
            fullUser[key] = fullUser[key];
          }
        });

      const {
        body: { _id },
      } = await elasticsearch.index(`mongodb_${collection}`, {
        ...fullUser,
        pseudo,
      });
      res.json(_id);
    } else if (collection === 'cooperators') {
      const titre = `${req.body.prenom} ${req.body.nom}, ${req.body.fonction}`;
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
    console.error(err);
    res.json(500, 'Error');
  }
};

const editUser = async (req, res, collection) => {
  try {
    const oldUser = await elasticsearch.get(
      `mongodb_${collection}`,
      req.params.id,
    );
    const eventPromises = [];
    Object.keys(req.body).forEach(field => {
      if (typeof oldUser[field] === 'undefined') {
        if (collection === 'pilotes') {
          eventPromises.push(
            event.fire(
              { _id: req.params.id, pseudo: req.body.pseudo },
              { _id: req.user.roles.copilote, email: req.user.email },
              'profileUpdate',
              '',
              {
                field,
                newValue: req.body[field],
              },
            ),
          );
        }
      } else if (oldUser[field].toString() !== req.body[field].toString()) {
        if (collection === 'pilotes') {
          eventPromises.push(
            event.fire(
              { _id: req.params.id, pseudo: req.body.pseudo },
              { _id: req.user.roles.copilote, email: req.user.email },
              'profileUpdate',
              '',
              {
                field,
                oldValue: oldUser[field].toString(),
                newValue: req.body[field].toString(),
              },
            ),
          );
        }
      }
    });
    await Promise.all(eventPromises);

    const fullUser = req.body;
    Object.keys(fullUser)
      .forEach(key => {
        if (key.startsWith('ph_date') || key.startsWith('date')) {
          if (moment(fullUser[key]).isValid()) {
            fullUser[key] = moment(fullUser[key]).format("YYYY-MM-DD");
          } else {
            fullUser[key] = moment('1900-01-01').format("YYYY-MM-DD");
          }
        } else {
          fullUser[key] = fullUser[key];
        }
      });

    if (collection === 'cooperators' && req.body.titre === '') {
      const titre = `${req.body.prenom} ${req.body.nom}, ${req.body.fonction}`;
      const result = await elasticsearch.update(
        `mongodb_${collection}`,
        req.params.id,
        { ...fullUser, titre },
      );
      res.json(result);
    } else if (collection === 'pilotes' && req.body.pseudo === '') {
      const pseudo = `${req.body.prenom} ${req.body.nom}`;
      const result = await elasticsearch.update(
        `mongodb_${collection}`,
        req.params.id,
        { ...fullUser, pseudo },
      );
      res.json(result);
    } else {
      const result = await elasticsearch.update(
        `mongodb_${collection}`,
        req.params.id,
        req.body,
      );
      res.json(result);
    }
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
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
    router.put('/admin/pilotes/id/:id', editPilote);
    router.delete('/admin/pilotes/id/:id', deletePilote);

    router.get('/admin/cooperators', listCooperators);
    router.post('/admin/cooperators', newCooperator);
    router.put('/admin/cooperators/id/:id', editCooperator);
    router.delete('/admin/cooperators/id/:id', deleteCooperator);

    router.get('/admin/users', listUsers);
    router.post('/admin/users', newUser);
    router.put('/admin/users/id/:id', editUser);
    router.delete('/admin/users/id/:id', deleteUser);
  },
};
