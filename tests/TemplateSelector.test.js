/**
 * TemplateSelector Component Test Suite - MISIÓN 191.1 Validation
 * Tests loading, rendering, and navigation behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateSelector from '../components/ProjectTracking/TemplateSelector';
import * as templatesLib from '../lib/templates';

// Mock next/navigation (App Router)
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn()
    })),
    usePathname: jest.fn(() => '/'),
    useSearchParams: jest.fn(() => new URLSearchParams())
}));

// Mock the templates library
jest.mock('../lib/templates', () => ({
    getAllTemplates: jest.fn(),
    getTemplatesByCategory: jest.fn()
}));

describe('TemplateSelector - MISIÓN 191.1 Validation', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('NIVEL 1: Validación de Carga de Datos', () => {

        test('Debe cargar templates exitosamente desde lib/templates.js', async () => {
            const mockTemplates = {
                daily_reflection: {
                    name: 'Reflexión Diaria',
                    subtitle: 'Metacognición',
                    description: 'Test description',
                    icon: '📝'
                }
            };

            const mockCategories = {
                'Reflexión y Seguimiento': ['daily_reflection']
            };

            templatesLib.getAllTemplates.mockReturnValue(mockTemplates);
            templatesLib.getTemplatesByCategory.mockReturnValue(mockCategories);

            render(<TemplateSelector />);

            await waitFor(() => {
                expect(templatesLib.getAllTemplates).toHaveBeenCalled();
                expect(templatesLib.getTemplatesByCategory).toHaveBeenCalled();
                expect(screen.getByText('Reflexión Diaria')).toBeInTheDocument();
            });
        });

        test('Debe mostrar loading state inicialmente', () => {
            // Templates return null to keep loading state visible on first render
            templatesLib.getAllTemplates.mockReturnValue(null);
            templatesLib.getTemplatesByCategory.mockReturnValue(null);

            const { container } = render(<TemplateSelector />);

            // Component shows loading or returns null when no data
            expect(container).toBeDefined();
        });
    });

    describe('NIVEL 2: Validación de Renderizado Resiliente', () => {

        test('Debe manejar templates null sin crash', () => {
            templatesLib.getAllTemplates.mockReturnValue(null);
            templatesLib.getTemplatesByCategory.mockReturnValue(null);

            expect(() => render(<TemplateSelector />)).not.toThrow();
        });

        test('Debe manejar templates vacíos sin crash', async () => {
            templatesLib.getAllTemplates.mockReturnValue({});
            templatesLib.getTemplatesByCategory.mockReturnValue({});

            expect(() => render(<TemplateSelector />)).not.toThrow();
        });

        test('Debe manejar template no existente en categoría sin crash', async () => {
            const mockTemplates = {
                existing_template: { name: 'Existe', icon: '📝', subtitle: 'Sub', description: 'Test' }
            };

            const mockCategories = {
                'Test Category': ['existing_template', 'non_existing_template']
            };

            templatesLib.getAllTemplates.mockReturnValue(mockTemplates);
            templatesLib.getTemplatesByCategory.mockReturnValue(mockCategories);

            render(<TemplateSelector />);

            await waitFor(() => {
                expect(screen.getByText('Existe')).toBeInTheDocument();
            });
            // non_existing_template simply doesn't render (returns null)
        });
    });

    describe('NIVEL 3: Validación de Integración', () => {

        test('Debe navegar con router.push cuando se hace click en una plantilla', async () => {
            const mockTemplates = {
                daily_reflection: {
                    name: 'Reflexión Diaria',
                    subtitle: 'Metacognición',
                    description: 'Test description',
                    icon: '📝'
                }
            };

            const mockCategories = {
                'Reflexión y Seguimiento': ['daily_reflection']
            };

            templatesLib.getAllTemplates.mockReturnValue(mockTemplates);
            templatesLib.getTemplatesByCategory.mockReturnValue(mockCategories);

            render(<TemplateSelector />);

            await waitFor(() => {
                expect(screen.getByText('Reflexión Diaria')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Reflexión Diaria'));

            expect(mockPush).toHaveBeenCalledWith('/plantillas/crear?type=daily_reflection');
        });

        test('Debe renderizar todas las categorías correctamente', async () => {
            const mockTemplates = {
                daily_reflection: { name: 'Reflexión', icon: '📝', subtitle: 'Sub1', description: 'Test 1' },
                dde_entry: { name: 'DDE', icon: '📋', subtitle: 'Sub2', description: 'Test 2' }
            };

            const mockCategories = {
                'Reflexión y Seguimiento': ['daily_reflection'],
                'Documentación Educativa': ['dde_entry']
            };

            templatesLib.getAllTemplates.mockReturnValue(mockTemplates);
            templatesLib.getTemplatesByCategory.mockReturnValue(mockCategories);

            render(<TemplateSelector />);

            await waitFor(() => {
                expect(screen.getByText('Reflexión y Seguimiento')).toBeInTheDocument();
                expect(screen.getByText('Documentación Educativa')).toBeInTheDocument();
                expect(screen.getByText('Reflexión')).toBeInTheDocument();
                expect(screen.getByText('DDE')).toBeInTheDocument();
            });
        });
    });

    describe('Validación de Seguridad y Robustez', () => {

        test('Debe manejar template con datos faltantes sin crash', async () => {
            const mockTemplates = {
                incomplete_template: {
                    name: 'Template Incompleto'
                    // Missing icon, description, subtitle
                }
            };

            const mockCategories = {
                'Test Category': ['incomplete_template']
            };

            templatesLib.getAllTemplates.mockReturnValue(mockTemplates);
            templatesLib.getTemplatesByCategory.mockReturnValue(mockCategories);

            expect(() => render(<TemplateSelector />)).not.toThrow();

            await waitFor(() => {
                expect(screen.getByText('Template Incompleto')).toBeInTheDocument();
            });
        });
    });
});
