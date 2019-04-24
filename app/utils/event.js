const moment = require('moment');
const elasticsearch = require('./elasticsearch');
const uuidv5 = require('uuid/v5');
const PDC_NAMESPACE = '7065726d-6973-6465-636f-6e7374727569';

async function fire(pilote, source, type, comment, data, forgeId = false) {
  const date = moment().toISOString();
  const result = await elasticsearch.index('pdc', {
    date,
    type,
    comment,
    pilote,
    source,
    data
  })
  return result.body;
}

module.exports = {
  fire
};
