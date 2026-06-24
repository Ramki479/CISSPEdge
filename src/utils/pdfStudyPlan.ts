/**
 * pdfStudyPlan.ts
 *
 * Generates a downloadable PDF study plan from the Study Coach's weakness
 * report data. Uses jsPDF with manual layout for maximum portability.
 */

import { jsPDF } from 'jspdf';
import type { WeaknessReport } from './weaknessAnalysis';

/* ─── Color palette ────────────────────────────────────────────────────── */
const COLORS = {
  darkBg: [8, 11, 20] as [number, number, number],
  darkCard: [13, 18, 34] as [number, number, number],
  border: [22, 28, 40] as [number, number, number],
  accent: [0, 240, 255] as [number, number, number],
  pink: [255, 0, 228] as [number, number, number],
  green: [16, 185, 129] as [number, number, number],
  red: [255, 0, 127] as [number, number, number],
  amber: [255, 184, 0] as [number, number, number],
  purple: [139, 92, 246] as [number, number, number],
  text: [200, 206, 216] as [number, number, number],
  textDim: [136, 146, 169] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/**
 * Domain-level color (simplified by domain ID).
 */
function domainColor(domainId: number): [number, number, number] {
  const map: Record<number, [number, number, number]> = {
    1: [59, 130, 246],    // blue
    2: [16, 185, 129],    // green
    3: [245, 158, 11],    // amber
    4: [239, 68, 68],     // red
    5: [139, 92, 246],    // purple
    6: [236, 72, 153],    // pink
    7: [20, 184, 166],    // teal
    8: [249, 115, 22],    // orange
  };
  return map[domainId] || COLORS.accent;
}

/**
 * Get a human-readable performance band label and color.
 */
function bandForAccuracy(acc: number): { label: string; color: [number, number, number] } {
  if (acc >= 90) return { label: 'Expert', color: COLORS.accent };
  if (acc >= 80) return { label: 'Strong', color: COLORS.green };
  if (acc >= 70) return { label: 'Good', color: [0, 188, 212] };
  if (acc >= 60) return { label: 'Needs Review', color: COLORS.amber };
  if (acc >= 50) return { label: 'High Priority', color: [255, 107, 107] };
  return { label: 'Critical', color: COLORS.red };
}

/* ═══════════════════════════════════════════════════════════════════════════
   PDF GENERATION
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generate a complete study plan PDF and trigger a download.
 */
export function downloadStudyPlanPdf(report: WeaknessReport): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();   // page width
  const ph = doc.internal.pageSize.getHeight();  // page height
  const ml = 16;  // margin left
  const mr = 16;  // margin right
  const cw = pw - ml - mr; // content width

  let y = 12; // current y position

  /* ─── Helper: add a new page if needed ──────────────────────────────── */
  function checkPage(needed: number = 20) {
    if (y + needed > ph - 16) {
      doc.addPage();
      y = 12;
    }
  }

  /* ─── Helper: draw a filled rect card ───────────────────────────────── */
  function card(h: number, color: [number, number, number] = COLORS.darkCard) {
    doc.setFillColor(...color);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, h, 1.5, 1.5, 'FD');
  }

  /* ─── Helper: draw accent bar at top of current card area ───────────── */
  function accentBar(barColor: [number, number, number]) {
    doc.setFillColor(...barColor);
    doc.roundedRect(ml, y, cw, 1.2, 0.3, 0.3, 'F');
  }

  /* ═══ PAGE 1: COVER ════════════════════════════════════════════════════ */

  // Background gradient effect — darker top area
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(0, 0, pw, ph, 'F');

  // Decorative top accent bar
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pw, 1.5, 'F');
  doc.setFillColor(...COLORS.pink);
  doc.rect(0, 1.5, pw, 0.3, 'F');

  // Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.accent);
  doc.text('#', ml, y + 10);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDim);
  doc.text('CISSP Edge — Study Plan', ml + 6, y + 10);

  y += 20;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...COLORS.white);
  doc.text('Personalized Study Plan', ml, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text(`Generated on ${dateStr}`, ml, y);

  y += 14;

  // Exam readiness score — large centered display
  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(...COLORS.darkCard);
  doc.roundedRect(ml, y, cw, 38, 2, 2, 'FD');

  const readinessColor = report.overallReadiness >= 75
    ? COLORS.accent : report.overallReadiness >= 50
    ? COLORS.amber : COLORS.red;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...readinessColor);
  doc.text(`${report.overallReadiness}%`, ml + 8, y + 18);

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDim);
  doc.text('Exam Readiness Score', ml + 8, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  const wrapLines = doc.splitTextToSize(report.interpretation, cw - 50);
  doc.text(wrapLines, ml + 48, y + 10);

  y += 44;

  // Quick summary boxes
  const boxW = (cw - 6) / 3;
  const summaryItems = [
    { label: 'Critical', value: report.criticalWeaknesses.length.toString(), color: COLORS.red },
    { label: 'Needs Review', value: report.needsReview.length.toString(), color: COLORS.amber },
    { label: 'Strong', value: report.strongAreas.length.toString(), color: COLORS.green },
  ];

  for (let i = 0; i < summaryItems.length; i++) {
    const item = summaryItems[i];
    const bx = ml + i * (boxW + 3);
    doc.setFillColor(...COLORS.darkCard);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(bx, y, boxW, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...item.color);
    doc.text(item.value, bx + 4, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textDim);
    doc.text(item.label, bx + 4, y + 15);
  }

  y += 24;

  // Study time
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textDim);
  doc.text(
    `Estimated study time: ~${report.estimatedStudyHours} hours across ${report.topRecommendedTopics.length} recommended topics.`,
    ml, y,
  );

  y += 14;

  /* ═══ SECTIONS: Top Recommendations ════════════════════════════════════ */

  checkPage(50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.white);
  doc.text('Top 5 Study Recommendations', ml, y);
  y += 4;

  // Underline
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.4);
  doc.line(ml, y, ml + 60, y);
  y += 8;

  report.topRecommendedTopics.slice(0, 5).forEach((rec, idx) => {
    checkPage(28);

    card(20, COLORS.darkCard);
    accentBar(
      rec.priority === 1 ? COLORS.red :
      rec.priority === 2 ? [255, 107, 107] as [number, number, number] :
      COLORS.amber,
    );

    // Priority number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(
      rec.priority === 1 ? COLORS.red :
      rec.priority === 2 ? [255, 107, 107] as [number, number, number] :
      COLORS.amber,
    );
    doc.text(`${idx + 1}`, ml + 4, y + 8);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text(rec.title, ml + 12, y + 8);

    // Reason
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.text);
    const reasonLines = doc.splitTextToSize(rec.reason, cw - 18);
    doc.text(reasonLines, ml + 12, y + 12);

    y += 24;
  });

  /* ═══ DOMAIN PERFORMANCE TABLE ═════════════════════════════════════════ */

  checkPage(30 + report.domains.length * 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.white);
  doc.text('Domain Performance Summary', ml, y);
  y += 4;

  doc.setDrawColor(...COLORS.pink);
  doc.setLineWidth(0.4);
  doc.line(ml, y, ml + 65, y);
  y += 8;

  // Table header
  doc.setFillColor(...COLORS.darkBg);
  doc.setDrawColor(...COLORS.border);
  doc.rect(ml, y, cw, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textDim);
  doc.text('Domain', ml + 3, y + 4);
  doc.text('Accuracy', ml + 80, y + 4);
  doc.text('Band', ml + 100, y + 4);
  doc.text('Correct', ml + 125, y + 4);
  doc.text('Questions', ml + 150, y + 4);
  y += 7;

  // Table rows sorted by accuracy ascending
  const sortedDomains = [...report.domains].sort((a, b) => a.accuracy - b.accuracy);

  sortedDomains.forEach((d) => {
    checkPage(8);
    const rowColor = y % 2 === 0 ? COLORS.darkCard : COLORS.darkBg;
    doc.setFillColor(...rowColor);
    doc.setDrawColor(...COLORS.border);
    doc.rect(ml, y, cw, 5.5, 'FD');

    // Domain name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.text(d.shortName.length > 18 ? d.shortName.slice(0, 16) + '...' : d.shortName, ml + 3, y + 4);

    // Accuracy bar (mini visual)
    const barWidth = Math.max(2, d.accuracy);
    const barColor = bandForAccuracy(d.accuracy).color;
    doc.setFillColor(...barColor);
    doc.roundedRect(ml + 62, y + 1.5, Math.min(barWidth, 30), 2.5, 0.8, 0.8, 'F');

    // Accuracy %
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...barColor);
    doc.text(`${Math.round(d.accuracy)}%`, ml + 80, y + 4);

    // Band label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.text);
    doc.text(bandForAccuracy(d.accuracy).label, ml + 100, y + 4);

    // Correct / Total
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textDim);
    doc.text(`${d.correctAnswers}`, ml + 125, y + 4);
    doc.text(`/ ${d.questionsAttempted}`, ml + 135, y + 4);

    // Questions count
    doc.setTextColor(...COLORS.textDim);
    doc.text(`${d.questionsAttempted}`, ml + 150, y + 4);

    y += 6.5;
  });

  y += 8;

  /* ═══ AI COACH INSIGHTS ════════════════════════════════════════════════ */

  checkPage(40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.white);
  doc.text('Coach Insights', ml, y);
  y += 4;

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(0.4);
  doc.line(ml, y, ml + 50, y);
  y += 8;

  const insights: string[] = [];
  if (report.criticalWeaknesses.length > 0) {
    insights.push(`Critical weaknesses: ${report.criticalWeaknesses.map(d => `${d.shortName} (${Math.round(d.accuracy)}%)`).join(', ')}. These domains need immediate attention.`);
  }
  if (report.needsReview.length > 0) {
    insights.push(`Needs review: ${report.needsReview.map(d => d.shortName).join(', ')}. Focus on these next.`);
  }
  if (report.strongAreas.length > 0) {
    insights.push(`Strong areas: ${report.strongAreas.slice(0, 3).map(d => `${d.shortName} (${Math.round(d.accuracy)}%)`).join(', ')}.`);
  }
  if (report.topRecommendedTopics.length > 0) {
    insights.push(`Study next: ${report.topRecommendedTopics[0].title} — ${report.topRecommendedTopics[0].reason}`);
  }

  insights.forEach((insight) => {
    checkPage(12);
    doc.setDrawColor(...COLORS.border);
    doc.setFillColor(...COLORS.darkCard);
    doc.roundedRect(ml, y, cw, 10, 1.2, 1.2, 'FD');

    // Bullet
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(...COLORS.purple);
    doc.text('●', ml + 3, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.text);
    const insLines = doc.splitTextToSize(insight, cw - 12);
    doc.text(insLines, ml + 8, y + 4);

    y += 13;
  });

  y += 6;

  /* ═══ STUDY PLAN STEPS ═════════════════════════════════════════════════ */

  checkPage(30 + report.studyPlan.length * 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.white);
  doc.text('Recommended Study Steps', ml, y);
  y += 4;

  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.4);
  doc.line(ml, y, ml + 70, y);
  y += 8;

  report.studyPlan.forEach((step) => {
    checkPage(8);

    const isHeader = step.startsWith('**');
    const cleanText = step.replace(/\*\*/g, '');
    const isEmpty = step.trim() === '';

    if (isEmpty) {
      y += 3;
      return;
    }

    doc.setFillColor(...COLORS.darkCard);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(ml, y, cw, 7, 1, 1, 'FD');

    if (isHeader) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.accent);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.text);
    }

    const stepLines = doc.splitTextToSize(cleanText, cw - 8);
    doc.text(stepLines, ml + 4, y + 4);

    y += 9;
  });

  y += 4;

  /* ═══ FINAL FOOTER ═════════════════════════════════════════════════════ */

  checkPage(15);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(ml, y, ml + cw, y);
  y += 4;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.textDim);
  doc.text('Generated by CISSP Edge AI Study Coach', ml, y);
  doc.text('Use alongside the Learning Path, Practice Tests, and AI Mentor for best results.', ml, y + 3);
  doc.text('CISSP is a registered trademark of (ISC)².', ml, y + 6);

  /* ═══ SAVE ═════════════════════════════════════════════════════════════ */

  const safeDate = dateStr.replace(/[,\s]+/g, '-').replace(/-+/g, '-');
  doc.save(`CISSP-Study-Plan-${safeDate}.pdf`);
}
