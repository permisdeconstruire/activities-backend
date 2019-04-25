const ObjectID = require('mongodb').ObjectID;
const mongodb = require('../utils/mongodb');

const collection = 'pedagogy';

const listPedagogy = async (req, res) => {
  try {
    const pedagogy = await mongodb.find(collection);
    res.json(pedagogy);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newPedagogy = async (req, res) => {
  try {
    const { insertedId } = await mongodb.insertOne(collection, req.body);
    res.json(insertedId);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const editPedagogy = async (req, res) => {
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

const deletePedagogy = async (req, res) => {
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
    router.get('/pedagogy', listPedagogy);
    router.post('/admin/pedagogy', newPedagogy);
    router.put('/admin/pedagogy/id/:id', editPedagogy);
    router.delete('/admin/pedagogy/id/:id', deletePedagogy);
  },
};
