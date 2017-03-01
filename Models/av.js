const AvSchema = require('../Schemas/av')
		, mongoose = require('mongoose')

let Av = mongoose.model('Av', AvSchema)

module.exports = Av
