import * as vscode from 'vscode';

let mongoose = require('mongoose');

const server = '127.0.0.1:27017'; // REPLACE WITH YOUR DB SERVER
const database = 'memoryFactory';      // REPLACE WITH YOUR DB NAME


export class Database {
  constructor() {
    this._connect()
  }
  
_connect() {
    mongoose.connect(`mongodb://${server}/${database}`)
       .then(() => {
		 console.log('Database connection successful:',`mongodb://${server}/${database}`)
		 vscode.window.showInformationMessage('Database connection successful:',`mongodb://${server}/${database}`);
       })
       .catch((err:Error) => {
         console.error('Database connection error')
       })
  }
}

// module.exports = new Database()
// export Database = Database;