'use strict';

import * as vscode from 'vscode';

import {AllDocViewProvider, NeedReviewDocViewProvider} from './allDocview';
import {MFaddDoc, MFdeleteDoc, MFaddReviewedDate, MFsetToReviewDate} from './memoryFactory';
import {MFaddGroup} from './memoryFactory';
import { join } from 'path';

import simpleGit, {SimpleGit,SimpleGitOptions} from 'simple-git';

let repoModel = require('./models/repository');

export async function activate(context: vscode.ExtensionContext) {
	// let msg = new DocModel({
	// 	doc: "tmp/test1",
	// 	label: "TEST1",
	// 	reviewed_dates:[]
	// });
	// msg.save().catch((err:any)=>{
	// 	console.error(err);
	// })
	const options: SimpleGitOptions = {
		baseDir: vscode.workspace.rootPath,
		binary: 'git',
		maxConcurrentProcesses: 6,
	 };
	const git: SimpleGit = simpleGit(options);
	const gitroot = await git.remote(['get-url','origin']);
	const repo = await repoModel.findOne({"path":gitroot});
	console.log(`repo${repo}`);
	if(!repo){return;}
	
	const allDocViewProvider =  new AllDocViewProvider(vscode.workspace.rootPath);
	const needReviewDocViewProvider =  new NeedReviewDocViewProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('MF-all-documents', allDocViewProvider);
	vscode.window.registerTreeDataProvider('MF-need-review-doc', needReviewDocViewProvider);
	vscode.commands.registerCommand('MF-all-documents.refresh', () => allDocViewProvider.refresh());
	vscode.commands.registerCommand('MF-need-review-doc.refresh', () => needReviewDocViewProvider.refresh());
	vscode.commands.registerCommand('MemoryFactory.addDoc', MFaddDoc);
	vscode.commands.registerCommand('MemoryFactory.deleteDoc', MFdeleteDoc);
	vscode.commands.registerCommand('MemoryFactory.setToreviewDate', MFsetToReviewDate);
	vscode.commands.registerCommand('MemoryFactory.openFile', (resource) => {
		vscode.window.showInformationMessage(`open file ${resource}`);
		vscode.window.showTextDocument(vscode.Uri.file(join(vscode.workspace.workspaceFolders[0].uri.fsPath, resource)))});
	vscode.commands.registerCommand('MemoryFactory.addReviewedDate', MFaddReviewedDate);
	// group related commands
	vscode.commands.registerCommand('MemoryFactory.addGroup', MFaddGroup);
	
	vscode.window.showInformationMessage(`Memory factory started`);
}
