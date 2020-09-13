/**
 * Runnable on Cloudflare Workers
 */

const badgeNamePattern = /^[a-z_\-\d]{0,32}$/i;
const namePattern = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const repoPattern = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,100}$/i;
const branchPattern = /^[a-z\d_\-]{0,255}$/i;

const error = 'FF0000';

// Valid:
// RubbaBoy/EmojIDE/badgeName
// RubbaBoy/EmojIDE/badgeName/master
// RubbaBoy/EmojIDE/badgeName/master/path/here/stuff.json
async function handleRequest(request) {
    let url = new URL(request.url)
    let splitted = url.pathname.substr(1).split('/')
    let nameorg = splitted[0];
    let repo = splitted[1];
    let badgeName = splitted[2];
    let branch = splitted[3] || 'shields';
    let path = splitted[4] || 'shields.json';

    if (!badgeNamePattern.test(badgeName) || !namePattern.test(nameorg) || !repoPattern.test(repo) || !branchPattern.test(branch)) {
        return sendResult('BYOB', 'Invalid request', error);
    }

    let res = await fetch(`https://raw.githubusercontent.com/${nameorg}/${repo}/${branch}/${path}`)

    if (res.status < 200 || res.status >= 300) {
        return sendResult('BYOB', `No config found (${res.status})`, error);
    }

    let parsed = loadBody(await res.text());

    if (parsed === undefined) {
        return sendResult('BYOB', 'Invalid file', error);
    }

    let currBadge = parsed[badgeName];

    if (currBadge === undefined) {
        return sendResult('BYOB', 'Badge not found', error);
    }

    return sendResult(currBadge['label'], currBadge['status'], currBadge['color']);
}

addEventListener("fetch", event => {
    return event.respondWith(handleRequest(event.request))
})

function loadBody(body) {
    try {
        return JSON.parse(body);
    } catch (_) {
        return undefined;
    }
}

async function sendResult(label, status, color) {
    let res = await fetch(badgeUrl(label, status, color))
    let response = new Response(res.body, res)
    response.headers.append('ETag', Date.now())
    response.headers.append('Cache-Control', 'no-cache')
    response.headers.append('Pragma', 'no-cache')
    response.headers.append('Content-Type', 'image/svg+xml')
    return response
}

function badgeUrl(label, status, color) {
    return `https://badgen.net/badge/${label || 'N/A'}/${status || 'N/A'}/${color || 'N/A'}?cache=300`;
}
