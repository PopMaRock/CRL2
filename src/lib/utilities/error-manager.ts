import { PUBLIC_DEBUG, PUBLIC_LOG_LEVEL } from "$env/static/public";
import { toastr } from "$lib/ui/toastr";

let isDebugLogging = false; //guard

export async function catchError<T>(promise: Promise<T>): Promise<T | boolean> {
	try {
		const result = await promise;
		return result;
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		DebugLogger.warn(errorMessage);
		return false;
	}
}

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	NONE = 4
}

export interface DebugLoggerInterface {
	(...args: any[]): any;
	debug(...args: any[]): any;
	info(...args: any[]): any;
	warn(...args: any[]): any;
	/**
	 * The last parameter can be an optional boolean flag determining whether to throw the error.
	 * If omitted, it defaults to true.
	 */
	error(...args: any[]): boolean;
	table(data: any): any;
	setLevel(newLevel: LogLevel): any;
}

const getTimestamp = (): string => new Date().toISOString();

const defaultLevel = (() => {
	const envLevel = PUBLIC_LOG_LEVEL?.toUpperCase();
	switch (envLevel) {
		case "DEBUG":
			return LogLevel.DEBUG;
		case "INFO":
			return LogLevel.INFO;
		case "WARN":
			return LogLevel.WARN;
		case "ERROR":
			return LogLevel.ERROR;
		default:
			return PUBLIC_DEBUG === "true" ? LogLevel.DEBUG : LogLevel.INFO;
	}
})();

let currentLevel: LogLevel = defaultLevel;

const passthrough = (args: any[]): any => (args.length === 1 ? args[0] : args);

const DebugLogger = ((...args: any[]): any => {
	// Calling DebugLogger(...) logs at debug level.
	if (currentLevel <= LogLevel.DEBUG) {
		DebugLogger.debug(`[${getTimestamp()}] [DEBUG]`, ...args);
	}
	return passthrough(args);
}) as DebugLoggerInterface;

DebugLogger.debug = (...args: any[]): any => {
	if (isDebugLogging) return passthrough(args);
	if (currentLevel <= LogLevel.DEBUG) {
		try {
			isDebugLogging = true;
			console.debug(`[${getTimestamp()}] [DEBUG]`, ...args);
		} finally {
			isDebugLogging = false;
		}
	}
	return passthrough(args);
};

DebugLogger.info = (...args: any[]): any => {
	let opts: { toast?: boolean } = {};
	if (
		args.length > 0 &&
		typeof args[args.length - 1] === "object" &&
		args[args.length - 1] !== null &&
		!Array.isArray(args[args.length - 1]) &&
		"toast" in args[args.length - 1]
	) {
		opts = args.pop();
	}
	const { toast = false } = opts;

	if (currentLevel <= LogLevel.INFO) {
		console.info(`[${getTimestamp()}] [INFO]`, ...args);
	}

	if (toast) {
		toastr({
			type: "info",
			message: args[0] instanceof Error ? args[0].message : (args[0]?.toString() ?? "")
		});
	}
	return passthrough(args);
};

DebugLogger.warn = (...args: any[]): boolean => {
	let opts: { toast?: boolean } = {};
	// Check if the last argument is an options object. Remove it from args if so.
	if (
		args.length > 0 &&
		typeof args[args.length - 1] === "object" &&
		args[args.length - 1] !== null &&
		!Array.isArray(args[args.length - 1])
	) {
		opts = args.pop();
	}
	const { toast = false } = opts;

	if (currentLevel <= LogLevel.WARN) {
		console.warn(`[${getTimestamp()}] [WARN]`, ...args);
	}

	if (toast) {
		toastr({
			type: "warning",
			message: args[0] instanceof Error ? args[0].message : (args[0]?.toString() ?? "")
		});
	}
	return false;
};

DebugLogger.error = (...args: any[]): boolean => {
	let opts: { toast?: boolean } = {};
	// Check if the last argument is an options object. Remove it from args if so.
	if (
		args.length > 0 &&
		typeof args[args.length - 1] === "object" &&
		args[args.length - 1] !== null &&
		!Array.isArray(args[args.length - 1]) &&
		"toast" in args[args.length - 1]
	) {
		opts = args.pop();
	}
	const { toast = false } = opts;

	if (currentLevel <= LogLevel.ERROR) {
		console.error(`[${getTimestamp()}] [ERROR]`, ...args);
	}

	if (toast) {
		toastr({
			type: "error",
			message: args[0] instanceof Error ? args[0].message : (args[0]?.toString() ?? "")
		});
	}
	return false;
};

DebugLogger.table = (data: any): any => {
	if (currentLevel <= LogLevel.DEBUG) {
		console.table(data);
	}
	return data;
};

DebugLogger.setLevel = (newLevel: LogLevel): any => {
	currentLevel = newLevel;
	return newLevel;
};

export { DebugLogger };
