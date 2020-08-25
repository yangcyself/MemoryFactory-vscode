import * as vscode from 'vscode';

let DocModel = require('./models/document');

export function MFaddDoc(name:vscode.Uri = vscode.window.activeTextEditor.document.uri){
	vscode.window.showInformationMessage(`Successfully called add doc.${name.fsPath}`);
	let msg = new DocModel({
		doc: name.fsPath,
		label: name.fsPath.replace(/^.*[\\\/]/, ''),
		reviewed_dates:[]
	});
	msg.save().catch((err:any)=>{
		console.error(err);
	});
}