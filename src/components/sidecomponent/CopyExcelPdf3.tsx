import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

type branch = {
   branchDesc: string;
  bank: string;
  branchType: string;
  parentBranch: string;
  branchCode: string;
  latitude: string;
  longitude: string;
  telephoneNumber: string;
  faxNo: string;
  mobile: string;
  mobile2: string;
  mobile3: string;
  mobile4: string;
  mobile5: string;
  mobile6: string;
  email: string;
  email2: string;
  email3: string;
  email4: string;
  email5: string;
  email6: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  contractPerson: string;
  status: string;
  ifsc?: string;
};

export const exportToExcel = (data: branch[], filename: string = 'branch_data') => {
  try {
    if (!data || data.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `DI-HMS : Branch Master Report - ${dateStr}, ${timeStr}`;
    const headers = [
      'Bank Name', 'Branch Name', 'Branch Type', 'Parent Branch', 'Branch Code', 'Latitude', 'Longitude', 'Telephone Number', 'Fax No.', 'Mobile', 'Mobile2', 'Mobile3', 'Mobile4', 'Mobile5', 'Mobile6', 'Email', 'Email2', 'Email3', 'Email4', 'Email5', 'Email6', 'Address', 'Pincode', 'City', 'State', 'Contact Person', 'Status'
    ];
    const excelHeader = [[title], headers];
    const rows = data.map(branchData => [
      branchData.bank || '',
      branchData.branchDesc || '',
      branchData.branchType || '',
      branchData.parentBranch || '',
      branchData.ifsc || '',
      branchData.latitude || '',
      branchData.longitude || '',
      branchData.telephoneNumber || '',
      branchData.faxNo || '',
      branchData.mobile || '',
      branchData.mobile2 || '',
      branchData.mobile3 || '',
      branchData.mobile4 || '',
      branchData.mobile5 || '',
      branchData.mobile6 || '',
      branchData.email || '',
      branchData.email2 || '',
      branchData.email3 || '',
      branchData.email4 || '',
      branchData.email5 || '',
      branchData.email6 || '',
      branchData.address || '',
      branchData.pincode || '',
      branchData.city || '',
      branchData.state || '',
      branchData.contractPerson || '',
      branchData.status || ''
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Branch Master");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log('Excel export completed successfully');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

export const exportToPDF = (data: branch[], filename: string = 'branch_data') => {
  const logoImg = new Image();
  logoImg.src = `/Digitals45.jpg`;

  logoImg.onload = () => {
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
    doc.text('Branch Master Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: Branch Master Report provides an overview of all branches, including contact, address, and status details.',
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
    doc.text(`DI-HMS : Branch Master Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    // Prepare Table (only columns in header)
    const headers = [[
      'S.No','Bank Name', 'Branch Name', 'Branch Type', 'Branch Code', 'Contact Person'
    ]];
    const rows = data.map((branchData ,index) => [
      index + 1,
      branchData.bank || '',
      branchData.branchDesc || '',
      branchData.branchType || '',
      branchData.ifsc || '',
      branchData.contractPerson || '',

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
  };
};

export const copyToClipboard = async (data: branch[]) => {
  try {
    // Prepare data for clipboard (tab-separated format)
    const headers = ['Bank Name', 'Branch Name', 'Branch Type', 'Branch Code', 'Branch Latitude', 'Branch Longitude', 'Telephone number, Fax No.', 'Mobile', 'Mobile2', 'Mobile3', 'Mobile4', 'Mobile5', 'Mobile6', 'Email', 'Email2', 'Email3', 'Email4', 'Email5', 'Email6', 'Address', 'Pincode', 'City', 'State', 'Contact Person', 'Status' ];
    const rows = data.map(branchData => [
        branchData.bank || '',
        branchData.branchDesc || '',
        branchData.branchType || '',
        branchData.branchCode || '',
        branchData.latitude || '',
        branchData.longitude || '',
        branchData.telephoneNumber || '',
        branchData.faxNo || '',
        branchData.mobile || '',
        branchData.mobile2 || '',
        branchData.mobile3 || '',
        branchData.mobile4 || '',
        branchData.mobile5 || '',
        branchData.mobile6 || '',
        branchData.email || '',
        branchData.email2 || '',
        branchData.email3 || '',
        branchData.email4 || '',
        branchData.email5 || '',
        branchData.email6 || '',
        branchData.address || '',
        branchData.pincode || '',
        branchData.city || '',
        branchData.state || '',
        branchData.contractPerson || '',
        branchData.status || ''
      
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
