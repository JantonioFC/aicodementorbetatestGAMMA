import { parentPort, workerData } from 'worker_threads';
import { retrieveDocumentationForCode } from './devdocs-core';

(async () => {
    try {
        const { codeSnippet, technology } = workerData;
        const result = await retrieveDocumentationForCode(codeSnippet, technology);
        if (parentPort) {
            parentPort.postMessage(result);
        }
    } catch (error) {
        if (parentPort) {
            parentPort.postMessage({ error: error instanceof Error ? error.message : String(error) });
        }
        process.exit(1);
    }
})();
