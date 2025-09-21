--#character schema.
-- id: string UNIQUE
-- name: string
-- description: string
-- age: integer
-- gender: string (default "female")
-- species: string (default "human")
-- strengths: string[]
-- flaws: string[]
-- faceCaption: string
-- bodyCaption: string
-- scenario: string
-- background: string
-- goals: string[]
-- relationships: string[]
-- images: {avatar: string, backgroundAvatar: string, transparentAvatar: string, face: string}
-- firstMsg: string
-- exampleMsg: string
-- sd: boolean default false,
-- vo: boolean default false,

-- #conversation schema
-- id: string
-- role: string
-- content: string
-- type: string (default "text")

-- #llmsettings schema
-- id: string
-- charId: string
-- llmActive: string default "lmstudio"
-- llmTextSettings: json
-- llmResponseSettings: json
-- vo: json
-- accessibility: json
-- behaviour: json

-- CHARACTER TABLE
CREATE TABLE IF NOT EXISTS character (
    hash TEXT PRIMARY KEY,
    charId TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    age INTEGER,
    gender TEXT DEFAULT 'female',
    species TEXT DEFAULT 'human',
    strengths TEXT,         -- JSON array of strings
    flaws TEXT,             -- JSON array of strings
    faceCaption TEXT,
    bodyCaption TEXT,
    scenario TEXT,
    background TEXT,
    goals TEXT,             -- JSON array of strings
    relationships TEXT,     -- JSON array of strings
    images TEXT,            -- JSON object as string
    firstMsg TEXT,
    exampleMsg TEXT,
    sd BOOLEAN DEFAULT 0,
    vo BOOLEAN DEFAULT 0
);

-- CONVERSATION TABLE
CREATE TABLE IF NOT EXISTS conversation (
    hash TEXT NOT NULL UNIQUE,
    charId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    additionalMedia: TEXT,  -- JSON object as string for additional media
    FOREIGN KEY (charId) REFERENCES character(charId) ON DELETE CASCADE
);

-- LLMSETTINGS TABLE
CREATE TABLE IF NOT EXISTS llmsettings (
    hash TEXT PRIMARY KEY,
    charId TEXT NOT NULL,
    llmActive TEXT DEFAULT 'lmstudio',
    llmTextSettings TEXT,         -- JSON object as string
    llmResponseSettings TEXT,     -- JSON object as string
    vo TEXT,                      -- JSON object as string
    accessibility TEXT,           -- JSON object as string
    behaviour TEXT,               -- JSON object as string
    FOREIGN KEY (charId) REFERENCES character(charId) ON DELETE CASCADE
);

--FUTURE - Add chat sessions table.