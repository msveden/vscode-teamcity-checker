var vscode = require('vscode');
var moment = require('moment');
var request = require('request');

let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

module.exports.check = (teamCityBaseUrl, repoName, branchName, username, password) => {
    var url = teamCityBaseUrl + '/app/rest/builds?locator=defaultFilter:false&fields=build(branchName,status,properties(property),finishDate)';

    var options = {
        url: url,
        headers: {
            'Accept': 'application/json'
        }
    };

    request.get(options, (error, response, body) => {
        let text = '';
        if (error) {
            text = 'Error when trying to access TeamCity: ' + error;
        }
        else if (response.statusCode === 404) {
            text = 'Could not find build status for ' + branchName;
        }
        else if (response.statusCode === 401) {
            text = 'Authentication failed. Check settings.';
        }
        else if (response.statusCode === 200) {
            let json = JSON.parse(body);
            let statuses = [];
            for (var i = 0; i < json.build.length; i++) {
                var build = json.build[i];
                if (build.branchName != branchName) {
                    continue;
                }
                for (var ii = 0; ii < build.properties.property.length; ii++) {
                    var property = build.properties.property[ii];
                    if (property.name === 'GitRepository' && property.value === repoName) {
                        statuses.push({ date: moment(build.finishDate), status: build.status });
                        break;
                    }
                }
            }
            // Sort descending
            statuses.sort((a, b) => {
                return a.date.isBefore(b.date) ? 1 : -1;
            });
            if (statuses.length > 0) {
                let status = statuses[0];
                text = 'Build status for ' + repoName + ' / ' + branchName + ' is ' + status.status + ' at ' + status.date.format('YYYY-MM-DD HH:mm:ss');
            }
            else {
                text = 'Could not find build status for ' + repoName + ' / ' + branchName;
            }
        }
        else {
            text = 'Error, code: ' + response.statusCode;
        }
        statusBarItem.text = text;
        statusBarItem.show();
    }).auth(username, password);

}