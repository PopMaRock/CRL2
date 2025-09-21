import type { RequestHandler } from "@sveltejs/kit";
import { resp, throwError } from "../../../../lib/utilities/apiHelper";
import dbAssist from "../db-assist";

// Helper to get DB instance per request
async function getDb(umanId: string | undefined, charId: string | undefined) {
	if (!umanId) throwError("Missing umanId (user id)", 400);
	if (!charId) throwError("Missing charId (character id)", 400);
	const dbPath = `data/users/${umanId}/${charId}/character.db`;
	return await dbAssist.dbConnect(dbPath, "character-schema.sql");
}

// GET: /api/data/character?table=character&id=abc123&charId=xyz
export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const umanId = cookies.get("umanId");
		const charId = url.searchParams.get("charId") ?? undefined;
		const table = url.searchParams.get("table");
		const id = url.searchParams.get("id") ?? undefined;
		if (!table) throwError("Missing table parameter", 400);
		const db = await getDb(umanId, charId);
		return id ? dbAssist.select(db, table, "id", id) : dbAssist.select(db, table);
	} catch (e: any) {
		return resp({ error: e.message }, e.status || 500);
	}
};

// POST: create new record
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const umanId = cookies.get("umanId");
		const { table, charId, data } = await request.json();
		if (!table) throwError("Missing table parameter", 400);
		const db = await getDb(umanId, charId);
		return dbAssist.insert(db, table, data);
	} catch (e: any) {
		return resp({ error: e.message }, e.status || 500);
	}
};

// PATCH: update record by id
export const PATCH: RequestHandler = async ({ request, cookies }) => {
	try {
		const umanId = cookies.get("umanId");
		const { table, charId, hash, data, where, value } = await request.json();
		if (!table || !hash) throwError("Missing table or hash parameter", 400);
		const db = await getDb(umanId, charId);
		return dbAssist.dbUpdate(db, table, where || "hash", value || hash, data);
	} catch (e: any) {
		return resp({ error: e.message }, e.status || 500);
	}
};

// DELETE: delete record by id
export const DELETE: RequestHandler = async ({ request, cookies }) => {
	try {
		const umanId = cookies.get("umanId");
		const { table, charId, hash } = await request.json();
		if (!table || !hash) throwError("Missing table or id parameter", 400);
		const db = await getDb(umanId, charId);
		return dbAssist.deleteRecord(db, table, "hash", hash);
	} catch (e: any) {
		return resp({ error: e.message }, e.status || 500);
	}
};

// HEAD will get all records from all tables
export const HEAD: RequestHandler = async ({ url, cookies }) => {
	try {
		const charId = url.searchParams.get("charId") ?? undefined;
		const umanId = cookies.get("umanId");
		//--
		if (!charId) throwError("Missing charId (character id)", 400);
		if (!umanId) throwError("Missing umanId (user id)", 400);
		//--
		const db = await getDb(umanId, charId);
		//get all records from each table
		const character = dbAssist.select(db, "character");
		const conversations = dbAssist.select(db, "conversations");
		const llmSettings = dbAssist.select(db, "llmsettings");
		if (!character || !conversations || !llmSettings) {
			throwError("Something is missing or it's all missing. No data found for character", 404);
		}
		return resp(
			{
				character,
				conversations,
				llmSettings
			},
			200
		);
	} catch (e: any) {
		return resp({ error: e.message }, e.status || 500);
	}
};
