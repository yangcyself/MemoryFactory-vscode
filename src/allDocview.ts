import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';
import { Database } from './database';
import simpleGit, {SimpleGit,SimpleGitOptions} from 'simple-git'; // used in singelon repoUrl
import { pathgetter,pathsetter } from "./utils/pathutil";

let DocModel = require('./models/document');
let GroupModel = require('./models/group');

const db = new Database();


export class AllDocViewProvider implements vscode.TreeDataProvider<Document> {
  constructor(private workspaceRepo: string) {
    
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

  getChildren(element?: AllDocViewElement): Thenable<Document[]> {

    if (element && element.elemType==AllDocViewElementType.document) {
		  return Promise.resolve([]);
    } else if (element && element.elemType==AllDocViewElementType.group){
      return Promise.resolve( 
        DocModel.find(
          {"ancestors": pathsetter(element.doc_path),
           "repository":repoURL.url}
        )
        .then((doc:[any]) => {
        return doc.map((d:any)=> new Document(d.label,  vscode.TreeItemCollapsibleState.None,
                                              d.doc,    d.toreview_date));
        })
        .catch(err => {
        console.error(err)
        }) );
    } else { // Root 
      return Promise.resolve(
        GroupModel.find({"repository":repoURL.url})
        .then((doc:[any]) => {
          return doc.map((d:any)=> new Group(d.label,  vscode.TreeItemCollapsibleState.Collapsed,
                                                d.path));
        })
        .catch(err => {
          console.error(err)
        })
      );
    }
  }

  // Refresh
  private _onDidChangeTreeData: vscode.EventEmitter<Document | undefined> = new vscode.EventEmitter<Document | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Document | undefined> = this._onDidChangeTreeData.event;


	refresh(): void {
    repoURL.refresh();
		this._onDidChangeTreeData.fire(null);
	}
}


export class NeedReviewDocViewProvider implements vscode.TreeDataProvider<Document> {
  constructor(private workspaceRepo: string) {
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
        "toreview_date": {
          "$lte": today24
      },
        "repository" : repoURL.url
      })
		  .then((doc:[any]) => {
      return Promise.all(doc.map(async (d:any) =>  {
        const g = await GroupModel.findOne({"path":{"$in":d.ancestors},
                                            "repository":repoURL.url}).catch(err =>{console.error(err)});
        return new Document(`${g.label} ${d.label}`,  vscode.TreeItemCollapsibleState.None,
                                            d.doc,    d.toreview_date)}));
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
    repoURL.refresh();
		this._onDidChangeTreeData.fire(null);
	}
}

enum AllDocViewElementType{
  document,
  group
}
interface AllDocViewElement{
  elemType:AllDocViewElementType
  readonly doc_path:string
}


export class Document extends vscode.TreeItem implements AllDocViewElement{
  elemType:AllDocViewElementType
  constructor(
    public readonly label: string,
    // private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly doc_path:string,
    public readonly toReivewDate:Date
  ) {
    super(label, collapsibleState);
    this.elemType = AllDocViewElementType.document;
    this.command = { command: 'MemoryFactory.openFile', title: "Open File", arguments: [this.doc_path], };
    this.description = toReivewDate.toDateString();
  }
}

class Group extends vscode.TreeItem implements AllDocViewElement{
  elemType:AllDocViewElementType
  constructor(
    public readonly label: string,
    // private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly doc_path:string
  ) {
    super(label, collapsibleState);
    this.elemType = AllDocViewElementType.group;
  }
}


class RepoURL
{
    private static _instance: RepoURL;

    private constructor()
    {
      this.refresh();
    }

    public static get Instance()
    {
        return this._instance || (this._instance = new this());
    }

    private _url:String|void;
    
    public get url() {return this._url};

    public async refresh() { 
      if (!this._url) this._url = await this.getUrl();
      if (this._url) this._url = this._url.trim();
    }

    private getUrl(): Promise<String|void>{	
        const options: SimpleGitOptions = {
          baseDir: vscode.workspace.rootPath,
          binary: 'git',
          maxConcurrentProcesses: 6,
          config:[],
          trimmed: true
        };
        const git: SimpleGit = simpleGit(options);
        const gitroot =  git.remote(['get-url','origin']);
        return gitroot;
    }

}

export const repoURL = RepoURL.Instance;
