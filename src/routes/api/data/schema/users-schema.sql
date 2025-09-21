-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL
);

-- SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
    sessionId TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expires INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);

PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;