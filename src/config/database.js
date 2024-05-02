const config = require('./config');
const mongoose = require('mongoose');
const {
  UserSchema,
  TableSchema
} = require('../models');

mongoose
  .connect(config.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => UserSchema.createIndexes())
  .then(() => TableSchema.createIndexes())
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch((error) =>
    console.log(`❗can not connect to database, ${error}`, error.message),
  );
