import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GymLogo from "../assets/GymLogo.jpg";


export function generatePaymentsPDF(payments = [], totals = {}, options = {}) {
  const title = options.title || `Payments Report`;
  const suffix = new Date().toISOString().slice(0, 10);
  const fileName = options.fileName || `payments_report_${suffix}.pdf`;

  const fmtCurrency = (n) => `LKR ${Number(n || 0).toLocaleString("en-LK")}`;
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Receipt header
  const red = [220, 38, 38];
  const gray = [75, 85, 99];
  const black = [0, 0, 0];
  const W = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const leftX = marginX;
  let y = 56;

  // Logo
  try {
    doc.addImage(GymLogo, "JPEG", leftX, y, 54, 54);
  } catch (err) {
    // ignore if not available
  }

  // Business name
  doc.setTextColor(...red);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Gettz Fitness", leftX + 70, y + 20);

  // Address
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Address: 48 Udyana Mawatha, Matara", leftX + 70, y + 40);

  // Divider
  y += 70;
  doc.setDrawColor(...red);
  doc.line(marginX, y, W - marginX, y);

  // Title centered
  y += 28;
  const pageWidth = W;
  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, y, { align: "center" });

  // Professional Report Info box (two columns, subtle fill, divider, aligned values)
  const now = new Date();
  const ref = `PR-${now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
  const metaTop = y + 10;
  const metaLeft = marginX;
  const metaWidth = W - marginX * 2;
  const metaHeight = 92;
  doc.setDrawColor(...red);
  doc.setFillColor(255, 252, 252);
  if (doc.roundedRect) {
    doc.roundedRect(metaLeft, metaTop, metaWidth, metaHeight, 6, 6, "FD");
  } else {
    doc.rect(metaLeft, metaTop, metaWidth, metaHeight, "FD");
  }

  // Vertical divider
  const midX = metaLeft + metaWidth / 2;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(midX, metaTop + 14, midX, metaTop + metaHeight - 14);

  // Helpers for value rows
  const drawPair = (lx, ry, label, value, opts = {}) => {
    const { mono = false } = opts;
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), lx, ry);
    doc.setTextColor(...black);
    doc.setFont("helvetica", mono ? "bold" : "normal");
    doc.setFontSize(11);
    doc.text(String(value ?? "-"), lx + 110, ry);
  };

  // Left column content
  const leftColX = metaLeft + 16;
  let metaY = metaTop + 26;
  doc.setFontSize(11);
  doc.setTextColor(...red);
  doc.setFont("helvetica", "bold");
  doc.text("REPORT DETAILS", leftColX, metaY);
  metaY += 18;
  drawPair(leftColX, metaY, "Report ID", ref, { mono: true });
  metaY += 18;
  drawPair(
    leftColX,
    metaY,
    "Generated",
    `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
  );

  // Right column content
  const rightColX = midX + 16;
  let metaY2 = metaTop + 26;
  doc.setFontSize(11);
  doc.setTextColor(...red);
  doc.setFont("helvetica", "bold");
  doc.text("SUMMARY", rightColX, metaY2);
  metaY2 += 18;
  const totalCount = Number(totals?.count ?? payments.length);
  const totalDiscountStr = fmtCurrency(totals?.totalDiscount || 0);
  const totalPaidStr = fmtCurrency(
    totals?.totalPaid ?? payments.reduce((s, p) => s + Number(p?.paidAmount || 0), 0)
  );
  drawPair(rightColX, metaY2, "Items", totalCount);
  metaY2 += 18;
  drawPair(rightColX, metaY2, "Total Discount", totalDiscountStr);
  metaY2 += 18;
  drawPair(rightColX, metaY2, "Total Paid", totalPaidStr);

  const columns = [
    { header: "#", dataKey: "no" },
    { header: "Id", dataKey: "id" },
    { header: "Type", dataKey: "type" },
    { header: "User", dataKey: "user" },
    { header: "Discount", dataKey: "discount" },
    { header: "Paid Amount", dataKey: "paidAmount" },
    { header: "Status", dataKey: "status" },
    { header: "Date", dataKey: "date" },
  ];

  const rows = payments.map((p, i) => ({
    no: i + 1,
    id: p?.id ?? "",
    type: p?.type ?? "",
    user: p?.user ?? "",
    discount: fmtCurrency(p?.discount || 0),
    paidAmount: fmtCurrency(p?.paidAmount || 0),
    status: p?.status ? String(p.status).replace(/^./, (c) => c.toUpperCase()) : "",
    date: fmtDate(p?.date),
  }));

  autoTable(doc, {
    startY: metaTop + metaHeight + 16,
    margin: { left: marginX, right: marginX },
    headStyles: { fillColor: red, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 6, lineColor: red, lineWidth: 0.3 },
    alternateRowStyles: { fillColor: [255, 245, 245] },
    columnStyles: {
      no: { halign: "center", cellWidth: 24 },
      discount: { halign: "right" },
      paidAmount: { halign: "right" },
      status: { halign: "center" },
      date: { halign: "center" },
    },
    columns,
    body: rows,
  });

  // No additional tables at the bottom — we already show a summary in the info box above

  // Footer, like receipt
  const footerBaseY = doc.lastAutoTable?.finalY || (metaTop + metaHeight + 16);
  let footerY = footerBaseY + 24;
  doc.setDrawColor(...red);
  doc.line(marginX, footerY, W - marginX, footerY);
  footerY += 16;
  doc.setTextColor(...gray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Thank you. For support: support@gettzfitness.lk | +94 77 780 4602`,
    marginX,
    footerY
  );

  doc.save(fileName);
}
