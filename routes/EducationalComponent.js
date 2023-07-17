const express = require('express')
const router = express.Router()

router.get('/Introduction', (req, res) => {
    console.log("REQUEST PARAMS:")
    console.log(req.params.version)
    res.render("pages/introduction", {version: req.params.version})
})

module.exports = router