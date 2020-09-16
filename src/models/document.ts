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
	}
})


// returns an array of paths of the parent directories
// Using fat arrow functions will change what `this` refers to.
docSchema.virtual('ancestors').get(function() {
	const pathItems = this.doc.split(path.posix.sep);
	const ancsArray:string[] = [pathItems[0]];
	for (let i = 1; i < pathItems.length; i++) {
		ancsArray.push(path.join(ancsArray[ancsArray.length - 1],pathItems[i]));
	}
	return ancsArray;
})

module.exports = mongoose.model('Documents', docSchema);