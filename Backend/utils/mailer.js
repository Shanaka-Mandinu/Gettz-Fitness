import nodemailer from "nodemailer";
import Payment from "../model/Payment_Model.js";
import User from "../model/user.js";
import Order from "../model/order.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPaymentReciept(email, sessionId) {
  const payment = await Payment.findOne({ session_id: sessionId });
  const user = await User.findById(payment.user_id);

  const dateOnly = payment.createdAt.toISOString().split("T")[0];

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
        color: #333333;
        }
        .container {
        max-width: 600px;
        margin: 30px auto;
        background: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        /* Header */
        .header {
        background: #111111; /* black */
        color: #FF0000;      /* red text */
        text-align: center;
        padding: 20px;
        }
        .header h1 {
        margin: 0;
        font-size: 26px;
        letter-spacing: 1px;
        }
        .sub-header {
        font-size: 14px;
        margin-top: 5px;
        color: #ffffff; /* white for subtitle */
        opacity: 0.85;
        }
        /* Success badge */
        .success {
        background: #FF0000;
        color: #fff;
        font-weight: bold;
        padding: 10px 20px;
        border-radius: 30px;
        display: inline-block;
        margin: 20px auto;
        }
        /* Content */
        .content {
        padding: 25px;
        text-align: center;
        }
        .content p {
        margin: 10px 0;
        }
        /* Receipt table */
        .details {
        margin: 20px 0;
        }
        .details table {
        width: 100%;
        border-collapse: collapse;
        }
        .details th {
        background: #f8f8f8;
        padding: 12px 10px;
        text-align: left;
        font-size: 14px;
        color: #111;
        }
        .details td {
        padding: 12px 10px;
        border-bottom: 1px solid #eeeeee;
        font-size: 14px;
        color: #444;
        }
        .highlight {
        color: #FF0000;
        font-weight: bold;
        }
        /* Footer */
        .footer {
        background: #111111;
        color: #bbbbbb;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        }
        .footer a {
        color: #FF0000;
        text-decoration: none;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <!-- Header -->
        <div class="header">
        <h1>Gettz Fitness</h1>
        <div class="sub-header">Official Payment Receipt</div>
        </div>

        <!-- Content -->
        <div class="content">
        <p>Hello Mr.<strong>${user.firstName}${" "}${
    user.lastName
  }</strong>,</p>
        <p>Your payment has been processed successfully 🎉</p>
        <div class="success">Payment Successful</div>

        <!-- Receipt -->
        <div class="details">
            <table>
            <tr>
                <th>Transaction ID</th>
                <td>#TA_${payment.payment_id}</td>
            </tr>
            <tr>
                <th>Date</th>
                <td>${dateOnly}</td>
            </tr>
            <tr>
                <th>Plan</th>
                <td>${payment.planName}</td>
            </tr>
            <tr>
                <th>Total Amount</th>
                <td class="highlight">LKR.${payment.amount}.00</td>
            </tr>
            <tr>
                <th>Discount</th>
                <td class="highlight">LKR.${payment.discount}.00</td>
            </tr>
            <tr>
                <th>Amount Paid</th>
                <td class="highlight">LKR.${payment.paid_amount}.00</td>
            </tr>
            <tr>
                <th>Payment Method</th>
                <td>Card (Stripe)</td>
            </tr>
            <tr>
                <th>Status</th>
                <td class="highlight">Paid</td>
            </tr>
            </table>
        </div>

        <p>Thank you for your payment. Your subscription is now active.</p>
        <p><strong>Team Gettz Fitness</strong></p>
        </div>

        <!-- Footer -->
        <div class="footer">
        © 2025 Gettz Fitness. All rights reserved.<br>
        <a href="#">Visit our website</a>
        </div>
    </div>
    </body>
    </html>

  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your Payment Receipt For Gettz Fitness",
    text: `You Payment Recipet #TA_${payment.payment_id}`, // Plain text version as fallback
    html: htmlTemplate, // HTML version
  };

  await transporter.sendMail(mailOptions);
}


// Send inquiry reply notification email
export async function sendInquiryReplyNotification(email, inquiryData, adminReply) {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
        color: #333333;
        }
        .container {
        max-width: 600px;
        margin: 30px auto;
        background: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        /* Header */
        .header {
        background: #111111;
        color: #FF0000;
        text-align: center;
        padding: 20px;
        }
        .header h1 {
        margin: 0;
        font-size: 26px;
        letter-spacing: 1px;
        }
        .sub-header {
        font-size: 14px;
        margin-top: 5px;
        color: #ffffff;
        opacity: 0.85;
        }
        /* Content */
        .content {
        padding: 25px;
        }
        .content h2 {
        color: #FF0000;
        margin-top: 0;
        }
        .inquiry-details {
        background: #f8f8f8;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        }
        .reply-section {
        background: #e8f4fd;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #FF0000;
        margin: 15px 0;
        }
        .reply-text {
        font-style: italic;
        color: #333;
        margin: 10px 0;
        }
        /* Footer */
        .footer {
        background: #111111;
        color: #bbbbbb;
        text-align: center;
        padding: 15px;
        font-size: 13px;
        }
        .footer a {
        color: #FF0000;
        text-decoration: none;
        }
        .button {
        display: inline-block;
        background: #FF0000;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin: 15px 0;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <!-- Header -->
        <div class="header">
        <h1>Gettz Fitness</h1>
        <div class="sub-header">Inquiry Reply Notification</div>
        </div>

        <!-- Content -->
        <div class="content">
        <h2>Hello!</h2>
        <p>We have received your inquiry and our admin team has responded. Here are the details:</p>
        
        <div class="inquiry-details">
        <h3>Your Inquiry Details:</h3>
        <p><strong>Inquiry ID:</strong> ${inquiryData.inquiry_id}</p>
        <p><strong>Type:</strong> ${inquiryData.inquiry_type}</p>
        <p><strong>Your Message:</strong> ${inquiryData.inquiry_message}</p>
        <p><strong>Date:</strong> ${new Date(inquiryData.inquiry_date).toLocaleString()}</p>
        <p><strong>Status:</strong> ${inquiryData.inquiry_status}</p>
        </div>

        <div class="reply-section">
        <h3>Admin Reply:</h3>
        <div class="reply-text">"${adminReply}"</div>
        <p><strong>Reply Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>You can reply to this inquiry by visiting your dashboard or clicking the link below:</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/userDashboard" class="button">View & Reply to Inquiry</a>
        
        <p>Thank you for contacting Gettz Fitness!</p>
        </div>

        <!-- Footer -->
        <div class="footer">
        <p>Gettz Fitness - Your Fitness Partner</p>
        <p>Email: <a href="mailto:hello@getzzfitness.com">hello@getzzfitness.com</a> | Phone: +94 11 234 5678</p>
        </div>
    </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: `Gettz Fitness - Reply to Your Inquiry #${inquiryData.inquiry_id}`,
    text: `Hello! We have replied to your inquiry #${inquiryData.inquiry_id}. Admin Reply: "${adminReply}". Please visit your dashboard to view the full conversation.`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendStoreOrderReceipt(email, sessionId) {
  const order = await Order.findOne({ session_id: sessionId });
  if (!order) {
    throw new Error("Order not found for session_id: " + sessionId);
  }

  // Prefer the passed email; if not passed, fall back to the order's user
  let user = null;
  if (order.user_id) {
    try {
      user = await User.findById(order.user_id).select("firstName lastName email");
    } catch {}
  }

  const recipientEmail = email || user?.email;
  if (!recipientEmail) {
    throw new Error("No recipient email available for this order.");
  }

  const firstName = user?.firstName || "Customer";
  const lastName = user?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateOnly = createdAt.toISOString().split("T")[0];

  // Money helpers (default to LKR)
  const currency = "LKR";
  const money = (n) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(n || 0));

  const statusUpper = String(order.status || "").toUpperCase(); // PENDING | PAID | FAILED
  const statusColor =
    statusUpper === "PAID" ? "#16a34a" : statusUpper === "FAILED" ? "#ef4444" : "#111111";

  // Build item rows
  const itemRows = (order.cart || [])
    .map((it) => {
      const name = String(it?.name ?? "-");
      const qty = Number(it?.qty ?? 0);
      const price = Number(it?.price ?? 0);
      const line = qty * price;
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">${name}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${money(price)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${money(line)}</td>
        </tr>
      `;
    })
    .join("");

  const pointsLine =
    order.pointsUsed && order.pointsUsed > 0
      ? `<tr>
           <th style="padding:10px;text-align:left;">Points Used</th>
           <td style="padding:10px;text-align:right;" colspan="3">${order.pointsUsed}</td>
         </tr>`
      : "";

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Gettz Fitness - Store Order Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin:0; padding:0; background:#f5f5f5; color:#333; }
        .container { max-width: 640px; margin: 30px auto; background:#fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        .header { background:#111111; color:#FF0000; text-align:center; padding: 20px; }
        .header h1 { margin:0; font-size: 24px; letter-spacing: 0.5px; }
        .sub-header { font-size: 14px; color:#fff; opacity:0.85; margin-top: 4px; }
        .content { padding: 24px; }
        .badge { display:inline-block; padding:8px 14px; border-radius: 999px; font-weight:bold; color:#fff; margin: 10px 0 16px; }
        .card { border:1px solid #eee; border-radius: 8px; overflow:hidden; }
        .section-title { font-weight:bold; color:#111; margin: 14px 0 6px; }
        .meta-table, .items-table, .total-table { width:100%; border-collapse: collapse; }
        .meta-table th, .meta-table td { padding: 10px; border-bottom:1px solid #eee; text-align:left; font-size: 14px; }
        .items-table th, .items-table td { padding: 10px; border-bottom:1px solid #eee; font-size: 14px; }
        .items-table th { background:#f8f8f8; color:#111; }
        .total-table th { text-align:left; padding: 10px; font-size: 14px; }
        .total-table td { text-align:right; padding: 10px; font-size: 14px; }
        .footer { background:#111111; color:#bbb; text-align:center; padding: 14px; font-size: 13px; }
        .footer a { color:#FF0000; text-decoration:none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Gettz Fitness</h1>
          <div class="sub-header">Store Order Receipt</div>
        </div>

        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Thanks for your purchase from the Gettz Fitness Store.</p>
          <span class="badge" style="background:${statusColor};">${statusUpper || "PENDING"}</span>

          <!-- Order Meta -->
          <div class="card" style="margin-top:6px;">
            <table class="meta-table">
              <tr>
                <th style="width: 40%;">Order ID</th>
                <td>#ORD_${order.order_id ?? "-"}</td>
              </tr>
              <tr>
                <th>Date</th>
                <td>${dateOnly}</td>
              </tr>
              <tr>
                <th>Payment Method</th>
                <td>Card (Stripe)</td>
              </tr>
        
            </table>
          </div>

          <!-- Items -->
          <div class="section-title">Items</div>
          <div class="card">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align:left;">Name</th>
                  <th style="text-align:center;width:80px;">Qty</th>
                  <th style="text-align:right;width:120px;">Price</th>
                  <th style="text-align:right;width:140px;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows || `<tr><td colspan="4" style="padding:10px;text-align:center;">No items</td></tr>`}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div class="section-title">Summary</div>
          <div class="card">
            <table class="total-table">
              <tr>
                <th>Subtotal</th>
                <td>${money(order.subtotal)}</td>
              </tr>
              <tr>
                <th>Discount</th>
                <td>-${money(order.discount || 0)}</td>
              </tr>
              ${pointsLine}
              <tr>
                <th style="border-top:1px solid #ddd;">Paid Amount</th>
                <td style="border-top:1px solid #ddd;"><strong>${money(order.paidAmount)}</strong></td>
              </tr>
            </table>
          </div>

          <p style="margin-top:16px;">If you have any questions, just reply to this email — we’re happy to help.</p>
          <p><strong>Team Gettz Fitness</strong></p>
        </div>

        <div class="footer">
          © ${new Date().getFullYear()} Gettz Fitness. All rights reserved.<br />
          <a href="#">Visit our website</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textFallback = [
    `Gettz Fitness - Store Order Receipt`,
    ``,
    `Hello ${fullName},`,
    `Status: ${statusUpper}`,
    `Order ID: #ORD_${order.order_id ?? "-"}`,
    `Date: ${dateOnly}`,
    `Subtotal: ${money(order.subtotal)}`,
    `Discount: -${money(order.discount || 0)}`,
    order.pointsUsed ? `Points Used: ${order.pointsUsed}` : null,
    `Paid Amount: ${money(order.paidAmount)}`,
    ``,
    `Items:`,
    ...(order.cart || []).map(
      (it) => ` - ${it?.name ?? "-"} x${it?.qty ?? 0} @ ${money(it?.price ?? 0)}`
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: recipientEmail,
    subject: `Your Gettz Fitness Store Receipt #ORD_${order.order_id ?? "-"}`,
    text: textFallback,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
}
