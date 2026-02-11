import migrate from './lib/db/migrate';

try {
    migrate();
    console.log('Migration script executed successfully.');
} catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
}
