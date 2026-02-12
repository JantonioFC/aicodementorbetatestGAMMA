/**
 * PDF Export Utility for AI Code Mentor
 * Client-side PDF generation using pdf-lib
 */
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';

export interface PDFExportLesson {
    title: string;
    content: string;
}

export interface PDFExportProgress {
    student_name: string;
    completed_lessons: number;
    avg_score: number;
    learning_path: string;
}

// Constants
const PAGE_WIDTH = 612;  // Letter size
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const TITLE_SIZE = 24;
const BODY_SIZE = 11;

/**
 * Export a lesson to PDF
 */
export async function exportLessonToPDF(lesson: PDFExportLesson): Promise<Uint8Array> {
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

    y -= 40;

    // Title
    page.drawText(lesson.title || 'Lección', {
        x: MARGIN,
        y: y,
        size: TITLE_SIZE,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
    });

    y -= 60;

    // Content
    const content = lesson.content || '';
    const lines = wrapText(content, PAGE_WIDTH - (MARGIN * 2), BODY_SIZE, helvetica);

    for (const line of lines) {
        if (y < MARGIN + 50) {
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

    // Save and download
    const pdfBytes = await pdfDoc.save();
    downloadPDF(pdfBytes, `leccion-${sanitizeFilename(lesson.title)}.pdf`);

    return pdfBytes;
}

/**
 * Export user progress report to PDF
 */
export async function exportProgressReportToPDF(progress: PDFExportProgress): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    page.drawText('AI Code Mentor - Reporte de Progreso', {
        x: MARGIN,
        y: y,
        size: TITLE_SIZE,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
    });

    // Añadir más detalles del progreso si es necesario
    y -= 40;
    page.drawText(`Estudiante: ${progress.student_name}`, {
        x: MARGIN,
        y: y,
        size: 12,
        font: helveticaBold
    });

    const pdfBytes = await pdfDoc.save();
    downloadPDF(pdfBytes, `reporte-progreso-${new Date().toISOString().split('T')[0]}.pdf`);

    return pdfBytes;
}

// Helper: Wrap text to fit width
function wrapText(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
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

    if (currentLine) lines.push(currentLine);
    return lines;
}

// Helper: Download PDF
function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
    return (name || 'documento')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
}

const pdfExport = {
    exportLessonToPDF,
    exportProgressReportToPDF
};

export default pdfExport;
