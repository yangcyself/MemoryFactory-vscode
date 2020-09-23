var mongoose = require('mongoose');
import { pathgetter,pathsetter } from "../utils/pathutil";

let groupSchema = new mongoose.Schema({
	path: {
		type: String,
		required: true,
		unique: true,
		set:pathsetter,
		get:pathgetter
	},
	label:{
		type: String
	},
	difficulty:{ // numbers of 20min required
		type: Number,
		default: 1
	},
	reviewLevel:{ // the factor for calculating the reviewperiod
		type: Number,
		default: 1
	},
	repository:{
		type: String,
		required: true
	}
})

module.exports = mongoose.model('groups', groupSchema);