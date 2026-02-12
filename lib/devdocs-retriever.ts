import * as core from './devdocs-core';
import { DocumentationResult } from './devdocs-core';

/**
 * WRAPPER ASÍNCRONO (WORKER THREADS)
 * Delega la recuperación pesada a un hilo separado para no bloquear el Event Loop.
 */

import { Worker } from 'worker_threads';
import * as path from 'path';

export async function retrieveDocumentationForCode(codeSnippet: string, technology: string | null = null): Promise<DocumentationResult[]> {
    return new Promise((resolve, reject) => {
        // En producción el path debe apuntar al .js compilado o usar ts-node/register si se configura
        const worker = new Worker(path.join(__dirname, 'rag-worker.js'), {
            workerData: { codeSnippet, technology }
        });

        worker.on('message', (result: DocumentationResult[]) => {
            resolve(result);
        });

        worker.on('error', (err: Error) => {
            reject(err);
        });

        worker.on('exit', (code: number) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

// Exportar todo el core, sobreescribiendo la función pesada
const retriever = {
    ...core,
    retrieveDocumentationForCode
};

export default retriever;
