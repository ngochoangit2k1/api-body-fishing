const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/config');

const generateToken = (id, username) => {
  const token = jwt.sign({ id, username }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: config.TOKEN_EXPIRE_TIME,
  });
  return token.toString();
};
const expiresToken = (token) => {
  const now = new Date().getTime(token);
  const expires_in = now + 1000 * 24 * 60 * 60 * 1000;
  return expires_in.toString();
}
const verifyToken = async (req, res, next) => {
  try {
    if (!req.headers['authorization'])
      return res
        .status(401)
        .send({ errMessage: 'Authorization token not found!' });

    const header = req.headers['authorization'];
    const token = header.split(' ')[1];

    jwt.verify(
      token,
      config.ACCESS_TOKEN_SECRET,
      async (err, verifiedToken) => {
        if (err)
          return res
            .status(401)
            .send({ errMessage: 'Authorization token invalid', details: err });
        const user = await User.findById(verifiedToken.id);
        req.user = user;
        next();
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateToken,
  expiresToken,
  verifyToken,
};
