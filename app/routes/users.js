const ObjectID = require('mongodb').ObjectID;
const mongodb = require('../utils/mongodb');
const event = require('../utils/event');

const listUsers = async (req, res, collection) => {
  try {
    const users = await mongodb.find(collection);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newUser = async (req, res, collection) => {
  try {
    const { insertedId } = await mongodb.insertOne(collection, req.body);
    res.json(insertedId);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const editUser = async (req, res, collection) => {
  try {
    const oldUser = await mongodb.findOne(collection, {
      _id: new ObjectID(req.params.id),
    });
    const eventPromises = [];
    Object.keys(req.body).forEach(field => {
      if (typeof oldUser[field] === 'undefined') {
        eventPromises.push(
          event.fire(req.body.email, 'profileUpdate', '', {
            field,
            newValue: req.body[field],
          }),
        );
      } else if (oldUser[field] !== req.body[field]) {
        eventPromises.push(
          event.fire(req.body.email, 'profileUpdate', '', {
            field,
            oldValue: oldUser[field],
            newValue: req.body[field],
          }),
        );
      }
    });
    await Promise.all(eventPromises);
    const { result } = await mongodb.updateOne(
      collection,
      { _id: new ObjectID(req.params.id) },
      { $set: req.body },
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const deleteUser = async (req, res, collection) => {
  try {
    const { result } = mongodb.deleteOne(collection, {
      _id: new ObjectID(req.params.id),
    });
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

module.exports = {
  create: router => {
    router.get('/admin/pilotes', listPilotes);
    router.post('/admin/pilotes', newPilote);
    router.put('/admin/pilotes/id/:id', editPilote);
    router.delete('/admin/pilotes/id/:id', deletePilote);

    router.get('/admin/users', listUsers);
    router.post('/admin/users', newUser);
    router.put('/admin/users/id/:id', editUser);
    router.delete('/admin/users/id/:id', deleteUser);
  },
};
