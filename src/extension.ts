'use strict';

import * as vscode from 'vscode';

import {AllDocViewProvider} from './allDocview';

let DocModel = require('./models/document');

export function activate(context: vscode.ExtensionContext) {
	// let msg = new DocModel({
	// 	doc: "tmp/test1",
	// 	label: "TEST1",
	// 	reviewed_dates:[]
	// });
	// msg.save().catch((err:any)=>{
	// 	console.error(err);
	// });

	const allDocViewProvider =  new AllDocViewProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('MF-all-documents', allDocViewProvider);
}