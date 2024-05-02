const UserSchema = require('./user.model');
const TableSchema = require('./table.model');
const  IpSchema = require('./ipcheck.model');
const CountSchema = require('./count.model');

const CTRL = {
  IpSchema,
  UserSchema,
  TableSchema,
  CountSchema
};
module.exports = CTRL;
