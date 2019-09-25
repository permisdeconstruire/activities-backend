require('dotenv').config({ path: './config/env' });
const moment = require('moment');
const elasticsearch = require('./app/utils/elasticsearch')
const mongodb = require('./app/utils/mongodb');

(async () => {
  const pedagogy = await elasticsearch.search('mongodb_pilotes', {
    query: { match_all: {} },
  });
  for(let i = 0; i < pedagogy.length; i += 1){
    const p = pedagogy[i];
    // console.log(p);
    delete p.copilote;
    console.log(p);
    try {
      await elasticsearch.index('mongodb_pilotes', p, {id: p._id.toString()});
    } catch(e) {
      console.log(JSON.stringify(e, '', 2))
      throw e;
    }
  }
  console.log('done');
})();
