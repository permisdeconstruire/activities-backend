const elasticsearch = require('../utils/elasticsearch');
const agenceMapping = require('../utils/agenceMapping');

const collection = 'parcours';

const listParcours = async (req, res) => {
  try {
    const parcours = await elasticsearch.search(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      {
        query: { match_all: {} },
      },
    );
    res.json(parcours);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const getParcoursByTitle = async (req, res) => {
  try {
    const parcours = await elasticsearch.search(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      {
        query: { term: { title: req.params.title } },
      },
    );
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

const getParcours = async (req, res) => {
  try {
    const parcours = await elasticsearch.get(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      req.params.id,
    );
    res.json(parcours);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const editParcours = async (req, res) => {
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

const deleteParcours = async (req, res) => {
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
    router.get('/admin/parcours', listParcours);
    router.get('/admin/parcours/id/:id', getParcours);
    router.get('/admin/parcours/title/:title', getParcoursByTitle);
    router.post('/admin/parcours', newParcours);
    router.put('/admin/parcours/id/:id', editParcours);
    router.delete('/admin/parcours/id/:id', deleteParcours);
  },
};
