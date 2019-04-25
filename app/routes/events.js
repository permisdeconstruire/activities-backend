const event = require('../utils/event');

const newEvent = async (req, res) => {
  try {
    await event.fire(
      req.body.pilote,
      req.user.email,
      req.body.type,
      req.body.comment,
      req.body.data,
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
