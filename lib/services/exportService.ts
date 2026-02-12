import jsPDF from 'jspdf';
import JSZip from 'jszip';

/**
 * Interfaces de Dominio para Exportación
 */

export interface ReviewFeedback {
    mensaje_tutor?: string;
    puntos_fuertes?: Array<{ titulo: string; descripcion: string }>;
    sugerencias_mejora?: Array<{ titulo: string; descripcion: string; codigo_ejemplo?: string }>;
    preguntas_reflexion?: string[];
}

export interface ReviewScores {
    clean_code: number;
    architecture: number;
    security: number;
    testing: number;
    [key: string]: number;
}

export interface ReviewData {
    review_id: string;
    created_at: string;
    metadata?: {
        display_name?: string;
        [key: string]: unknown;
    };
    feedback?: ReviewFeedback;
    scores?: ReviewScores;
}

export interface PortfolioDocument {
    metadata: {
        title: string;
        student: string;
        generatedAt: string;
    };
    sections: Array<{
        title: string;
        content: string;
    }>;
}

/**
 * Servicio para exportar datos de lecciones y revisiones a diferentes formatos
 */
const exportService = {
    /**
     * Convierte una revisión de IRP a formato Markdown
     */
    convertToMarkdown(review: ReviewData): string {
        const { feedback, metadata, review_id, created_at, scores } = review;

        let md = `# 🎓 AI Code Mentor - Informe de Revisión\n\n`;
        md += `**ID de Revisión:** \`${review_id}\`  \n`;
        md += `**Fecha:** ${new Date(created_at).toLocaleDateString()}  \n`;
        md += `**Estudiante:** ${metadata?.display_name || 'Estudiante'}  \n\n`;

        md += `## 🤖 Mensaje del Mentor\n\n`;
        md += `> ${feedback?.mensaje_tutor || 'No hay mensaje adicional.'}\n\n`;

        md += `## 🚀 Resumen de Metas\n\n`;
        md += `| Categoría | Puntuación | Rebuscada? |\n`;
        md += `| :--- | :---: | :---: |\n`;
        md += `| Clean Code | ${scores?.clean_code || 0}/5 | ${scores && scores.clean_code > 3 ? '✅' : '❌'} |\n`;
        md += `| Arquitectura | ${scores?.architecture || 0}/5 | ${scores && scores.architecture > 3 ? '✅' : '❌'} |\n`;
        md += `| Seguridad | ${scores?.security || 0}/5 | ${scores && scores.security > 3 ? '✅' : '❌'} |\n`;
        md += `| Testing | ${scores?.testing || 0}/5 | ${scores && scores.testing > 3 ? '✅' : '❌'} |\n\n`;

        md += `## ✅ Puntos Fuertes\n\n`;
        if (feedback?.puntos_fuertes && feedback.puntos_fuertes.length > 0) {
            feedback.puntos_fuertes.forEach((p) => {
                md += `### 🟢 ${p.titulo}\n`;
                md += `${p.descripcion}\n\n`;
            });
        } else {
            md += `No se identificaron puntos fuertes específicos.\n\n`;
        }

        md += `## 💡 Sugerencias de Mejora\n\n`;
        if (feedback?.sugerencias_mejora && feedback.sugerencias_mejora.length > 0) {
            feedback.sugerencias_mejora.forEach((s) => {
                md += `### 🟠 ${s.titulo}\n`;
                md += `${s.descripcion}\n\n`;
                if (s.codigo_ejemplo) {
                    md += `**Ejemplo de código:**\n\`\`\`javascript\n${s.codigo_ejemplo}\n\`\`\`\n\n`;
                }
            });
        } else {
            md += `No hay sugerencias de mejora urgentes para este nivel.\n\n`;
        }

        md += `## 🤔 Preguntas para la Reflexión\n\n`;
        if (feedback?.preguntas_reflexion && feedback.preguntas_reflexion.length > 0) {
            feedback.preguntas_reflexion.forEach((q) => {
                md += `- ${q}\n`;
            });
        } else {
            md += `- ¿Cómo podrías aplicar lo aprendido hoy en tu próximo proyecto?\n`;
        }

        md += `\n---\n*Generado automáticamente por AI Code Mentor v2.5 - Tu Mentor de Desarrollo 360*`;

        return md;
    },

    /**
     * Genera un PDF de portfolio
     */
    async generatePortfolioPDF(document: PortfolioDocument): Promise<Buffer> {
        const pdf = new jsPDF();
        pdf.setFontSize(20);
        pdf.text(document.metadata.title, 20, 30);
        pdf.setFontSize(12);
        pdf.text(`Estudiante: ${document.metadata.student}`, 20, 45);
        pdf.text(`Fecha: ${document.metadata.generatedAt}`, 20, 52);

        document.sections.forEach((section) => {
            pdf.addPage();
            pdf.setFontSize(16);
            pdf.text(section.title, 20, 30);
            pdf.setFontSize(10);
            const lines = pdf.splitTextToSize(section.content.replace(/<[^>]*>?/gm, ''), 170) as string[];
            pdf.text(lines, 20, 50);
        });

        return Buffer.from(pdf.output('arraybuffer'));
    },

    /**
     * Genera un ZIP para GitHub Pages
     */
    async generateGitHubZip(htmlContent: string, readme: string): Promise<Buffer> {
        const zip = new JSZip();
        zip.file('index.html', htmlContent);
        zip.file('README.md', readme);
        zip.file('_config.yml', 'theme: jekyll-theme-cayman');
        return await zip.generateAsync({ type: 'nodebuffer' });
    }
};

export default exportService;
