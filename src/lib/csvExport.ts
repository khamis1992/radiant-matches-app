import { format } from "date-fns";

interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number | null | undefined;
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  // Add BOM for Arabic support in Excel
  const BOM = "\uFEFF";
  
  // Create header row
  const headers = columns.map((col) => `"${col.header}"`).join(",");
  
  // Create data rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = col.accessor(item);
        if (value === null || value === undefined) return '""';
        // Escape quotes and wrap in quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(",")
  );
  
  // Combine all
  const csvContent = BOM + [headers, ...rows].join("\n");
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
