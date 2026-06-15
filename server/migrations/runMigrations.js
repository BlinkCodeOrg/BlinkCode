export const CURRENT_SCHEMA_VERSION = 3;

function columnExists(db, table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(item => item.name === column);
}

export function runMigrations(db) {
  const row = db.prepare('SELECT MAX(version) AS version FROM schema_version').get();
  let version = Number(row?.version || 0);

  const migrate = db.transaction(() => {
    if (version < 1) {
      if (!columnExists(db, 'editor_state', 'updated_at')) {
        db.exec('ALTER TABLE editor_state ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0');
      }
      if (!columnExists(db, 'settings', 'updated_at')) {
        db.exec('ALTER TABLE settings ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0');
      }
      version = 1;
    }

    if (version < 2) {
      if (!columnExists(db, 'file_cursor_positions', 'updated_at')) {
        db.exec('ALTER TABLE file_cursor_positions ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0');
      }
      if (!columnExists(db, 'file_cursor_positions', 'view_state')) {
        db.exec('ALTER TABLE file_cursor_positions ADD COLUMN view_state TEXT');
      }
      version = 2;
    }

    if (version < 3) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS recovery_buffers (
          workspace_path TEXT NOT NULL,
          file_path TEXT NOT NULL,
          content TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (workspace_path, file_path)
        );
      `);
      version = 3;
    }

    db.exec('DELETE FROM schema_version');
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(CURRENT_SCHEMA_VERSION);
  });

  migrate();
  return CURRENT_SCHEMA_VERSION;
}
