import jsPDF from 'jspdf';

export interface PaymentReceiptData {
  transactionId: string;
  referenceNumber: string;
  payerName: string;
  payerEmail: string;
  planName: string;
  amount: string | number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  expiryDate?: string;
  status: 'Verified' | 'Completed';
}

export function generatePaymentReceiptPDF(data: PaymentReceiptData): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background Header Card
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Cyan brand accent line
  doc.setFillColor(6, 182, 212); // #06b6d4
  doc.rect(0, 45, pageWidth, 3, 'F');

  // Company Branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("KNOWLEDGE UNIVERSE", 20, 22);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text("Ethiopian Premier Digital Learning Platform · Addis Ababa, Ethiopia", 20, 30);
  doc.text("Official Payment Receipt & Tax Invoice", 20, 36);

  // Right-aligned Receipt Tag
  doc.setTextColor(34, 211, 238);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("OFFICIAL RECEIPT", pageWidth - 20, 24, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Invoice #${data.transactionId.slice(-8).toUpperCase()}`, pageWidth - 20, 32, { align: 'right' });
  doc.text(`Date: ${data.paymentDate}`, pageWidth - 20, 38, { align: 'right' });

  // Receipt Details Body
  let y = 62;

  // Payer and Payment Method Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, 36, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, pageWidth - 40, 36, 3, 3, 'D');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("BILLED TO / SUBSCRIBER:", 26, y + 10);
  doc.text("PAYMENT DETAILS:", pageWidth / 2 + 10, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${data.payerName || 'Valued Learner'}`, 26, y + 18);
  doc.text(`Email: ${data.payerEmail || 'learner@knowledgeuniverse.edu'}`, 26, y + 25);
  doc.text(`Access: 30-Day Unlimited Premium`, 26, y + 31);

  doc.text(`Method: ${data.paymentMethod}`, pageWidth / 2 + 10, y + 18);
  doc.text(`Ref / TxID: ${data.referenceNumber}`, pageWidth / 2 + 10, y + 25);
  doc.text(`Status: Verified & Active`, pageWidth / 2 + 10, y + 31);

  y += 48;

  // Plan Breakdown Table
  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(20, y, pageWidth - 40, 10, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("ITEM DESCRIPTION", 26, y + 7);
  doc.text("PERIOD", pageWidth / 2, y + 7);
  doc.text("AMOUNT", pageWidth - 26, y + 7, { align: 'right' });

  y += 14;

  // Table Row
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.planName} Membership`, 26, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("1 Month (30 Days)", pageWidth / 2, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.amount} ${data.currency}`, pageWidth - 26, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, pageWidth - 20, y);

  // Features list
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("• Full Access to Ethiopian Curriculum Books & 3D Interactive Reader", 26, y);
  y += 5;
  doc.text("• Unlimited AI Tutor & Dual Agent Studio Image Generator", 26, y);
  y += 5;
  doc.text("• Downloadable Chapter Study Guides & National Exam Prep Quizzes", 26, y);

  y += 16;

  // Total Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - 90, y, 70, 26, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text("Subtotal:", pageWidth - 84, y + 8);
  doc.text(`${data.amount} ${data.currency}`, pageWidth - 26, y + 8, { align: 'right' });

  doc.text("VAT / Tax (0%):", pageWidth - 84, y + 14);
  doc.text(`0.00 ${data.currency}`, pageWidth - 26, y + 14, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Paid:", pageWidth - 84, y + 22);
  doc.setTextColor(8, 145, 178);
  doc.text(`${data.amount} ${data.currency}`, pageWidth - 26, y + 22, { align: 'right' });

  // Verification Badge
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(20, y, 70, 26, 2, 2, 'F');
  doc.setDrawColor(52, 211, 153);
  doc.roundedRect(20, y, 70, 26, 2, 2, 'D');

  doc.setTextColor(5, 150, 105);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("✓ PAYMENT VERIFIED", 26, y + 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(4, 120, 87);
  doc.text(`Expires: ${data.expiryDate || '30 days from purchase'}`, 26, y + 18);

  // Footer Note
  doc.setDrawColor(226, 232, 240);
  doc.line(20, pageHeight - 24, pageWidth - 20, pageHeight - 24);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text("Thank you for learning with Knowledge Universe! For queries or student support, contact support@knowledgeuniverse.edu", pageWidth / 2, pageHeight - 15, { align: 'center' });

  return doc.output('blob');
}

export function downloadPaymentReceipt(data: PaymentReceiptData) {
  const blob = generatePaymentReceiptPDF(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt_${data.planName.replace(/\s+/g, '_')}_${data.referenceNumber || 'Paid'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
