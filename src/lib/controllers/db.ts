//exists as otherwise we'd be spreading our debounce and dethrottle seed throughout the codebase.

import { _api } from "$lib/utilities/_api";
import { asyncDebounce, asyncThrottle } from "$lib/utilities/lodash-wrapper";

const defaultDb = "CRL";
//DATABASE API
export const dbGet = asyncThrottle(
	async (payload: { db: string; collection?: string; id?: string; url?: string; path?: string }): Promise<any> => {
		return await _api("/api/data", "GET", { ...payload });
	},
	500
);
export const dbSet = asyncDebounce(
	async (payload: { db: string; collection?: string; data: any; path?: string }): Promise<any> => {
		return await _api("/api/data", "POST", { ...payload });
	},
	500
);
export const dbUpdate = asyncDebounce(
	async (params: { db: string; collection: string; id: string; data: any; path?: string }): Promise<any> => {
		return await _api("/api/data", "PUT", {
			db: params.db || defaultDb,
			collection: params.collection,
			id: params.id,
			data: params.data,
			path: params.path ?? ""
		});
	},
	500
);
export const dbPut = asyncDebounce(
	async (params: { db: string; collection: string; id: string; data: any; path?: string }): Promise<any> => {
		return await _api("/api/data", "PUT", {
			db: params.db || defaultDb,
			collection: params.collection,
			id: params.id,
			data: params.data,
			path: params.path ?? ""
		});
	},
	500
);
export const dbList = asyncThrottle(async (params: { db: string; collection: string; path?: string }): Promise<any> => {
	return await _api("/api/data", "GET", {
		db: params.db || defaultDb,
		collection: params.collection,
		path: params.path ?? ""
	});
}, 500);
export const dbQuery = asyncThrottle(
	async (params: { db: string; collection: string; query: any; path?: string }): Promise<any> => {
		const listObj = await dbList({ db: params.db, collection: params.collection, path: params.path });
		if (!listObj || typeof listObj !== "object") return false;
		const list = Array.isArray(listObj) ? listObj : Object.values(listObj);
		const queryArr = Array.isArray(params.query[0]) ? params.query[0] : params.query;
		if (!queryArr || !Array.isArray(queryArr) || queryArr.length < 3) return false;
		const [key, operator, value] = queryArr;
		return list.filter((item: any) => {
			if (item[key] === undefined) return false;
			switch (operator) {
				case "=":
					return item[key] === value;
				case "!=":
					return item[key] !== value;
				case ">":
					return item[key] > value;
				case "<":
					return item[key] < value;
				case ">=":
					return item[key] >= value;
				case "<=":
					return item[key] <= value;
				default:
					return false; // unsupported operator
			}
		});
	},
	500
);

export const dbDelete = asyncDebounce(
	async (params: { db: string; collection: string; id: string; path?: string }): Promise<any> => {
		return await _api("/api/data", "DELETE", {
			db: params.db || defaultDb,
			collection: params.collection,
			id: params.id,
			path: params.path ?? ""
		});
	},
	500
);
export const removeCollection = asyncDebounce(async (params: { db: string; collection: string; path?: string }): Promise<any> => {
	return await _api("/api/data", "DELETE", {
		db: params.db || defaultDb,
		collection: params.collection,
		path: params.path ?? ""
	});
}, 500);
export const dbDrop = asyncDebounce(async (db: string): Promise<any> => {
	return await _api(`/api/data`, "DELETE", { db: db || defaultDb, dropData: true });
}, 500);
export const dbExists = asyncDebounce(
	async (params: { db: string; collection: string; id: string; path?: string }): Promise<boolean> => {
		return await _api("/api/data", "HEAD", {
			db: params.db || defaultDb,
			collection: params.collection,
			id: params.id,
			path: params.path ?? ""
		});
	},
	500
);
