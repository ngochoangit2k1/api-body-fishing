const express = require('express');
const userController = require('../controllers/user.controller');
const router = express.Router();

router.post('/login', userController.login);
router.post('/register', userController.register);
router.patch('/update-password', userController.resetPassword)
module.exports = router;
