import { request, FullConfig } from '@playwright/test';
import * as fs from 'fs';

const STORAGE_STATE_PATH = '.auth/storageState.json';

async function globalTeardown(config: FullConfig) {
    console.log('\nSweep [M-268 GlobalTeardown] Iniciando limpieza de estado del pipeline...\n');

    if (!fs.existsSync(STORAGE_STATE_PATH)) {
        console.log('ℹ️ No hay estado de autenticación para limpiar.');
        return;
    }

    try {
        const context = await request.newContext({
            storageState: STORAGE_STATE_PATH,
        });

        const response = await context.post('http://localhost:3000/api/e2e/cleanup-state');

        if (response.ok()) {
            const responseBody = await response.json();
            console.log('✅ [M-268 GlobalTeardown] Limpieza completada:', responseBody.metadata?.deletedRecords);
        }
    } catch (error: any) {
        console.error('\n❌ [M-268 GlobalTeardown] FALLO LA LIMPIEZA:', error.message);
    }
}

export default globalTeardown;
