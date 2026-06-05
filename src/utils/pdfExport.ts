import type { StrategyReport } from '../types/film';

const GOLD: [number, number, number] = [201, 168, 76];
const DARK: [number, number, number] = [26, 26, 38];
const GREY: [number, number, number] = [100, 100, 100];
const BLACK: [number, number, number] = [50, 50, 50];
const GREEN: [number, number, number] = [34, 197, 94];
const RED: [number, number, number] = [239, 68, 68];
const YELLOW: [number, number, number] = [234, 179, 8];

export async function exportReportToPDF(report: StrategyReport): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkSpace = (needed: number) => {
    if (y + needed > pageH - 18) addPage();
  };

  const sectionTitle = (title: string) => {
    checkSpace(20);
    doc.setTextColor(...GOLD);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 5;
    doc.setDrawColor(...GREY);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  // ── Portada ──────────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, pageW, 50, 'F');

  doc.setTextColor(...GOLD);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FilmRoute', margin, 18);

  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text('Estrategia de Distribucion Cinematografica Independiente', margin, 26);

  doc.setTextColor(229, 231, 235);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  const titleText = `"${report.filmTitle}"`;
  doc.text(titleText, margin, 39);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Generado: ${report.generatedAt}  |  Indice de distribucion: ${report.overallScore}/100`,
    pageW - margin,
    39,
    { align: 'right' }
  );

  // Línea dorada decorativa bajo portada
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(margin, 49, pageW - margin, 49);
  doc.setLineWidth(0.2);

  y = 62;

  // ── Resumen ejecutivo ────────────────────────────────────────────────────
  sectionTitle('RESUMEN EJECUTIVO');
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const summaryLines = doc.splitTextToSize(report.executiveSummary, contentW);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 10;

  // ── DAFO ─────────────────────────────────────────────────────────────────
  sectionTitle('ANALISIS DAFO');

  const dafoData = [
    ['Fortalezas', report.strengths.join('\n') || '-'],
    ['Debilidades', report.weaknesses.join('\n') || 'Sin debilidades criticas identificadas'],
    ['Oportunidades', report.opportunities.join('\n') || '-'],
    ['Riesgos', report.risks.join('\n') || '-'],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: dafoData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 3.5, overflow: 'linebreak' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28, textColor: GOLD },
      1: { textColor: BLACK },
    },
    theme: 'grid',
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Festivales recomendados ───────────────────────────────────────────────
  sectionTitle(`FESTIVALES RECOMENDADOS (${report.recommendedFestivals.length})`);

  const festivalRows = report.recommendedFestivals.map(f => [
    f.name,
    f.country,
    f.tier.toUpperCase().replace('_', ' '),
    f.month,
    f.deadline,
    f.submissionFee,
    f.reason,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Festival', 'Pais', 'Tier', 'Mes', 'Deadline', 'Tasa', 'Razon']],
    body: festivalRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 38 },
      6: { cellWidth: 42 },
    },
    alternateRowStyles: { fillColor: [245, 245, 248] },
    theme: 'striped',
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Hoja de ruta de festivales ────────────────────────────────────────────
  if (report.festivalRoadmap.length > 0) {
    sectionTitle('HOJA DE RUTA — CIRCUITO DE FESTIVALES');

    const roadmapRows = report.festivalRoadmap.map(r => [
      r.month,
      r.festivals.join(', '),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Mes', 'Festivales']],
      body: roadmapRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { textColor: BLACK },
      },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ── Plataformas recomendadas ──────────────────────────────────────────────
  if (report.recommendedPlatforms.length > 0) {
    sectionTitle('PLATAFORMAS RECOMENDADAS');

    const platformRows = report.recommendedPlatforms.map(p => [
      p.name,
      p.type,
      p.territory,
      p.probability,
      p.notes,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Plataforma', 'Tipo', 'Territorio', 'Probabilidad', 'Notas']],
      body: platformRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        4: { cellWidth: 45 },
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const val = String(platformRows[data.row.index]?.[3] ?? '').toLowerCase();
          if (val.includes('alta')) data.cell.styles.textColor = GREEN;
          else if (val.includes('media')) data.cell.styles.textColor = YELLOW;
          else if (val.includes('baja')) data.cell.styles.textColor = RED;
        }
      },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ── Ventanas de distribución ──────────────────────────────────────────────
  sectionTitle('VENTANAS DE DISTRIBUCION');

  const windowRows = report.distributionWindows.map(w => [
    w.window,
    w.platform,
    w.timing,
    w.revenue,
    w.notes,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Ventana', 'Plataforma', 'Timing', 'Ingresos Est.', 'Notas']],
    body: windowRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
    columnStyles: { 4: { cellWidth: 42 } },
    theme: 'striped',
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Fases de marketing ────────────────────────────────────────────────────
  if (report.marketingPhases.length > 0) {
    sectionTitle('PLAN DE MARKETING — FASES');

    report.marketingPhases.forEach((phase, i) => {
      checkSpace(30);

      // Cabecera de fase
      doc.setFillColor(...DARK);
      doc.rect(margin, y - 3, contentW, 8, 'F');
      doc.setTextColor(...GOLD);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`FASE ${i + 1}: ${phase.phase.toUpperCase()}`, margin + 3, y + 2);
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Duracion: ${phase.duration}  |  Presupuesto: ${phase.budget}`, pageW - margin - 3, y + 2, { align: 'right' });
      y += 10;

      // Acciones
      doc.setTextColor(...BLACK);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Acciones:', margin + 2, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      phase.actions.forEach(action => {
        checkSpace(6);
        const lines = doc.splitTextToSize(`- ${action}`, contentW - 6);
        doc.text(lines, margin + 4, y);
        y += lines.length * 4.5;
      });

      // KPIs
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('KPIs:', margin + 2, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GREY);
      phase.kpis.forEach(kpi => {
        checkSpace(6);
        const lines = doc.splitTextToSize(`* ${kpi}`, contentW - 6);
        doc.text(lines, margin + 4, y);
        y += lines.length * 4.5;
      });

      y += 6;
    });
  }

  // ── Checklist de entregables ──────────────────────────────────────────────
  addPage();
  sectionTitle('CHECKLIST DE ENTREGABLES');

  const checklistRows = report.deliverableChecklist.map(item => [
    item.item,
    item.priority.toUpperCase(),
    item.status === 'listo' ? 'Listo' : item.status === 'en_proceso' ? 'En proceso' : 'Pendiente',
    item.deadline,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Entregable', 'Prioridad', 'Estado', 'Deadline']],
    body: checklistRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
    columnStyles: {
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      if (data.column.index === 1) {
        const val = String(checklistRows[data.row.index]?.[1] ?? '');
        if (val === 'ALTA') data.cell.styles.textColor = RED;
        else if (val === 'MEDIA') data.cell.styles.textColor = YELLOW;
        else data.cell.styles.textColor = GREEN;
      }
      if (data.column.index === 2) {
        const val = String(checklistRows[data.row.index]?.[2] ?? '');
        if (val === 'Listo') data.cell.styles.textColor = GREEN;
        else if (val === 'En proceso') data.cell.styles.textColor = YELLOW;
        else data.cell.styles.textColor = RED;
      }
    },
    theme: 'striped',
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Presupuesto ───────────────────────────────────────────────────────────
  if (report.totalBudgetEstimate > 0) {
    checkSpace(50);
    sectionTitle('DESGLOSE PRESUPUESTARIO');

    const budgetRows = report.budgetBreakdown.map(b => [
      b.category,
      `${b.recommended.toLocaleString('es-ES')} EUR`,
      `${b.percentage}%`,
    ]);
    budgetRows.push(['TOTAL ESTIMADO', `${report.totalBudgetEstimate.toLocaleString('es-ES')} EUR`, '100%']);

    autoTable(doc, {
      startY: y,
      head: [['Categoria', 'Importe', '%']],
      body: budgetRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: 'bold' },
      didParseCell: (data) => {
        if (data.row.index === budgetRows.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = GOLD;
          data.cell.styles.fillColor = DARK;
        }
      },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // ── Próximos pasos ────────────────────────────────────────────────────────
  checkSpace(30);
  sectionTitle('PROXIMOS PASOS INMEDIATOS');

  report.nextSteps.forEach((step, i) => {
    checkSpace(12);
    doc.setTextColor(...GOLD);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}.`, margin, y);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(step, contentW - 8);
    doc.text(lines, margin + 8, y);
    y += lines.length * 5 + 3;
  });

  // ── Footer en todas las páginas ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFillColor(10, 10, 15);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(...GREY);
    doc.text(
      `FilmRoute  |  "${report.filmTitle}"  |  Pagina ${page} de ${totalPages}`,
      pageW / 2,
      pageH - 4,
      { align: 'center' }
    );
  }

  const filename = `FilmRoute_${report.filmTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
