// export{}
let mongoose = require('mongoose');
import  * as path from 'path';

let docSchema = new mongoose.Schema({
	path: {
		type: [String],
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
	},
	difficulty:{ // numbers of 20min required
		type: Number,
		default: 1
	}
})

docSchema.virtual('doc').get(function() {
	return path.join.apply(path,this.path);
})

docSchema.virtual('doc').set(function(doc_path:string) {
	console.log(doc_path.split(path.sep));
	this.path =  doc_path.split(path.sep);
	console.log(this.path);
})

// // returns an array of relapahts of the parent directories
// // Using fat arrow functions will change what `this` refers to.
// docSchema.virtual('ancestors').get(function() {

// 	const ancsArray:string[] = [];
// 	const ancsNames:string[] = [];
// 	return 
// })

module.exports = mongoose.model('Documents', docSchema);