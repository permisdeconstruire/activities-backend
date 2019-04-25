const moment = require('moment');
const uuidv5 = require('uuid/v5');
const elasticsearch = require('./elasticsearch');

const PDC_NAMESPACE = '7065726d-6973-6465-636f-6e7374727569';

async function fire(pilote, source, type, comment, data, forgeId = false) {
  const params = {};
  const date = moment().toISOString();
  const event = {
    date,
    type,
    comment,
    pilote,
    source,
    data,
  };
  if (forgeId !== false) {
    params.id = uuidv5(
      forgeId.reduce((acc, key) => `${acc}_${event[key]}`, ''),
      PDC_NAMESPACE,
    );
  }

  const result = await elasticsearch.index('pdc', event, params);
  return result.body;
}

module.exports = {
  fire,
};
