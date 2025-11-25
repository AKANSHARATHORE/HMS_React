// Install exceljs: npm install exceljs file-saver
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

type SmsLogDataItem = {
  branchName: any;
  smsLogId?: number;
  sentTo?: string;
  message?: string;
  bodyText?: string;
  messageRef?: string; 
};

// Utility to extract Site Name (Branch) from messageRef
function extractBranchName(messageRef: string = ''): string {
  const smsMatch = messageRef.match(/sms=([^&]+)/);
  if (!smsMatch) return '';
  const smsDecoded = decodeURIComponent(smsMatch[1]).replace(/\+/g, ' ');
  const branchMatch = smsDecoded.match(/([\w\s\-]+?)\s+(is having|has|is facing)/i);
  return branchMatch ? branchMatch[1].trim() : '';
}

export const exportToExcel = (data: SmsLogDataItem[], filename: string = 'SMS_Log_Report') => {
  try {
    if (!data || data.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `DI-HMS : SMS Log Report - ${dateStr}, ${timeStr}`;
    const headers = [
      'S.No', 'Site Name', 'Controlling Office','SMS Send To', 'SMS Sent At Date', 'SMS Messages'
    ];
    const excelHeader = [[title], headers];
    const rows = data.map((item, idx) => [
      idx + 1,
      extractBranchName(item.messageRef || ''), // Site Name
      item.branchName || '',
      item.sentTo || '',
      item.message ? (item.message.match(/(\d{4})-(\d{2})-(\d{2})/) ? `${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[3]}-${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[2]}-${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[1]}` : '') : '',
      decodeURIComponent(item.message || "")
        .replace(/\+/g, ' ')
        .replace(/%0D/g, '\n')
        .replace(/\r/g, '')
        .replace(/\n{2,}/g, '\n')
    ]);
    const sheetData = [...excelHeader, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Merge title row
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

    // Set column widths
    worksheet['!cols'] = headers.map(() => ({ wch: 22 }));

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "SMS Log Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log('Excel export completed successfully');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

export const exportToPDF = (data: SmsLogDataItem[], filename: string = 'SMS_Log_Report') => {
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
    doc.text('SMS Log Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: SMS Log Report provides a comprehensive overview of all SMS logs, including recipient and message details.',
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
    doc.text(`DI-HMS : SMS Log Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    // Prepare Table
    const headers = [['S.No','Controlling Office','SMS Send To', 'SMS Sent At Date', 'SMS Messages']];
    const rows = data.map((item, idx) => [
      idx + 1,
      item.branchName, // Site Name 
      item.sentTo || '',
      item.message ? (item.message.match(/(\d{4})-(\d{2})-(\d{2})/) ? `${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[3]}-${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[2]}-${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[1]}` : '') : '',
      decodeURIComponent(item.message || "")
        .replace(/\+/g, ' ')
        .replace(/%0D/g, '\n')
        .replace(/\r/g, '')
        .replace(/\n{2,}/g, '\n')
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

export const copyToClipboard = async (data: SmsLogDataItem[]) => {
  try {
    const headers = ['S.No', 'Site Name', 'Controlling Office', 'SMS Send To', 'SMS Sent At Date', 'SMS Messages'];
    const rows = data.map((item, idx) => [
      idx + 1,
      extractBranchName(item.messageRef || ''), 
      item.branchName || '',
      item.sentTo || '',
      item.message ? (item.message.match(/(\d{4})-(\d{2})-(\d{2})/) ? `${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[3]}-${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[2]}-${item.message.match(/(\d{4})-(\d{2})-(\d{2})/)[1]}` : '') : '',
      decodeURIComponent(item.message || "")
        .replace(/\+/g, ' ')
        .replace(/%0D/g, '\n')
        .replace(/\r/g, '')
        .replace(/\n{2,}/g, '\n')
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

// WhatsApp log export type
type WhatsAppLogExportItem = {
  "S.No": number;
  "Phone No": string;
  "WhatsApp Message": string;
  "Time Stamp": string;
};

export const exportWhatsAppToExcel = (data: WhatsAppLogExportItem[], filename: string = 'WhatsApp_Log_Report') => {
  try {
    if (!data || data.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `DI-HMS : WhatsApp Log Report - ${dateStr}, ${timeStr}`;
    const headers = ['S.No', 'Phone No', 'WhatsApp Message', 'Time Stamp'];
    const excelHeader = [[title], headers];
    const rows = data.map(item => [
      item["S.No"],
      item["Phone No"],
      item["WhatsApp Message"],
      item["Time Stamp"],
    ]);
    const sheetData = [...excelHeader, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    worksheet['!cols'] = headers.map(() => ({ wch: 22 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WhatsApp Log Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

export const exportWhatsAppToPDF = (data: WhatsAppLogExportItem[], filename: string = 'WhatsApp_Log_Report') => {
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

    doc.addImage(logoImg, 'JPEG', 40, 20, 120, 60);
    doc.setDrawColor(180);
    doc.line(40, 90, 800, 90);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('WhatsApp Log Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: WhatsApp Log Report provides a comprehensive overview of all WhatsApp logs, including recipient and message details.',
      40, 110,
      { maxWidth: 760 }
    );

    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    doc.setFontSize(13);
    doc.setFillColor(255, 255, 255);
    doc.rect(40, 140, 760, 28, 'F');
    doc.setTextColor(128, 128, 128);
    doc.text(`DI-HMS : WhatsApp Log Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    const headers = [['S.No', 'Phone No', 'WhatsApp Message', 'Time Stamp']];
    const rows = data.map(item => [
      item["S.No"],
      item["Phone No"],
      item["WhatsApp Message"],
      item["Time Stamp"],
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
        doc.saveGraphicsState();
        doc.setGState(doc.GState({ opacity: 0.08 }));
        doc.setFontSize(100);
        doc.setTextColor(128, 128, 128);
        doc.text('Digitals India', 200, 450, { angle: 25 });
        doc.restoreGraphicsState();

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

export const copyWhatsAppToClipboard = async (data: WhatsAppLogExportItem[]) => {
  try {
    const headers = ['S.No', 'Phone No', 'WhatsApp Message', 'Time Stamp'];
    const rows = data.map(item => [
      item["S.No"],
      item["Phone No"],
      item["WhatsApp Message"],
      item["Time Stamp"],
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

// Call log export type
type CallLogExportItem = {
  "S.No": number;
  "Branch Name": string;
  "Call Sent To": string;
  "Reason": string;
};

export const exportCallLogToExcel = (data: CallLogExportItem[], filename: string = 'Call_Log_Report') => {
  try {
    if (!data || data.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `DI-HMS : Call Log Report - ${dateStr}, ${timeStr}`;
    const headers = ['S.No', 'Branch Name', 'Call Sent To', 'Reason'];
    const excelHeader = [[title], headers];
    const rows = data.map(item => [
      item["S.No"],
      item["Branch Name"],
      item["Call Sent To"],
      item["Reason"],
    ]);
    const sheetData = [...excelHeader, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    worksheet['!cols'] = headers.map(() => ({ wch: 22 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Call Log Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

export const exportCallLogToPDF = (data: CallLogExportItem[], filename: string = 'Call_Log_Report') => {
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

    doc.addImage(logoImg, 'JPEG', 40, 20, 120, 60);
    doc.setDrawColor(180);
    doc.line(40, 90, 800, 90);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Call Log Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: Call Log Report provides a comprehensive overview of all call logs, including branch, recipient, and reason details.',
      40, 110,
      { maxWidth: 760 }
    );

    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    doc.setFontSize(13);
    doc.setFillColor(255, 255, 255);
    doc.rect(40, 140, 760, 28, 'F');
    doc.setTextColor(128, 128, 128);
    doc.text(`DI-HMS : Call Log Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    const headers = [['S.No', 'Branch Name', 'Call Sent To', 'Reason']];
    const rows = data.map(item => [
      item["S.No"],
      item["Branch Name"],
      item["Call Sent To"],
      item["Reason"],
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
        doc.saveGraphicsState();
        doc.setGState(doc.GState({ opacity: 0.08 }));
        doc.setFontSize(100);
        doc.setTextColor(128, 128, 128);
        doc.text('Digitals India', 200, 450, { angle: 25 });
        doc.restoreGraphicsState();

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

export const copyCallLogToClipboard = async (data: CallLogExportItem[]) => {
  try {
    const headers = ['S.No', 'Branch Name', 'Call Sent To', 'Reason'];
    const rows = data.map(item => [
      item["S.No"],
      item["Branch Name"],
      item["Call Sent To"],
      item["Reason"],
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
