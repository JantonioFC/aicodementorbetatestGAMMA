/**
 * @deprecated Legacy Data Access Layer
 * FACADE PATTERN: Re-exports from new Structured Repositories.
 */
import { weekRepository } from './repositories/WeekRepository';
import { curriculumRepository } from './repositories/CurriculumRepository';
import db from './db';

const curriculumSqlite = {
    getWeekData: (id: number) => weekRepository.getWeekData(id),
    getWeekDetails: (id: number) => weekRepository.getWeekDetails(id),
    getCurriculumIndex: () => curriculumRepository.getCurriculumIndex(),
    getCurriculumSummary: () => curriculumRepository.getCurriculumSummary(),
    getPhasesOnly: () => curriculumRepository.getPhasesOnly(),
    validateDatabase: () => curriculumRepository.validateDatabase(),
    getDatabase: () => {
        console.warn('⚠️ [DEPRECATED] getDatabase() called.');
        return require('./db-instance');
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
