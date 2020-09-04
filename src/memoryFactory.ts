import * as vscode from 'vscode';
import { relative } from 'path';


let DocModel = require('./models/document');

function calcToReviewDate(reviewed_dates:[Date]):Date{
	var reviewRank = 0;
	const toReviewDate = new Date(reviewed_dates[0].getTime());
	for (let i = 0; i < reviewed_dates.length; i++) {
		const rwdate = reviewed_dates[i];
		var Difference_In_Time = rwdate.getTime() - toReviewDate.getTime(); 
		// To calculate the no. of days between two dates 
		var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
		if(Difference_In_Days<-Math.pow(2,reviewRank-1)){ // reviewed too early
			toReviewDate.setDate(rwdate.getDate() + Math.pow(2,reviewRank));
		}else if(Difference_In_Days<1){
			reviewRank = reviewRank+1;
			toReviewDate.setDate(rwdate.getDate() + Math.pow(2,reviewRank));
		}else{
			reviewRank =  reviewRank-1;
			toReviewDate.setDate(rwdate.getDate() + Math.pow(2,reviewRank));
		}
	}
	return toReviewDate;
}

export function MFaddDoc(name:vscode.Uri = vscode.window.activeTextEditor.document.uri){
	//vscode.workspace.workspaceFolders[0]: The rootPath
	vscode.window.showInformationMessage(`Successfully called add doc.${name.fsPath}\nFrom workSpaceFolder${vscode.workspace.workspaceFolders[0].name}`);
	const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
	let msg = new DocModel({
		doc: relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath),
		label: name.fsPath.replace(/^.*[\\\/]/, ''),
		toreview_date: tomorrow,
		reviewed_dates:[new Date()]
	});
	msg.save().catch((err:any)=>{
		console.error(err);
	});
}

export async function MFaddReviewedDate(name:vscode.Uri = vscode.window.activeTextEditor.document.uri){
	//vscode.workspace.workspaceFolders[0]: The rootPath
	vscode.window.showInformationMessage(`Successfully called add review time stamp.${name.fsPath}\nFrom workSpaceFolder${vscode.workspace.workspaceFolders[0].name}`);
	// TODO: change this part an atomic operation (although not required in MF)

	// DocModel.findOneAndUpdate(
	// 	{ doc: relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath)}, 
	// 	{ $push: { reviewed_dates: new Date() }},
	// 	{
	// 		new: true,                       // return updated doc
	// 		runValidators: true              // validate before update
	// 	}
	// ).then(doc => {
	// 	console.log(doc)
	//   })
	//   .catch(err => {
	// 	console.error(err)
	//   });

	// push the reviewed_date
	const Doc = await DocModel.findOne({doc: relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath)});
	Doc.reviewed_dates.push(new Date());
	// Calc the to review date
	const toReivew = calcToReviewDate(Doc.reviewed_dates);
	// update the to_review date
	Doc.toreview_date = toReivew;
	Doc.save();
}