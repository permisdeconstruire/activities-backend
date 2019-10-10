const { Client } = require('@elastic/elasticsearch');

const connectElasticsearch = () =>
  new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://127.0.0.1:9200',
  });

const elastic = {
  get: async (index, id) => {
    const {
      body: { _source: res },
    } = await elastic.client.get({
      index,
      id,
    });
    return { ...res, _id: id };
  },
  delete: async (index, id) => {
    await elastic.client.delete({
      index,
      id,
      refresh: 'true',
    });
    return 'deleted';
  },
  search: async (index, body, params = {}) => {
    let res;
    if (typeof body === 'string') {
      const {
        body: { hits },
      } = await elastic.client.search({
        ...params,
        size: 10000,
        index,
        q: body,
      });
      res = hits.hits;
    } else {
      const {
        body: { hits },
      } = await elastic.client.search({ ...params, size: 10000, index, body });
      res = hits.hits;
    }
    return res.map(r => ({ ...r._source, _id: r._id }));
  },
  update: async (index, id, body) => {
    const cleanBody = body;
    if (typeof cleanBody._id !== 'undefined') {
      delete cleanBody._id;
    }
    await elastic.client.update({
      index,
      id,
      refresh: 'true',
      body: { doc: cleanBody },
    });
    return 'updated';
  },
  index: async (index, body, params = {}) => {
    if (Array.isArray(body)) {
      const arrayBody = [];
      body.forEach(elem => {
        arrayBody.push({
          index: {},
        });
        arrayBody.push(elem);
      });
      return elastic.client.bulk({
        ...params,
        refresh: 'true',
        index,
        body: arrayBody,
      });
    }

    const cleanBody = body;
    if (typeof cleanBody._id !== 'undefined') {
      delete cleanBody._id;
    }

    return elastic.client.index({
      ...params,
      refresh: 'true',
      index,
      body: cleanBody,
    });
  },
};

if (typeof elastic.client === 'undefined') {
  elastic.client = connectElasticsearch();
}

module.exports = elastic;
