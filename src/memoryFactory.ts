import * as vscode from 'vscode';
import { relative } from 'path';


let DocModel = require('./models/document');


export function MFaddDoc(name:vscode.Uri = vscode.window.activeTextEditor.document.uri){
	//vscode.workspace.workspaceFolders[0]: The rootPath
	vscode.window.showInformationMessage(`Successfully called add doc.${name.fsPath}\nFrom workSpaceFolder${vscode.workspace.workspaceFolders[0].name}`);
	const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
	let msg = new DocModel({
		doc: relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath),
		label: name.fsPath.replace(/^.*[\\\/]/, ''),
		toreview_date: tomorrow,
		reviewed_dates:[]
	});
	msg.save().catch((err:any)=>{
		console.error(err);
	});
}

export function MFaddReviewedDate(name:vscode.Uri = vscode.window.activeTextEditor.document.uri){
	//vscode.workspace.workspaceFolders[0]: The rootPath
	vscode.window.showInformationMessage(`Successfully called add review time stamp.${name.fsPath}\nFrom workSpaceFolder${vscode.workspace.workspaceFolders[0].name}`);
	// let msg = new DocModel({
	// 	doc: relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath),
	// 	label: name.fsPath.replace(/^.*[\\\/]/, ''),
	// 	reviewed_dates:[]
	// });
	// msg.save().catch((err:any)=>{
	// 	console.error(err);
	// });
	DocModel.findOneAndUpdate(
		{ doc: relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath)}, 
		{ $push: { reviewed_dates: new Date() } },
		{
			new: true,                       // return updated doc
			runValidators: true              // validate before update
		}
	).then(doc => {
		console.log(doc)
	  })
	  .catch(err => {
		console.error(err)
	  });
	// DocModel.findOneAndUpdate
}