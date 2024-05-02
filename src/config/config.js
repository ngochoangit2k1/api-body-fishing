const dotenv = require('dotenv');
require('dotenv').config();
dotenv.config();

module.exports = {
  SOCKET_PORT: process.env.SOCKET_PORT,
  PORT: process.env.PORT,
  MONGODB_URL: process.env.MONGODB_URL,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  TOKEN_EXPIRE_TIME: process.env.TOKEN_EXPIRE_TIME,
  TOKEN_EXPIRATION_DATE: process.env.TOKEN_EXPIRATION_DATE,
  CLIENT_URL: process.env.CLIENT_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  EXPIRES_IN: process.env.EXPIRES_IN,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SENDER_EMAIL_ADDRESS: process.env.SENDER_EMAIL_ADDRESS,
  PASS_EMAIL: process.env.PASS_EMAIL
};
