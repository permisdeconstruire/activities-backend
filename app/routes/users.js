const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const url = process.env.MONGODB_URL

const listUsers = async (req, res, role) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const usersColl = db.collection('users');
    if(typeof(role) !== 'undefined') {
      return usersColl.find({role}).toArray();
    }
    return usersColl.find().toArray();
  }).then(users => {
    res.json(users);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const newUser = async (req, res, role) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const usersColl = db.collection('users');
    if(typeof(role) !== 'undefined') {
      return usersColl.insertOne({...req.body, role});
    }
    return usersColl.insertOne(req.body);
  }).then(user => {
    res.json(user.insertedId);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const editUser = async (req, res, role) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const usersColl = db.collection('users');
    if(typeof(role) !== 'undefined') {
      return usersColl.updateOne({_id: new ObjectID(req.params.id)}, {'$set': {...req.body, role}});
    }
    return usersColl.updateOne({_id: new ObjectID(req.params.id)}, {'$set': req.body});
  }).then(user => {
    res.json(user.result);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const deleteUser = async (req, res, role) => {
  MongoClient.connect(url, { useNewUrlParser: true })
  .then(client => {
    const db = client.db('permisdeconstruire')
    const usersColl = db.collection('users');
    return usersColl.deleteOne({_id: new ObjectID(req.params.id)});
  }).then(user => {
    res.json(user.result);
  })
  .catch(function (err) {
    console.log(err);
    res.json(500, 'Error');
  })
};

const listPilotes = async (req, res) => {
  listUsers(req, res, 'pilote')
}

const newPilote = async (req, res) => {
  newUser(req, res, 'pilote')
}

const editPilote = async (req, res) => {
  editUser(req, res, 'pilote')
}

const deletePilote = async (req, res) => {
  deleteUser(req, res, 'pilote')
}

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
