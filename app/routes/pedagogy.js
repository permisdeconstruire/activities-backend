const elasticsearch = require('../utils/elasticsearch');
const agenceMapping = require('../utils/agenceMapping');

const collection = 'pedagogy';

const listPedagogy = async (req, res) => {
  try {
    const pedagogy = await elasticsearch.search(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      {
        query: { match_all: {} },
      },
    );
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

const editPedagogy = async (req, res) => {
  try {
    const result = await elasticsearch.update(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
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
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
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
