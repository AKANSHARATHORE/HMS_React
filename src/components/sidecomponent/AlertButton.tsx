// Install exceljs: npm install exceljs file-saver
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

type ReportDataItem= {
  ifsc: string;
  address: string;
  deviceType: string;
  vendorName: string;
  zoneDesiredName: string;
  alertType: string;
  timeStamp: string;

};

export const exportToExcel = async (data: ReportDataItem[], filename: string = 'Alert_Report') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Alert Report');

    // Define headers
    const headers = [
        { header: 'Branch Code', key: 'ifsc', width: 20 },
        { header: 'Branch Address', key: 'address', width: 60 },
        { header: 'Device Type', key: 'deviceType', width: 20 },
        { header: 'Service Integrator', key: 'vendorName', width: 25 },
        { header: 'Product Name', key: 'zoneDesiredName', width: 25 },
        { header: 'Alert Type', key: 'alertType', width: 30 },
        { header: 'Time Stamp', key: 'timeStamp', width: 25 },
      
    ];

    worksheet.columns = headers;

    // Add data rows
    data.forEach(reportData => {
      worksheet.addRow({
        ifsc: reportData.ifsc || '',
        address: reportData.address || '',
        deviceType: reportData.deviceType || '',
        vendorName: reportData.vendorName || '',
        zoneDesiredName: reportData.zoneDesiredName || '',
        alertType: reportData.alertType || '',
        timeStamp: reportData.timeStamp || '',
      });
    });

    // Style header row
    worksheet.getRow(1).eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ADD8E6' } // Light Blue
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
    console.log('Excel export completed successfully');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

export const exportToPDF = (data: ReportDataItem[], filename: string = 'Alert_Report') => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
    
    // Add title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('User Master Report', 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
    
    // Prepare table data
    const tableData = data.map(reportData => [
         reportData.ifsc || '',
         reportData.address || '',
         reportData.deviceType || '',
         reportData.vendorName || '',
         reportData.zoneDesiredName || '',
         reportData.alertType || '',
         reportData.timeStamp || '',
    ]);

    // Add table
    autoTable(doc, {
      head: [['Branch Code','Branch Address','Device Type','Service Integrator','Product Name','Alert Type','Time Stamp']],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [71, 85, 105], // gray-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // gray-50
      },
      margin: { top: 35, left: 14, right: 14 },
    });
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
    console.log('PDF export completed successfully');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Failed to export to PDF. Please try again.');
  }
};

export const copyToClipboard = async (data: ReportDataItem[]) => {
  try {
    // Prepare data for clipboard (tab-separated format)
    const headers = [];
    const rows = data.map(reportData => [
       reportData.ifsc || '',
         reportData.address || '',
         reportData.deviceType || '',
         reportData.vendorName || '',
         reportData.zoneDesiredName || '',
         reportData.alertType || '',
         reportData.timeStamp || '',
      
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
