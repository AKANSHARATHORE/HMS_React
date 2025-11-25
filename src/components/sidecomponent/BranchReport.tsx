import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  FileSignature,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";
import Swal from 'sweetalert2';
import { Input } from '../ui/input';


const DEVICE_TYPES = ["CCTV", "Security Alarm", "Fire Alarm", "ETL", "BACS"];
const DEVICE_TYPE_LABELS: Record<string, string> = {
  "Security Alarm": "SAS/IAS",
  "Fire Alarm": "FAS",
};

const copyToClipboard = async (data: any[]) => {
  if (!data || data.length === 0) return;
  const headers = ["S.No", "Site Name", ...DEVICE_TYPES];
  const rows = data.map((branch: any, idx: number) => {
    const deviceStatuses = DEVICE_TYPES.map(type => {
      const s = branch.devices[type];
      if (!s) return "-";
      if (s === "Working") return "Working";
      if (s === "Partially Working") return "Partially Working";
      if (s === "Not Working" || s === "Not Working") return "Not Working";
      return s;
    });
    return [
      (idx + 1).toString(),
      branch.branchName,
      ...deviceStatuses,
    ].join("\t");
  });
  const tsv = [headers.join("\t"), ...rows].join("\n");
  await navigator.clipboard.writeText(tsv);
  Swal.fire({
    toast: true,
    position: 'top',
    icon: 'success',
    title: 'Table data copied to clipboard!',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

const exportToExcel = (data: any[], filename: string) => {
  // Prepare header and data as per image
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const excelHeader = [
    [`DI-HMS : Site Report - ${dateStr}, ${timeStr}`],
    [
      "Site Name",
      ...DEVICE_TYPES.map(type => DEVICE_TYPE_LABELS[type] || type)
    ]
  ];
  const rows = data.map(item => [
    item.branchName,
    ...DEVICE_TYPES.map(type => {
      const s = item.devices[type];
      if (!s) return "-";
      if (s === "Working") return "Working";
      if (s === "Partially Working") return "Partially Working";
      if (s === "Not Working" || s === "Not Working") return "Not Working";
      return s;
    })
  ]);
  const sheetData = [...excelHeader, ...rows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Merge the first row for the title
  worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: DEVICE_TYPES.length } }];

  // Set column widths
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 18 },
    ...DEVICE_TYPES.map(() => ({ wch: 10 }))
  ];

  // Style the title row (blue background, white text)
  worksheet['A1'].s = {
    font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "1976D2" } }
  };

  // Style the header row (bold)
  for (let col = 0; col < DEVICE_TYPES.length + 2; col++) {
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

  // Create workbook and export
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Site Report');
  // Use XLSX-style for styling (requires xlsx-style or SheetJS Pro for full styling support)
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};





const exportToPDF = (data: any[], filename: string) => {
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

  function getStatus(status: string): string {
    if (!status) return "-";
    if (status === "Working") return "Working";
    if (status === "Partially Working") return "Partially Working";
    if (status === "Not Working" || status === "Not Working") return "Not Working";
    return status;
  }

  loadImage(logoUrl).then(logoImg => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    // Add logo if loaded
    doc.addImage(logoImg, 'JPEG', 40, 20, 120, 60);

    // Horizontal rule
    doc.setDrawColor(180);
    doc.line(40, 90, 800, 90);

    // Heading + About
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Site Report', 700, 50, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      'ABOUT: Site Report provides an overview of the status of various systems across different Sitees. It includes information on CCTV, SAS, FAS, ETL, and BACS systems, helping to ensure that all security measures are functioning properly.',
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
    doc.text(`DI-HMS : Site Report - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

    // Prepare Table
    const headers = [["S.No", "Site Name", "Site Code", ...DEVICE_TYPES.map(type => DEVICE_TYPE_LABELS[type] || type)]];

    const rows = data.map((item, index) => [
      index + 1,
      item.branchName,
      ...DEVICE_TYPES.map(type => {
        return getStatus(item.devices[type]);
      })
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
      columnStyles: {
        0: { halign: 'right' }, 
        1: { halign: 'left' }, 
        // Dynamically set for device columns
        ...Object.fromEntries(DEVICE_TYPES.map((_, idx) => [idx + 2, { halign: 'center' }]))
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      didParseCell: function (data) {
        const statusColors: Record<string, [number, number, number]> = {
          "Working": [0, 128, 0],
          "Partially Working": [218, 165, 32],
          "Not Working": [178, 34, 34],
        };

        if (data.section === 'body' && data.column.index >= 2) {
          const val = typeof data.cell.raw === 'string' ? data.cell.raw : '';
          if (statusColors[val]) {
            data.cell.styles.textColor = statusColors[val];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
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


const statusBadge = (status: string | undefined) => {
  if (!status) return <span className="px-2 py-1 rounded border text-gray-400 border-gray-300">-</span>;
  if (status === "Working") return <span className="px-2 py-1 rounded border border-green-500 text-green-600 bg-green-50">Working</span>;
  if (status === "Partially Working") return <span className="px-2 py-1 rounded border border-yellow-500 text-yellow-700 bg-yellow-50">Partially Working</span>;
  if (status === "Not Working" || status === "Not Working") return <span className="px-2 py-1 rounded border border-red-500 text-red-600 bg-red-50">Not Working</span>;
  return <span className="px-2 py-1 rounded border border-gray-400 text-gray-600">{status}</span>;
};

const BranchReport = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const branchCode = sessionStorage.getItem("branch");
    try {
      const res = await axios.get(`${API_BASE_URL}/getSystemWiseBranchReport`, {
        params: { branchCode },
      });
      const grouped: Record<string, any> = {};
      (res.data.payload || []).forEach((item: any) => {
        const key = item.branchCode;
        if (!grouped[key]) {
          grouped[key] = {
            branchCode: item.branchCode,
            branchName: item.branchName,
            ifsc: item.bank || "-",
            devices: {},
          };
        }
        (item.zoneDTOList || []).forEach((zone: any) => {
          // Map zoneType to DEVICE_TYPES key if matches (case-insensitive)
          const matchedType = DEVICE_TYPES.find(dt => dt.toLowerCase() === zone.zoneType.toLowerCase());
          if (matchedType) {
            grouped[key].devices[matchedType] = zone.status;
          }
        });
      });
      setData(Object.values(grouped));
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((user) => {
  // free-text search (site name, code, device statuses)
  const matchesSearch = [user.branchName, ...Object.values(user.devices)]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  // status filter check
  let matchesStatus = true;
  if (statusFilter !== "All") {
    matchesStatus = Object.values(user.devices).some((status) => {
      if (!status) return false;
      if (status === "Working" && statusFilter === "Working") return true;
      if (status === "Partially Working" && statusFilter === "Partially Working") return true;
      if ((status === "Not Working" || status === "Not Working") && statusFilter === "Not Working") return true;
      return false;
    });
  }

  return matchesSearch && matchesStatus;
});


  const handleStatusClick = async (branch: any, type: string) => {
    setModalLoading(true);
    setModalOpen(true);
    setModalData(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/getTATReport`, {
        params: { branchCode: branch.branchCode, zoneType: type },
      });
      setModalData(res.data.payload?.[0]);
    } catch (err) {
      setModalData(null);
    } finally {
      setModalLoading(false);
    }
  };

  const StatusModal = () => (
    <div className="fixed inset-0 z-50 flex justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow-xl w-full max-w-4xl mt-16 relative overflow-hidden max-h-[30vh]">
        <button
          className="absolute top-3 right-3 text-gray-700 hover:bg-gray-200 w-8 h-8 rounded border border-gray-400 flex items-center justify-center"
          onClick={() => setModalOpen(false)}
        >
          ×
        </button>
        <h2 className="text-2xl font-semibold text-gray-800 px-6 pt-6 mb-4">System Status</h2>
        <div className="overflow-x-auto px-6 pb-6">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-left">Site Name</th>
                <th className="px-4 py-2 text-left">Zone</th>
                <th className="px-4 py-2 text-left">Faulty Since</th>
                <th className="px-4 py-2 text-left">Downtime</th>
              </tr>
            </thead>
            <tbody>
              {modalLoading ? (
                <tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>
              ) : modalData ? (
                <tr className="border border-gray-200">
                  <td className="px-4 py-2">{modalData.branchName}</td>
                  <td className="px-4 py-2">{modalData.zone}</td>
                  <td className="px-4 py-2">
                    {modalData.tat
                      ? `Faulty since ${new Date(modalData.tat).toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-2">{modalData.downtime || "-"}</td>
                </tr>
              ) : (
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">No data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const printSection = () => {
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Site Report</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; }
              .print-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
              .print-title { font-size: 2rem; font-weight: 600; }
              .print-logo { max-width:320px; max-height:90px; margin-left: 20px; }
              table { border-collapse: collapse; width: 100%; font-size: 1rem; }
              th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
              th { background: #f3f4f6; font-weight: 600; }
              tr:nth-child(even) { background: #fafbfc; }
            </style>
          </head>
          <body>
            <div class="print-header">
              <div class="print-title">Site Report</div>
              <img src="${window.location.origin}/Digitals45.jpg" alt="Digitals Logo" class="print-logo" />
            </div>
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <>
    <div className="w-full mx-auto px-4 py-6 font-sans text-sm">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
          Site Report
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          {/* <Button onClick={() => copyToClipboard(data)} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileText className="w-4 h-4 mr-1 text-yellow-500" /> Copy
          </Button> */}
          <div className="w-52">
            <Input
            id="search"
            type="text"
            className="w-full h-8 text-sm border-gray-300 focus:ring-green-700 focus:border-green-700"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 text-sm border-gray-300 rounded px-2"
            >
              <option value="All">All</option>
              <option value="Working">Working</option>
              <option value="Not Working">Not Working</option>
              <option value="Partially Working">Partially Working</option>
            </select>
          <Button onClick={() => exportToExcel(data, 'Site_Report')} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4 mr-1 text-green-500" /> Excel
          </Button>
          <Button onClick={() => exportToPDF(data, 'Site_Report')} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileSignature className="w-4 h-4 mr-1 text-red-500" /> PDF
          </Button>
          <Button onClick={printSection} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <Printer className="w-4 h-4 mr-1 text-blue-600" /> Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading Site Report data...</p>
        </div>
      ) : (
        <div className="border rounded shadow-sm max-h-[65vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 font-semibold text-gray-700 text-right">S.No</th>
                <th className="px-3 py-3 font-semibold text-gray-700 text-left">Site Name</th>
                {DEVICE_TYPES.map(type => (
                  <th key={type} className="px-3 py-3 font-semibold text-gray-700 text-left">
                    {DEVICE_TYPE_LABELS[type] || type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">No data available.</td>
                </tr>
              ) : (
                filteredData.map((branch, index) => (
                  <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                    <td className="px-3 py-2 text-right">{index + 1}</td>
                    <td className="px-3 py-2">{branch.branchName}</td>
                    {DEVICE_TYPES.map(type => (
                      <td
                        key={type}
                        className="px-3 py-2 cursor-pointer"
                        onClick={() => handleStatusClick(branch, type)}
                      >
                        {statusBadge(branch.devices[type])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && <StatusModal />}

      {/* Only this section will be printed */}
      <div id="print-section" className="hidden">
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '1rem' }}>
          <thead>
            <tr>
              <th style={{ background: '#f3f4f6', fontWeight: 600 }}>S.No</th>
              <th style={{ background: '#f3f4f6', fontWeight: 600 }}>Site Name</th>
              {DEVICE_TYPES.map(type => (
                <th key={type} style={{ background: '#f3f4f6', fontWeight: 600 }}>
                  {DEVICE_TYPE_LABELS[type] || type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{item.branchName}</td>
                {DEVICE_TYPES.map(type => {
                  const s = item.devices[type];
                  let displayStatus = "-";
                  if (s === "Working") displayStatus = "Working";
                  else if (s === "Partially Working") displayStatus = "Partially Working";
                  else if (s === "Not Working" || s === "Not Working") displayStatus = "Not Working";
                  else if (s) displayStatus = s;
                  return <td key={type}>{displayStatus}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Alert/>
    </>
  );
};

export default BranchReport;
