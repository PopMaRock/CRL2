import { _api } from "$lib/utilities/_api";
import { asyncThrottle } from "$lib/utilities/lodash-wrapper";

export const fsDelete = asyncThrottle(async (params: { mode: string; id: string }) => {
	return _api(`/api/filesystem/folder`, "DELETE", { ...params });
}, 1000);
