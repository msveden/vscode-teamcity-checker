var vscode = require('vscode');
var moment = require('moment');
var request = require('request');

let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

function isWantedRepo(properties, repoName) {
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        if (property.name === 'GitRepository' && property.value === repoName) {
            return true;
        }
    }
    return false;
}

function resolveStatusFromResponseBody(responseBody, repoName, branchName) {
    let json = JSON.parse(responseBody);
    let statuses = [];
    for (var i = 0; i < json.build.length; i++) {
        var build = json.build[i];
        if (build.branchName === branchName && isWantedRepo(build.properties.property, repoName)) {
            statuses.push({ date: moment(build.finishDate), status: build.status });
        }
    }
    // Sort descending
    statuses.sort((a, b) => {
        return a.date.isBefore(b.date) ? 1 : -1;
    });
    return statuses.length > 0 ? statuses[0] : null;
}

module.exports.check = (teamCityBaseUrl, repoName, branchName, username, password) => {

    var options = {
        url: teamCityBaseUrl + '/app/rest/builds?locator=defaultFilter:false,count:200&fields=build(branchName,status,properties(property),finishDate)',
        headers: {
            'Accept': 'application/json'
        }
    };

    request.get(options, (error, response, body) => {
        let text = '';
        if (error) {
            text = 'Error when trying to access TeamCity: ' + error;
        }
        else if (response.statusCode === 200) {
            let status = resolveStatusFromResponseBody(body, repoName, branchName);
            if (status) {
                text = 'Build status for ' + repoName + ' / ' + branchName + ' is ' + status.status + ' at ' + status.date.format('YYYY-MM-DD HH:mm:ss');
            }
            else {
                text = 'Could not find build status for ' + repoName + ' / ' + branchName;
            }
        }
        else if (response.statusCode === 404) {
            text = 'Could not find build status for ' + branchName;
        }
        else if (response.statusCode === 401) {
            text = 'Authentication failed. Check settings.';
        }
        else {
            text = 'Error, code: ' + response.statusCode;
        }
        statusBarItem.text = text;
        statusBarItem.show();
    }).auth(username, password);

}