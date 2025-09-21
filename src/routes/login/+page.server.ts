import { createHash, randomUUID } from "crypto"; // node:crypto [49]
import { type Actions, fail } from "@sveltejs/kit";
import auth from "$lib/controllers/auth";
import { DebugLogger } from "$lib/utilities/error-manager";

const TTL = 60 * 20;

function sha256(txt: string) {
	return createHash("sha256").update(txt).digest("hex");
}

export const actions: Actions = {
	//login
	login: async ({ request, cookies }) => {
		try {
			const data = await request.formData();
			const name = String(data.get("user") ?? "");
			const pwdRaw = String(data.get("pass") ?? "");

			// 1 – get user row
			const user = await auth.getUserByName(name);
			if (!user || user.error) {
				DebugLogger.warn("Login attempt with non-existing user:", name, user);
				throw { status: 400, message: "invalid-creds" };
			}

			// 2 – verify password
			const hash = sha256(pwdRaw + user.salt); // salt optional
			if (hash !== user.password_hash) {
				DebugLogger.warn("Login attempt with invalid password for user:", name, hash, user.password_hash);
				throw { status: 400, message: "invalid-creds" };
			}

			// 3 – create session
			const sessionId = randomUUID();
			const expires = Date.now() + TTL * 1000;

			await auth.createSession({ sessionId, userId: user.userId, expires: expires });

			// 4 – http-only cookie (20 min)
			cookies.set("session", sessionId, {
				path: "/",
				httpOnly: true,
				sameSite: true,
				secure: false, //process.env.NODE_ENV === "production",
				maxAge: TTL
			});
			//set cookie for userId
			cookies.set("umanId", user.userId, {
				path: "/",
				httpOnly: true,
				sameSite: true,
				secure: false, //process.env.NODE_ENV === "production",
				maxAge: TTL
			});
			//return success, 200
			return { success: true, status: 200, sessionId, userId: user.userId };
		} catch (error: any) {
			if (error.status === 307) return;
			console.error("Login error:", error);
			if (error && typeof error === "object" && "status" in error && "message" in error) {
				return fail(error.status, { error: error.message, status: error.status });
			}
			return fail(500, { error: "server-error", status: 500 });
		}
	},
	register: async ({ cookies, request }) => {
		try {
			const data = await request.formData();
			const user = String(data.get("user") ?? "");
			const pwdRaw = String(data.get("pass") ?? "");
			if (pwdRaw.length < 3 || user.length < 3) {
				throw { status: 400, message: "password and/or username too short" };
			}
			const searchName = user.toLowerCase();
			const existingUser = await auth.getUserByName(searchName);
			if (existingUser && !existingUser.error) {
				throw { status: 400, message: "username already exists" };
			}
			const salt = randomUUID();
			const passwordHash = sha256(pwdRaw + salt);
			const userId = randomUUID();
			const sessionId = randomUUID();
			const newUser:any = await auth.createUser({
				userId,
				name: searchName,
				password_hash: passwordHash,
				salt
			});
			const sessionCreation:any = await auth.createSession({
				sessionId: sessionId,
				userId: userId,
				expires: Date.now() + TTL * 1000
			});
			if (!sessionCreation || sessionCreation?.error) {
				throw { status: 500, message: "failed to create user" };
			}
			if (!newUser || newUser?.error) {
				throw { status: 500, message: "failed to create user" };
			}
			// 4 – http-only cookie (20 min)
			cookies.set("session", sessionId, {
				path: "/",
				httpOnly: true,
				sameSite: true,
				secure: false, // process.env.NODE_ENV === "production",
				maxAge: TTL
			});
			return { success: true, status: 200, sessionId: sessionId  };
		} catch (error: any) {
			if (error.status === 307) return;
			console.error("Registration error:", error);
			if (error && typeof error === "object" && "status" in error && "message" in error) {
				return fail(error.status, { error: error.message, status: error.status });
			}
			return fail(500, { error: "unknown-error", status: 500 });
		}
	}
};
