import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface PDFColumn {
  header: string;
  dataKey: string;
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: PDFColumn[];
  data: Record<string, string | number | null | undefined>[];
  orientation?: "portrait" | "landscape";
}

// Arabic text needs to be reversed for proper display in PDF
const reverseArabic = (text: string): string => {
  if (!text) return "";
  // Check if text contains Arabic characters
  const arabicPattern = /[\u0600-\u06FF]/;
  if (arabicPattern.test(text)) {
    return text.split("").reverse().join("");
  }
  return text;
};

export const exportToPDF = ({
  title,
  subtitle,
  filename,
  columns,
  data,
  orientation = "landscape",
}: PDFExportOptions) => {
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = format(new Date(), "yyyy-MM-dd HH:mm");

  // Header background
  doc.setFillColor(139, 92, 246); // Primary purple color
  doc.rect(0, 0, pageWidth, 35, "F");

  // Title (reversed for Arabic)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(reverseArabic(title), pageWidth - 15, 15, { align: "right" });

  // Subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.text(reverseArabic(subtitle), pageWidth - 15, 25, { align: "right" });
  }

  // Date
  doc.setFontSize(10);
  doc.text(currentDate, 15, 15);

  // Prepare table data with reversed Arabic text
  const tableColumns = columns.map((col) => ({
    ...col,
    header: reverseArabic(col.header),
  }));

  const tableData = data.map((row) => {
    const newRow: Record<string, string> = {};
    columns.forEach((col) => {
      const value = row[col.dataKey];
      newRow[col.dataKey] = reverseArabic(String(value ?? ""));
    });
    return newRow;
  });

  // Generate table
  autoTable(doc, {
    startY: 45,
    head: [tableColumns.map((col) => col.header)],
    body: tableData.map((row) => columns.map((col) => row[col.dataKey])),
    styles: {
      fontSize: 10,
      cellPadding: 4,
      halign: "right",
      valign: "middle",
    },
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "right",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
    margin: { top: 45, right: 15, bottom: 25, left: 15 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `${reverseArabic("صفحة")} ${data.pageNumber} ${reverseArabic("من")} ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    },
  });

  // Save the PDF
  doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

// Booking-specific PDF export
export const exportBookingsToPDF = (
  bookings: Array<{
    id: string;
    customer?: { full_name?: string | null; phone?: string | null } | null;
    artist?: { profile?: { full_name?: string | null } | null } | null;
    service?: { name?: string } | null;
    booking_date: string;
    booking_time: string;
    total_price: number;
    status: string;
  }>,
  statusLabels: Record<string, string>
) => {
  const columns: PDFColumn[] = [
    { header: "رقم الحجز", dataKey: "id" },
    { header: "العميل", dataKey: "customer" },
    { header: "الهاتف", dataKey: "phone" },
    { header: "الفنانة", dataKey: "artist" },
    { header: "الخدمة", dataKey: "service" },
    { header: "التاريخ", dataKey: "date" },
    { header: "الوقت", dataKey: "time" },
    { header: "السعر", dataKey: "price" },
    { header: "الحالة", dataKey: "status" },
  ];

  const data = bookings.map((b) => ({
    id: b.id.slice(0, 8),
    customer: b.customer?.full_name || "غير معروف",
    phone: b.customer?.phone || "-",
    artist: b.artist?.profile?.full_name || "غير معروف",
    service: b.service?.name || "-",
    date: b.booking_date,
    time: b.booking_time,
    price: `${b.total_price} ر.ق`,
    status: statusLabels[b.status] || b.status,
  }));

  exportToPDF({
    title: "تقرير الحجوزات",
    subtitle: `إجمالي ${bookings.length} حجز`,
    filename: "bookings_report",
    columns,
    data,
  });
};

// Transactions-specific PDF export
export const exportTransactionsToPDF = (
  transactions: Array<{
    id: string;
    created_at: string;
    type: string;
    artist?: { profiles?: { full_name?: string | null } | null } | null;
    amount: number;
    platform_fee: number;
    net_amount: number;
    status: string;
  }>,
  typeLabels: Record<string, string>
) => {
  const columns: PDFColumn[] = [
    { header: "التاريخ", dataKey: "date" },
    { header: "النوع", dataKey: "type" },
    { header: "الفنان", dataKey: "artist" },
    { header: "المبلغ", dataKey: "amount" },
    { header: "العمولة", dataKey: "fee" },
    { header: "الصافي", dataKey: "net" },
    { header: "الحالة", dataKey: "status" },
  ];

  const data = transactions.map((t) => ({
    date: format(new Date(t.created_at), "yyyy-MM-dd"),
    type: typeLabels[t.type] || t.type,
    artist: t.artist?.profiles?.full_name || "غير معروف",
    amount: `${t.amount.toFixed(2)} ر.ق`,
    fee: `${t.platform_fee.toFixed(2)} ر.ق`,
    net: `${t.net_amount.toFixed(2)} ر.ق`,
    status: t.status === "completed" ? "مكتمل" : t.status === "pending" ? "معلق" : t.status,
  }));

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.reduce((sum, t) => sum + t.platform_fee, 0);

  exportToPDF({
    title: "تقرير المعاملات المالية",
    subtitle: `إجمالي ${transactions.length} معاملة | المبلغ: ${totalAmount.toFixed(2)} ر.ق | العمولات: ${totalFees.toFixed(2)} ر.ق`,
    filename: "transactions_report",
    columns,
    data,
  });
};

// Artist Payouts PDF export
export const exportArtistPayoutsToPDF = (
  payouts: Array<{
    artist_id: string;
    full_name: string;
    email: string;
    transactions_count: number;
    total_fees: number;
    total_earnings: number;
  }>
) => {
  const columns: PDFColumn[] = [
    { header: "الفنان", dataKey: "name" },
    { header: "البريد الإلكتروني", dataKey: "email" },
    { header: "عدد المعاملات", dataKey: "count" },
    { header: "إجمالي العمولات", dataKey: "fees" },
    { header: "إجمالي الأرباح", dataKey: "earnings" },
  ];

  const data = payouts.map((p) => ({
    name: p.full_name,
    email: p.email,
    count: String(p.transactions_count),
    fees: `${p.total_fees.toFixed(2)} ر.ق`,
    earnings: `${p.total_earnings.toFixed(2)} ر.ق`,
  }));

  const totalEarnings = payouts.reduce((sum, p) => sum + p.total_earnings, 0);

  exportToPDF({
    title: "تقرير مدفوعات الفنانين",
    subtitle: `إجمالي ${payouts.length} فنان | إجمالي الأرباح: ${totalEarnings.toFixed(2)} ر.ق`,
    filename: "artist_payouts_report",
    columns,
    data,
  });
};
