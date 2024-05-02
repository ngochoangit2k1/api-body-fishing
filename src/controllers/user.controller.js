const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserSchema = require("../models/user.model");
const auth = require("../middlewares/auth");
const config = require("../config/config");
const { validateEmail } = require("../validates/auth.validate");

const register = async (req, res) => {
  try {
    const { name, username, password, email, phone, isAdmin, isStaff } = req.body;
    if (!(name && phone && username && email && password)) {
      return res.status(400).json({
        oke: false,
        errMessage: "Thiếu tên người dùng, mật khẩu, email!",
      });
    }
    const users = await UserSchema.findOne({ username });
    if (users) {
      return res.status(400).json({
        oke: false,
        errMessage: " username đã được sử dụng!",
      });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({
        oke: false,
        errMessage: " Email không hợp lệ!",
      });
    }
    const user = await UserSchema.findOne({ email });
    if (user) {
      return res.status(400).json({
        oke: false,
        errMessage: " Email đã được sử dụng!",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        oke: false,
        errMessage: "Mật khẩu phải lớn hơn 6 kí tự!",
      });
    }
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newUser = new UserSchema({
      name: name,
      username: username,
      email: email,
      phone: phone,
      status: true,
      password: passwordHash,
      isAdmin: isAdmin,
      isStaff: isStaff,
    });
    await newUser.save();
    res.status(200).json({
      oke: true,
      message: "Bạn đã tạo tài khoản thành công! 🎉'",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errMessage: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { username , password, newPassword } = req.body;
    if (!(username && password)) {
      return res
        .status(400)
        .json({ error: "Vui lòng điền tất cả các thông tin cần thiết!" });
    } else {
      const user = await UserSchema.findOne({ username });

      if (!user) {
        return res.status(400).send({
          ok: false,
          errMessage: "Tài khoản không tồn tại!",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).send({
          ok: false,
          errMessage: "Bạn đã nhập mật khẩu sai😞",
        });
      }
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(newPassword, salt);
      const updatePassword = await UserSchema.findOneAndUpdate(
        { username: username },
        { password: passwordHash }
      );
      return res.status(200).json({ data: updatePassword });
    }
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!(username && password)) {
    return res.status(400).send({
      ok: false,
      errMessage: "Vui lòng điền tất cả các thông tin cần thiết!",
    });
  }

  try {
    console.log(username)
    const user = await UserSchema.findOne({ username });
    console.log(user)
    if (!user) { 
      return res.status(400).send({
        ok: false,
        errMessage: "Tài khoản không tồn tại!",
      });
    }
    if (user.status == false) {
      return res.status(400).send({
        ok: false,
        errMessage: "Tài khoản đã bị khoá!",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).send({ 
        ok: false,
        errMessage: "Bạn đã nhập mật khẩu sai😞",
      });
    }

    const token = auth.generateToken(user._id, user.username);
    const expires_in = auth.expiresToken(token);
 
    user.password = undefined;
    user.__v = undefined;

    return res.status(200).send({
      ok: true,
      message: "Đăng nhập thành công! 🎉",
      user,
      token,
      expires_in,
    });
  } catch (err) {
    return res.status(500).send({
      ok: false,
      errMessage: "Đã xảy ra lỗi trong quá trình đăng nhập.",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        errMessage: 'Token không hợp lệ hoặc người dùng không xác thực.',
      });
    }
    const userId = req.user ? req.user.id : null;
    const user = await UserSchema.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: 'Không tìm thấy người dùng.',
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
      errMessage: 'Lỗi trong quá trình lấy thông tin người dùng.',
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const { username } = req.query;
    let query = {};
    if (username) {
      query = {
        username: { $regex: username, $options: "i" },
        isStaff: true,
      };
    } else {
      query = { isStaff: true };
    }
    const user = await UserSchema.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
};


const searchStaff = async (req, res) => {
  try {
    const { name, username, email } = req.query;
    let query = {};

    if (name && username && email) {
      query = {
        $and: [
          { name: { $regex: name, $options: "i" } },
          { username: { $regex: username, $options: "i" } },
          { email: { $regex: email, $options: "i" } },
        ]
      };
    } else if (name) {
      query = { name: { $regex: name, $options: "i" } };
    } else if (username) {
      query = { username: { $regex: username, $options: "i" } };
    } else if (email) {
      query = { email: { $regex: email, $options: "i" } };
    }

    const searchStaff = await UserSchema.find(query);

    return res.status(200).json(searchStaff);
  } catch (error) {
    return res.status(400).json(error);
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserSchema.findByIdAndDelete(userId);

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
        errMessage: 'Token không hợp lệ hoặc người dùng không xác thực.',
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
        errMessage: 'Không có dữ liệu để cập nhật.',
      });
    }
    const user = await UserSchema.findByIdAndUpdate(userId, updatedData, { new: true });

    if (!user) {
      return res.status(404).json({
        ok: false,
        errMessage: 'Không tìm thấy người dùng.',
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
      errMessage: 'Lỗi trong quá trình lấy thông tin người dùng.',
    });
  }
};

const updatePasswordByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const user = await UserSchema.findByIdAndUpdate(userId, { password: passwordHash }, { new: true });
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
        errMessage: 'Không có dữ liệu để cập nhật.',
      });
    }
    const user = await UserSchema.findByIdAndUpdate(userId, updatedData, { new: true });
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
  const newUser = new UserSchema({
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
  resetPassword,
  register,
  login,
  deleteStaff,
  searchStaff,
  updatePasswordByAdmin,
  getAllUser,
  getUserWithMail,
  updateProfile,
  // updateUser,
  updateStaff,
  createUser,
  getUserProfile,
};
