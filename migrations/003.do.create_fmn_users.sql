CREATE TABLE fmn_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    date_created TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fmn_lists
    ADD COLUMN
        user_id UUID
        REFERENCES fmn_users(id)
        ON DELETE SET NULL;