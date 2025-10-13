// utils/paymentReciept.js  (same export name you already import)
import jsPDF from "jspdf";
import GymLogo from "../assets/GymLogo.jpg"; // adjust if needed

export function generateStoreReceiptPDF(data, userName) {
  if (!data) return;

  // ---- Detect mode: Supplement Order vs Membership ----
  const isSupplementOrder = Array.isArray(data?.cart) && data.cart.length >= 0;

  // ---- Common fields with fallbacks ----
  const customerName = userName || "-";
  const currency = data?.currency || "LKR"; // your Order schema doesn't store currency; default is fine
  const createdAt = (data?.paid_at || data?.createdAt || "").toString();
  const transactionDate = createdAt ? (createdAt.split("T")[0] || createdAt) : "-";
  const status = (data?.status || "").toUpperCase();

  // Money helpers
  const fmtMoney = (n) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  // ---- Supplement Order fields ----
  const orderId = isSupplementOrder ? data?.order_id : data?.payment_id;
  const transactionId = isSupplementOrder
    ? (orderId != null ? `#ORD_${orderId}` : "-")
    : (data?.payment_id ? `#TA_${data.payment_id}` : "-");

  // Totals
  const subtotal = isSupplementOrder
    ? Number(data?.subtotal || 0)
    : Number(data?.amount || 0);

  const discount = Number(data?.discount || 0);

  const paidAmount = isSupplementOrder
    ? Number(data?.paidAmount != null ? data.paidAmount : subtotal - discount)
    : Number(data?.paid_amount != null ? data.paid_amount : subtotal - discount);

  // Optional fields
  const pointsUsed = isSupplementOrder ? Number(data?.pointsUsed || 0) : 0;
  const paymentIntent = isSupplementOrder ? (data?.paymentIntent || "") : "";

  // Branding
  const business = "Gettz Fitness";
  const address = "48 Udyana Mawatha, Matara";

  // Colors
  const red = [220, 38, 38];
  const gray = [75, 85, 99];
  const black = [0, 0, 0];
  const green = [22, 163, 74];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const marginY = 56;
  const leftX = marginX;
  let y = marginY;

  // Logo
  try {
    doc.addImage(GymLogo, "JPEG", leftX, y, 54, 54);
  } catch (err) {
    // non-fatal if logo missing
    console.warn("Logo not added:", err);
  }

  // Business name
  doc.setTextColor(...red);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(business, leftX + 70, y + 20);

  // Address
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Address: ${address}`, leftX + 70, y + 40);

  // Divider
  y += 70;
  doc.setDrawColor(...red);
  doc.line(marginX, y, W - marginX, y);

  // Title
  y += 28;
  const title = isSupplementOrder ? "Order Receipt (Supplements)" : "Payment Receipt (Summary)";
  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, W / 2, y, { align: "center" });

  // Rows helper
  y += 40;
  const rowGap = 22;
  const row = (label, value, opts = {}) => {
    const { bold = false, mono = false, color = black } = opts;
    doc.setFontSize(11);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text(label, leftX, y);

    doc.setTextColor(...color);
    doc.setFont("helvetica", mono || bold ? "bold" : "normal");
    doc.text(String(value ?? "-"), leftX + 150, y);

    y += rowGap;
  };

  // Header rows
  row("Customer", customerName);
  row(isSupplementOrder ? "Order ID" : "Transaction ID", transactionId, { mono: true });
  row("Date", transactionDate || "-");

  if (status) {
    const statusColor =
      status === "PAID" ? green : status === "FAILED" ? red : black;
    row("Status", status, { bold: true, color: statusColor });
  }

  // If supplement order, optionally show Payment Intent (useful for debugging/support)
  if (isSupplementOrder && paymentIntent) {
    row("Payment Intent", paymentIntent, { mono: true });
  }

  // Section divider
  y += 8;
  doc.setDrawColor(...red);
  doc.line(marginX, y, W - marginX, y);
  y += 18;

  // Itemized cart (supplements only)
  if (isSupplementOrder && Array.isArray(data.cart) && data.cart.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...black);
    doc.text("Items", leftX, y);
    y += rowGap;

    // Table header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...gray);
    doc.text("Name", leftX, y);
    doc.text("Qty", leftX + 260, y);
    doc.text("Price", leftX + 310, y);
    doc.text("Line Total", leftX + 400, y);
    y += 16;
    doc.setDrawColor(...gray);
    doc.line(marginX, y, W - marginX, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);

    data.cart.forEach((it) => {
      const name = String(it?.name ?? "-");
      const qty = Number(it?.qty ?? 0);
      const price = Number(it?.price ?? 0);
      const line = qty * price;

      // Wrap name if too long
      const maxNameWidth = 230;
      const splitName = doc.splitTextToSize(name, maxNameWidth);

      // Print first line of name on the current row
      doc.text(splitName[0], leftX, y);
      doc.text(String(qty), leftX + 260, y);
      doc.text(fmtMoney(price), leftX + 310, y);
      doc.text(fmtMoney(line), leftX + 400, y);

      // Additional name lines (if any)
      if (splitName.length > 1) {
        for (let i = 1; i < splitName.length; i++) {
          y += 14;
          doc.text(splitName[i], leftX, y);
        }
      }

      y += 18;

      // Add a soft page break if near bottom
      if (y > doc.internal.pageSize.getHeight() - 120) {
        doc.addPage();
        y = marginY;
      }
    });

    // Section divider under items
    y += 6;
    doc.setDrawColor(...red);
    doc.line(marginX, y, W - marginX, y);
    y += 18;
  }

  // Totals
  row("Subtotal", fmtMoney(subtotal));
  row("Discount", discount > 0 ? `- ${fmtMoney(discount)}` : fmtMoney(0));
  if (isSupplementOrder && pointsUsed > 0) {
    row("Points Used", String(pointsUsed), { mono: true });
  }

  // Paid Amount emphasized
  doc.setFontSize(12);
  doc.setTextColor(...gray);
  doc.setFont("helvetica", "normal");
  doc.text("Paid Amount", leftX, y);

  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.text(fmtMoney(paidAmount), leftX + 150, y);
  y += rowGap + 6;

  // Footer divider
  doc.setDrawColor(...red);
  doc.line(marginX, y, W - marginX, y);
  y += 18;

  // Footer
  doc.setTextColor(...gray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Thank you. For support: support@gettzfitness.lk | +94 77 780 4602`,
    marginX,
    y
  );

  const filename = isSupplementOrder
    ? `order_receipt_${orderId ?? "unknown"}.pdf`
    : "payment_receipt.pdf";

  doc.save(filename);
}
