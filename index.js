// This file is deployed to Runkit, to allow for rapid development and to allow others to host their own versions of this.
// The first chunk of code between this and the next comment are for local development, and should not be
// copied over when deploying. The same goes with the last few lines, as denoted by comments.

const express = require("express");

function tonicExpress(anExport) {
    let mount = express();
    let app = express();

    mount.use(process.env.TONIC_MOUNT_PATH || "", app);

    if (anExport) {
        anExport.tonicEndpoint = mount;
    }

    app.listen = function () {
    }

    return app;
}

module.exports = tonicExpress



// When deploying to RunKit, copy from here down (Uncommenting the first line after this)


// const express = require('@runkit/runkit/express-endpoint/1.0.0');
const app = express(exports);
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

    request(`https://raw.githubusercontent.com/${nameorg}/${repo}/${branch}/${path}`, {}, (err, res, body) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            return sendResult(result, 'BYOB', 'No config found', error);
        }

        let parsed = loadBody(path, body);

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

function loadBody(path, body) {
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



// Don't deploy here down

app.listen(9090)
console.log('Ready!');
