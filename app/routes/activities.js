const moment = require('moment');
const event = require('../utils/event');
const screenshot = require('../utils/screenshot');
const elasticsearch = require('../utils/elasticsearch');

const collection = 'activities';

const listActivities = async () => {
  const activities = await elasticsearch.search(`mongodb_${collection}`, {
    query: { match_all: {} },
  });
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

const cooperatorListActivities = async (req, res) => {
  try {
    const activities = await listActivities();
    res.json(
      activities
        .filter(activity => activity.published)
        .map(rActivity => {
          const activity = rActivity;
          delete activity.cost;
          delete activity.estimated;
          return activity;
        }),
    );
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
        .map(rActivity => {
          const activity = rActivity;
          if (typeof activity.participants !== 'undefined') {
            activity.participants = activity.participants.map(participant => {
              const newParticipant = participant;
              delete newParticipant.pedagogy;
              return newParticipant;
            });
          }

          delete activity.cost;
          delete activity.estimated;
          return activity;
        }),
    );
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const publicDownloadActivities = async (req, res) => {
  try {
    if(req.query.token) {
      const agenda = await screenshot(`https://pilote.pdc.bug.builders/?token=${req.query.token}`);
      res.download(agenda);
    } else {
      const agenda = await screenshot();
      res.download(agenda);
    }

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
        .map(rActivity => {
          const activity = rActivity;
          delete activity.cost;
          delete activity.estimated;
          delete activity.participants;
          return activity;
        }),
    );
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newActivity = async (req, res) => {
  try {
    const {
      body: { _id },
    } = await elasticsearch.index(`mongodb_${collection}`, { ...req.body });
    res.json(_id);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const editActivity = async (req, res) => {
  try {
    const result = await elasticsearch.update(
      `mongodb_${collection}`,
      req.params.id,
      { ...req.body },
    );
    res.json(result);
  } catch (err) {
    console.error(JSON.stringify(err, '', 2));
    res.json(500, 'Error');
  }
};

const registerActivity = async (
  activityId,
  pilote,
  body,
  who = { _id: 'application' },
) => {
  const activity = await elasticsearch.get(`mongodb_${collection}`, activityId);
  if (typeof activity.participants === 'undefined') {
    activity.participants = [];
  }

  const forbidden = ['Fermeture', 'Autonomie'];
  if (who._id === 'application') {
    forbidden.push('Individuelle');
  }
  if (forbidden.indexOf(activity.status) === -1) {
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
    const result = await elasticsearch.update(
      `mongodb_${collection}`,
      activityId,
      activity,
    );
    return result;
  }
  throw new Error('Impossible');
};

const adminRegisterActivity = async (req, res) => {
  try {
    const result = await registerActivity(
      req.params.id,
      req.body.pilote,
      { action: req.body.action, justification: '', pedagogy: [] },
      { _id: req.user.roles.copilote, email: req.user.email },
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const piloteRegisterActivity = async (req, res) => {
  try {
    const result = await registerActivity(
      req.params.id,
      { _id: req.user.roles.pilote, pseudo: req.user.pseudo },
      req.body,
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const evaluateActivity = async (req, res) => {
  const activity = await elasticsearch.get(
    `mongodb_${collection}`,
    req.params.id,
  );
  if (['Fermeture', 'Autonomie'].indexOf(activity.status) === -1) {
    if (typeof req.body.activityAction !== 'undefined') {
      await event.fire(
        { _id: req.body.pilote._id, pseudo: req.body.pilote.pseudo },
        { _id: req.user.roles.cooperator, titre: req.user.titre },
        'activity',
        '',
        {
          activity,
          subType: req.body.activityAction,
        },
        {
          date: activity.end,
          forgeId: `${req.body.pilote._id}_${req.params.id}_${activity.theme}_${
            activity.title
          }_${activity.end}`,
        },
      );
    } else {
      await event.fire(
        { _id: req.body.pilote._id, pseudo: req.body.pilote.pseudo },
        { _id: req.user.roles.cooperator, titre: req.user.titre },
        'evaluation',
        req.body.comment,
        { ...req.body.data, activity },
        {
          date: activity.end,
          forgeId: `${req.body.pilote._id}_${req.params.id}_${
            req.body.data.objective
          }_${activity.theme}_${activity.title}_${activity.end}`,
        },
      );
    }
    res.json('Ok');
  } else {
    res.json(403, 'Impossible');
  }
};

const deleteActivity = async (req, res) => {
  try {
    const result = await elasticsearch.delete(
      `mongodb_${collection}`,
      req.params.id,
    );
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
