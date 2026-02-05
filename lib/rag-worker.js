const { parentPort, workerData } = require('worker_threads');
const { retrieveDocumentationForCode } = require('./devdocs-core');

// Worker Entry Point for CPU-intensive RAG operations
(async () => {
    try {
        const { codeSnippet, technology } = workerData;
        const result = await retrieveDocumentationForCode(codeSnippet, technology);
        parentPort.postMessage(result);
    } catch (error) {
        // Ensure error is serializable/propagated
        throw error;
    }
})();
