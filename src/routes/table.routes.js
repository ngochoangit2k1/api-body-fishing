const express = require("express");
const tableController = require("../controllers/table.controller");
const upload = require("../middlewares/upload");
const authAdmin = require("../middlewares/authAdmin");
const authStaff = require("../middlewares/authStaff");
const {verifyToken} = require("../middlewares/auth");
const router = express.Router();

router.post('/checkFb', tableController.checkFB);

router.post('/create', tableController.create);
router.get('/get-all', tableController.getTable);
router.patch('/update-table', tableController.updateTables);
// router.get('/search', tableController.searchTab);
// router.route('/')
//   .post(tableController.handleTableRequest)
//   .get(tableController.handleTableRequest);
// router.patch('/update', verifyToken, upload.Avatar('avatar'), tableController.updateProfile)

//Admin
// router.post('/register-staff', verifyToken, authAdmin, tableController.register);
// router.patch('/update-password-by-admin/:tableId', verifyToken, authAdmin, tableController.updatePasswordByAdmin);
// // router.get('/get-all-staff', verifyToken, authAdmin, tableController.getAlltable);

// router.delete('/:tableId', verifyToken, authAdmin, tableController.deleteStaff);
// router.patch('/:tableId', verifyToken, authAdmin, upload.Avatar('avatar'), tableController.updateStaff);


// router.post('/get-table-by-email', tableController.gettableWithMail);
// router.patch('/:tableId', upload.Avatar('avatar'), tableController.updatetable);
// router.post('/create-table',authAdmin, upload.Avatar('avatar'), tableController.createtable);
module.exports = router;
