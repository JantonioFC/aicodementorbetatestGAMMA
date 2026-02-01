/**
 * Script para indexar el currículo con embeddings.
 * Uso: node scripts/index-curriculum.js
 */

// Cargar variables de entorno desde .env.local (Next.js lo hace automáticamente, pero node no)
require('dotenv').config({ path: '.env.local' });

const { embeddingService } = require('../lib/rag/EmbeddingService');

async function main() {
    console.log('🚀 Iniciando indexación del currículo...\n');

    try {
        const result = await embeddingService.indexCurriculum();
        console.log('\n📊 Resultado:');
        console.log(`   - Nuevos indexados: ${result.indexed}`);
        console.log(`   - Ya existentes: ${result.skipped}`);
        console.log('\n✅ Indexación completada.');
    } catch (error) {
        console.error('❌ Error durante indexación:', error);
        process.exit(1);
    }
}

main();
