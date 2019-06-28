const elasticsearch = require('../utils/elasticsearch');

const collection = 'pedagogy';

const listPedagogy = async (req, res) => {
  try {
    const pedagogy = await elasticsearch.search(`mongodb_${collection}`, {
      query: { match_all: {} },
    });
    res.json(pedagogy);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newPedagogy = async (req, res) => {
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

const editPedagogy = async (req, res) => {
  try {
    const result = await elasticsearch.update(
      `mongodb_${collection}`,
      req.params.id,
      { ...req.body },
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const deletePedagogy = async (req, res) => {
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
    router.get('/pedagogy', listPedagogy);
    router.post('/admin/pedagogy', newPedagogy);
    router.put('/admin/pedagogy/id/:id', editPedagogy);
    router.delete('/admin/pedagogy/id/:id', deletePedagogy);
  },
};
