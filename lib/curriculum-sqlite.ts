/**
 * @deprecated Legacy Data Access Layer
 * FACADE PATTERN: Re-exports from new Structured Repositories.
 */
import { weekRepository } from './repositories/WeekRepository';
import { curriculumRepository } from './repositories/CurriculumRepository';
import db from './db';
import { logger } from './observability/Logger';

const curriculumSqlite = {
    getWeekData: (id: number) => weekRepository.getWeekData(id),
    getWeekDetails: (id: number) => weekRepository.getWeekDetails(id),
    getCurriculumIndex: () => curriculumRepository.getCurriculumIndex(),
    getCurriculumSummary: () => curriculumRepository.getCurriculumSummary(),
    getPhasesOnly: () => curriculumRepository.getPhasesOnly(),
    validateDatabase: () => curriculumRepository.validateDatabase(),
    getDatabase: () => {
        logger.warn('[DEPRECATED] getDatabase() called. db-instance removed.');
        throw new Error('Database instance is no longer available via this deprecated method.');
    },
    closeDatabase: () => {
        db.close();
    }
};

export default curriculumSqlite;
export const {
    getWeekData, getWeekDetails, getCurriculumIndex,
    getCurriculumSummary, getPhasesOnly, validateDatabase,
    getDatabase, closeDatabase
} = curriculumSqlite;
