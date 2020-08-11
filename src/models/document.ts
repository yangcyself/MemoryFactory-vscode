let mongoose = require('mongoose');

let docSchema = new mongoose.Schema({
	doc: {
		type: String,
		required: true,
		unique: true,
		lowercase: true
	  },
	label:{
		type: String
	},
	reviewed_dates:{
		type: [Date],
		required: false
	}
})

module.exports = mongoose.model('Documents', docSchema)