/**
 * ExportPDFButton - Button component for PDF exports
 * 
 * Usage:
 *   <ExportPDFButton type="lesson" data={lessonData} />
 *   <ExportPDFButton type="progress" data={progressData} />
 */

import React, { useState } from 'react';
import { exportLessonToPDF, exportProgressReportToPDF } from '@/lib/pdf/pdfExport';

export default function ExportPDFButton({ type, data, className = '' }) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;

        setIsExporting(true);

        try {
            if (type === 'lesson') {
                await exportLessonToPDF(data);
            } else if (type === 'progress') {
                await exportProgressReportToPDF(data);
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error al exportar PDF. Por favor intenta de nuevo.');
        } finally {
            setIsExporting(false);
        }
    };

    const labels = {
        lesson: 'Descargar Lección',
        progress: 'Descargar Reporte'
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`export-pdf-button ${className}`}
            aria-label={labels[type] || 'Exportar PDF'}
        >
            <span className="export-pdf-icon">
                {isExporting ? '⏳' : '📄'}
            </span>
            <span className="export-pdf-text">
                {isExporting ? 'Exportando...' : (labels[type] || 'Exportar PDF')}
            </span>

            <style jsx>{`
        .export-pdf-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .export-pdf-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .export-pdf-button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .export-pdf-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .export-pdf-icon {
          font-size: 16px;
        }
        
        @media (max-width: 480px) {
          .export-pdf-text {
            display: none;
          }
          
          .export-pdf-button {
            padding: 10px;
          }
        }
      `}</style>
        </button>
    );
}
