import * as vscode from 'vscode';
import  * as path from 'path';
import * as moment from 'moment'; // to validate date string
import {Document as DocViewItem} from './allDocview';
import {repoURL} from "./allDocview";

let DocModel = require('./models/document');
let groupModel = require('./models/group');

function calcToReviewDate(reviewed_dates:[Date], reviewLevel:number ):Date{

	// the default review Level is 1, However, make the minimal to 2
	reviewLevel = Math.max(reviewLevel+1,2); 
	// mimic the process of forgetting and review as energy, dissipate in linear, and refill in exponent
	var reviewEnergy:number = reviewLevel*2-2; 
	var dateP = new Date(reviewed_dates[0].getTime()); dateP.setUTCHours(0,0,0);
	for (let i = 1; i < reviewed_dates.length; i++) {
		const rwdate = reviewed_dates[i]; rwdate.setUTCHours(0,0,0);
		const Difference_In_Time = rwdate.getTime() - dateP.getTime(); 
		// To calculate the no. of days between two dates 
		const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
		dateP = rwdate;

		const leftEnergy =  Math.max(reviewEnergy - Difference_In_Days, reviewLevel);
		reviewEnergy = leftEnergy + reviewLevel * Math.min(Difference_In_Days, leftEnergy);
	}

	//set the toReviewDate as the last date plus half of the energy (the most optimal time for review)
	const toReviewDate = new Date(dateP.getTime());
	toReviewDate.setDate(toReviewDate.getDate()+Math.ceil(reviewEnergy/2));
	return toReviewDate;
}

export async function MFaddDoc(name:vscode.Uri = vscode.window.activeTextEditor.document.uri){
	//vscode.workspace.workspaceFolders[0]: The rootPath
	// vscode.window.showInformationMessage(`Successfully called add doc.${name.fsPath}\nFrom workSpaceFolder${vscode.workspace.workspaceFolders[0].name}`);
	if(!isSubDirectory(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath)){
		vscode.window.showInformationMessage('trying to add a doc not in workspace: ${name.fspath}');
		return;
	}
	const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
	const label_result = await vscode.window.showInputBox({
		value: path.basename(name.fsPath,path.extname(name.fsPath)),
		placeHolder: 'name of doc',
		prompt: "name of the document"
	});
	let msg = new DocModel({
		doc: path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath),
		// label: name.fsPath.replace(/^.*[\\\/]/, ''),
		label: label_result,
		toreview_date: tomorrow,
		reviewed_dates:[new Date()],
		repository: repoURL.url
	});
	
	await msg.save()
	.then((msg:any)=>{
		vscode.commands.executeCommand('MF-all-documents.refresh');
		vscode.commands.executeCommand('MF-need-review-doc.refresh');
	})
	.catch((err:any)=>{
		console.error(err);
	});

	var g = await groupModel.findOne({"path":{"$in":msg.ancestors},
										"repository":repoURL.url})
							.catch(err =>{console.error(err)});
	
	if(!g){ // the doc does not belongs to any group
		g = await MFaddGroup(name);
	}
	
	msg.reviewLevel = g.reviewLevel;

	msg.save()
	.then((msg:any)=>{
		vscode.commands.executeCommand('MF-all-documents.refresh');
		vscode.commands.executeCommand('MF-need-review-doc.refresh');
	})
	.catch((err:any)=>{
		console.error(err);
	});
	
}


//! I put an 'any' below to bypass the type checker. TODO: find a better way to do this.
//! Note both types are needed as they are arugments from treeview context and from direct command line
export function MFdeleteDoc(name:vscode.Uri|DocViewItem|any = vscode.window.activeTextEditor.document.uri){
	console.log(typeof(name),name);
	// typeof(name)==DocViewItem;
	const relapath = name.fsPath? path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath) : name.doc_path;
	DocModel
	.findOneAndRemove({
		doc: relapath,
		repository: repoURL.url
	})
	.then(response => {
		console.log(response);
		vscode.commands.executeCommand('MF-all-documents.refresh');
		vscode.commands.executeCommand('MF-need-review-doc.refresh');
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
	// 	{ doc: path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath)}, 
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
	const Doc = await DocModel.findOne({doc: path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath),
										repository:repoURL.url});
	const today0 = new Date(); today0.setUTCHours(0,1,0);
	Doc.reviewed_dates.push(today0);
	// Calc the to review date
	const targetToReivew:Date = calcToReviewDate(Doc.reviewed_dates, Doc.reviewLevel);
	const toReview:Date = await QuickPickDate(targetToReivew);
	// update the to_review date
	Doc.toreview_date = toReview;
	Doc.save()
	.then((msg:any)=>{
		vscode.commands.executeCommand('MF-all-documents.refresh');
		vscode.commands.executeCommand('MF-need-review-doc.refresh');
	})
	.catch(err=>{
		console.log(err);
	});
}


export async function MFsetToReviewDate(name:vscode.Uri|DocViewItem|any = vscode.window.activeTextEditor.document.uri){
	console.log(typeof(name),name);
	const relapath = name.fsPath? path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath) : name.doc_path;
	const Doc = await DocModel.findOne({doc: relapath, repository:repoURL.url});
	// Calc the to review date
	const toReview:Date = await InputDate(Doc.toreview_date);
	// update the to_review date
	Doc.toreview_date = toReview;
	Doc.save()
	.then((msg:any)=>{
		vscode.commands.executeCommand('MF-all-documents.refresh');
		vscode.commands.executeCommand('MF-need-review-doc.refresh');
	})
	.catch(err=>{
		console.log(err);
	});
}

async function InputDate(TargetToReivew:Date): Promise<Date> {
	const result = await vscode.window.showInputBox({
		value: TargetToReivew.toISOString().substring(0,10),
		valueSelection: [8, 10],
		placeHolder: 'YYYY-MM-DD',
		prompt: "the date for next review",
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

// Group related methods

export async function MFaddGroup(name:vscode.Uri|DocViewItem|any = vscode.window.activeTextEditor.document.uri){
	if(!isSubDirectory(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath)){
		vscode.window.showInformationMessage('trying to add a doc not in workspace: ${name.fspath}');
		return;
	}
	const relapath:string = name.fsPath? path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, name.fsPath) : name.doc_path;
	const path_result = await vscode.window.showInputBox({
		value: path.dirname(relapath),
		valueSelection: [relapath.length,relapath.length],
		placeHolder: 'path of group',
		prompt: "path of the group",
		validateInput: (text:string) => {
			return isSubDirectory(text, relapath) ? null : "The group should be an ancestor of the file";
		}
	});
	const label_result = await vscode.window.showInputBox({
		value: path.basename(path_result),
		// valueSelection: [0,path.basename(path_result).length],
		placeHolder: 'name of group',
		prompt: "name of the group"
	});
	let msg = new groupModel({
		path: path_result,
		label:label_result,	
		repository: repoURL.url
	});
	msg.save()
	.then((msg:any)=>{
		vscode.commands.executeCommand('MF-all-documents.refresh');
		vscode.commands.executeCommand('MF-need-review-doc.refresh');
	})
	.catch((err:any)=>{
		console.error(err);
	});
	return msg;
}


function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms*1000) );
}

function isSubDirectory(parent, child) {
	const rela = path.relative(parent, child);
	return rela && !rela.startsWith('..') && !path.isAbsolute(rela);;
  }