const express = require('express')
const router = express.Router()

var id = ''
var version = ''
var vh = ''

router.get('/Introduction', getVH, (req, res) => {
    console.log("IN EDUCATIONAL COMPONENT ROUTER")
    console.log("VHType is: " + vh)
    res.render("pages/EducationalComponent/introduction", {version: version, vh: vh})
})

function getVH(req, res, next) {
    console.log("IN MIDDLEWARE OF EDUCATIONAL COMPONENT - REQUEST PARAMS:")
    id = req.id
    version = req.version
    vh = req.vh
    next()
}

module.exports = router