/**
 * Runnable on Cloudflare Workers
 */

import { badgen } from 'badgen'
import { parseIcon } from './icon'

const namePattern = /^\S+$/i;

// Valid:
// RubbaBoy/EmojIDE/badgeName
// RubbaBoy/EmojIDE/badgeName/master
// RubbaBoy/EmojIDE/badgeName/master/path/here/stuff.json
export async function handleRequest(request: Request): Promise<Response> {
    let url = new URL(request.url)
    let splitted = url.pathname.substr(1).split('/')
    let [nameorg, repo, badgeName, branch, ...split_path] = splitted
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

function loadBody(body: string): any {
    try {
        return JSON.parse(body);
    } catch (_) {
        return undefined;
    }
}

async function sendError(label: string, status: string, statusCode: number) {
    return sendResult(label, status, 'FF0000', undefined, statusCode)
}

async function sendResult(label: string, status: string, color: string, icon: string | undefined, statusCode = 200) {
    let usingIcon = await parseIcon(icon)

    const svgString = badgen({
        label: label || '',         // <Text>
        labelColor: '555',          // <Color RGB> or <Color Name> (default: '555')
        status: status || 'N/A',    // <Text>, required
        color: color || 'blue',     // <Color RGB> or <Color Name> (default: 'blue')
        style: 'classic',           // 'flat' or 'classic' (default: 'classic')
        icon: usingIcon.base64,     // Use icon (default: undefined)
        iconWidth: usingIcon.width, // Set this if icon is not square (default: 13)
        scale: 1                    // Set badge scale (default: 1)
    })

    return new Response(svgString, {
        'status': statusCode, 'headers': {
            'ETag': Date.now().toString(),
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Content-Type': 'image/svg+xml',
        }
    })
}
