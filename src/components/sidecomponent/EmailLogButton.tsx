// Install exceljs: npm install exceljs file-saver
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

type ReportDataItem= {
  emailLogId?: string;
  branchName?: string;
  emailIdTo?: string;
  mobileNo?: string;
  bodyText?:string;
  subject?: string;
  

};

// Utility to extract date from bodyText (same as EmailLog.tsx)
function extractDateFromBodyText(bodyText?: string): string {
  if (!bodyText) return '';
  const match = bodyText.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return `${day}-${month}-${year}`;
  }
  return '';
}

// Utility to strip HTML tags for plain text export
function stripHtml(html?: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Utility to extract Site Name (Branch) from bodyText
function extractBranchName(bodyText: string = ''): string {
  const match = bodyText.match(/TIME\s+([A-Za-z0-9\- ]+?)\s+is encountering/i);
  return match ? match[1].trim() : '';
}

export const exportToExcel = (data: ReportDataItem[], filename: string = 'All_Alert_Report') => {
  try {
    if (!data || data.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `DI-HMS : Email Log Report - ${dateStr}, ${timeStr}`;
    const headers = [
      'S.No','Site Name', 'Controlling Office', 'Email Send To', 'Email Date', 'Email Subject', 'Email Body'
    ];
    const excelHeader = [[title], headers];
    const rows = data.map((reportData, idx) => [
      idx + 1,
      extractBranchName(reportData.bodyText), // Site Name
      reportData.branchName || '', // Controlling Name
      reportData.emailIdTo || '',

      
      extractDateFromBodyText(reportData.bodyText), // Use extracted date
      reportData.subject || '',
      stripHtml(reportData.bodyText) // Strip HTML for Excel
    ]);
    const sheetData = [...excelHeader, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Merge title row
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 }, // S.No
      { wch: 25 }, // Site Name
      { wch: 25 }, // Controlling Name
      { wch: 25 }, // Email Send To
      { wch: 20 }, // Email Date
      { wch: 30 }, // Email Subject
      { wch: 50 }  // Email Body
    ];

    // Style title row (requires xlsx-style or SheetJS Pro for full styling)
    worksheet['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "1976D2" } }
    };

    // Style header row (bold)
    for (let col = 0; col < headers.length; col++) {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Email Log Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log('Excel export completed successfully');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

export const exportToPDF = (data: ReportDataItem[], filename: string = 'All_Alert_Report') => {
  // Use absolute path for logo
  const logoUrl = `${window.location.origin}/Digitals45.jpg`;

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  loadImage(logoUrl).then(logoImg => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    // Add logo
    doc.addImage(logoImg, 'JPEG', 40, 20, 120, 60);

    // Horizontal rule
    doc.setDrawColor(180);
    doc.line(40, 90, 800, 90);

    // Heading + About
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Email Log Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: Email Log Report provides a summary of all email logs, including recipients, dates, subjects, and body.',
      40, 110,
      { maxWidth: 760 }
    );

    // Subtitle with more gap
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    doc.setFontSize(13);
    doc.setFillColor(255, 255, 255);
    doc.rect(40, 140, 760, 28, 'F');
    doc.setTextColor(128, 128, 128);
    doc.text(`DI-HMS : Email Log Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    // Prepare Table
    const headers = [['S.No', 'Site Name', 'Controlling Name', 'Email Send To', 'Email Date', 'Email Subject', 'Email Body']];
    const rows = data.map((reportData, idx) => [
      idx + 1,
      extractBranchName(reportData.bodyText), // Site Name
      reportData.branchName || '', // Controlling Name
      reportData.emailIdTo || '',
      extractDateFromBodyText(reportData.bodyText),
      reportData.subject || '',
      stripHtml(reportData.bodyText)
    ]);

    autoTable(doc, {
      startY: 180,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [60, 60, 60],
      },
      styles: {
        cellPadding: 5,
        overflow: 'linebreak',
        minCellHeight: 18,
        font: 'helvetica',
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      didDrawPage: function () {
        // Watermark
        doc.saveGraphicsState();
        doc.setGState(doc.GState({ opacity: 0.08 }));
        doc.setFontSize(100);
        doc.setTextColor(128, 128, 128);
        doc.text('Digitals India', 200, 450, { angle: 25 });
        doc.restoreGraphicsState();

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated on: ${dateStr}`, 40, doc.internal.pageSize.height - 20);
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 20);
      }
    });

    doc.save(`${filename}.pdf`);
  }).catch(() => {
    alert("Error loading logo image or generating PDF.");
  });
};

export const copyToClipboard = async (data: ReportDataItem[]) => {
  try {
    // Prepare data for clipboard (tab-separated format)
    const headers = ['S.No', 'Site Name', 'Email Send To', 'Email Date', 'Email Subject', 'Email Body'];
    const rows = data.map((reportData, idx) => [
      (idx + 1).toString(),
      extractBranchName(reportData.bodyText), // Site Name
      reportData.branchName || '', // Controlling Name
      reportData.emailIdTo || '',
      extractDateFromBodyText(reportData.bodyText),
      reportData.subject || '',
      stripHtml(reportData.bodyText)
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
