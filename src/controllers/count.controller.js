const CTRL = require("../models/index");



const coutRequest = async (req, res, next) => {
    try {
        const count = await CTRL.CountSchema.countDocuments({})
        return res.status(200).json(count)
    } catch (error) {
        return res.status(404).json({ error: error })
    }
}

module.exports ={
    coutRequest
}