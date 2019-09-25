process.env.ELASTICSEARCH_URL = 'http://127.0.0.1:9201'
const uuidv5 = require('uuid/v5');
var fs = require('fs');
var CsvReadableStream = require('csv-reader');
// var AutoDetectDecoderStream = require('autodetect-decoder-stream');
// var inputStream = fs.createReadStream('peda/peda.csv').pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' }));
var inputStream = fs.createReadStream('peda/peda.csv', 'utf8');
const elasticsearch = require('./app/utils/elasticsearch');

let a = 0;
const info = [];

inputStream
  .pipe(CsvReadableStream({
    delimiter: ',',
    parseNumbers: true,
    parseBooleans: true,
    trim: true
  }))
  .on('data', function(row) {
    a += 1;
    if(a > 1) {
      // console.log(row);
      // if(row[6] === 1) {
      //   pillars.push('Bien vivre')
      // }
      // if(row[8] === 1) {
      //   pillars.push('Bien faire')
      // }
      // if(row[10] === 1) {
      //   pillars.push('Bien-être psychologique')
      // }
      // if(row[12] === 1) {
      //   pillars.push('Bien-être corporel')
      // }

      info.push({pillar: row[0], level: parseInt(row[1].trim().substring(row[1].trim().length-1), 10), type: row[2], category: row[3].trim(), subCategory: row[4].trim(), objective: row[5], indicator: row[6]})
    }
  })
  .on('end', async function(data) {
    const categories = {};
    const what = 'objective'
    const what2 = 'pillar'
    // info.forEach(i => {
    //   if(typeof(categories[`${i[what2]}_${i[what]}`]) === 'undefined'){
    //     categories[`${i[what2]}_${i[what]}`] = 0
    //   }
    //   categories[`${i[what2]}_${i[what]}`] += 1
    // });
    // Object.keys(categories).forEach(k => {
    //   if(categories[k]>1) {console.log(k, categories[k])}
    // });
    const PDC_NAMESPACE = '7065726d-6973-6465-636f-6e7374727569';
    const indexPromises = []
    for(let i = 0; i < info.length; i += 1){
      const id = uuidv5(`${info[i]['pillar']}_${info[i]['objective']}`, PDC_NAMESPACE);
      try{
        const res = await elasticsearch.index('mongodb_pedagogy', info[i], {id})
      } catch(e) {
        console.log(e.body.error)
        throw(e)
      }

    }




    // const subCategories = {};
    // const objective = {}
    // info.forEach(i => {
    //   if(typeof(categories[i.category]) === 'undefined'){
    //     categories[i.category] = {}
    //   }
    //   if(typeof(categories[i.category][i.subCategory]) === 'undefined'){
    //     categories[i.category][i.subCategory] = []
    //   }
    //   if(typeof(subCategories[`${i.subCategory}_${i.category}`]) === 'undefined') {
    //     subCategories[`${i.subCategory}_${i.category}`] = 0;
    //   }
    //   if(typeof(objective[i.objective]) === 'undefined'){
    //     objective[i.objective] = [];
    //   }
    //   subCategories[`${i.subCategory}_${i.category}`] += 1;
    //   categories[i.category][i.subCategory].push({objective: i.objective, indicator: i.indicator});
    //   objective[i.objective].push(`${i.category}_${i.subCategory}`);
    //   objective[i.objective].sort();
    // });

    // console.log(JSON.stringify(objective, '', 2));
    // MongoClient.connect(
    //   url,
    //   { useNewUrlParser: true },
    // )
    //   .then(client => {
    //     const db = client.db('permisdeconstruire');
    //     const activitiesColl = db.collection('pedagogy');
    //     const insertPromises = [];
    //     info.forEach(i => {
    //       if(i.category !== '') {
    //         insertPromises.push(activitiesColl.insertOne(i))
    //       }
    //     })
    //     return Promise.all(insertPromises);
    //   })
    //   .then(res => {
    //     console.log(res.length);
    //   })
    //   .catch(err => {
    //     console.log(err);
    //   });

  });
