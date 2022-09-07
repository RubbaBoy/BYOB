import icons from 'badgen-icons/icons.json'
import twemoji from "twemoji";

const cache = caches.default

interface Icon {
    base64: string | undefined;
    width: number;
    height: number;
}

const defaultIcon: Icon = {
    base64: undefined,
    width: 13,
    height: 13,
};

function makeIcon(base64: string, width = 13, height = 13): Icon {
    return {
        base64: base64,
        width: width,
        height: height,
    } as Icon;
}

async function insertIntoCache(url: string, text: string | undefined, response: Response, cacheControl: string = 's-maxage=86400'): Promise<Response> {
    response = new Response(text, response)
    response.headers.append("Cache-Control", cacheControl) // Cache icons for 1 day by default

    if (text === undefined) {
        response.headers.append("x-cache-undefined", "true")
    }

    await cache.put(url, response.clone())
    return response
}

async function fetchIcon(url: string): Promise<string | undefined> {
    const cacheKey = new Request(url)
    let response = await cache.match(cacheKey)

    if (!response) {
        await cache.delete(cacheKey)

        response = await fetch(url);
        if (response.status != 200) {
            await insertIntoCache(url, undefined, response)
            return undefined
        }

        let svgText = await response.text()
        if (!svgText.startsWith('<svg')) {
            await insertIntoCache(url, undefined, response)
            return undefined
        }

        response = await insertIntoCache(url, 'data:image/svg+xml;base64,' + btoa(svgText), response)
    }

    if (response.headers.get('x-cache-undefined') === 'true') {
        return undefined
    }

    return response.text()
}

function getEmojiUrl(emoji: string): string | undefined {
    let regex = /src="(.*?)"/

    let res = twemoji.parse(emoji.replace('[\x00-\x7F]', ''), {
        folder: 'svg',
        ext: '.svg'
    })

    let match = res.match(regex)

    if (match == undefined) {
        return undefined
    }

    return match.length < 2 ? undefined : match[1];
}

async function makeEmojiIcon(emoji: string): Promise<Icon | undefined> {
    let emojiUrl = getEmojiUrl(emoji)
    if (emojiUrl == undefined) {
        return undefined
    }

    const cacheKey = new Request(emojiUrl)
    let response = await cache.match(cacheKey)

    if (!response) {
        let emojiResponse = await fetch(emojiUrl)
        let svgText = await emojiResponse.text()
        response = await insertIntoCache(emojiUrl, 'data:image/svg+xml;base64,' + btoa(svgText), emojiResponse, 's-maxage=2592000') // 30 days (arbitrary)
    }

    return makeIcon(await response.text())
}

export async function parseIcon(icon: string | undefined): Promise<Icon> {
    if (icon === undefined) {
        return defaultIcon
    }

    if (icon.startsWith('data:image/svg+xml;base64,')) {
        return makeIcon(icon)
    }

    if (icon.startsWith('https://')) {
        let fetched = await fetchIcon(icon)
        if (fetched !== undefined) {
            return makeIcon(fetched)
        }
    }

    let storedIcon = (icons as any)[icon]
    if (storedIcon != undefined) {
        return storedIcon
    }

    let emojiIcon = await makeEmojiIcon(icon)
    if (emojiIcon != undefined) {
        return emojiIcon
    }

    return defaultIcon
}
