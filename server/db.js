import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFileName =
	process.env.NODE_ENV === "test" ? "test-database.sqlite" : "database.sqlite";
const dbPath = path.resolve(__dirname, "..", dbFileName);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
	// Entries table
	db.run(`CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        account TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT
    )`);

	// Accounts table
	db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )`);

	// Initial accounts if none exist
	db.get("SELECT count(*) as count FROM accounts", (_err, row) => {
		if (row && row.count === 0) {
			db.run("INSERT INTO accounts (name) VALUES ('Main Account')");
			db.run("INSERT INTO accounts (name) VALUES ('Joint Account')");
		}
	});
});

export default db;
