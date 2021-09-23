import * as vscode from 'vscode';
import loginfo from './serverPass';

let mongoose = require('mongoose');
const fs = require('fs');

const server = loginfo.server ; // 'cluster0.ncugx'; // REPLACE WITH YOUR DB SERVER
const pass = loginfo.password;
const user = loginfo.user;
console.log(`${user}:${pass}@${server}`);
const database = 'memoryFactory';      // REPLACE WITH YOUR DB NAME


export class Database {
  constructor() {
    this._connect()
  }

_connect() {
    mongoose.connect(`mongodb+srv://${user}:${pass}@${server}.mongodb.net/${database}`)
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