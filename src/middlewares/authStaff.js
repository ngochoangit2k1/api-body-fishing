const { response } = require("express");

const authStaff = (req, res = response, next) => {
  try {
    if (req.user.isStaff !== true) {
      return res.status(401).json({
        message: `Bạn không phải nhân viên`,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authStaff;
