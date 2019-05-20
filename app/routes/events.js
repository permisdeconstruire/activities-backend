const event = require('../utils/event');

const newEvent = async (req, res) => {
  try {
    await event.fire(
      req.body.pilote,
      {_id: req.user.roles.copilote, email: req.user.email},
      req.body.type,
      req.body.comment,
      req.body.data,
      {date: req.body.date},
    );
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
