const { response } = require("express");

const authAdmin = (req, res = response, next) => {
  try {
    if (req.user.isAdmin !== true) {
      return res.status(401).json({
        message: `Bạn không phải admin`,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authAdmin;
