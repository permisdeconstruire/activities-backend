const elasticsearch = require('../utils/elasticsearch');
const agenceMapping = require('../utils/agenceMapping');

const collection = 'promotions';

const listPromotions = async (req, res) => {
  try {
    const promotions = await elasticsearch.search(
      `${agenceMapping[req.agence].dbPrefix}${collection}`,
      {
        query: { match_all: {} },
      },
    );
    res.json(promotions);
  } catch (err) {
    console.error(err);
    res.json(500, 'Error');
  }
};

const newPromotions = async (req, res) => {
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

const editPromotions = async (req, res) => {
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

const deletePromotions = async (req, res) => {
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
    router.get('/admin/promotions', listPromotions);
    router.post('/admin/promotions', newPromotions);
    router.put('/admin/promotions/id/:id', editPromotions);
    router.delete('/admin/promotions/id/:id', deletePromotions);
  },
};
