/**
 * Runnable on Cloudflare Workers
 */

const namePattern = /^\S+$/i;

const error = 'FF0000';

// Valid:
// RubbaBoy/EmojIDE/badgeName
// RubbaBoy/EmojIDE/badgeName/master
// RubbaBoy/EmojIDE/badgeName/master/path/here/stuff.json
async function handleRequest(request) {
    let url = new URL(request.url)
    let splitted = url.pathname.substr(1).split('/')
    let [nameorg, repo, badgeName, branch, ...split_path ] = splitted
    branch = branch || 'shields';
    let path = 'shields.json';
    if (split_path.length > 0) {
        path = split_path.join('/')
    }

    if (!namePattern.test(badgeName)) {
        return sendResult('BYOB', 'Invalid badge name in request', error);
    }

    if (!namePattern.test(nameorg)) {
        return sendResult('BYOB', 'Invalid github org name in request', error);
    }

    if (!namePattern.test(branch)) {
        return sendResult('BYOB', 'Invalid branch name in request', error);
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

    return sendResult(currBadge['label'], currBadge['icon'], currBadge['status'], currBadge['color']);
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

async function sendResult(label, icon, status, color) {
    let res = await fetch(badgeUrl(label, icon, status, color))
    let response = new Response(res.body)
    response.headers.append('ETag', Date.now())
    response.headers.append('Cache-Control', 'no-cache')
    response.headers.append('Pragma', 'no-cache')
    response.headers.append('Content-Type', 'image/svg+xml')
    return response
}

function badgeUrl(label, icon, status, color) {
    let statusString = 'N/A';
    if (status !== undefined) {
        statusString = encodeURIComponent(status)
    }

    let iconString = '';
    if (icon !== undefined) {
        iconString = `&icon=${icon}`
    }

    let labelString = '&label';
    if (label !== undefined) {
        labelString += `=${label}`
    }

    return `https://badgen.net/badge/_/${statusString}/${color || 'N/A'}?cache=300${iconString}${labelString}`
}
