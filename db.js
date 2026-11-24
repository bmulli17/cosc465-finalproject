const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Sets the database
const db = new sqlite3.Database(
  path.join(__dirname, 'touch_point_food_pantry.db')
);

db.run('PRAGMA foreign_keys = ON;');

let transactionQueue = Promise.resolve();

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      } 
    });
  });
}

function runTransaction(callback){
  const operation = transactionQueue.then(async () => {
    await dbRun('BEGIN TRANSACTION');
    try{
      const result = await callback();
      await dbRun('COMMIT;');
      return result;
    }catch (err){
      await dbRun('ROLLBACK;').catch(() => {});
    }
  });

  transactionQueue = operation.catch(() => {});
  return operation;
}

module.exports = {
  db,
  dbAll,
  dbGet,
  dbRun,
  runTransaction
};