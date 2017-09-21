
const readline = require('readline');
const fs = require('fs');
const Promise = require('promise');
var findParentDir = require('find-parent-dir');

function fileExists(file_name) {
    return new Promise((resolve, reject) => {
        fs.stat(file_name, function (err, stats) {
            if (stats && stats.isFile()) {
                resolve();
            }
            else {
                reject();
            }
        });
    });

}

function resolveRepoNameFromGitConfigFile(file) {
    const rl = readline.createInterface({
        input: fs.createReadStream(file)
    });

    return new Promise((resolve, reject) => {
        let found = false;
        rl.on('line', function (line) {
            if (!found && line.endsWith('.git')) {
                let indexOfSlash = line.lastIndexOf('/');
                let repoName = line.substring(indexOfSlash + 1, line.length - 4);
                found = true;
                resolve(repoName);
            }
        });
        rl.on('close', () => {
            if (!found) {
                reject();
            }
        });
    });

}

function resolveBranchNameFromGitHeadFile(file) {
    const rl = readline.createInterface({
        input: fs.createReadStream(file)
    });

    return new Promise((resolve, reject) => {
        let found = false;
        rl.on('line', function (line) {
            if (!found && line.startsWith('ref:')) {
                let indexOfSlash = line.lastIndexOf('/');
                let branchName = line.substring(indexOfSlash + 1);
                found = true;
                resolve(branchName);
            }
        });
        rl.on('close', () => {
            if (!found) {
                reject();
            }
        });
    });
}

function resolveBranchName(repoDir, callback) {
    findParentDir(repoDir, '.git', function (err, dir) {
        if (dir) {
            let gitConfigFile = dir + '/.git/config';
            fileExists(gitConfigFile)
                .then(() => {
                    resolveRepoNameFromGitConfigFile(gitConfigFile)
                        .then(repoName => {
                            resolveBranchNameFromGitHeadFile(dir + '/.git/HEAD')
                                .then(branchName => callback(repoName, branchName));
                        });
                })
                .catch(() => {
                    callback();
                });
        }
        else {
            callback();
        }

    });
}

module.exports.resolveBranchName = resolveBranchName;