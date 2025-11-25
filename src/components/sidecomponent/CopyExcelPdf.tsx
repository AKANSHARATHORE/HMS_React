import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
type User = {
  code?: string;
  name?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
  mobile?: string;
  email?: string;
  group?: string;
  branch?: string;
  role?: string;
};

export const exportToExcel = (data: User[], filename: string = 'users_data') => {
  try {
    if (!data || data.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const title = `DI-HMS : User Master Report - ${dateStr}, ${timeStr}`;
    const headers = ['User Code', 'User Name', 'Role', 'Mobile No.', 'Email', 'Address', 'City', 'State', 'Country', 'Pincode', 'Group', 'Branch'];
    const excelHeader = [[title], headers];
    const rows = data.map(user => [
      user.code || '',
      user.name || '',
      user.role || '',
      user.mobile || '',
      user.email || '',
      user.address || '',
      user.city || '',
      user.state || '',
      user.country || '',
      user.pincode || '',
      user.group || '',
      user.branch || ''
    ]);
    const sheetData = [...excelHeader, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Merge title row
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // User Code
      { wch: 30 }, // User Name
      { wch: 15 }, // Role
      { wch: 15 }, // Mobile No.
      { wch: 25 }, // Email
      { wch: 30 }, // Address
      { wch: 15 }, // City
      { wch: 15 }, // State
      { wch: 12 }, // Country
      { wch: 10 }, // Pincode
      { wch: 25 }, // Group
      { wch: 30 }  // Branch
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
          alignment: { 
            horizontal: ( // Right-align numeric columns
              ['Mobile No.', 'Pincode'].includes(headers[col]) ? "right" : "center"
            ),
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
      }
    }
    // Style data rows: right-align numeric columns
    for (let row = 2; row < sheetData.length; row++) {
      // Mobile No. (col 3), Pincode (col 9)
      [3, 9].forEach(col => {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell) {
          cell.s = cell.s || {};
          cell.s.alignment = { ...(cell.s.alignment || {}), horizontal: "right" };
        }
      });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Master");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    console.log('Excel export completed successfully');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};

export const exportToPDF = (data: User[], filename: string = 'users_data') => {
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
    doc.text('User Master Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: User Master Report provides an overview of all users, including their roles, contact, and branch details.',
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
    doc.text(`DI-HMS : User Master Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    // Prepare Table
    const headers = [['S.No', 'User Name', 'Role', 'Mobile No.', 'Email', 'Address', 'City', 'State']];
    const rows = data.map((user, index) => [
      index + 1 ,
      user.name || '',
      user.role || '',
      user.mobile || '',
      user.email || '',
      user.address || '',
      user.city || '',
      user.state || '',
      
    ]);

    autoTable(doc, {
      startY: 180,
      head: headers,
      body: rows,
      theme: 'grid',
      columnStyles: {
        3: { halign: 'right' }, // Mobile No.
        9: { halign: 'right' }, // Pincode
      },
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

export const copyToClipboard = async (data: User[]) => {
  try {
    // Prepare data for clipboard (tab-separated format)
    const headers = ['S.No', 'User Name', 'Role', 'Mobile No.', 'Email', 'Address', 'City', 'State', 'Country', 'Pincode', 'Group', 'Branch'];
    const rows = data.map((user, index) => [
      index + 1,
      user.name || '',
      user.role || '',
      user.mobile || '',
      user.email || '',
      user.address || '',
      user.city || '',
      user.state || '',
      user.country || '',
      user.pincode || '',
      user.group || '',
      user.branch || ''
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
