CREATE TYPE list_color AS ENUM (
    'ColorA',
    'ColorB',
    'ColorC',
    'ColorD',
    'ColorE'
);

ALTER TABLE fmn_lists
  ADD COLUMN
    theme list_color;