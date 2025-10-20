import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GymLogo from "../assets/GymLogo.jpg";

export function generateMealRequestsPDF(requests = [], totals = {}, options = {}) {
  const title = options.title || "Meal Requests Report";
  const suffix = new Date().toISOString().slice(0, 10);
  const fileName = options.fileName || `meal_requests_report_${suffix}.pdf`;

  const fmtISO = (d) => {
    if (!d) return "-";
    try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? String(d) : dt.toISOString().slice(0,10); } catch { return String(d); }
  };
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();

  // Compact brand header (match mealTemplate style)
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 12, W, 36, 'F');
  try { doc.addImage(GymLogo, 'JPEG', 20, 18, 28, 28); } catch {}
  doc.setFontSize(20); doc.setTextColor(220,38,38);
  try { doc.setFont('helvetica','bold'); } catch {}
  doc.text('Gettz Fitness', 60, 30);
  try { doc.setFont('helvetica','normal'); } catch {}
  doc.setFontSize(9.5); doc.setTextColor(0);
  doc.text('Address: 48 Udyana Mawatha, Matara  |  Email: support@gettzfitness.lk  |  +94 77 780 4602', 60, 40);
  doc.setDrawColor(220,38,38); doc.setLineWidth(0.8);
  doc.line(20, 60, W - 20, 60);

  // Title (centered)
  doc.setFontSize(16); doc.setTextColor(0);
  doc.text(title, W/2, 78, { align: 'center' });

  // Box: REPORT DETAILS | SUMMARY
  const boxX = 20, boxY = 88, boxW = W - 40, boxH = 48;
  doc.setDrawColor(220,38,38); doc.setLineWidth(0.6);
  if (doc.roundedRect) doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3); else doc.rect(boxX, boxY, boxW, boxH);
  const midX = boxX + boxW/2;
  doc.setFontSize(9); doc.setTextColor(220,38,38);
  doc.text('REPORT DETAILS', boxX + 6, boxY + 10);
  doc.text('SUMMARY', midX + 6, boxY + 10);
  doc.setTextColor(100); doc.setFontSize(9.5);
  const reportId = `MR-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14)}`;
  doc.text(`REPORT ID   ${reportId}`, boxX + 6, boxY + 20);
  doc.text(`GENERATED   ${new Date().toLocaleString()}`, boxX + 6, boxY + 30);
  const count = Number(totals.count || requests.length || 0);
  doc.text(`ITEMS   ${String(count)}`, midX + 6, boxY + 20);

  // Filters line
  const filters = options.filters || {};
  const statusText = filters.status ? (filters.status === 'all' ? 'All' : filters.status.charAt(0).toUpperCase() + filters.status.slice(1)) : '-';
  const mealTypeText = filters.mealType ? (filters.mealType === 'all' ? 'All' : filters.mealType.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join('-')) : '-';
  const dateFromText = fmtISO(filters.dateFrom);
  const dateToText = fmtISO(filters.dateTo);
  const searchText = filters.q ? String(filters.q) : '-';
  doc.setTextColor(0); doc.setFontSize(9);
  doc.text(`Filters: Status ${statusText} | Meal Type ${mealTypeText} | Date ${dateFromText} to ${dateToText} | Search ${searchText}`, boxX, boxY + boxH + 10);

  // Pie chart: Urgent vs Normal
  const urgent = Number(totals.urgent || requests.filter(r => String(r.status||'').toLowerCase()==='urgent').length || 0);
  const normal = Number(totals.normal || Math.max(0, count - urgent));
  let tableStartY = boxY + boxH + 18;
  try {
    const data = [
      { label: 'Urgent', value: urgent, color: '#ef4444' },
      { label: 'Normal', value: normal, color: '#10b981' },
    ];
    const total = urgent + normal;
    if (total > 0) {
      const chartSize = 70; // compact and readable
      const chartX = (W - chartSize) / 2;
      const chartY = boxY + boxH + 30; // space under box
      const canvas = document.createElement('canvas');
      canvas.width = chartSize * 2; canvas.height = chartSize * 2;
      const ctx = canvas.getContext('2d');
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 10;
      let startAngle = -Math.PI / 2;
      data.forEach(seg => {
        const val = Number(seg.value) || 0; if (val <= 0) return;
        const angle = (val / total) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
        ctx.closePath(); ctx.fillStyle = seg.color; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        startAngle += angle;
      });
      const img = canvas.toDataURL('image/png');
      doc.setFontSize(12); doc.setTextColor(220,38,38);
      doc.text('Status Distribution', W/2, chartY - 8, { align: 'center' });
      doc.addImage(img, 'PNG', chartX, chartY, chartSize, chartSize);
      // Legend below chart (centered)
      const hexToRgb = (hex) => {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [0,0,0];
      };
      let ly = chartY + chartSize + 8;
      const legendBlockW = 160;
      const lx = Math.max(20, (W - legendBlockW) / 2);
      doc.setFontSize(9); doc.setTextColor(0);
      data.forEach(seg => {
        const pct = total ? Math.round((Number(seg.value)||0) / total * 100) : 0;
        const [r,g,b] = hexToRgb(seg.color);
        doc.setFillColor(r,g,b);
        doc.rect(lx, ly, 6, 6, 'F');
        doc.text(`${seg.label}: ${seg.value} (${pct}%)`, lx + 10, ly + 5);
        ly += 10;
      });
      tableStartY = ly + 6;
      // Always start table on a new page to mirror mealTemplate
      doc.addPage();
      tableStartY = 30;
    }
  } catch {}

  // Table title
  doc.setFontSize(12); doc.setTextColor(220,38,38);
  doc.text('Meal Requests - Details', W/2, tableStartY, { align: 'center' });
  tableStartY += 8;

  // Build centered table
  const clean = (v) => { if (v === undefined || v === null) return '-'; const s = String(v).trim(); return s.length ? s : '-'; };
  const minSide = 20;
  const safeTableWidth = Math.max(60, W - 2 * minSide);

  const head = [[
    '#', 'Request ID', 'First Name', 'Last Name', 'Status', 'Description', 'Meal Type', 'Weight', 'Height', 'Created'
  ]];
  const body = requests.map((r, i) => [
    i + 1,
    clean(r.request_id),
    clean(r.user_name),
    clean(r.last_name),
    String(r.status || '').toLowerCase() === 'urgent' ? 'Urgent' : 'Normal',
    clean(r.description),
    clean(r.mealType),
    clean(r.weight),
    clean(r.height),
    fmtDate(r.createdAt),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [220,38,38], textColor: [255,255,255], fontSize: 10, halign: 'left' },
    styles: { fontSize: 8, cellPadding: 2.5, halign: 'left', overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // #
      1: { cellWidth: 18 },                  // Request ID (reduced)
      2: { cellWidth: 24 },                  // First Name
      3: { cellWidth: 24 },                  // Last Name
      4: { cellWidth: 16 },                  // Status
      5: { cellWidth: 20 },                  // Description (reduced)
      6: { cellWidth: 20 },                  // Meal Type
      7: { cellWidth: 16, halign: 'right' }, // Weight
      8: { cellWidth: 16, halign: 'right' }, // Height
      9: { cellWidth: 20 },                  // Created
    },
    tableWidth: safeTableWidth,
    margin: { left: minSide, right: minSide, bottom: 30 },
    showHead: 'everyPage',
  });

  // Footer (match mealTemplate)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220,38,38); doc.setLineWidth(0.4);
    doc.line(20, H - 18, doc.internal.pageSize.getWidth() - 20, H - 18);
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text('Thank you. For support: support@gettzfitness.lk | +94 77 780 4602', 20, H - 10);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 20, H - 10, { align: 'right' });
  }

  doc.save(fileName);
}
