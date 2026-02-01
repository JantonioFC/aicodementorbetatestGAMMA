const db = require('../lib/db');

try {
    console.log('--- TABLES ---');
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(tables.map(t => t.name).join('\n'));

    console.log('\n--- SCHEMA DUMP ---');
    const schema = db.query("SELECT sql FROM sqlite_master WHERE type='table'");
    console.log(schema.map(s => s.sql).join('\n;\n'));

} catch (err) {
    console.error("Error inspecting DB:", err);
}
