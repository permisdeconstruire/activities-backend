const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const url = 'mongodb://root:example@localhost:27017'

const listActivities = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => { // <- db as first argument
    const db = client.db('permisdeconstruire')
    const activitiesColl = db.collection('activities');
    return activitiesColl.find().toArray();
  }).then(activities => {
    res.json(activities);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const newActivity = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => { // <- db as first argument
    const db = client.db('permisdeconstruire')
    const activitiesColl = db.collection('activities');
    return activitiesColl.insertOne(req.body);
  }).then(activity => {
    res.json(activity.insertedId);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const editActivity = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => { // <- db as first argument
    const db = client.db('permisdeconstruire')
    const activitiesColl = db.collection('activities');
    return activitiesColl.updateOne({_id: new ObjectID(req.params.id)}, {'$set': req.body});
  }).then(activity => {
    res.json(activity.result);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const deleteActivity = async (req, res) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => { // <- db as first argument
    const db = client.db('permisdeconstruire')
    const activitiesColl = db.collection('activities');
    return activitiesColl.deleteOne({_id: new ObjectID(req.params.id)});
  }).then(activity => {
    res.json(activity.result);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

module.exports = {
  create: router => {
    router.get('/activities', listActivities);
    router.post('/activities', newActivity);
    router.put('/activities/id/:id', editActivity);
    router.delete('/activities/id/:id', deleteActivity);
  },
};
