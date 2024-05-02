const multer = require('multer');
const cloudiness = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudiness.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudiness,
  params: {
    folder: 'api-glory365',
    allowed_formats: ['png', 'jpeg', 'jpg', 'gif', 'jpeg'],
  },
});

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     const originalname = file.originalname;
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const newFilename = originalname.split('.').slice(0, -1).join('.') + '-' + uniqueSuffix + '.' + originalname.split('.').pop();

//     cb(null, newFilename);
//   },
// });

exports.Avatar = function () {
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const upload = multer({ storage: storage, fileFilter: fileFilter });

  return upload.array('avatar', 12);
};

exports.Image = function () {
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const upload = multer({ storage: storage, fileFilter: fileFilter });

  return upload.array('image', 12);
};