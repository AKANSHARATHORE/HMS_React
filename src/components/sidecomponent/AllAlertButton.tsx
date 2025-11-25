// Install exceljs: npm install exceljs file-saver
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

type ReportDataItem= {
  ifsc: string;
  branchName: string;
  mobileNo: string;
  vendorName: string;
  alarmtype: string;
  alertType: string;
  alarmTime: string;
  issueResolvedTime: string;
  timeDifference: string;
  alarmDescription: string;

};

export const exportToExcel = (data: ReportDataItem[], filename: string = 'All_Alert_Report') => {
  try {
    if (!data || data.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `DI-HMS : All Alert Report - ${dateStr}, ${timeStr}`;
    const headers = [
      'Site Code', 'Site Name', 'Mobile', 'System Integrator', 'Product', 'Alert Type', 'Alarm Time', 'Issue Resolved Time', 'Resolution', 'Alarm Description'
    ];
    const excelHeader = [[title], headers];
    const rows = data.map(reportData => [
      reportData.ifsc || '',
      reportData.branchName || '',
      reportData.mobileNo || '',
      reportData.vendorName || '',
      reportData.alarmtype || '',
      reportData.alertType || '',
      reportData.alarmTime || '',
      reportData.issueResolvedTime || '',
      reportData.timeDifference || '',
      reportData.alarmDescription || ''
    ]);
    const sheetData = [...excelHeader, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Merge title row
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

    // Set column widths
    worksheet['!cols'] = headers.map(() => ({ wch: 18 }));

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Alert Report");
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
    doc.text('All Alert Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: All Alert Report provides a comprehensive overview of all alerts, including site, product, and resolution details.',
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
    doc.text(`DI-HMS : All Alert Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    // Prepare Table
    const headers = [[
      'Site Code','Site Name','Mobile','System Integrator','Product','Alert Type','Alarm Time','Issue Resolved Time','Resolution','Alarm Description'
    ]];
    const rows = data.map((reportData, index) => [
      index + 1,
      reportData.ifsc || '',
      reportData.branchName || '',
      reportData.mobileNo || '',
      reportData.vendorName||'',
      reportData.alarmtype||'',
      reportData.alertType||'',
      reportData.alarmTime||'',
      reportData.issueResolvedTime||'',
      reportData.timeDifference||'',
      reportData.alarmDescription || '',
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
    const headers = ['Site Code','Site Name','Mobile','System Integrator','Product','Alert Type','Alarm Time','Issue Resolved Time','Resolution','Alarm Description'];
    const rows = data.map(reportData => [
       reportData.ifsc || '',
        reportData.branchName || '',
        reportData.mobileNo || '',
        reportData.vendorName||'',
        reportData.alarmtype||'',
        reportData.alertType||'',
        reportData.alarmTime||'',
        reportData.issueResolvedTime||'',
        reportData.timeDifference||'',
        reportData.alarmDescription || ''
      
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
