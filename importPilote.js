const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const url = 'mongodb://root:example@localhost:27017';
// const url = 'mongodb://root:permisdeconstruire@localhost:27018';
const moment = require('moment');

var fs = require('fs');
var CsvReadableStream = require('csv-reader');
var AutoDetectDecoderStream = require('autodetect-decoder-stream');
var inputStream = fs.createReadStream('../Pilote.csv').pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' }));

let a = 0;
const info = []
let header = []

inputStream
  .pipe(CsvReadableStream({
    delimiter: ';',
    parseNumbers: true,
    parseBooleans: true,
    trim: true
  }))
  .on('data', function(row) {
    if(a === 0) {
      header = row;
      console.log(header);
    }
    a += 1;
    if(a > 1) {
      const pilote = {}
      row.forEach((r, i) => {
        if(header[i] === 'pseudo' && r === ''){
          pilote[header[i]] = `${row[1]} ${row[2]}`;
        } else if(['ph_dateaccueil', 'ph_datecloture', 'ph_datedebutsuivi', 'ph_datenaissance', 'ph_dateorientation', 'datecontact', 'datefinpeine'].indexOf(header[i]) !== -1){
          if(moment(r, 'DD/MM/YYYY').isValid()) {
            pilote[header[i]] = moment(r, 'DD/MM/YYYY').format('YYYY-MM-DD');
          } else {
            pilote[header[i]] = '1900-01-01';
          }

        } else {
          pilote[header[i]] = r;
        }
      })
      info.push(pilote)
    }
  })
  .on('end', function(data) {
    let client;
    MongoClient.connect(
      url,
      { useNewUrlParser: true },
    )
      .then(rClient => {
        client = rClient;
        const db = client.db('permisdeconstruire');
        const formsColl = db.collection('forms');
        return formsColl.find({}).toArray()
      })
      .then(res => {
        const fieldList = []
        res.filter(form => form.type === 'pilote').forEach(form => {
          const formData = JSON.parse(form.formData);
          formData.forEach(f => {
            if(f.name) {
              fieldList.push(f.name)
            } else {
              console.log(f);
            }

          })
        })
        console.log(JSON.stringify(fieldList.sort(), '', 2))
        console.log(JSON.stringify(header.sort(), '', 2));
        header.forEach(h => {
          if(fieldList.indexOf(h) === -1) {
            console.log(`${h} is not in the forms`)
          } else {
            console.log(`${h} is in the forms`)
          }

        })

        const db = client.db('permisdeconstruire');
        const pilotesColl = db.collection('pilotes');

        const insertPromises = [];
        info.forEach(i => {
          const levels = {
        "Relation à Soi": 0,
        "Compétences clés": 0,
        "Projet professionnel": 0,
        "Relation avec l'autre": 0,
        "S'adapter à la vie d'une structure accueillante (PdC)": 0,
        "Réaliser un objectif individuel": 0
    }
          insertPromises.push(pilotesColl.insertOne({...i, levels}))
        })
        return Promise.all(insertPromises);
      })
      .then(res => {
        console.log(res.length);
      })
      .catch(err => {
        console.log(err);
      });
  });
