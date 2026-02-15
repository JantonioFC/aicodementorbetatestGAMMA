/**
 * Jest Configuration for AI Code Mentor
 * Supports both Node.js and React component tests
 */

module.exports = {
    // Default environment for most tests
    testEnvironment: 'node',

    // Coverage settings
    collectCoverageFrom: [
        'lib/**/*.{js,ts,tsx}',
        'components/**/*.{js,ts,tsx}',
        '!**/*.d.ts',
        '!lib/**/*.test.{js,ts,tsx}',
        '!**/node_modules/**'
    ],

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.(js|ts|tsx)',
        '**/tests/**/*.test.(js|ts|tsx)'
    ],

    // Transform ESM to CommonJS for Jest
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
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
                '**/__tests__/**/*.test.(js|ts|tsx)',
                '**/tests/prompts/**/*.test.(js|ts|tsx)',
                '**/tests/integration/**/*.test.(js|ts|tsx)',
                '**/tests/unit/**/*.test.(js|ts|tsx)'
            ],
            testPathIgnorePatterns: [
                '/node_modules/',
                '/\\.next/',
                '/98_Obsolete_Archive/',
                '/99_Archive_Temp/'
            ],
            transform: {
                '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
                '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './.babelrc.jest.js' }]
            },
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/$1'
            }
        },
        {
            displayName: 'react',
            testEnvironment: 'jsdom',
            testMatch: [
                '**/tests/TemplateSelector.test.(js|ts|tsx)',
                '**/tests/components/**/*.test.(js|ts|tsx)'
            ],
            testPathIgnorePatterns: [
                '/node_modules/',
                '/\\.next/',
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
        '/\\.next/',
        '/98_Obsolete_Archive/',
        '/99_Archive_Temp/'
    ],

    // Module file extensions
    moduleFileExtensions: ['js', 'jsx', 'json', 'node', 'ts', 'tsx']
};
