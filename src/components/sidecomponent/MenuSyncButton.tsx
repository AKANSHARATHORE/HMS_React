// Install: npm install exceljs file-saver jspdf jspdf-autotable sweetalert2
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from 'sweetalert2';

type ReportDataItem = {
  deviceSerialNo: string;
  branchName: string;
  deviceName: string;
  bankName: string;
  phoneNumber: string;
  lastSyncedTimes: string | string[]; // Accepts array or JSON string
};

// Format last 5 sync times as in ManualSync table (one per line, dd-mm-yyyy hh:mm:ss)
const formatSyncTimes = (times: string | string[], separator: string = '\n') => {
  let timesArray: string[] = [];
  if (!times) {
    timesArray = [];
  } else if (Array.isArray(times)) {
    timesArray = times;
  } else {
    try {
      timesArray = JSON.parse(times);
      if (!Array.isArray(timesArray)) timesArray = [];
    } catch {
      timesArray = [];
    }
  }
  return timesArray.slice(0, 5).map((time: string) =>
    new Date(time).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).replace(',', '')
  ).join(separator);
};

// ✅ Export to Excel
export const exportToExcel = (data: ReportDataItem[], filename: string = 'Menu_Sync') => {
  try {
    if (!data || data.length === 0) {
      console.error('Excel export: No data to export');
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `Menu Sync Report - ${dateStr}, ${timeStr}`;
    const excelHeader = [[title], ["S.No", "Serial No.", "Branch Name", "Panel Name", "Bank Name", "Phone Number", "Last 5 Sync Time"]];
    const rows = data.map((row: any, idx: number) => [
      idx + 1,
      row.deviceSerialNo || '',
      row.branchName || '',
      row.deviceName || '',
      row.bankName || '',
      row.phoneNumber || '',
      formatSyncTimes(row.lastSyncedTimes, '\n'),
    ]);
    const sheetData = [...excelHeader, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Merge title row
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 28 },
      { wch: 20 },
      { wch: 25 },
      { wch: 18 },
      { wch: 40 },
    ];

    // Style title row (requires xlsx-style or SheetJS Pro for full styling)
    worksheet['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "1976D2" } }
    };

    // Style header row (bold, blue)
    for (let col = 0; col < 7; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 1, c: col })];
      if (cell) {
        cell.s = {
          font: { bold: true },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Sync");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (err) {
    console.error('Excel export error:', err);
    alert('Failed to export Excel. See console for details.');
  }
};

// ✅ Export to PDF
export const exportToPDF = (data: ReportDataItem[], filename: string = 'Menu_Sync') => {
  try {
    if (!data || data.length === 0) {
      console.error('PDF export: No data to export');
      return;
    }

    // Blue title bar
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const logoImg = new Image();
    logoImg.src = `${window.location.origin}/Digitals45.jpg`; // ✅ Adjust base path as needed

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    // Add logo image
    doc.addImage(logoImg, 'JPEG', 40, 20, 120, 60);
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`Menu Sync Report - ${dateStr}, ${timeStr}`, 420, 50, { align: 'center' });

    // Table headers and rows
    const headers = [["S.No", "Serial No.", "Branch Name", "Panel Name", "Bank Name", "Phone Number", "Last 5 Sync Time"]];
    const rows = data.map((row: any, idx: number) => [
      idx + 1,
      row.deviceSerialNo || '',
      row.branchName || '',
      row.deviceName || '',
      row.bankName || '',
      row.phoneNumber || '',
      formatSyncTimes(row.lastSyncedTimes, '\n'),
    ]);

    autoTable(doc, {
      startY: 70,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        halign: 'center',
        fontSize: 10,
        textColor: [60, 60, 60],
      },
      styles: {
        cellPadding: 5,
        overflow: 'linebreak',
        minCellHeight: 18,
        font: 'helvetica',
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didDrawPage: () => {
        // Footer
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated on: ${dateStr}`, 40, doc.internal.pageSize.height - 20);
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 20);
      }
    });

    doc.save(`${filename}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Failed to export PDF. See console for details.');
  }
};

// ✅ Copy to Clipboard
export const copyToClipboard = async (data: ReportDataItem[]) => {
  try {
    const headers = ['Serial No.', 'Branch Name', 'Panel Name', 'Bank Name', 'Phone Number', 'Last 5 Sync Time'];

    const rows = data.map(reportData => [
      reportData.deviceSerialNo || '',
      reportData.branchName || '',
      reportData.deviceName || '',
      reportData.bankName || '',
      reportData.phoneNumber || '',
      formatSyncTimes(reportData.lastSyncedTimes, '\n'),
    ]);

    const clipboardData = [headers, ...rows]
      .map(row => row.join('\t'))
      .join('\n');

    await navigator.clipboard.writeText(clipboardData);

    Swal.fire({
      toast: true,
      position: 'top',
      icon: 'success',
      title: 'Table data copied to clipboard!',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('Failed to copy data to clipboard. Please try again.');
  }
};
