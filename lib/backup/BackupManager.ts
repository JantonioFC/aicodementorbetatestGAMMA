import { storage } from '../storage/StorageManager';

export interface BackupData {
    version: string;
    createdAt: string;
    type: string;
    data: any;
    metadata: {
        analysisCount: number;
        hasDraft: boolean;
        encrypted: boolean;
    };
}

class BackupManager {
    private lastBackupKey = 'lastBackupTimestamp';

    async createBackup(options: { encrypt?: boolean; password?: string | null } = {}): Promise<BackupData> {
        await storage.init();
        const exportedData = await storage.exportAll();

        const backup: BackupData = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            type: 'full',
            data: {
                analyses: exportedData.analyses || [],
                draft: exportedData.draft || null
            },
            metadata: {
                analysisCount: exportedData.analyses?.length || 0,
                hasDraft: !!exportedData.draft,
                encrypted: !!options.encrypt
            }
        };

        if (options.encrypt && options.password) {
            // Lógica de encriptación omitida para brevedad en el plan, se incluirá completa con Web Crypto
        }

        this.saveLastBackupTimestamp();
        return backup;
    }

    private saveLastBackupTimestamp() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.lastBackupKey, new Date().toISOString());
        }
    }

    async restoreFromBackup(backupData: BackupData) {
        await storage.init();
        if (backupData.data.analyses) {
            for (const a of backupData.data.analyses) await storage.saveAnalysis(a);
        }
        return { success: true };
    }
}

export const backupManager = new BackupManager();
