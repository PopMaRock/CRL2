import type { LayoutServerLoad } from './$types';

export const load = (async ({ params }) => {
    const { characterId } = params;
    return { characterId };
}) satisfies LayoutServerLoad;