import type { StrategyReport } from '../types/film';

export async function exportReportToPDF(report: StrategyReport): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkSpace = (needed: number) => {
    if (y + needed > 270) addPage();
  };

  // Header
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, pageW, 45, 'F');
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FilmRoute', margin, 18);
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text('Estrategia de Distribución Cinematográfica Independiente', margin, 26);
  doc.setTextColor(229, 231, 235);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`"${report.filmTitle}"`, margin, 37);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(`Generado: ${report.generatedAt} | Índice de distribución: ${report.overallScore}/100`, pageW - margin, 37, { align: 'right' });

  y = 55;

  // Resumen ejecutivo
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN EJECUTIVO', margin, y);
  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.line(margin, y, pageW - margin, y);
  y += 4;
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(report.executiveSummary, contentW);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 8;

  // DAFO
  checkSpace(40);
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS DAFO', margin, y);
  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const dafoData = [
    ['✓ Fortalezas', report.strengths.join('\n')],
    ['! Debilidades', report.weaknesses.join('\n') || 'Sin debilidades críticas identificadas'],
    ['→ Oportunidades', report.opportunities.join('\n')],
    ['⚠ Riesgos', report.risks.join('\n')],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: dafoData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30, textColor: [201, 168, 76] },
      1: { textColor: [50, 50, 50] },
    },
    theme: 'grid',
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Festivales recomendados
  checkSpace(30);
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`FESTIVALES RECOMENDADOS (${report.recommendedFestivals.length})`, margin, y);
  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  const festivalRows = report.recommendedFestivals.map(f => [
    f.name,
    f.country,
    f.tier.toUpperCase().replace('_', ' '),
    f.month,
    f.deadline,
    f.submissionFee,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Festival', 'País', 'Tier', 'Mes', 'Deadline', 'Tasa']],
    body: festivalRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [26, 26, 38], textColor: [201, 168, 76], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 240, 245] },
    theme: 'striped',
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Ventanas de distribución
  checkSpace(30);
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTANAS DE DISTRIBUCIÓN', margin, y);
  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  const windowRows = report.distributionWindows.map(w => [w.window, w.platform, w.timing, w.revenue]);
  autoTable(doc, {
    startY: y,
    head: [['Ventana', 'Plataforma', 'Timing', 'Ingresos Estimados']],
    body: windowRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [26, 26, 38], textColor: [201, 168, 76], fontStyle: 'bold' },
    theme: 'striped',
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Checklist de entregables
  addPage();
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST DE ENTREGABLES', margin, y);
  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  const checklistRows = report.deliverableChecklist.map(item => [
    item.item,
    item.priority.toUpperCase(),
    item.status === 'listo' ? '✓' : item.status === 'en_proceso' ? '⏳' : '✗',
    item.deadline,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Entregable', 'Prioridad', 'Estado', 'Deadline']],
    body: checklistRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [26, 26, 38], textColor: [201, 168, 76], fontStyle: 'bold' },
    columnStyles: {
      1: {
        fontStyle: 'bold',
      },
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const val = checklistRows[data.row.index]?.[2];
        if (val === '✓') data.cell.styles.textColor = [34, 197, 94];
        else if (val === '✗') data.cell.styles.textColor = [239, 68, 68];
        else data.cell.styles.textColor = [234, 179, 8];
      }
    },
    theme: 'striped',
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Presupuesto
  if (report.totalBudgetEstimate > 0) {
    checkSpace(40);
    doc.setTextColor(201, 168, 76);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE PRESUPUESTARIO', margin, y);
    y += 6;
    doc.setTextColor(100, 100, 100);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    const budgetRows = report.budgetBreakdown.map(b => [
      b.category,
      `${b.recommended.toLocaleString('es-ES')} €`,
      `${b.percentage}%`,
    ]);
    budgetRows.push(['TOTAL', `${report.totalBudgetEstimate.toLocaleString('es-ES')} €`, '100%']);

    autoTable(doc, {
      startY: y,
      head: [['Categoría', 'Importe', '%']],
      body: budgetRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [26, 26, 38], textColor: [201, 168, 76], fontStyle: 'bold' },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Próximos pasos
  checkSpace(50);
  doc.setTextColor(201, 168, 76);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRÓXIMOS PASOS INMEDIATOS', margin, y);
  y += 6;
  doc.setTextColor(100, 100, 100);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  report.nextSteps.forEach((step, i) => {
    checkSpace(10);
    doc.setTextColor(201, 168, 76);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}.`, margin, y);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(step, contentW - 8);
    doc.text(lines, margin + 8, y);
    y += lines.length * 5 + 3;
  });

  // Footer en todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 287, pageW, 10, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`FilmRoute — Estrategia de Distribución | "${report.filmTitle}" | Pág. ${page} de ${totalPages}`, pageW / 2, 292, { align: 'center' });
  }

  doc.save(`FilmRoute_Estrategia_${report.filmTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
