const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const url = process.env.MONGODB_URL;

const listForms = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const formsColl = db.collection('forms');
      return formsColl.find().toArray();
    })
    .then(forms => {
      res.json(forms);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

const newForm = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const formsColl = db.collection('forms');
      return formsColl.insertOne(req.body);
    })
    .then(form => {
      res.json(form.insertedId);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

const editForm = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const formsColl = db.collection('forms');
      return formsColl.updateOne(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
      );
    })
    .then(form => {
      res.json(form.result);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

const getForm = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const formsColl = db.collection('forms');
      return formsColl.findOne({ title: req.params.title });
    })
    .then(form => {
      res.json(form);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

const deleteForm = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const formsColl = db.collection('forms');
      return formsColl.deleteOne({ _id: new ObjectID(req.params.id) });
    })
    .then(form => {
      res.json(form.result);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
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
