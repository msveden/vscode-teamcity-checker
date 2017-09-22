var vscode = require('vscode');
var branchResolver = require('./branch-resolver');
var teamCityStatusChecker = require('./teamcity-status-checker');

var workspaceFolder = null;
var interval = null;

function onWorkspaceFolderChange(newWorkspaceFolder) {
    let config = vscode.workspace.getConfiguration('teamcity_checker');
    const check = () => { 
        branchResolver.resolveBranchName(workspaceFolder, (repoName, branchName) => {
            teamCityStatusChecker.check(config.baseUrl, repoName, branchName, config.username, config.password) 
        });        
    };
    clearInterval(interval);
    interval = setInterval(check, config.interval);
    check();
}

function activate(context) {
    if (vscode.workspace.rootPath != workspaceFolder) {
        workspaceFolder = vscode.workspace.rootPath;
        onWorkspaceFolderChange(workspaceFolder);
    }
}

function deactivate() {
    clearInterval(interval);
}

exports.activate = activate;
exports.deactivate = deactivate;