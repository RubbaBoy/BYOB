/**
 * Runnable on Cloudflare Workers
 */

const namePattern = /^\S+$/i;

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
        return sendError('BYOB', 'Invalid badge name in request', 400);
    }

    if (!namePattern.test(nameorg)) {
        return sendError('BYOB', 'Invalid github org name in request', 400);
    }

    if (!namePattern.test(branch)) {
        return sendError('BYOB', 'Invalid branch name in request', 400);
    }

    let res = await fetch(`https://raw.githubusercontent.com/${nameorg}/${repo}/${branch}/${path}`)

    if (res.status < 200 || res.status >= 300) {
        return sendError('BYOB', `No config found (${res.status})`, 404);
    }

    let parsed = loadBody(await res.text());

    if (parsed === undefined) {
        return sendError('BYOB', 'Invalid file', 400);
    }

    let currBadge = parsed[badgeName];

    if (currBadge === undefined) {
        return sendError('BYOB', 'Badge not found', 404);
    }

    return sendResult(currBadge['label'], currBadge['status'], currBadge['color'], currBadge['icon']);
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

async function sendError(label, status, statusCode) {
    return sendResult(label, status, 'FF0000', undefined, statusCode)
}

async function sendResult(label, status, color, icon, statusCode = 200) {
    let res = await fetch(badgeUrl(label, icon, status, color))
    return new Response(res.body, {
        'status': statusCode, "headers": {
            'ETag': Date.now().toString(),
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Content-Type': 'image/svg+xml',
        }
    })
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
