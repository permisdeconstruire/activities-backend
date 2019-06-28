require('dotenv').config({ path: './config/env' });
const moment = require('moment');
const elasticsearch = require('./app/utils/elasticsearch')
const mongodb = require('./app/utils/mongodb');

(async () => {
  console.log(process.env.MONGODB_URL);
  console.log(process.env.ELASTICSEARCH_URL);
  const pedagogy = await mongodb.find('pedagogy');
  for(let i = 0; i < pedagogy.length; i += 1){
    const p = pedagogy[i];
    console.log(p);
    delete p.levels;
    Object.keys(p)
      .forEach(key => {
        if (key.startsWith('ph_date') || key.startsWith('date')) {
          if (moment(p[key]).isValid()) {
            p[key] = moment(p[key]);
          } else {
            p[key] = moment('1900-01-01');
          }
        } else {
          p[key] = p[key];
        }
      });
    try {
      await elasticsearch.index('mongodb_pedagogy', p, {id: p._id.toString()});
    } catch(e) {
      console.log(JSON.stringify(e, '', 2))
      throw e;
    }

  }
  console.log('done');
})();
