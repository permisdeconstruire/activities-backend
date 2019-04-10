const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const url = process.env.MONGODB_URL;

const adminListActivities = async (req, res) => {
  try {
    const activities = await listActivitiesDb();
    res.json(activities);
  } catch(err) {
    console.log(err);
    res.json(500, 'Error');
  }
};

const listActivities = async (req, res) => {
  try {
    const activities = await listActivitiesDb();
    res.json(activities
      .filter(activity => activity.published)
      .map(activity => {
        const newActivity = activity;
        delete newActivity.cost;
        delete newActivity.estimated;
        return newActivity;
    }))
  } catch(err) {
    console.log(err);
    res.json(500, 'Error');
  }
};

const listActivitiesDb = async () => {
  return MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const activitiesColl = db.collection('activities');
      return activitiesColl.find().toArray();
    })
};

const newActivity = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const activitiesColl = db.collection('activities');
      return activitiesColl.insertOne(req.body);
    })
    .then(activity => {
      res.json(activity.insertedId);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

const editActivity = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const activitiesColl = db.collection('activities');
      return activitiesColl.updateOne(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
      );
    })
    .then(activity => {
      res.json(activity.result);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

const registerActivity = async (req, res) => {
  let activitiesColl;
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      activitiesColl = db.collection('activities');
      return activitiesColl.findOne({ _id: new ObjectID(req.params.id) });
    })
    .then(rActivity => {
      const activity = rActivity;
      if (typeof activity.participants === 'undefined') {
        activity.participants = [];
      }
      if (req.body.action === 'register') {
        if (activity.participants.indexOf(req.user.email) === -1) {
          activity.participants.push(req.user.email);
        }
      } else {
        const participantIndex = activity.participants.indexOf(req.user.email);
        activity.participants.splice(participantIndex, 1);
      }

      return activitiesColl.updateOne(
        { _id: new ObjectID(req.params.id) },
        { $set: activity },
      );
    })
    .then(activity => {
      res.json(activity.result);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

const deleteActivity = async (req, res) => {
  MongoClient.connect(
    url,
    { useNewUrlParser: true },
  )
    .then(client => {
      const db = client.db('permisdeconstruire');
      const activitiesColl = db.collection('activities');
      return activitiesColl.deleteOne({ _id: new ObjectID(req.params.id) });
    })
    .then(activity => {
      res.json(activity.result);
    })
    .catch(err => {
      console.log(err);
      res.json(500, 'Error');
    });
};

module.exports = {
  create: router => {
    router.get('/activities', listActivities);
    router.get('/admin/activities', adminListActivities);
    router.post('/admin/activities', newActivity);
    router.put('/admin/activities/id/:id', editActivity);
    router.put('/pilote/activities/id/:id', registerActivity);
    router.delete('/admin/activities/id/:id', deleteActivity);
  },
};
