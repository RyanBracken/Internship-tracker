const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let db;
let SQL;
const DB_PATH = process.env.DB_PATH || './data/internships.db';

function getDbPath() {
  return path.resolve(DB_PATH);
}

function saveDb() {
  const data = db._raw.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(), buffer);
}

// Wrap sql.js to look like better-sqlite3's synchronous API
function wrapDb(sqlDb) {
  return {
    prepare(sql) {
      return {
        run(...params) {
          const flat = params.flat();
          sqlDb.run(sql, flat);
          const changes = sqlDb.getRowsModified();
          // get last insert rowid
          const [[lastId]] = sqlDb.exec('SELECT last_insert_rowid()');
          saveDb();
          return { changes, lastInsertRowid: lastId.values[0][0] };
        },
        get(...params) {
          const flat = params.flat();
          const result = sqlDb.exec(sql, flat);
          if (!result.length || !result[0].values.length) return undefined;
          const { columns, values } = result[0];
          const row = {};
          columns.forEach((col, i) => { row[col] = values[0][i]; });
          return row;
        },
        all(...params) {
          const flat = params.flat();
          const result = sqlDb.exec(sql, flat);
          if (!result.length) return [];
          const { columns, values } = result[0];
          return values.map(row => {
            const obj = {};
            columns.forEach((col, i) => { obj[col] = row[i]; });
            return obj;
          });
        },
      };
    },
    exec(sql) {
      sqlDb.run(sql);
      saveDb();
    },
    transaction(fn) {
      return (items) => {
        sqlDb.run('BEGIN');
        try {
          fn(items);
          sqlDb.run('COMMIT');
          saveDb();
        } catch (e) {
          sqlDb.run('ROLLBACK');
          throw e;
        }
      };
    },
    pragma(sql) {
      sqlDb.run(`PRAGMA ${sql}`);
    },
    _raw: sqlDb,
  };
}

async function initDb() {
  if (db) return db;

  SQL = await initSqlJs();
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = wrapDb(sqlDb);
  return db;
}

function getDb() {
  if (!db) throw new Error('DB not initialised. Call initDb() first.');
  return db;
}

module.exports = { initDb, getDb };
