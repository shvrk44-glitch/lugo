import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format currency in NGN
export function formatCurrency(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Download CSV file from array of objects
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate PDF Report using jspdf-autotable
export function generatePDFReport(title: string, subtitle: string, headers: string[], data: any[][], summaryText?: string) {
  const doc = new jsPDF();
  
  // Header branding
  doc.setFontSize(18);
  doc.setTextColor(180, 30, 30); // Mobil red accent
  doc.text('KANO MOBIL LUBRICANT DISTRIBUTION', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 28);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | ${subtitle}`, 14, 35);
  
  // Table
  autoTable(doc, {
    startY: 42,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [180, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  if (summaryText) {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(summaryText, 14, finalY + 15);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Kano Depot Operations Dashboard - Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generate Invoice PDF
export function generateInvoicePDF(order: any, account: any, invoice: any) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(180, 30, 30);
  doc.text('KANO MOBIL DISTRIBUTION', 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Official Sales Invoice', 14, 28);

  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoice.id}`, 14, 38);
  doc.text(`Order Ref: ${order.id}`, 14, 44);
  doc.text(`Issue Date: ${invoice.issueDate}`, 14, 50);
  doc.text(`Due Date: ${invoice.dueDate}`, 14, 56);

  doc.text(`Customer: ${account.name}`, 120, 38);
  doc.text(`Area: ${account.area}`, 120, 44);
  doc.text(`Contact: ${account.contact} (${account.phone})`, 120, 50);
  doc.text(`Payment Type: ${account.paymentType}`, 120, 56);

  const tableRows = order.lines.map((line: any) => [
    line.productName,
    line.packSize,
    line.quantity,
    formatCurrency(line.unitPrice),
    formatCurrency(line.discount),
    formatCurrency(line.subtotal)
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['Product Description', 'Pack Size', 'Qty', 'Unit Price', 'Discount', 'Subtotal']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [180, 30, 30], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;

  doc.setFontSize(10);
  doc.text(`Delivery Fee: ${formatCurrency(order.deliveryFee || 0)}`, 140, finalY + 10, { align: 'right' });
  doc.text(`Total Discount: ${formatCurrency(order.discount || 0)}`, 140, finalY + 16, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: ${formatCurrency(invoice.totalAmount)}`, 140, finalY + 24, { align: 'right' });
  doc.text(`Paid Amount: ${formatCurrency(invoice.paidAmount)}`, 140, finalY + 30, { align: 'right' });
  doc.text(`Balance Due: ${formatCurrency(invoice.totalAmount - invoice.paidAmount)}`, 140, finalY + 36, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Bank: Zenith Bank | Account: 1012938481 | Kano Mobil Ltd', 14, finalY + 50);
  doc.text('Thank you for your business. Quality & Genuine Mobil Lubricants.', 14, finalY + 56);

  doc.save(`invoice_${invoice.id}.pdf`);
}
