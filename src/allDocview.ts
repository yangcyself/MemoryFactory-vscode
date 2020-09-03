import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';
import { Database } from './database';

let DocModel = require('./models/document');
const db = new Database();


export class AllDocViewProvider implements vscode.TreeDataProvider<Document> {
  constructor(private workspaceRoot: string) {
  }

  // Methods for getting the items and expand to get the childern
  getTreeItem(element: Document): vscode.TreeItem {
    // const treeItem = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    // const treeItem = element;
		// if (element.type === vscode.FileType.File) {
    // treeItem.command = { command: 'MemoryFactory.openFile', title: "Open File", arguments: [element.doc_path], };
    // treeItem.contextValue = 'file';
    // treeItem.tooltip = "tooltip";
		// }
    // return treeItem;
    return element
  }

  getChildren(element?: Document): Thenable<Document[]> {

    if (element) {
		return Promise.resolve([]);
    } else {
		return Promise.resolve( 
      DocModel.find()
		  .then((doc:[any]) => {
      return doc.map((d:any)=> new Document(d.label,  vscode.TreeItemCollapsibleState.None,
                                            d.doc,    d.toreview_date));
		  })
		  .catch(err => {
			console.error(err)
		  }) );
		
    }
  }

  // Refresh
  private _onDidChangeTreeData: vscode.EventEmitter<Document | undefined> = new vscode.EventEmitter<Document | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Document | undefined> = this._onDidChangeTreeData.event;


	refresh(): void {
    vscode.window.showInformationMessage(`MF: Clicked Refresh`);
		this._onDidChangeTreeData.fire(null);
	}
}

export class NeedReviewDocViewProvider implements vscode.TreeDataProvider<Document> {
  constructor(private workspaceRoot: string) {
  }

  // Methods for getting the items and expand to get the childern
  getTreeItem(element: Document): vscode.TreeItem {
    return element
  }

  getChildren(element?: Document): Thenable<Document[]> {
    const today24 = new Date();
    today24.setUTCHours(23,59,59);
    if (element) {
		return Promise.resolve([]);
    } else {
		return Promise.resolve( 
      DocModel.find({
        toreview_date: {
          $lte: today24
      }
      })
		  .then((doc:[any]) => {
      return doc.map((d:any)=> new Document(d.label,  vscode.TreeItemCollapsibleState.None,
                                            d.doc,    d.toreview_date));
		  })
		  .catch(err => {
			console.error(err)
		  }) );
		
    }
  }

  // Refresh
  private _onDidChangeTreeData: vscode.EventEmitter<Document | undefined> = new vscode.EventEmitter<Document | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Document | undefined> = this._onDidChangeTreeData.event;


	refresh(): void {
    vscode.window.showInformationMessage(`MF: Clicked Refresh`);
		this._onDidChangeTreeData.fire(null);
	}
}

class Document extends vscode.TreeItem {
  doc_path:string;

  constructor(
    public readonly label: string,
    // private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly doc:string,
    public readonly toReivewDate:Date
  ) {
    super(label, collapsibleState);
    this.doc_path = doc;
    this.command = { command: 'MemoryFactory.openFile', title: "Open File", arguments: [this.doc_path], };
    this.toReivewDate = toReivewDate;
    this.description = toReivewDate.toDateString();
  }
}