'use strict';

import * as vscode from 'vscode';

import {AllDocViewProvider, NeedReviewDocViewProvider} from './allDocview';
import {MFaddDoc, MFdeleteDoc, MFaddReviewedDate, MFsetToReviewDate} from './memoryFactory';
import {MFaddGroup} from './memoryFactory';
import { join } from 'path';
import { getWebviewContent } from "./getwebpage";
import { MFgetDocJson, updateJsonDoc } from "./memoryFactory";

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
		vscode.window.showInformationMessage(`open file ${resource}`);
		vscode.window.showTextDocument(vscode.Uri.file(join(vscode.workspace.workspaceFolders[0].uri.fsPath, resource)))});
	vscode.commands.registerCommand('MemoryFactory.addReviewedDate', MFaddReviewedDate);
	// group related commands
	vscode.commands.registerCommand('MemoryFactory.addGroup', MFaddGroup);
	
	vscode.window.showInformationMessage(`Memory factory started`);

	let currentPanel: vscode.WebviewPanel | undefined = undefined;

	vscode.commands.registerCommand('MemoryFactory.showInfoPage', () => {
		// Create and show a new webview
		if (currentPanel) {
			currentPanel.reveal(vscode.ViewColumn.One);
		  } else {
			currentPanel = vscode.window.createWebviewPanel(
			  'catCoding',
			  'Cat Coding',
			  vscode.ViewColumn.One,
			  {
				enableScripts: true
			  }
			);
		}
		let iteration = 0;
		const updateWebview = () => {
		  const cat = iteration++ % 2 ? 'Compiling Cat' : 'Coding Cat';
		  currentPanel.title = cat;
		  currentPanel.webview.html = getWebviewContent(cat);
		};
  
		// Set initial content
		updateWebview();
  
		// And schedule updates to the content every second
		const interval = setInterval(updateWebview, 10000);

		currentPanel.onDidDispose(
			() => {
			  // When the panel is closed, cancel any future updates to the webview content
			  clearInterval(interval);
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
	context.subscriptions.push(
		vscode.commands.registerCommand('MemoryFactory.updateDocInfo', async () => {
		  if (!currentPanel) {
			return;
		  }
		  // Send a message to our webview.
		  // You can send any JSON serializable data.
		//   currentPanel.webview.postMessage({ command: 'refactor' });
		  currentPanel.webview.postMessage({ command: 'update', 
											text: await MFgetDocJson()});
		})
	  );

}
