'use strict';

import * as vscode from 'vscode';

import {AllDocViewProvider, NeedReviewDocViewProvider} from './allDocview';
import {MFaddDoc, MFdeleteDoc, MFaddReviewedDate, MFsetToReviewDate, MFrewardMySelf} from './memoryFactory';
import {MFaddGroup} from './memoryFactory';
import { join } from 'path';
import { getWebviewContent } from "./getwebpage";
import { MFgetDocJson, updateJsonDoc } from "./memoryFactory";

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export async function activate(context: vscode.ExtensionContext) {
	// let msg = new DocModel({
	// 	doc: "tmp/test1",
	// 	label: "TEST1",
	// 	reviewed_dates:[]
	// });
	// msg.save().catch((err:any)=>{
	// 	console.error(err);
	// })
	
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
		vscode.window.showInformationMessage(`open file ${resource}`,"safe")
			.then(selection => {console.log(selection); MFrewardMySelf(selection)});
		vscode.commands.executeCommand('MemoryFactory.updateDocInfo');
		vscode.window.showTextDocument(vscode.Uri.file(join(vscode.workspace.workspaceFolders[0].uri.fsPath, resource)))});
	vscode.commands.registerCommand('MemoryFactory.addReviewedDate', MFaddReviewedDate);
	// group related commands
	vscode.commands.registerCommand('MemoryFactory.addGroup', MFaddGroup);
	
	vscode.window.showInformationMessage(`Memory factory started`);

	vscode.commands.registerCommand('MemoryFactory.showInfoPage', () => {
		// Create and show a new webview
		if (currentPanel) {
			currentPanel.reveal(vscode.ViewColumn.Two);
		  } else {
			currentPanel = vscode.window.createWebviewPanel(
			  'catCoding',
			  'Cat Coding',
			  vscode.ViewColumn.Two,
			  {
				enableScripts: true
			  }
			);
		}
		
		const updateWebview = () => {
		  currentPanel.title = 'document Info';
		  currentPanel.webview.html = getWebviewContent();
		};
  
		// Set initial content
		updateWebview();
		
		currentPanel.onDidDispose(
			() => {
				currentPanel = null;
			},
			null,
			context.subscriptions
		);

		currentPanel.webview.onDidReceiveMessage(
			message => {
			  switch (message.command) {
				case 'alert':
				  vscode.window.showErrorMessage(message.text);
				  return;
				case 'log':
				  updateJsonDoc(JSON.parse(message.text));
				  return;
			  }
			},
			undefined,
			context.subscriptions
		);
	});
	
	vscode.commands.registerCommand('MemoryFactory.updateDocInfo', async () => {
		if (!currentPanel) {
		return;
		}
		// Send a message to our webview.
		// You can send any JSON serializable data.
		// currentPanel.webview.postMessage({ command: 'refactor' });
		currentPanel.webview.postMessage({ command: 'update', 
										text: await MFgetDocJson()});
	})

}
