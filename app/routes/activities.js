const ObjectID = require('mongodb').ObjectID;
const mongodb = require('../utils/mongodb');
const event = require('../utils/event');

const collection = 'activities';

const adminListActivities = async (req, res) => {
  try {
    const activities = await mongodb.find(collection);
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const listActivities = async (req, res) => {
  try {
    const activities = await mongodb.find(collection);
    res.json(
      activities
        .filter(activity => activity.published)
        .map(activity => {
          const newActivity = activity;
          delete newActivity.cost;
          delete newActivity.estimated;
          return newActivity;
        }),
    );
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newActivity = async (req, res) => {
  try {
    const { insertedId } = await mongodb.insertOne(collection, req.body);
    res.json(insertedId);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const editActivity = async (req, res) => {
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

const registerActivity = async (req, res) => {
  try {
    const activity = await mongodb.findOne(collection, {
      _id: new ObjectID(req.params.id),
    });
    if (typeof activity.participants === 'undefined') {
      activity.participants = [];
    }
    if (req.body.action === 'register') {
      await event.fire(req.user.email, 'application', 'activity', '', {
        ...activity,
        subType: 'register',
      });
      if (activity.participants.indexOf(req.user.email) === -1) {
        activity.participants.push(req.user.email);
      }
    } else {
      await event.fire(
        req.user.email,
        'application',
        'activity',
        req.body.justification,
        { ...activity, subType: 'unregister' },
      );
      const participantIndex = activity.participants.indexOf(req.user.email);
      activity.participants.splice(participantIndex, 1);
    }

    const { result } = await mongodb.updateOne(
      collection,
      { _id: new ObjectID(req.params.id) },
      { $set: activity },
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const deleteActivity = async (req, res) => {
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
    router.get('/activities', listActivities);
    router.get('/admin/activities', adminListActivities);
    router.post('/admin/activities', newActivity);
    router.put('/admin/activities/id/:id', editActivity);
    router.put('/pilote/activities/id/:id', registerActivity);
    router.delete('/admin/activities/id/:id', deleteActivity);
  },
};
