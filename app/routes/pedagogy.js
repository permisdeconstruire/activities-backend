const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const url = process.env.MONGODB_URL

const listPedagogy = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const pedagogyColl = db.collection('pedagogy');
    return pedagogyColl.find().toArray();
  }).then(pedagogy => {
    res.json(pedagogy);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const newPedagogy = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const pedagogyColl = db.collection('pedagogy');
    return pedagogyColl.insertOne(req.body);
  }).then(pedagogy => {
    res.json(pedagogy.insertedId);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const editPedagogy = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const pedagogyColl = db.collection('pedagogy');
    return pedagogyColl.updateOne({_id: new ObjectID(req.params.id)}, {'$set': req.body});
  }).then(pedagogy => {
    res.json(pedagogy.result);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const deletePedagogy = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const pedagogyColl = db.collection('pedagogy');
    return pedagogyColl.deleteOne({_id: new ObjectID(req.params.id)});
  }).then(pedagogy => {
    res.json(pedagogy.result);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

module.exports = {
  create: router => {
    router.get('/pedagogy', listPedagogy);
    router.post('/admin/pedagogy', newPedagogy);
    router.put('/admin/pedagogy/id/:id', editPedagogy);
    router.delete('/admin/pedagogy/id/:id', deletePedagogy);
  },
};
