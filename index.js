const express = require('express');
const app = express();
const request = require('request');

const badgeNamePattern = /^[a-z_\-\d]{0,32}$/i;
const namePattern = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const repoPattern = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,100}$/i;
const branchPattern = /^[a-z\d_\-]{0,255}$/i;

const error = 'FF0000';

// Valid:
// RubbaBoy/EmojIDE/badgeName
// RubbaBoy/EmojIDE/badgeName/master
// RubbaBoy/EmojIDE/badgeName/master/path/here/stuff.json
app.get(["/:nameorg/:repo/:name/:branch?", "/:nameorg/:repo/:name/:branch/*"], async (req, result) => {
    let badgeName = req.params['name'];
    let nameorg = req.params['nameorg'];
    let repo = req.params['repo'];
    let branch = req.params['branch'] || 'shields';
    let path = req.params['0'] || 'shields.json';

    if (!badgeNamePattern.test(badgeName) || !namePattern.test(nameorg) || !repoPattern.test(repo) || !branchPattern.test(branch)) {
        return sendResult(result, 'BYOB', 'Invalid request', error);
    }

    console.log(`https://raw.githubusercontent.com/${nameorg}/${repo}/${branch}/${path}`);
    request(`https://raw.githubusercontent.com/${nameorg}/${repo}/${branch}/${path}`, {}, (err, res, body) => {

        if (res.statusCode < 200 || res.statusCode >= 300) {
            return sendResult(result, 'BYOB', 'No config found (' + res.statusCode + ')', error);
        }

        let parsed = loadBody(body);

        if (parsed === undefined) {
            return sendResult(result, 'BYOB', 'Invalid file', error);
        }

        let currBadge = parsed[badgeName];

        if (currBadge === undefined) {
            return sendResult(result, 'BYOB', 'Badge not found', error);
        }

        sendResult(result, currBadge['label'], currBadge['status'], currBadge['color']);
    })
})

app.get('*', (req, res) => sendResult(res, 'BYOB', 'error', error))

app.listen(3000, () => console.log(`BYOB listening at http://localhost:3000`))

function loadBody(body) {
    try {
        return JSON.parse(body);
    } catch (_) {
        return undefined;
    }
}

function sendResult(result, label, status, color) {
    return request(badgeUrl(label, status, color), {}, (e, r, b) => {
        result.setHeader('ETag', Date.now());
        result.setHeader('Cache-Control', 'no-cache');
        result.setHeader('Pragma', 'no-cache');
        result.setHeader('Content-Type', 'image/svg+xml');
        result.send(b);
    })
}

function badgeUrl(label, status, color) {
    return `https://badgen.net/badge/${label || 'N/A'}/${status || 'N/A'}/${color || 'N/A'}?cache=300`;
}
