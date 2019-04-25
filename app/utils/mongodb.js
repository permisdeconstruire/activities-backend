const MongoClient = require('mongodb').MongoClient;

const url = process.env.MONGODB_URL;

const mongodb = {
  connect: async () => {
    if (typeof mongodb.client === 'undefined') {
      mongodb.client = await MongoClient.connect(url, {
        useNewUrlParser: true,
      });
    }
  },
  findOne: async (collection, search, database = 'permisdeconstruire') => {
    await mongodb.connect();
    const db = mongodb.client.db(database);
    const coll = db.collection(collection);
    return coll.findOne(search);
  },
  find: async (collection, search = {}, database = 'permisdeconstruire') => {
    await mongodb.connect();
    const db = mongodb.client.db(database);
    const coll = db.collection(collection);
    return coll.find(search).toArray();
  },
  insertOne: async (collection, body, database = 'permisdeconstruire') => {
    await mongodb.connect();
    const db = mongodb.client.db(database);
    const coll = db.collection(collection);
    return coll.insertOne(body);
  },
  updateOne: async (
    collection,
    search,
    body,
    database = 'permisdeconstruire',
  ) => {
    await mongodb.connect();
    const db = mongodb.client.db(database);
    const coll = db.collection(collection);
    return coll.updateOne(search, body);
  },
  deleteOne: async (collection, search, database = 'permisdeconstruire') => {
    await mongodb.connect();
    const db = mongodb.client.db(database);
    const coll = db.collection(collection);
    return coll.deleteOne(search);
  },
};

module.exports = mongodb;
