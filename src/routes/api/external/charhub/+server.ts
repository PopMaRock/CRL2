import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const rUrl = url.searchParams.get('rUrl');
    if (!rUrl) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
    }
    const parsedUrl = new URL(rUrl);
    if (!parsedUrl.hostname.includes("characterhub.org")) {
        return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
    }
    // If the rUrl is a characterhub.org URL, derive the charhub.io avatar URL dynamically.
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    // Expected URL structure: /characters/{username}/{id}
    if (segments[0] === 'characters' && segments.length >= 3) {
        const username = segments[1];
        const id = segments[2];
        const avatarUrl = `https://avatars.charhub.io/avatars/${username}/${id}/chara_card_v2.png`;
        // Fetch the generated avatar URL instead of the original rUrl.
								const avatarResponse = await fetch(avatarUrl, { credentials: "include" });
        const contentType = avatarResponse.headers.get('Content-Type') || '';
        if (contentType.includes('text/html')) {
            return new Response(JSON.stringify({ error: 'Received unexpected text/html' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const imageBuffer = await avatarResponse.arrayBuffer();
        return new Response(imageBuffer, {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
        });
    }
    return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });

};