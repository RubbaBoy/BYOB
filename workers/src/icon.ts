import icons from "../badgen/dist/icons.json";

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

export async function parseIcon(icon: string | undefined): Promise<Icon> {
    if (icon === undefined) {
        return defaultIcon;
    }

    if (icon.startsWith('data:image/svg+xml;base64,')) {
        return makeIcon(icon)
    }

    // TODO: Use Workers caching
    if (icon.startsWith('https://')) {
        let fetched = await fetch(icon);
        if (fetched.status == 200) {
            let svgText = await fetched.text()
            if (svgText.startsWith('<svg')) {
                return makeIcon('data:image/svg+xml;base64,' + btoa(svgText))
            }
        }
    }

    return (icons as any)[icon] || defaultIcon;
}
