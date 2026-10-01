const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log('Cleaning up backup tables...');
    db.run("DROP TABLE IF EXISTS Users_backup", (err) => {
        if (err) console.error("Error dropping Users_backup", err);
        else console.log("Dropped Users_backup");
    });
    db.run("DROP TABLE IF EXISTS Voters_backup", (err) => {
        if (err) console.error("Error dropping Voters_backup", err);
        else console.log("Dropped Voters_backup");
    });
});

db.close();
