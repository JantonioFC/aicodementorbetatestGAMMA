/**
 * Jest Configuration for AI Code Mentor
 * Supports both Node.js and React component tests
 */

module.exports = {
    // Default environment for most tests
    testEnvironment: 'node',

    // Coverage settings
    collectCoverageFrom: [
        'lib/**/*.js',
        '!lib/**/*.test.js'
    ],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/tests/**/*.test.js'
    ],

    // Transform ESM to CommonJS for Jest
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
    },

    // Handle module name mapping for imports
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },

    // Setup files to run before tests
    setupFilesAfterEnv: [
        '@testing-library/jest-dom'
    ],

    // Override environment for React component tests
    projects: [
        {
            displayName: 'node',
            testEnvironment: 'node',
            testMatch: [
                '**/__tests__/**/*.test.js',
                '**/tests/prompts/**/*.test.js',
                '**/tests/integration/**/*.test.js',
                '**/tests/unit/**/*.test.js'
            ],
            testPathIgnorePatterns: [
                '/node_modules/',
                '/98_Obsolete_Archive/',
                '/99_Archive_Temp/'
            ],
            transform: {
                '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './.babelrc.jest.js' }]
            }
        },
        {
            displayName: 'react',
            testEnvironment: 'jsdom',
            testMatch: [
                '**/tests/TemplateSelector.test.js',
                '**/tests/components/**/*.test.js'
            ],
            testPathIgnorePatterns: [
                '/node_modules/',
                '/98_Obsolete_Archive/',
                '/99_Archive_Temp/'
            ],
            transform: {
                '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './.babelrc.jest.js' }]
            },
            setupFilesAfterEnv: [
                '@testing-library/jest-dom'
            ]
        }
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/98_Obsolete_Archive/',
        '/99_Archive_Temp/'
    ],

    // Module file extensions
    moduleFileExtensions: ['js', 'jsx', 'json', 'node', 'ts', 'tsx']
};
