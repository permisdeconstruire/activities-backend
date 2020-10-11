const elasticsearch = require('../utils/elasticsearch');
const agenceMapping = require('../utils/agenceMapping');

const collection = 'forms';

const listForms = async (req, res) => {
  try {
    const forms = await elasticsearch.search(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      {
        query: { match_all: {} },
      },
    );
    res.json(forms);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newForm = async (req, res) => {
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

const editForm = async (req, res) => {
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

const getForm = async (req, res) => {
  try {
    const forms = await elasticsearch.search(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      {
        query: {
          bool: {
            must: [
              {
                term: { type: req.params.type },
              },
              {
                term: { title: req.params.title },
              },
            ],
          },
        },
      },
    );
    res.json(forms[0]);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const deleteForm = async (req, res) => {
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
    router.get('/admin/forms', listForms);
    router.post('/admin/forms', newForm);
    router.put('/admin/forms/id/:id', editForm);
    router.get('/forms/title/:type/:title', getForm);
    router.delete('/admin/forms/id/:id', deleteForm);
  },
};
