const express = require("express");
const ipController = require("../controllers/ip.controller")
const countController = require("../controllers/count.controller")
const router = express.Router();

router.post('/create', ipController.createIp)
router.get('/getAll', ipController.getIp)
router.post('/delete', ipController.deleteIp)

router.post('/create-code', ipController.createCodeNational)
router.get('/get-all-code', ipController.getCodeNations)
router.post('/delete-code', ipController.deleteCodeNation)


router.get('/count', countController.coutRequest)

module.exports = router;