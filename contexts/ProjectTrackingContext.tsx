
// contexts/ProjectTrackingContext.tsx
// MVP Context for Project Tracking - Created to resolve compilation errors
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Interfaces
interface ProjectDashboardData {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalHours: number;
}

interface ProjectEntry {
    id: number;
    entry_type: string;
    date: string;
    [key: string]: any;
}

interface ProjectTrackingContextType {
    dashboardData: ProjectDashboardData | null;
    entryCounts: Record<string, number>;
    recentEntries: ProjectEntry[];
    loading: boolean;
    error: string | null;
    loadDashboardData: () => Promise<void>;
    refreshData: () => Promise<void>;
    selectedTemplate: string | null;
    templates: Record<string, any>;
    isModalOpen: boolean;
    closeModal: () => void;
    createEntry: (template: string, content: string, metadata: any) => Promise<any>;
    resetError: () => void;
    addEntry: (entryType: string, entryData: any) => Promise<{ success: boolean; entry?: ProjectEntry; error?: string }>;
    updateEntry: (entryId: number, updateData: any) => Promise<{ success: boolean; error?: string }>;
    deleteEntry: (entryId: number, entryType: string) => Promise<{ success: boolean; error?: string }>;
    exportToPortfolio: () => Promise<{ success: boolean; message: string }>;
    resetAllData: () => Promise<{ success: boolean; error?: string }>;
    selectTemplate: (templateType: string) => { success: boolean; templateType?: string; action?: string; error?: string };
    isLoading: boolean;
    hasError: boolean;
    totalEntries: number;
}

// Create the Project Tracking context
const ProjectTrackingContext = createContext<ProjectTrackingContextType | undefined>(undefined);

interface ProjectTrackingProviderProps {
    children: ReactNode;
}

/**
 * Project Tracking Provider - MVP Version
 * Provides basic project tracking functionality to resolve compilation issues
 * This is a minimal viable version that can be expanded later
 */
export function ProjectTrackingProvider({ children }: ProjectTrackingProviderProps) {
    // Basic state management
    const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null);
    const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
    const [recentEntries, setRecentEntries] = useState<ProjectEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [templates, setTemplates] = useState<Record<string, any>>({});

    // Mock data for development
    const mockDashboardData: ProjectDashboardData = React.useMemo(() => ({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalHours: 0
    }), []);

    const mockEntryCounts = React.useMemo(() => ({
        dde_entry: 0,
        weekly_action_plan: 0,
        unified_tracking_log: 0,
        peer_review: 0,
        project_reflection: 0
    }), []);

    const mockRecentEntries: ProjectEntry[] = React.useMemo(() => [], []);

    // Initialize with mock data
    useEffect(() => {
        setDashboardData(mockDashboardData);
        setEntryCounts(mockEntryCounts);
        setRecentEntries(mockRecentEntries);
    }, [mockDashboardData, mockEntryCounts, mockRecentEntries]);

    // Load dashboard data function - MVP implementation
    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // In a real implementation, this would make API calls
            // For now, we just set the mock data
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate loading

            setDashboardData(mockDashboardData);
            setEntryCounts(mockEntryCounts);
            setRecentEntries(mockRecentEntries);

            console.log('📊 [PROJECT_TRACKING] Dashboard data loaded (MVP mode)');
        } catch (err: any) {
            console.error('❌ [PROJECT_TRACKING] Error loading dashboard data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [mockDashboardData, mockEntryCounts, mockRecentEntries]);

    // Add new entry function - MVP implementation
    const addEntry = async (entryType: string, entryData: any) => {
        setLoading(true);
        try {
            // In a real implementation, this would save to database
            console.log(`➕ [PROJECT_TRACKING] Adding entry: ${entryType}`, entryData);

            // Update entry counts
            setEntryCounts(prev => ({
                ...prev,
                [entryType]: (prev[entryType] || 0) + 1
            }));

            // Add to recent entries
            const newEntry: ProjectEntry = {
                id: Date.now(),
                entry_type: entryType,
                date: new Date().toISOString(),
                ...entryData
            };

            setRecentEntries(prev => [newEntry, ...prev.slice(0, 4)]); // Keep only 5 recent

            return { success: true, entry: newEntry };
        } catch (err: any) {
            console.error('❌ [PROJECT_TRACKING] Error adding entry:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Update entry function - MVP implementation
    const updateEntry = async (entryId: number, updateData: any) => {
        setLoading(true);
        try {
            console.log(`📝 [PROJECT_TRACKING] Updating entry: ${entryId}`, updateData);

            // Update recent entries
            setRecentEntries(prev =>
                prev.map(entry =>
                    entry.id === entryId ? { ...entry, ...updateData } : entry
                )
            );

            return { success: true };
        } catch (err: any) {
            console.error('❌ [PROJECT_TRACKING] Error updating entry:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Delete entry function - MVP implementation
    const deleteEntry = async (entryId: number, entryType: string) => {
        setLoading(true);
        try {
            console.log(`🗑️ [PROJECT_TRACKING] Deleting entry: ${entryId}`);

            // Update entry counts
            setEntryCounts(prev => ({
                ...prev,
                [entryType]: Math.max((prev[entryType] || 0) - 1, 0)
            }));

            // Remove from recent entries
            setRecentEntries(prev => prev.filter(entry => entry.id !== entryId));

            return { success: true };
        } catch (err: any) {
            console.error('❌ [PROJECT_TRACKING] Error deleting entry:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Export to portfolio function - MVP implementation
    const exportToPortfolio = async () => {
        console.log('📁 [PROJECT_TRACKING] Exporting to portfolio (MVP mode)');
        return {
            success: true,
            message: 'Portfolio export functionality will be implemented in future versions'
        };
    };

    // Reset all data function - MVP implementation
    const resetAllData = async () => {
        setLoading(true);
        try {
            console.log('🔄 [PROJECT_TRACKING] Resetting all data (MVP mode)');

            setDashboardData(mockDashboardData);
            setEntryCounts(mockEntryCounts);
            setRecentEntries(mockRecentEntries);
            setError(null);

            return { success: true };
        } catch (err: any) {
            console.error('❌ [PROJECT_TRACKING] Error resetting data:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Select template function - Route to functional pages for ALL templates
    const selectTemplate = (templateType: string) => {
        try {
            console.log(`📋 [PROJECT_TRACKING] Template selected: ${templateType}`);

            // Route to specific page for IRP (has special AI generation functionality)
            if (templateType === 'peer_review') {
                console.log('✅ [PROJECT_TRACKING] Routing to specialized IRP page...');
                window.location.href = '/irp';
                return { success: true, templateType, action: 'routed_specialized' };
            }

            // Route to universal template creator for all other templates
            console.log(`✅ [PROJECT_TRACKING] Routing to template creator for: ${templateType}`);
            window.location.href = `/crear-template?type=${templateType}`;

            return { success: true, templateType, action: 'routed_universal' };
        } catch (err: any) {
            console.error('❌ [PROJECT_TRACKING] Error selecting template:', err);
            return { success: false, error: err.message };
        }
    };

    // Context value with all required functions and state
    const value: ProjectTrackingContextType = {
        // State
        dashboardData,
        entryCounts,
        recentEntries,
        loading,
        error,

        // Functions
        loadDashboardData,
        refreshData: loadDashboardData,
        selectedTemplate,
        templates,
        isModalOpen,
        closeModal: () => setIsModalOpen(false),
        createEntry: async (template: string, content: string, metadata: any) => {
            return addEntry(template, { content, ...metadata });
        },
        resetError: () => setError(null),
        addEntry,
        updateEntry,
        deleteEntry,
        exportToPortfolio,
        resetAllData,
        selectTemplate,

        // Utilities
        isLoading: loading,
        hasError: !!error,
        totalEntries: Object.values(entryCounts).reduce((sum, count) => sum + count, 0)
    };

    return (
        <ProjectTrackingContext.Provider value={value}>
            {children}
        </ProjectTrackingContext.Provider>
    );
}

/**
 * Custom hook to use the Project Tracking context
 * Must be used within a ProjectTrackingProvider
 */
export function useProjectTracking() {
    const context = useContext(ProjectTrackingContext);

    if (context === undefined) {
        throw new Error('useProjectTracking must be used within a ProjectTrackingProvider');
    }

    return context;
}

export default useProjectTracking;
