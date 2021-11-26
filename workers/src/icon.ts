import icons from "../badgen/dist/icons.json"

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

async function insertIntoCache(url: string, text: string | undefined, response: Response): Promise<Response> {
    response = new Response(text, response)
    response.headers.append("Cache-Control", "s-maxage=86400") // Cache icons for 1 day

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

    return (icons as any)[icon] || defaultIcon
}
