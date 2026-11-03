CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  url VARCHAR(255),
  notes TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
CREATE TABLE sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0 CHECK(sort >= 0),
  created_at DATETIME,
  updated_at DATETIME
);
CREATE TABLE data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  data BLOB,
  sort INTEGER NOT NULL DEFAULT 0 CHECK(sort >= 0),
  created_at DATETIME,
  updated_at DATETIME
);
CREATE INDEX sections_site_sort ON sections(site_id, sort, id);
CREATE INDEX data_section_sort ON data(section_id, sort, id);
