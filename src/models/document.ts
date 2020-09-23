// let mongoose = require('mongoose');
var mongoose = require('mongoose');
import  * as path from 'path';
import { pathgetter,pathsetter } from "../utils/pathutil";
let docSchema = new mongoose.Schema({
	doc: {
		type: String,
		required: true,
		unique: true,
		set:pathsetter,
		get:pathgetter
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
	},
	difficulty:{ // numbers of 20min required
		type: Number,
		default: 1
	},
	ancestors:{
		type: [String]
	},
	repository:{
		type: String,
		required: true
	}
})


// an array of paths of the parent directories
docSchema.pre('save', function (next) {

	const pathItems = this.doc.split(path.sep);
	const ancsArray:string[] = [pathItems[0]];
	for (let i = 1; i < pathItems.length; i++) {
		ancsArray.push(path.join(ancsArray[ancsArray.length - 1],pathItems[i]));
	}
	this.ancestors = ancsArray;
	// Call the next function in the pre-save chain
	next()    
  })


module.exports = mongoose.model('Documents', docSchema);