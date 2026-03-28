import db from "../db.js";

/**
 * Execute a query that returns multiple rows.
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {Promise<any[]>}
 */
export function dbAll(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
}

/**
 * Execute a query that returns a single row.
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {Promise<any>}
 */
export function dbGet(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
}
