import { NextApiRequest, NextApiResponse } from 'next';
import { BaseController } from './BaseController';
import { smartLessonGenerator } from '../services/SmartLessonGenerator';
import { LessonRequest, LessonContent } from '../services/LessonService';

export class LessonController extends BaseController {
    async generate(req: NextApiRequest, res: NextApiResponse): Promise<void> {
        try {
            // Input is already validated by middleware
            const params = req.body as LessonRequest;

            // Delegate to Agentic Service
            const result = await smartLessonGenerator.generateWithAutonomy(params);

            this.handleSuccess(res, result as unknown as Record<string, unknown>);
        } catch (error: unknown) {
            this.handleError(res, error, 'LessonController.generate');
        }
    }
}

export const lessonController = new LessonController();
