import type { RequestHandler } from "@sveltejs/kit";
import { DebugLogger } from "$lib/utilities/error-manager";
import { resp, throwError } from "../../../../lib/utilities/apiHelper";
import dbAssist from "../db-assist";

const db = await dbAssist.dbConnect("data/uman.db", "users-schema.sql");
//CREATE USER
export const POST: RequestHandler = async ({ request }) => {
	try {
		console.log("IN POST USER");
		const { userId, password_hash, name, salt }: { name: string; userId: string; password_hash: string; salt: string } =
			await request.json();
		if (!userId || !password_hash || !name || !salt) {
			DebugLogger.error("Missing user data for creation", { userId, password_hash, name, salt });
			throwError("Need all the variables to create a user", 400);
		}
		//see if we already have this user
		const existingUser = dbAssist.select(db, "users", "userId", userId);
		if (existingUser.status === 200) {
			throwError("User already exists", 409);
		}
		const data = { userId, password_hash, name, salt };
		//-------------------
		return dbAssist.insert(db, "users", data);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Auth failed" }, 500);
	}
};

//SELECT
export const GET: RequestHandler = async ({ url }) => {
	try {
		console.log("IN GET USER");
		const userId = url.searchParams.get("userId") ?? undefined;
		const name = url.searchParams.get("name") ?? undefined;
		if (!userId && !name) {
			throwError("Need userId or name to get user data", 400);
		}
		return userId ? dbAssist.select(db, "users", "userId", userId) : dbAssist.select(db, "users", "name", name);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Get failed" }, 500);
	}
};
//DELETE
//this really needs more - such as deleting all user data
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		console.log("IN DELETE USER");
		const { userId } = await request.json();
		return dbAssist.deleteRecord(db, "users", "userId", userId); // ignore errors and return value.
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Delete failed" }, 500);
	}
};
