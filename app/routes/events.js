const event = require('../utils/event');
const elasticsearch = require('../utils/elasticsearch');
const agenceMapping = require('../utils/agenceMapping');

const newEvent = async (req, res) => {
  try {
    await event.fire(
      req.agence,
      req.body.pilote,
      { _id: req.user.roles.copilote, email: req.user.email },
      req.body.type,
      req.body.comment,
      req.body.data,
      { date: req.body.date },
    );

    if (req.body.type === 'parcours') {
      if (['terminate', 'stop'].indexOf(req.body.data.what) !== -1) {
        await elasticsearch.update(
          `${agenceMapping[req.agence].dbPrefix}pilotes`,
          req.body.pilote._id,
          {
            pillar: '',
            level: 0,
          },
        );
      } else {
        await elasticsearch.update(
          `${agenceMapping[req.agence].dbPrefix}pilotes`,
          req.body.pilote._id,
          {
            pillar: req.body.data.name,
            level: req.body.data.level,
          },
        );
      }
    }
    res.json('OK');
  } catch (err) {
    console.log(err);
    res.json(500, 'Error');
  }
};

module.exports = {
  create: router => {
    router.post('/admin/events', newEvent);
  },
};
