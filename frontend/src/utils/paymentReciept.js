// utils/generateReceiptPDF.js
import jsPDF from "jspdf";
import GymLogo from "../assets/GymLogo.jpg"; // adjust path if needed

export function generateReceiptPDF(data, userName) {
  if (!data) return;

  // --- Extract with fallbacks ---
  const customerName = userName || "-";
  const plan =
    data?.subscription_id?.plan_id?.plan_name ||
    data?.planName ||
    "Membership Plan";
  const transactionId = data?.payment_id ? `#TA_${data.payment_id}` : "-";
  const transactionDate = (data?.paid_at || data?.createdAt || "")
    .toString()
    .split("T")[0] || "-";

  const currency = data?.currency || "LKR";
  const subtotal = Number(data?.amount || 0);
  const discount = Number(data?.discount || 0); // absolute value
  const paidAmount = Number(
    data?.paid_amount != null ? data.paid_amount : subtotal - discount
  );
  const status = (data?.status || "").toUpperCase();

  
  const business = "Gettz Fitness";
  const address = "48 Udyana Mawatha, Matara";

  
  const fmtMoney = (n) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  const red = [220, 38, 38];
  const gray = [75, 85, 99];
  const black = [0, 0, 0];

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
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Payment Receipt (Summary)", pageWidth / 2, y, { align: "center" });

  // Rows
  y += 40;
  const rowGap = 22;

  const row = (label, value, opts = {}) => {
    const { bold = false, mono = false, color = black } = opts;
    doc.setFontSize(11);
    doc.setTextColor(...gray);
    doc.setFont("helvetica", "normal");
    doc.text(label, leftX, y);

    doc.setTextColor(...color);
    doc.setFont("helvetica", mono ? "bold" : bold ? "bold" : "normal");
    doc.text(String(value ?? "-"), leftX + 150, y);

    y += rowGap;
  };

  row("Customer Name", customerName);
  row("Plan Name", plan);
  row("Transaction ID", transactionId, { mono: true });
  row("Transaction Date", transactionDate);
  if (status) row("Status", status);

  // Price breakdown header divider
  y += 8;
  doc.setDrawColor(...red);
  doc.line(marginX, y, W - marginX, y);
  y += 18;

  // Totals
  row("Subtotal", fmtMoney(subtotal));
  row("Discount", discount > 0 ? `- ${fmtMoney(discount)}` : fmtMoney(0));

  // Paid Amount emphasized
  doc.setFontSize(12);
  doc.setTextColor(...gray);
  doc.setFont("helvetica", "normal");
  doc.text("Paid Amount", leftX, y);

  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.text(fmtMoney(paidAmount), leftX + 150, y);

  y += rowGap + 6;

  // Footer
  doc.setDrawColor(...red);
  doc.line(marginX, y, W - marginX, y);

  y += 18;
  doc.setTextColor(...gray);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Thank you. For support: support@gettzfitness.lk | +94 77 780 4602`,
    marginX,
    y
  );

  doc.save("payment_receipt.pdf");
}
