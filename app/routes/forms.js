const ObjectID = require('mongodb').ObjectID;
const mongodb = require('../utils/mongodb');

const collection = 'forms';

const listForms = async (req, res) => {
  try {
    const forms = await mongodb.find(collection);
    res.json(forms);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newForm = async (req, res) => {
  try {
    const { insertedId } = await mongodb.insertOne(collection, req.body);
    res.json(insertedId);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const editForm = async (req, res) => {
  try {
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

const getForm = async (req, res) => {
  try {
    const form = await mongodb.findOne(collection, { title: req.params.title });
    res.json(form);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const deleteForm = async (req, res) => {
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

module.exports = {
  create: router => {
    router.get('/admin/forms', listForms);
    router.post('/admin/forms', newForm);
    router.put('/admin/forms/id/:id', editForm);
    router.get('/forms/title/:title', getForm);
    router.delete('/admin/forms/id/:id', deleteForm);
  },
};
