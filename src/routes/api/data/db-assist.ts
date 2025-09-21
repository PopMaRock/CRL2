import { constants as fsConstants } from "fs";
import { access, chmod, mkdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import Database, { SqliteError } from "better-sqlite3";
import { resp, throwError } from "../../../lib/utilities/apiHelper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
async function existsAsync(path: string): Promise<boolean> {
	try {
		await access(path, fsConstants.F_OK);
		return true;
	} catch {
		return false;
	}
}
async function dbConnect(database: string, schemaFileName: string = "schema.sql") {
	const dbDir = dirname(database);
	if (!(await existsAsync(dbDir))) {
		await mkdir(dbDir, { recursive: true });
		await chmod(dbDir, 0o755);
	}
	const db = new Database(database, { verbose: sqlErrorHandler });
	const schemaPath = join(__dirname, "schema", schemaFileName);
	//if (!(await existsAsync(database))) {
	try {
		const schema = await readFile(schemaPath, "utf-8");
		console.log("Database schema initialized", schema);
		db.exec(schema);
	} catch (error) {
		console.error("Failed to initialize database schema:", error);
		throwError("Database initialization failed", 500);
	}
	//}
	db.pragma("journal_mode = WAL");
	return db;
}
function sqlErrorHandler(message?: unknown, ...additionalArgs: unknown[]): void {
	if (message instanceof SqliteError) {
		console.error("SQLite Error:", message.message, "Code:", message.code);
	} else {
		console.error("SQLite Error:", message, ...additionalArgs);
	}
}

function insert(db: Database.Database, table: string, data: Record<string, string | number>): ReturnType<typeof resp> {
	try {
		if (!table || !data) throwError("Table and data are required", 400);
		const columns = Object.keys(data).join(", ");
		const placeholders = Object.keys(data)
			.map(() => "?")
			.join(", ");
		const values = Object.values(data);
		const stmt = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
		const info = stmt.run(...values);
		console.log("Insert info:", info);
		return resp({ id: info.lastInsertRowid }, 201);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Insert failed" }, 500);
	}
}

function select(db: Database.Database, table: string, where?: string, value?: string): ReturnType<typeof resp> {
	try {
		console.log("Selecting from table:", table, "where:", where, "value:", value);
		if (!table) throwError("Table is required", 400);
		let query = `SELECT * FROM ${table}`;
		let results: any;
		if (where && value) {
			query += ` WHERE ${where} = ?`;
			const stmt = db.prepare(query);
			results = stmt.all(value);
		} else {
			const stmt = db.prepare(query);
			results = stmt.all();
		}
		console.log("Select results:", results);
		if (results.length === 0) {
			throwError("No records found", 404);
		}
		return resp(results, 200);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Select failed" }, 500);
	}
}

function dbUpdate(
	db: Database.Database,
	table: string,
	where: string,
	value: string | number,
	data: Record<string, any>
): ReturnType<typeof resp> {
	try {
		if (!table || !where || !value || !data) throwError("All parameters are required to update", 400);
		const columns = Object.keys(data)
			.map((key) => `${key} = ?`)
			.join(", ");
		const values = Object.values(data);
		const stmt = db.prepare(`UPDATE ${table} SET ${columns} WHERE ${where} = ?`);
		const info = stmt.run(...values, value);
		console.log("Update info:", info);
		if (info.changes === 0) {
			throwError("No records updated", 404);
		}
		return resp({ changes: info.changes }, 200);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Update failed" }, 500);
	}
}

function deleteRecord(db: Database.Database, table: string, where: string, value: string | number): ReturnType<typeof resp> {
	try {
		if (!table || !value) throwError("All parameters are required to delete", 400);
		const stmt = db.prepare(`DELETE FROM ${table} WHERE ${where} = ?`);
		const info = stmt.run(value);
		console.log("Delete info:", info);
		if (info.changes === 0) {
			throwError("No record found to delete", 404);
		}
		return resp({ message: "Record deleted successfully" }, 200);
	} catch (e: any) {
		if (e?.status && e?.message) {
			return resp({ error: e.message }, e.status);
		}
		return resp({ error: "Delete failed" }, 500);
	}
}

export default {
	insert,
	dbConnect,
	select,
	dbUpdate,
	deleteRecord
};
