-- Main context storage table - simplified and optimized
CREATE TABLE IF NOT EXISTS context_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, --context entry ID
    worldId TEXT,                    -- World/session identifier (nullable)
    chatId TEXT NOT NULL,                     -- Reference to chat message (not null)
    charId TEXT,                     -- Character ID (nullable for world events)
    type TEXT NOT NULL,              -- 'chat', 'world_event', 'world_lore', 'character_note'
    
    --content TEXT NOT NULL,           -- The actual content -there's no reason to store this
    summary TEXT,                    -- Optional LLM-generated summary
    tags TEXT,                       -- JSON array of tags
    embedding BLOB,                  -- Vector embedding for similarity search

    emotionalState TEXT,             -- STRING object with emotional data
    metadata TEXT,                   -- Additional JSON metadata
    
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    
    -- Constraints
    CHECK (type IN ('chat', 'world_event', 'world_lore', 'character_note'))
);

-- Context connections discovered through vector similarity
-- //TODO - Remember to delete connections when entries are deleted
CREATE TABLE IF NOT EXISTS context_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    similarity_score REAL NOT NULL,   -- Cosine similarity score
    connection_type TEXT NOT NULL,    -- 'semantic', 'temporal', 'character'
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    
    FOREIGN KEY (source_id) REFERENCES context_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES context_entries(id) ON DELETE CASCADE,
    UNIQUE(source_id, target_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_context_worldId ON context_entries(worldId);
CREATE INDEX IF NOT EXISTS idx_context_chatId ON context_entries(chatId);
CREATE INDEX IF NOT EXISTS idx_context_charId ON context_entries(charId);
CREATE INDEX IF NOT EXISTS idx_context_type ON context_entries(type);
CREATE INDEX IF NOT EXISTS idx_context_type_world ON context_entries(type, worldId);
CREATE INDEX IF NOT EXISTS idx_context_char_world ON context_entries(charId, worldId);
CREATE INDEX IF NOT EXISTS idx_connections_source ON context_connections(source_id);
CREATE INDEX IF NOT EXISTS idx_connections_similarity ON context_connections(similarity_score DESC);

-- SQLite optimization pragmas
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;