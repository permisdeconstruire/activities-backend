const { Client } = require('@elastic/elasticsearch')

const connectElasticsearch = () =>
  new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://127.0.0.1:9200',
  });

const elastic = {
  search: async (index, body, params = {}) => {
    if (typeof body === 'string') {
      return elastic.client.search({ ...params, index, q: body });
    }
    return elastic.client.search({ ...params, index, body });
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
        type: '_doc',
        index,
        body: arrayBody,
      });
    }

    return elastic.client.index({
      ...params,
      index,
      type: '_doc',
      body,
    });
  },
};

if (typeof elastic.client === 'undefined') {
  elastic.client = connectElasticsearch();
}

module.exports = elastic;
