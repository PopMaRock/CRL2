import { promises as fs } from "fs";
import { Config, JsonDB } from "node-json-db";
import { DebugLogger } from "$lib/utilities/error-manager";
import { er, resp, sanitizeFilename } from "../../../lib/utilities/apiHelper";
// https://github.com/Belphemur/node-json-db
import type { RequestHandler } from "./$types";

//RE: path parameter = keep the fuckers in data
const pathBase = "data";
function getPath(path: string, db: string, umanId?: any): string {
	if (path === "/") return `${pathBase}/${db}`; //for shit in data/database.json
	if (!path) {
		//FIXME: remember to reinstate this! -- if (!umanId || umanId === "" || umanId.includes("/")) throw new Error("Baws! Hamish 'as gone!");
		if(!umanId) umanId = "defaultUser";
		path = `users/${umanId}`;
	}
	return `${pathBase}/${path}/${db}`;
}
/**
 * GET handler to get data from the database.
 *
 * @param {Object} request - The request object containing the parameters.
 * @param {string} request.db - The name of the database.
 * @param {string} request.collection - The collection to get data from the database.
 * @param {string} request.id - The id of the item to get from the collection.
 * @returns {Promise<Response>} - The response object with the fetched data or an error message.
 */
export const GET: RequestHandler = async ({ url, cookies }: any): Promise<Response> => {
	const db = url.searchParams.get("db");
	const collection = url.searchParams.get("collection");
	const id = url.searchParams.get("id");
	let path = url.searchParams.get("path");
	try {
		if (!db) {
			throw { message: `Missing database name ${er.badRequest}`, status: 400 };
		}
		const uman = cookies.get("umanId");
		const dbCon = new JsonDB(new Config(getPath(path, db, uman), true, false, "/"));
		if (!dbCon) {
			throw { message: er.serverFail.db, status: 400 };
		}

		let data: any;
		if (!collection) {
			// Return all data from the database if no collection is specified
			data = await dbCon.getData("/");
		} else {
			const path = id ? `/${collection}/${id}` : `/${collection}`;
			if (!(await dbCon.exists(path))) {
				throw { message: id ? "not found" : "empty", status: 404 };
			}
			data = await dbCon.getData(path);
		}
		return resp(data, 200);
	} catch (error: any) {
		console.error("Error in GET: ", error);
		const status = error?.status || 500;
		const message = error?.message || "Unable to fetch data";
		return resp({ error: message }, status);
	}
};
/**
 * POST handler to save data to the database.
 *
 * @param {Object} request - The request object containing the parameters.
 * @param {string} request.db - The name of the database.
 * @param {string} request.collection - The collection to save data under in the database.
 * @param {Object} request.data - The data to be saved in the database.
 * @returns {Promise<Response>} - The response object indicating the result of the operation.
 */
export const POST: RequestHandler = async ({ request, cookies }: any): Promise<Response> => {
	try {
		const { db, collection, data, path } = await request.json();
		const uman = cookies.get("umanId");
		//console.log("POST: ", db, collection, data);
		if (!db || !data) {
			DebugLogger.error("missing parameters");
			return resp({ error: "Missing parameters --DB POST" }, 400);
		}

		if (data === null) {
			DebugLogger.error("data is invalid --DB POST");
			return resp({ error: er.badRequest.nonObject }, 400);
		}

		const dbCon = new JsonDB(new Config(getPath(path, db, uman), true, false, "/"));
		const jsonDataPath = collection ? `/${collection}` : "/";
		await dbCon.push(jsonDataPath, data);
		return resp({ status: "Post complete" }, 200);
	} catch (error) {
		DebugLogger.debug("Error in POST: ", error);
		return resp({ error: "Internal Server Error" }, 500);
	}
};
/**
 * PUT handler to update data in the database.
 *
 * @param {Object} request - The request object containing the parameters.
 * @param {string} request.db - The name of the database.
 * @param {string} request.collection - The collection to update data under in the database.
 * @param {string} request.id - The ID of the document to update.
 * @param {Object} request.data - The data to be updated in the database.
 * @returns {Promise<Response>} - The response object indicating the result of the operation.
 */
export const PUT: RequestHandler = async ({ request, cookies }: any): Promise<Response> => {
	try {
		const { id, db, collection, data, path } = await request.json();

		if (!db || !collection || !id || !data) {
			throw { message: "Missing parameters", status: 400 };
		}
		// Uncomment and adjust if you want to validate filenames
		// if (!sanitizeFilename(db) || !sanitizeFilename(collection)) {
		// 	throw { message: "Invalid parameters", status: 400 };
		// }
		const uman = cookies.get("umanId");
		const dbCon = new JsonDB(new Config(getPath(path, db, uman), true, false, "/"));
		if (!dbCon) {
			throw { message: "Database connection failed", status: 500 };
		}

		const jsonDataPath = `/${collection}/${id}`;
		// Uncomment if you want to check existence before update
		// if (!(await dbCon.exists(path))) {
		// 	throw { message: "Document not found", status: 404 };
		// }

		await dbCon.push(jsonDataPath, data, false);
		return resp({ success: true }, 200);
	} catch (error: any) {
		if (error?.message && error?.status) {
			DebugLogger.error("PUT error:", error.message);
			return resp({ error: error.message }, error.status);
		}
		DebugLogger.debug("Error in DB PUT: ", error);
		return resp({ error: "Unable to update data" }, 500);
	}
};
/**
 * Deletes a collection or a specific item from the specified database.
 *
 * @param request - The request object containing the database, collection, and optional id.
 * @returns {Promise<Response>} A response indicating the success or failure of the delete operation.
 */
export const DELETE: RequestHandler = async ({ request, cookies }: any): Promise<Response> => {
	const body = await request.json();
	const { id, db, collection, path = "", dropData = false } = body;
	if (!db && !collection && !id) {
		return new Response(JSON.stringify({ error: "Missing parameters" }), {
			status: 400
		});
	}
	if (!sanitizeFilename(db) || !sanitizeFilename(collection)) {
		//delete folder
		DebugLogger.debug("db: ", sanitizeFilename(db), "collection: ", sanitizeFilename(collection));
		return new Response(JSON.stringify({ error: "Invalid parameters" }), {
			status: 400
		});
	}
	const uman = cookies.get("umanId");
	const dbCon = new JsonDB(new Config(getPath(path, db, uman), true, false, "/"));
	if (!dbCon) {
		return resp({ error: er.serverFail.db }, 500);
	}

	try {
		if (collection && id) {
			// Delete a specific item within the collection
			const path = `/${collection}/${id}`;
			if (!(await dbCon.exists(path))) {
				DebugLogger.debug("Document not found: ", path);
				return resp({ error: "Document not found" }, 404);
			}
			dbCon.delete(path);
			return resp({ status: "Delete successful" }, 200);
		} else if (collection) {
			// Delete the entire collection
			const path = `/${collection}`;
			if (!(await dbCon.exists(path))) {
				return resp({ error: "Collection not found" }, 404);
			}
			dbCon.delete(path);
			return resp({ status: "Delete collection successful" }, 200);
		} else {
			// Delete the entire database
			if (dropData) {
				await fs.rm(`${getPath(path, db, cookies.get("umanId"))}.json`, { recursive: true, force: true });
			} else {
				dbCon.delete("/"); //just delete the contents.
			}
			return resp({ status: "Delete database successful" }, 200);
		}
	} catch (error) {
		DebugLogger.error("Error in DB DELETE: ", error);
		return resp({ error: "Unable to delete" }, 500);
	}
};
/**
 * HEAD handler to check if data exists in the database.
 *
 * @param {Object} request - The request object containing the parameters.
 * @param {string} request.db - The name of the database.
 * @param {string} request.collection - The collection to check data under in the database.
 * @param {string} request.id - The ID of the document to check.
 * @returns {Promise<Response>} - The response object indicating the result of the existence check.
 */
export const HEAD: RequestHandler = async ({ url, cookies }: any): Promise<Response> => {
	const db = url.searchParams.get("db");
	const collection = url.searchParams.get("collection");
	const id = url.searchParams.get("id");
	const path = url.searchParams.get("path") || "";
	const uman = cookies.get("umanId");
	if (sanitizeFilename(db) || sanitizeFilename(collection)) {
		return new Response(null, {
			status: 400,
			statusText: "Bad Request: Missing parameters"
		});
	}

	const dbCon = new JsonDB(new Config(getPath(path, db, uman), true, false, "/"));
	if (!dbCon) {
		return new Response(null, {
			status: 500,
			statusText: "Internal Server Error: Database connection failed"
		});
	}

	try {
		const path = id ? `/${collection}/${id}` : `/${collection}`;
		if (!(await dbCon.exists(path))) {
			return new Response(null, {
				status: 404,
				statusText: id ? "Not Found: Document not found" : "Not Found: Collection not found"
			});
		}
		return new Response(null, { status: 200, statusText: "OK" });
	} catch (error) {
		DebugLogger.debug("Error in DB HEAD: ", error);
		return new Response(null, {
			status: 500,
			statusText: "Internal Server Error: Unable to check data"
		});
	}
};
