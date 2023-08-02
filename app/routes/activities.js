const moment = require('moment');
const jwt = require('jsonwebtoken');
const event = require('../utils/event');
const screenshot = require('../utils/screenshot');
const elasticsearch = require('../utils/elasticsearch');
const agenceMapping = require('../utils/agenceMapping');

const collection = 'activities';

const adminListPromotionActivities = async (req, res) => {
  try {
    const activities = await elasticsearch.search(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      {
        query: {
          term: {
            'promotion._id': req.params.promotionId,
          },
        },
      },
    );

    res.json(activities);
  } catch (e) {
    res.status(500).json('Error');
  }
};

const adminListEvaluationPilote = async (req, res) => {
  try {
    const evaluations = await elasticsearch.search(
      `${agenceMapping[req.agence].eventPrefix}pdc`,
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  type: 'evaluation',
                },
              },
              {
                term: {
                  'pilote._id': req.params.piloteId,
                },
              },
              {
                term: {
                  'data.activity.promotion._id': req.params.promotionId,
                },
              },
              {
                range: {
                  date: {
                    gte: req.query.startDate,
                  },
                },
              },
            ],
          },
        },
      },
    );

    res.json(
      evaluations.map(e => ({
        evaluation: e.data.evaluation,
        objective: e.data.objective,
      })),
    );
  } catch (e) {
    console.error(e.meta.body.error);
    res.status(500).json('Error');
  }
};

const listActivities = async agence => {
  const activities = await elasticsearch.search(
    `${agenceMapping[agence].dbPrefix}${collection}`,
    {
      query: {
        range: {
          start: {
            gte: 'now-500d/d',
          },
        },
      },
    },
  );
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
    const activities = await listActivities(req.agence);
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json('Error');
  }
};

const cooperatorListActivities = async (req, res) => {
  try {
    const activities = await listActivities(req.agence);
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
    const activities = await listActivities(req.agence);
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
    if (req.query.token) {
      const agenda = await screenshot(
        `https://pilote.${
          agenceMapping[req.agence].hostPart
        }.assopermisdeconstruire.org/?token=${req.query.token}&hide=true`,
      );
      res.download(agenda);
    } else {
      const agenda = await screenshot(
        `https://agenda.${
          agenceMapping[req.agence].hostPart
        }.assopermisdeconstruire.org/`,
      );
      res.download(agenda);
    }
  } catch (e) {
    console.log(e);
    res.json(500, 'Error');
  }
};

const impersonateDownloadActivities = async (req, res) => {
  try {
    const tokenOptions = {};
    tokenOptions.issuer = process.env.JWT_ISSUER;
    tokenOptions.audience = process.env.JWT_AUDIENCE;
    tokenOptions.expiresIn = process.env.JWT_TTL;
    const pilote = await elasticsearch.get(
      `${agenceMapping[req.agence].dbPrefix}pilotes`,
      req.params.id,
    );
    const token = encodeURIComponent(
      jwt.sign(
        { email: pilote.email, id: 'impersonate' },
        process.env.JWT_SECRET,
        tokenOptions,
      ),
    );
    const agenda = await screenshot(
      `https://pilote.${
        agenceMapping[req.agence].hostPart
      }.assopermisdeconstruire.org/?token=${token}&hide=true`,
    );
    res.download(agenda, `agenda_${pilote.pseudo}.pdf`);
  } catch (e) {
    console.log(e);
    res.json(500, 'Error');
  }
};

const publicListActivities = async (req, res) => {
  try {
    const activities = await listActivities(req.agence);
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
    } = await elasticsearch.index(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      { ...req.body },
    );
    res.json(_id);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const editActivityComment = async (req, res) => {
  try {
    const result = await elasticsearch.update(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      req.params.id,
      { cooperatorComments: req.body.comments },
    );
    res.json(result);
  } catch (err) {
    console.error(JSON.stringify(err, '', 2));
    res.json(500, 'Error');
  }
};

const editActivity = async (req, res) => {
  try {
    const result = await elasticsearch.update(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
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
  agence,
  activityId,
  rPilote,
  body,
  who = { _id: 'application' },
) => {
  let pilotes;
  if (Array.isArray(rPilote)) {
    pilotes = rPilote;
  } else {
    pilotes = [rPilote];
  }

  const activity = await elasticsearch.get(
    `${agenceMapping[agence].dbPrefix}${collection}`,
    activityId,
  );
  if (typeof activity.participants === 'undefined') {
    activity.participants = [];
  }

  const forbidden = ['Fermeture', 'Autonomie'];
  if (who._id === 'application') {
    forbidden.push('Individuelle');
  }
  if (forbidden.indexOf(activity.status) === -1) {
    for (let i = 0; i < pilotes.length; i += 1) {
      const pilote = pilotes[i];
      const participantIndex = activity.participants.findIndex(
        participant => participant._id === pilote._id,
      );
      if (body.action === 'register') {
        if (participantIndex === -1) {
          activity.participants.push({
            _id: pilote._id,
            pseudo: pilote.pseudo,
          });
          await event.fire(
            agence,
            { _id: pilote._id, pseudo: pilote.pseudo },
            who,
            'activity',
            '',
            {
              activity,
              subType: 'register',
            },
          );
        }
      } else if (participantIndex !== -1) {
        activity.participants.splice(participantIndex, 1);
        await event.fire(
          agence,
          { _id: pilote._id, pseudo: pilote.pseudo },
          who,
          'activity',
          body.justification,
          { activity, subType: 'unregister' },
        );
      }
    }
    const result = await elasticsearch.update(
      `${agenceMapping[agence].dbPrefix}${collection}`,
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
      req.agence,
      req.params.id,
      req.body.pilote,
      { action: req.body.action, justification: '' },
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
      req.agence,
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
    `${agenceMapping[req.agence].dbPrefix}${collection}`,
    req.params.id,
  );
  if (['Fermeture', 'Autonomie'].indexOf(activity.status) === -1) {
    if (typeof req.body.activityAction !== 'undefined') {
      await event.fire(
        req.agence,
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
        req.agence,
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
    res.status(403).json('Impossible');
  }
};

const getEvaluationActivity = async (req, res) => {
  const activity = await elasticsearch.get(
    `${agenceMapping[req.agence].dbPrefix}${collection}`,
    req.params.id,
  );
  if (
    typeof activity.cooperators.find(
      c => c._id === req.user.roles.cooperator,
    ) === 'undefined'
  ) {
    res.status(403).json('Impossible');
  } else {
    const evaluations = [];

    if (typeof activity.pedagogy !== 'undefined') {
      for (let i = 0; i < activity.pedagogy.length; i += 1) {
        const pedagogy = activity.pedagogy[i];
        const forgeId = event.uuid(
          `${req.params.piloteId}_${req.params.id}_${pedagogy.objective}_${
            activity.theme
          }_${activity.title}_${activity.end}`,
        );
        try {
          const evaluation = await elasticsearch.get(
            `${agenceMapping[req.agence].eventPrefix}pdc`,
            forgeId,
          );
          evaluations.push({
            comment: evaluation.comment,
            evaluation: evaluation.data.evaluation,
          });
        } catch (e) {
          evaluations.push({ comment: '', evaluation: -1 });
        }
      }
    }

    if (typeof activity.objectives !== 'undefined') {
      for (let i = 0; i < activity.objectives.length; i += 1) {
        const objective = activity.objectives[i];
        const forgeId = event.uuid(
          `${req.params.piloteId}_${req.params.id}_${objective}_${
            activity.theme
          }_${activity.title}_${activity.end}`,
        );
        try {
          const evaluation = await elasticsearch.get(
            `${agenceMapping[req.agence].eventPrefix}pdc`,
            forgeId,
          );
          evaluations.push({
            comment: evaluation.comment,
            evaluation: evaluation.data.evaluation,
          });
        } catch (e) {
          evaluations.push({ comment: '', evaluation: -1 });
        }
      }
    }

    const forgeId = event.uuid(
      `${req.params.piloteId}_${req.params.id}_Commentaire global_${
        activity.theme
      }_${activity.title}_${activity.end}`,
    );
    let globalPiloteComments = '';
    try {
      const evaluation = await elasticsearch.get(
        `${agenceMapping[req.agence].eventPrefix}pdc`,
        forgeId,
      );
      globalPiloteComments = evaluation.comment;
    } catch (e) {}
    res.json({ evaluations, globalPiloteComments });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const result = await elasticsearch.delete(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      req.params.id,
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json('Error');
  }
};

module.exports = {
  create: router => {
    router.get('/activities.pdf', publicDownloadActivities);
    router.get('/activities', publicListActivities);
    router.get('/pilote/activities', piloteListActivities);
    router.get('/cooperator/activities', cooperatorListActivities);
    router.get(
      '/cooperator/activities/id/:id/pilote/:piloteId',
      getEvaluationActivity,
    );
    router.put('/cooperator/activities/id/:id', evaluateActivity);
    router.put('/cooperator/activities/id/:id/comment', editActivityComment);

    router.get('/admin/activities', adminListActivities);
    router.post('/admin/activities', newActivity);
    router.put('/admin/activities/id/:id', editActivity);
    router.put('/pilote/activities/id/:id', piloteRegisterActivity);
    router.put('/admin/activities/id/:id/pilote', adminRegisterActivity);
    router.delete('/admin/activities/id/:id', deleteActivity);
    router.get(
      '/admin/pilotes/id/:id/activities.pdf',
      impersonateDownloadActivities,
    );
    router.get(
      '/admin/activities/promotion/:promotionId',
      adminListPromotionActivities,
    );
    router.get(
      '/admin/activities/promotion/:promotionId/pilote/:piloteId',
      adminListEvaluationPilote,
    );
  },
};
