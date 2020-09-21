var mongoose = require('mongoose');

// Simple schema for repos, repos url are the unique identifiers of the workspace
let repositorySchema = new mongoose.Schema({ 
	path: {
		type: String,
		required: true,
		unique: true,
	}
})

module.exports = mongoose.model('repository', repositorySchema);