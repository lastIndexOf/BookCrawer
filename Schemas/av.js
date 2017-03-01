const mongoose = require('mongoose')

let AvSchema = new mongoose.Schema({
	name: String,
	autor: String,
	avaiter: String,
	intrudoce: String,
	allArcs: {
		type: Number,
		default: 0
	},
	arcs: [{
		title: String,
		content: String
	}],
	meta: {
		createAt: {
			type: Date,
			default: new Date()
		},
		updateAt: {
			type: Date,
			default: new Date()
		}
	}
})

AvSchema.pre('save', function(next) {
	if (this.isNew)
		this.meta.updateAt = this.meta.createAt = new Date()
	else
		this.meta.updateAt = new Date()

	next()
})

AvSchema.statics = {
	findById: function(id, cb) {
		return this.find({ _id: id })
			.exec(cb)
	},
	fetch: function(cb) {
		return this.find({})
			.exec(cb)
	}
}

module.exports = AvSchema