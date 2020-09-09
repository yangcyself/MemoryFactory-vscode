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
	const targetToReivew:Date = calcToReviewDate(Doc.reviewed_dates);
	const toReview:Date = await QuickPickDate(targetToReivew);
	// update the to_review date
	Doc.toreview_date = toReview;
	Doc.save();
}


async function QuickPickDate(TargetToReivew:Date): Promise<Date> {
	let i = 0;
	const dates:Date[] = [];
	const TODAY = new Date();
	const prepostfixlength = 7;

	for (let i = 0; i < prepostfixlength; i++) {
		const pretmpdate = new Date(TargetToReivew.getTime());
		pretmpdate.setDate(pretmpdate.getDate()-i);
		dates[i] = pretmpdate;
		const posttmpdate = new Date(TargetToReivew.getTime());
		posttmpdate.setDate(posttmpdate.getDate()+i);
		dates[i+prepostfixlength] = posttmpdate;
	}
	const pickItems:QuickPickDateItem[] = dates.filter(d=> d.getTime()>TODAY.getTime())
							.map(d => { const tod0 = new Date(d.getTime()); tod0.setUTCHours(0,0,0);
										const tom0 = new Date(tod0.getTime()); tom0.setDate(tod0.getDate()+1);
								return new QuickPickDateItem(d.toDateString(),d, 
								DocModel.countDocuments({
									toreview_date: {
										$lt: tom0,
										$gte: tod0
									}},
									(err:any,count:number)=>String(count))  // Count the elements in the list
							)});

	const result = await vscode.window.showQuickPick(pickItems, {
		placeHolder: 'eins, zwei or drei',
		// onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
	});
	vscode.window.showInformationMessage(`Got: ${result}`);
	return  result.date;
}

class QuickPickDateItem implements vscode.QuickPickItem{
	constructor(
		public readonly label: string,
		public readonly date: Date,
		public readonly description:string
	  ){}
}