CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE fmn_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL
);