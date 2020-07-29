const elasticsearch = require('../utils/elasticsearch');

const collection = 'parcours';

const listParcours = async (req, res) => {
  try {
    const parcours = await elasticsearch.search(`mongodb_${collection}`, {
      query: { match_all: {} },
    });
    res.json(parcours);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newParcours = async (req, res) => {
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

const editParcours = async (req, res) => {
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

const deleteParcours = async (req, res) => {
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
    router.get('/admin/parcours', listParcours);
    router.post('/admin/parcours', newParcours);
    router.put('/admin/parcours/id/:id', editParcours);
    router.delete('/admin/parcours/id/:id', deleteParcours);
  },
};
