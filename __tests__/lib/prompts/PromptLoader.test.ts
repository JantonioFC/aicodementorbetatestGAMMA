
import path from 'path';
import fs from 'fs';
import { PromptLoader } from '../../../lib/prompts/PromptLoader';

// Mock fs module
jest.mock('fs');

describe('PromptLoader', () => {
    const mockBaseDir = '/mock/prompts';
    let loader: PromptLoader;

    beforeEach(() => {
        loader = new PromptLoader(mockBaseDir);
        jest.clearAllMocks();
    });

    describe('load', () => {
        it('should load and parse a JSON file successfully', () => {
            const fileName = 'test.json';
            const mockContent = JSON.stringify({ key: 'value' });
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const result = loader.load(fileName);

            expect(fs.readFileSync).toHaveBeenCalledWith(path.join(mockBaseDir, fileName), 'utf-8');
            expect(result).toEqual({ key: 'value' });
        });

        it('should return cached content if useCache is true', () => {
            const fileName = 'test.json';
            const mockContent = JSON.stringify({ key: 'value' });
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            // First load
            loader.load(fileName);
            // Second load
            const result = loader.load(fileName);

            expect(fs.readFileSync).toHaveBeenCalledTimes(1); // Should only be called once
            expect(result).toEqual({ key: 'value' });
        });

        it('should reload content if useCache is false', () => {
            const fileName = 'test.json';
            const mockContent = JSON.stringify({ key: 'value' });
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            // First load
            loader.load(fileName);
            // Second load without cache
            const result = loader.load(fileName, '', false);

            expect(fs.readFileSync).toHaveBeenCalledTimes(2); // Should be called twice
            expect(result).toEqual({ key: 'value' });
        });

        it('should throw an error if file reading fails', () => {
            const fileName = 'nonexistent.json';
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error('File not found');
            });

            expect(() => loader.load(fileName)).toThrow(/Failed to load prompt file 'nonexistent.json' \(scope: \): File not found/);
        });

        it('should throw an error if JSON parsing fails', () => {
            const fileName = 'invalid.json';
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

            expect(() => loader.load(fileName)).toThrow(/Failed to load prompt file 'invalid.json' \(scope: \):/);
        });
    });

    describe('interpolate', () => {
        it('should replace placeholders with values', () => {
            const template = 'Hello {name}, welcome to {place}!';
            const variables = { name: 'World', place: 'Earth' };
            const result = loader.interpolate(template, variables);

            expect(result).toBe('Hello World, welcome to Earth!');
        });

        it('should keep placeholders if value is missing', () => {
            const template = 'Hello {name}, welcome to {place}!';
            const variables = { name: 'World' };
            const result = loader.interpolate(template, variables);

            expect(result).toBe('Hello World, welcome to {place}!');
        });

        it('should handle empty template', () => {
            const result = loader.interpolate('', {});
            expect(result).toBe('');
        });

        it('should handle numeric values', () => {
            const template = 'Count: {count}';
            const varsString = { count: '123' };
            const result = loader.interpolate(template, varsString);
            expect(result).toBe('Count: 123');
        });
    });

    describe('clearCache', () => {
        it('should clear the cache', () => {
            const fileName = 'test.json';
            const mockContent = JSON.stringify({ key: 'value' });
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            loader.load(fileName);
            loader.clearCache();
            loader.load(fileName);

            expect(fs.readFileSync).toHaveBeenCalledTimes(2);
        });
    });
});
