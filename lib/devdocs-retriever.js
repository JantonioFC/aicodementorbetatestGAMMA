const { Worker } = require('worker_threads');
const path = require('path');
const core = require('./devdocs-core');

/**
 * WRAPPER ASÍNCRONO (WORKER THREADS) - PERF-01
 * Delega la recuperación pesada a un hilo separado para no bloquear el Event Loop.
 */

async function retrieveDocumentationForCode(codeSnippet, technology = null) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'rag-worker.js'), {
            workerData: { codeSnippet, technology }
        });

        worker.on('message', (result) => {
            resolve(result);
            // Worker autoruns and exits or we terminate? 
            // Script style in rag-worker.js exits process when async done? 
            // No, Node.js workers keep running unless unref or terminate.
            // But if the script ends and no handles open... 
            // Explicit terminate is safer for "one-off" task.
            // However, terminate might cut off if not careful. 
            // Listen to 'exit' is better, but let's terminate on success explicitely to be sure.
            worker.terminate();
        });

        worker.on('error', (err) => {
            reject(err);
            worker.terminate();
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

// Exportar todo el core, sobreescribiendo la función pesada
module.exports = {
    ...core,
    retrieveDocumentationForCode
};
