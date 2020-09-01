let mongoose = require('mongoose');

let docSchema = new mongoose.Schema({
	doc: {
		type: String,
		required: true,
		unique: true,
	  },
	label:{
		type: String
	},
	reviewed_dates:{
		type: [Date],
		required: false
	},
	toreview_date:{
		type:Date,
		required: true
	}
})

module.exports = mongoose.model('Documents', docSchema)