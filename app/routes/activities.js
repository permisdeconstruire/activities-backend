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

const cooperatorListActivities = async(req, res) => {
  try {
    const activities = await listActivities();
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
}

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

const evaluateActivity = async(req, res) => {
  const activity = await mongodb.findOne(collection, {
    _id: new ObjectID(req.params.id),
  });

  if (
    ['Fermeture', 'Autonomie'].indexOf(activity.status) === -1
  ) {
    if(req.body.missed === true) {
      await event.fire(
        {_id: req.body.pilote._id, pseudo: req.body.pilote.pseudo},
        { _id: req.user.roles.cooperator, titre: req.user.titre },
        'activity',
        '',
        {
          activity,
          subType: 'missed',
        },
        {date: activity.end, forgeId: `${req.body.pilote._id}_${req.params.id}_${activity.theme}_${activity.title}_${activity.end}`}
      )
    } else {
      await event.fire(
        {_id: req.body.pilote._id, pseudo: req.body.pilote.pseudo},
        { _id: req.user.roles.cooperator, titre: req.user.titre },
        'evaluation',
        req.body.comment,
        {...req.body.data, activity},
        {date: activity.end, forgeId: `${req.body.pilote._id}_${req.params.id}_${req.body.data.objective}_${activity.theme}_${activity.title}_${activity.end}`}
      )

      await event.fire(
        {_id: req.body.pilote._id, pseudo: req.body.pilote.pseudo},
        { _id: req.user.roles.cooperator, titre: req.user.titre },
        'activity',
        '',
        {
          activity,
          subType: 'done',
        },
        {date: activity.end, forgeId: `${req.body.pilote._id}_${req.params.id}_${activity.theme}_${activity.title}_${activity.end}`}
      )
    }
    res.json('Ok');
  } else {
    res.json(403, 'Impossible');
  }
  res.json({})
}

const registerActivity = async (activityId, pilote, body, who = {_id: 'application'}) => {
  const activity = await mongodb.findOne(collection, {
    _id: new ObjectID(activityId),
  });
  if (typeof activity.participants === 'undefined') {
    activity.participants = [];
  }

  const forbidden = ['Fermeture', 'Autonomie']
  if(who._id === 'application') {
    forbidden.push('Individuelle');
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
    router.get('/cooperator/activities', cooperatorListActivities);
    router.put('/cooperator/activities/id/:id', evaluateActivity);

    router.get('/admin/activities', adminListActivities);
    router.post('/admin/activities', newActivity);
    router.put('/admin/activities/id/:id', editActivity);
    router.put('/pilote/activities/id/:id', piloteRegisterActivity);
    router.put('/admin/activities/id/:id/pilote', adminRegisterActivity);
    router.delete('/admin/activities/id/:id', deleteActivity);
  },
};
