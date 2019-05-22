const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const mongodb = require('../utils/mongodb');
const event = require('../utils/event');
const screenshot = require('../utils/screenshot');

const collection = 'activities';

const listActivities = async () => {
  const activities = await mongodb.find(collection);
  activities.sort((a, b) => {
    if (moment(a.start).isBefore(moment(b.start))) {
      return 1;
    }
    return -1;
  });
  return activities;
};

const adminListActivities = async (req, res) => {
  try {
    const activities = await listActivities();
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const piloteListActivities = async (req, res) => {
  try {
    const activities = await listActivities();
    res.json(
      activities
        .filter(activity => activity.published)
        .map(activity => {
          const newActivity = activity;
          if (typeof newActivity.participants !== 'undefined') {
            newActivity.participants = newActivity.participants.map(
              participant => {
                const newParticipant = participant;
                delete newParticipant.pedagogy;
                return newParticipant;
              },
            );
          }

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

const publicDownloadActivities = async (req, res) => {
  try {
    const agenda = await screenshot();
    res.download(agenda);
  } catch (e) {
    console.log(e);
    res.json(500, 'Error');
  }
};

const publicListActivities = async (req, res) => {
  try {
    const activities = await listActivities();
    res.json(
      activities
        .filter(activity => activity.published)
        .map(activity => {
          const newActivity = activity;
          delete newActivity.cost;
          delete newActivity.estimated;
          delete newActivity.participants;
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

const adminRegisterActivity = async(req, res) => {
  try{
    const result = await registerActivity(req.params.id, req.body.pilote, {action: req.body.action, justification: '', pedagogy: []}, { _id: req.user.roles.copilote, email: req.user.email });
    res.json(result)
  } catch(err) {
    console.error(err);
    res.json(500, 'Error');
  }
}

const piloteRegisterActivity = async(req, res) => {
  try{
    const result = await registerActivity(req.params.id, {_id: req.user.roles.pilote, pseudo: req.user.pseudo}, req.body);
    res.json(result)
  } catch(err) {
    console.error(err);
    res.json(500, 'Error');
  }
}

const registerActivity = async (activityId, pilote, body, who = {_id: 'application'}) => {
  const activity = await mongodb.findOne(collection, {
    _id: new ObjectID(activityId),
  });
  if (typeof activity.participants === 'undefined') {
    activity.participants = [];
  }

  if (
    ['Fermeture', 'Autonomie', 'Individuelle'].indexOf(activity.status) === -1
  ) {
    const participantIndex = activity.participants.findIndex(
      participant => participant._id === pilote._id,
    );
    if (body.action === 'register') {
      if (participantIndex === -1) {
        activity.participants.push({
          _id: pilote._id,
          pseudo: pilote.pseudo,
          pedagogy: body.pedagogy,
        });
      }
      await event.fire(
        { _id: pilote._id, pseudo: pilote.pseudo },
        who,
        'activity',
        '',
        {
          activity,
          subType: 'register',
        },
      );
    } else {
      if (participantIndex !== -1) {
        activity.participants.splice(participantIndex, 1);
      }
      await event.fire(
        { _id: pilote._id, pseudo: pilote.pseudo },
        who,
        'activity',
        body.justification,
        { activity, subType: 'unregister' },
      );
    }
    const { result } = await mongodb.updateOne(
      collection,
      { _id: new ObjectID(activityId) },
      { $set: activity },
    );
    return result;
  } else {
    throw new Error("Impossible");
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { result } = await mongodb.deleteOne(collection, {
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
    router.get('/activities.pdf', publicDownloadActivities);
    router.get('/activities', publicListActivities);
    router.get('/pilote/activities', piloteListActivities);
    router.get('/admin/activities', adminListActivities);
    router.post('/admin/activities', newActivity);
    router.put('/admin/activities/id/:id', editActivity);
    router.put('/pilote/activities/id/:id', piloteRegisterActivity);
    router.put('/admin/activities/id/:id/pilote', adminRegisterActivity);
    router.delete('/admin/activities/id/:id', deleteActivity);
  },
};
