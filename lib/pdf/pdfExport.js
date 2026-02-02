/**
 * PDF Export Utility for AI Code Mentor
 * Client-side PDF generation using pdf-lib
 * 
 * Usage:
 *   import { exportLessonToPDF, exportProgressReportToPDF } from '@/lib/pdf/pdfExport';
 *   await exportLessonToPDF(lessonData);
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Constants
const PAGE_WIDTH = 612;  // Letter size
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const TITLE_SIZE = 24;
const HEADING_SIZE = 16;
const BODY_SIZE = 11;

/**
 * Export a lesson to PDF
 * @param {Object} lesson - Lesson data
 * @param {string} lesson.title - Lesson title
 * @param {string} lesson.content - Lesson content (markdown)
 * @param {string} lesson.type - Lesson type (teoria, ejercicio, etc)
 * @param {Date} lesson.createdAt - Creation date
 */
export async function exportLessonToPDF(lesson) {
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    // Header
    page.drawText('AI Code Mentor', {
        x: MARGIN,
        y: y,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
    });

    page.drawText(new Date().toLocaleDateString('es-ES'), {
        x: PAGE_WIDTH - MARGIN - 80,
        y: y,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
    });

    y -= 40;

    // Title
    page.drawText(lesson.title || 'Lección', {
        x: MARGIN,
        y: y,
        size: TITLE_SIZE,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
    });

    y -= 30;

    // Type badge
    const typeLabels = {
        teoria: '📚 Teoría',
        ejercicio: '💪 Ejercicio',
        proyecto: '🚀 Proyecto',
        quiz: '❓ Quiz'
    };

    page.drawText(typeLabels[lesson.type] || 'Lección', {
        x: MARGIN,
        y: y,
        size: 12,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.8)
    });

    y -= 30;

    // Divider line
    page.drawLine({
        start: { x: MARGIN, y: y },
        end: { x: PAGE_WIDTH - MARGIN, y: y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });

    y -= 25;

    // Content
    const content = lesson.content || '';
    const lines = wrapText(content, PAGE_WIDTH - (MARGIN * 2), BODY_SIZE, helvetica);

    for (const line of lines) {
        if (y < MARGIN + 50) {
            // Add new page
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
        }

        page.drawText(line, {
            x: MARGIN,
            y: y,
            size: BODY_SIZE,
            font: helvetica,
            color: rgb(0.15, 0.15, 0.15)
        });

        y -= LINE_HEIGHT;
    }

    // Footer
    const pages = pdfDoc.getPages();
    pages.forEach((p, index) => {
        p.drawText(`Página ${index + 1} de ${pages.length}`, {
            x: PAGE_WIDTH / 2 - 30,
            y: 30,
            size: 9,
            font: helvetica,
            color: rgb(0.5, 0.5, 0.5)
        });
    });

    // Save and download
    const pdfBytes = await pdfDoc.save();
    downloadPDF(pdfBytes, `leccion-${sanitizeFilename(lesson.title)}.pdf`);

    return pdfBytes;
}

/**
 * Export user progress report to PDF
 * @param {Object} progress - User progress data
 */
export async function exportProgressReportToPDF(progress) {
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    // Header
    page.drawText('AI Code Mentor - Reporte de Progreso', {
        x: MARGIN,
        y: y,
        size: TITLE_SIZE,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
    });

    y -= 40;

    page.drawText(`Generado: ${new Date().toLocaleDateString('es-ES')}`, {
        x: MARGIN,
        y: y,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
    });

    y -= 40;

    // Stats
    const stats = [
        { label: 'Usuario', value: progress.userName || 'Anónimo' },
        { label: 'Lecciones Completadas', value: progress.lessonsCompleted || 0 },
        { label: 'Tiempo Total', value: formatDuration(progress.totalTime || 0) },
        { label: 'Semana Actual', value: progress.currentWeek || 1 },
        { label: 'Módulo Actual', value: progress.currentModule || 1 },
        { label: 'Porcentaje Completado', value: `${progress.completionPercentage || 0}%` }
    ];

    for (const stat of stats) {
        page.drawText(stat.label + ':', {
            x: MARGIN,
            y: y,
            size: 12,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.2)
        });

        page.drawText(String(stat.value), {
            x: MARGIN + 180,
            y: y,
            size: 12,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3)
        });

        y -= 25;
    }

    y -= 20;

    // Modules progress
    if (progress.modules && progress.modules.length > 0) {
        page.drawText('Progreso por Módulo:', {
            x: MARGIN,
            y: y,
            size: HEADING_SIZE,
            font: helveticaBold,
            color: rgb(0.1, 0.1, 0.1)
        });

        y -= 30;

        for (const moduleItem of progress.modules) {
            const barWidth = 200;
            const barHeight = 12;
            const fillWidth = (moduleItem.percentage / 100) * barWidth;

            // Module name
            page.drawText(moduleItem.name || `Módulo ${moduleItem.id}`, {
                x: MARGIN,
                y: y,
                size: 11,
                font: helvetica,
                color: rgb(0.2, 0.2, 0.2)
            });

            // Progress bar background
            page.drawRectangle({
                x: MARGIN + 150,
                y: y - 3,
                width: barWidth,
                height: barHeight,
                color: rgb(0.9, 0.9, 0.9)
            });

            // Progress bar fill
            page.drawRectangle({
                x: MARGIN + 150,
                y: y - 3,
                width: fillWidth,
                height: barHeight,
                color: rgb(0.2, 0.6, 0.4)
            });

            // Percentage text
            page.drawText(`${module.percentage}%`, {
                x: MARGIN + 360,
                y: y,
                size: 11,
                font: helvetica,
                color: rgb(0.3, 0.3, 0.3)
            });

            y -= 25;
        }
    }

    // Footer
    page.drawText('Generado automáticamente por AI Code Mentor', {
        x: PAGE_WIDTH / 2 - 100,
        y: 30,
        size: 9,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();
    downloadPDF(pdfBytes, `reporte-progreso-${new Date().toISOString().split('T')[0]}.pdf`);

    return pdfBytes;
}

// Helper: Wrap text to fit width
function wrapText(text, maxWidth, fontSize, font) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

// Helper: Download PDF
function downloadPDF(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Helper: Sanitize filename
function sanitizeFilename(name) {
    return (name || 'documento')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
}

// Helper: Format duration
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

export default {
    exportLessonToPDF,
    exportProgressReportToPDF
};
