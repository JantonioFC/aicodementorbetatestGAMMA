/**
 * Servicio para exportar datos de lecciones y revisiones a diferentes formatos
 */
const exportService = {
    /**
     * Convierte una revisión de IRP a formato Markdown
     */
    convertToMarkdown(review) {
        const { feedback, metadata, review_id, created_at } = review;

        let md = `# 🎓 AI Code Mentor - Informe de Revisión\n\n`;
        md += `**ID de Revisión:** \`${review_id}\`  \n`;
        md += `**Fecha:** ${new Date(created_at).toLocaleDateString()}  \n`;
        md += `**Estudiante:** ${metadata?.display_name || 'Estudiante'}  \n\n`;

        md += `## 🤖 Mensaje del Mentor\n\n`;
        md += `> ${feedback.mensaje_tutor || 'No hay mensaje adicional.'}\n\n`;

        md += `## 🚀 Resumen de Metas\n\n`;
        md += `| Categoría | Puntuación | Rebuscada? |\n`;
        md += `| :--- | :---: | :---: |\n`;
        md += `| Clean Code | ${review.scores?.clean_code || 0}/5 | ${review.scores?.clean_code > 3 ? '✅' : '❌'} |\n`;
        md += `| Arquitectura | ${review.scores?.architecture || 0}/5 | ${review.scores?.architecture > 3 ? '✅' : '❌'} |\n`;
        md += `| Seguridad | ${review.scores?.security || 0}/5 | ${review.scores?.security > 3 ? '✅' : '❌'} |\n`;
        md += `| Testing | ${review.scores?.testing || 0}/5 | ${review.scores?.testing > 3 ? '✅' : '❌'} |\n\n`;

        md += `## ✅ Puntos Fuertes\n\n`;
        if (feedback.puntos_fuertes && feedback.puntos_fuertes.length > 0) {
            feedback.puntos_fuertes.forEach(p => {
                md += `### 🟢 ${p.titulo}\n`;
                md += `${p.descripcion}\n\n`;
            });
        } else {
            md += `No se identificaron puntos fuertes específicos.\n\n`;
        }

        md += `## 💡 Sugerencias de Mejora\n\n`;
        if (feedback.sugerencias_mejora && feedback.sugerencias_mejora.length > 0) {
            feedback.sugerencias_mejora.forEach(s => {
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
        if (feedback.preguntas_reflexion && feedback.preguntas_reflexion.length > 0) {
            feedback.preguntas_reflexion.forEach(q => {
                md += `- ${q}\n`;
            });
        } else {
            md += `- ¿Cómo podrías aplicar lo aprendido hoy en tu próximo proyecto?\n`;
        }

        md += `\n---\n*Generado automáticamente por AI Code Mentor v2.5 - Tu Mentor de Desarrollo 360*`;

        return md;
    }
};

module.exports = exportService;
