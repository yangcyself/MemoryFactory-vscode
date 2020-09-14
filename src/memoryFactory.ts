import * as vscode from 'vscode';
import { relative,isAbsolute } from 'path';
import * as moment from 'moment'; // to validate date string
import {Document as DocViewItem} from './allDocview';

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
	// vscode.window.showInformationMessage(`Successfully called add doc.${name.fsPath}\nFrom workSpaceFolder${vscode.workspace.workspaceFolders[0].name}`);
	if(!isSubDirectory(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath)){
		vscode.window.showInformationMessage('trying to add a doc not in workspace: ${name.fspath}');
		return;
	}
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


//! I put an 'any' below to bypass the type checker. TODO: find a better way to do this.
//! Note both types are needed as they are arugments from treeview context and from direct command line
export function MFdeleteDoc(name:vscode.Uri|DocViewItem|any = vscode.window.activeTextEditor.document.uri){
	console.log(typeof(name),name);
	// typeof(name)==DocViewItem;
	const relapath = name.fsPath? relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath) : name.doc_path;
	vscode.window.showInformationMessage(`Successfully called delete doc.${relapath}`);
	DocModel
	.findOneAndRemove({
		doc: relapath,
	})
	.then(response => {
		console.log(response)
	})
	.catch(err => {
		vscode.window.showInformationMessage(err);
		console.error(err)
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


export async function MFsetToReviewDate(name:vscode.Uri|DocViewItem|any = vscode.window.activeTextEditor.document.uri){
	console.log(typeof(name),name);
	const relapath = name.fsPath? relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath) : name.doc_path;
	const Doc = await DocModel.findOne({doc: relapath});
	// Calc the to review date
	const toReview:Date = await InputDate(Doc.toreview_date);
	// update the to_review date
	Doc.toreview_date = toReview;
	Doc.save();
}

async function InputDate(TargetToReivew:Date): Promise<Date> {
	const result = await vscode.window.showInputBox({
		value: TargetToReivew.toISOString().substring(0,10),
		valueSelection: [8, 10],
		placeHolder: 'YYYY-MM-DD',
		validateInput: (text:string) => {
			return moment(text, "YYYY-MM-DD", true).isValid() ? null : "please input YYYY-MM-DD";
		}
	});
	vscode.window.showInformationMessage(`Got: ${result}`);
	return new Date(result);
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
	const pickItems:QuickPickDateItem[] = await Promise.all( dates.filter(d=> d.getTime()>TODAY.getTime())
							.map(async (d) => { const tod0 = new Date(d.getTime()); tod0.setUTCHours(0,0,0);
										const tom0 = new Date(tod0.getTime()); tom0.setDate(tod0.getDate()+1);
										const c_num:string = await DocModel.countDocuments({ // Here the Type System CANNOT Tell that Mongoose Returned a NUMBER !!!!!!!
											toreview_date: {
												$lt: tom0,
												$gte: tod0
											}},
											(err:any,count:number)=>String(count)
											);  // Count the elements in the list
										const c:string = String(c_num);
								return new QuickPickDateItem(d.toDateString(),d, c);
								})).then((values)=>{
									// console.log(values);
									return values;});
	const result:QuickPickDateItem = await vscode.window.showQuickPick(pickItems, {
		placeHolder: 'Please select the date to review this document',
		// onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
	});
	// vscode.window.showInformationMessage(`Got: ${result}`);
	return  result.date;
}

class QuickPickDateItem implements vscode.QuickPickItem{
	constructor(
		public readonly label: string,
		public readonly date: Date,
		public readonly description:string
	  ){}
}


function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms*1000) );
}

function isSubDirectory(parent, child) {
	const rela = relative(parent, child);
	return rela && !rela.startsWith('..') && !isAbsolute(rela);;
  }