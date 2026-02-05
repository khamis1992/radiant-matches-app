import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface HTMLColumn {
  header: string;
  dataKey: string;
}

interface HTMLExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: HTMLColumn[];
  data: Record<string, string | number | null | undefined>[];
  orientation?: "portrait" | "landscape";
}

interface ReportSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  footerText: string;
}

const getReportSettings = async (): Promise<ReportSettings> => {
  const defaults: ReportSettings = {
    logoUrl: "",
    primaryColor: "#8b5cf6",
    secondaryColor: "#a855f7",
    companyName: "Glam",
    footerText: "جميع الحقوق محفوظة",
  };

  try {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        "report_logo_url",
        "report_primary_color",
        "report_secondary_color",
        "report_company_name",
        "report_footer_text",
      ]);

    if (data) {
      data.forEach((setting) => {
        const val = (setting.value as Record<string, unknown>)?.value;
        if (val !== undefined) {
          switch (setting.key) {
            case "report_logo_url":
              defaults.logoUrl = String(val);
              break;
            case "report_primary_color":
              defaults.primaryColor = String(val);
              break;
            case "report_secondary_color":
              defaults.secondaryColor = String(val);
              break;
            case "report_company_name":
              defaults.companyName = String(val);
              break;
            case "report_footer_text":
              defaults.footerText = String(val);
              break;
          }
        }
      });
    }
  } catch (e) {
    console.error("Failed to fetch report settings:", e);
  }

  return defaults;
};

const generateHTMLReportWithSettings = (
  options: HTMLExportOptions,
  settings: ReportSettings
) => {
  const { title, subtitle, columns, data } = options;
  const { logoUrl, primaryColor, secondaryColor, companyName, footerText } = settings;
  const currentDate = format(new Date(), "yyyy-MM-dd HH:mm");
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: white;
      padding: 24px 32px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      max-height: 40px;
      max-width: 120px;
      object-fit: contain;
    }
    .header-content h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-content p {
      font-size: 14px;
      opacity: 0.9;
    }
    .header-date {
      font-size: 12px;
      opacity: 0.8;
      text-align: left;
    }
    .content {
      padding: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    thead {
      background: ${primaryColor}15;
    }
    th {
      padding: 14px 16px;
      text-align: right;
      font-weight: 600;
      color: ${primaryColor};
      border-bottom: 2px solid ${primaryColor}30;
    }
    td {
      padding: 12px 16px;
      text-align: right;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    tbody tr:hover {
      background: #f8fafc;
    }
    tbody tr:nth-child(even) {
      background: #fafafa;
    }
    tbody tr:nth-child(even):hover {
      background: #f1f5f9;
    }
    .footer {
      padding: 16px 32px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer-brand {
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 4px;
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: ${primaryColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px ${primaryColor}66;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn:hover {
      filter: brightness(0.9);
      transform: translateY(-2px);
    }
    @media print {
      .print-btn { display: none; }
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <div class="header-brand">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="header-logo" />` : ""}
          <span style="font-weight: 600; font-size: 18px;">${companyName}</span>
        </div>
        <div class="header-date">${currentDate}</div>
      </div>
      <div class="header-content">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
      </div>
    </div>
    <div class="content">
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td>${row[col.dataKey] ?? ""}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="footer">
      <div class="footer-brand">${companyName}</div>
      ${footerText} | إجمالي ${data.length} سجل | ${currentDate}
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
    طباعة التقرير
  </button>
</body>
</html>`;

  // Open in new window
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};

// Keep old function name for compatibility but now exports HTML
export const exportToPDF = async (options: HTMLExportOptions) => {
  const settings = await getReportSettings();
  generateHTMLReportWithSettings(options, settings);
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
  const columns: HTMLColumn[] = [
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

// Transactions-specific HTML export
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
  const columns: HTMLColumn[] = [
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

// Artist Payouts HTML export
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
  const columns: HTMLColumn[] = [
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

// Top Services HTML export
export const exportTopServicesToPDF = (
  services: Array<{
    id: string;
    name: string;
    category?: string | null;
    artistName?: string | null;
    bookingsCount: number;
    totalRevenue: number;
  }>,
  dateRangeLabel?: string
) => {
  const columns: HTMLColumn[] = [
    { header: "#", dataKey: "rank" },
    { header: "الخدمة", dataKey: "name" },
    { header: "الفئة", dataKey: "category" },
    { header: "الفنانة", dataKey: "artist" },
    { header: "الحجوزات", dataKey: "bookings" },
    { header: "الإيرادات", dataKey: "revenue" },
  ];

  const data = services.map((s, index) => ({
    rank: String(index + 1),
    name: s.name,
    category: s.category || "-",
    artist: s.artistName || "غير معروف",
    bookings: String(s.bookingsCount),
    revenue: `${s.totalRevenue.toFixed(0)} ر.ق`,
  }));

  const totalRevenue = services.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalBookings = services.reduce((sum, s) => sum + s.bookingsCount, 0);

  exportToPDF({
    title: "تقرير أكثر الخدمات طلبًا",
    subtitle: `${dateRangeLabel ? dateRangeLabel + " | " : ""}إجمالي ${totalBookings} حجز | ${totalRevenue.toFixed(0)} ر.ق`,
    filename: "top_services_report",
    columns,
    data,
    orientation: "portrait",
  });
};

// Top Artists HTML export
export const exportTopArtistsToPDF = (
  artists: Array<{
    id: string;
    name?: string | null;
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    rating?: number | null;
    totalReviews?: number | null;
  }>,
  dateRangeLabel?: string
) => {
  const columns: HTMLColumn[] = [
    { header: "#", dataKey: "rank" },
    { header: "الفنانة", dataKey: "name" },
    { header: "الحجوزات", dataKey: "bookings" },
    { header: "المكتملة", dataKey: "completed" },
    { header: "التقييم", dataKey: "rating" },
    { header: "الإيرادات", dataKey: "revenue" },
  ];

  const data = artists.map((a, index) => ({
    rank: String(index + 1),
    name: a.name || "غير معروف",
    bookings: String(a.totalBookings),
    completed: String(a.completedBookings),
    rating: a.rating ? `${a.rating.toFixed(1)} (${a.totalReviews || 0})` : "-",
    revenue: `${a.totalRevenue.toFixed(0)} ر.ق`,
  }));

  const totalRevenue = artists.reduce((sum, a) => sum + a.totalRevenue, 0);
  const totalBookings = artists.reduce((sum, a) => sum + a.totalBookings, 0);

  exportToPDF({
    title: "تقرير أفضل الفنانات أداءً",
    subtitle: `${dateRangeLabel ? dateRangeLabel + " | " : ""}إجمالي ${totalBookings} حجز | ${totalRevenue.toFixed(0)} ر.ق`,
    filename: "top_artists_report",
    columns,
    data,
    orientation: "portrait",
  });
};
