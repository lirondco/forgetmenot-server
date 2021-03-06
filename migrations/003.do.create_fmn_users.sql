CREATE TABLE fmn_users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    date_created TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fmn_lists
    ADD COLUMN
        user_id INTEGER
        REFERENCES fmn_users(id)
        ON DELETE SET NULL;