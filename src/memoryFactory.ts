import * as vscode from 'vscode';
import { relative } from 'path';


let DocModel = require('./models/document');


export function MFaddDoc(name:vscode.Uri = vscode.window.activeTextEditor.document.uri){
	//vscode.workspace.workspaceFolders[0]: The rootPath
	vscode.window.showInformationMessage(`Successfully called add doc.${name.fsPath}\nFrom workSpaceFolder${vscode.workspace.workspaceFolders[0].name}`);
	let msg = new DocModel({
		doc: relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath),
		label: name.fsPath.replace(/^.*[\\\/]/, ''),
		reviewed_dates:[]
	});
	msg.save().catch((err:any)=>{
		console.error(err);
	});
}