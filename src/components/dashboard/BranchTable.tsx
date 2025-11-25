import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select'; // <-- added react-select import
//import { useDashboardRefresh } from './DashboardRefreshContext';
import { API_BASE_URL } from "@/config/api";

// Extend jsPDF type to include autoTable for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

interface BranchData {
  createdBy: string;
  branchDesc: string;
  branchCode: string;
  ifsc: string;
  mobile: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  status: string;

}

interface Zone {
  branchCode: string;
  branchDesc: string;
}

// Add Option type for react-select
type Option = { value: string; label: string };

const BranchTable = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [allBranches, setAllBranches] = useState<BranchData[]>([]); // For dropdown
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Add this line to get refreshKey from context
  //const { refreshKey } = useDashboardRefresh();


  const [selectedZone, setSelectedZone] = useState<string>('');
  const [filteredBranches, setFilteredBranches] = useState<BranchData[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBranchDesc, setSelectedBranchDesc] = useState<string>(''); // Add this line
  const [selectedStatus, setSelectedStatus] = useState<string>('');


  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<Record<string, any>>({});
  const [alertLoading, setAlertLoading] = useState<Record<string, boolean>>({});


  const branchCode = sessionStorage.getItem('branch');
  const [selectedHead, setSelectedHead] = useState<string>(branchCode || '');

  useEffect(() => {
    // Fetch zones for Controlling Office filter
    const fetchZones = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getAllZonesByBranchCode?branchCode=${branchCode}`);
        const data = await res.json();
     
        if (data?.payload) {
          setZones(data.payload);
     
          // --- Fix: fetch branches for the default controlling office and set table data ---
          if (branchCode) {
            const branchRes = await fetch(`${API_BASE_URL}/getAllChildren?branchCode=${branchCode}`);
            const branchData = await branchRes.json();
            if (branchData?.payload) {
              setBranches(branchData.payload);
              // alert(JSON.stringify(branchData.payload));
              setFilteredBranches(branchData.payload);
            } else {
              setBranches([]);
              setFilteredBranches([]);
            }
          }
        }
      } catch (err) {
        setZones([]);
        setBranches([]);
        setFilteredBranches([]);
      }
    };

    // Fetch all branches for Sites filter
    const fetchAllBranches = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getAllChildren?branchCode=${branchCode}`);
        const data = await res.json();
        if (data?.payload) setAllBranches(data.payload);
      
      } catch (err) {
        setAllBranches([]);
      }
    };

    fetchZones();
    fetchAllBranches();
  }, [branchCode]);

  // Set selectedZone to branchCode on mount
  useEffect(() => {
    if (branchCode) {
      setSelectedZone(branchCode);
    }
  }, [branchCode]);

  // Fetch branches for Sites filter when selectedZone changes
  useEffect(() => {
    if (!selectedZone) {
      setBranches([]);
      setBranchDisabled(true);
      setSelectedBranch('');
      return;
    }
    setBranchLoading(true);
    setBranchDisabled(true);
    const getBranches = async () => {
      try {
        const url = `${API_BASE_URL}/getAllBranchesAndDevicesbyBranchCode?branchCode=${selectedZone}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        const data = result.payload || [];
        setBranches(data);
        setBranchDisabled(!data.length);
        setSelectedBranch('');
      } catch (err) {
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch('');
      } finally {
        setBranchLoading(false);
      }
    };
    getBranches();
  }, [selectedZone]);


 useEffect(() => {
  let url = '';
  if (selectedBranch) {
    url = `${API_BASE_URL}/getAllChildren?branchCode=${selectedBranch}`;
   
  } else if (selectedZone) {
    url = `${API_BASE_URL}/getAllChildren?branchCode=${selectedZone}`;
 
  } else if (branchCode) {
    url = `${API_BASE_URL}/getAllChildren?branchCode=${branchCode}`;
   
  } else {
    setBranches([]);
    setFilteredBranches([]);
    setLoading(false);
    return;
  }
  setLoading(true);
  const start = Date.now();
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, 1000 - elapsed); 
      setTimeout(() => {
        if (data?.payload) {
          setBranches(data.payload);
          setFilteredBranches(data.payload);
        } else {
          setBranches([]);
          setFilteredBranches([]);
        }
        setLoading(false);
      }, delay);
    })
    .catch(() => {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, 1000 - elapsed);
      setTimeout(() => {
        setBranches([]);
        setFilteredBranches([]);
        setLoading(false);
      }, delay);
    });
}, [selectedZone, selectedBranch, branchCode]);


  // Zone filter state
  const [zoneDisabled, setZoneDisabled] = useState(true);
  const [zoneLoading, setZoneLoading] = useState(false);

  // Branch filter state
  const [branchDisabled, setBranchDisabled] = useState(true);
  const [branchLoading, setBranchLoading] = useState(false);


  // Fetch Zones when Head Office changes
  useEffect(() => {
    if (!selectedHead) {
      setZones([]);
      setZoneDisabled(true);
      setSelectedZone('');
      setBranches([]);
      setBranchDisabled(true);
      setSelectedBranch('');
      return;
    }
    const getZones = async () => {
      setZoneLoading(true);
      try {
        const url = `${API_BASE_URL}/getAllZonesByBranchCode?branchCode=${selectedHead}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        const data = result.payload || [];
        if (data && data.length > 0) {
          setZones(data);
          setZoneDisabled(false);
          setSelectedZone('');
        } else {
          setZones([]);
          setZoneDisabled(true);
          setSelectedZone('');
        }
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch('');
      } catch (err) {
        setZoneDisabled(true);
      } finally {
        setZoneLoading(false);
      }
    };
    getZones();
  }, [selectedHead]);

  // Controlling Office (Zone) change handler
  const handleZoneChange = (option: Option | null) => {
    const newZone = option ? option.value : '';
    setSelectedZone(newZone);
    setSelectedBranch('');
    setSelectedStatus('');
  };

  // When Branch changes, reset status filter
  const handleBranchSelectChange = (option: Option | null) => {
    if (option) {
      setSelectedBranch(option.value);
      // find branch desc from branches list
      const br = branches.find(b => b.branchCode === option.value);
      setSelectedBranchDesc(br?.branchDesc || '');
    } else {
      setSelectedBranch('');
      setSelectedBranchDesc('');
    }
    setSelectedStatus('');
  };

  const handleStatusSelectChange = (option: Option | null) => {
    setSelectedStatus(option?.value || '');
  };

  // Filter branches based on selected filters
  useEffect(() => {
    let filtered = branches;
    if (selectedBranch) {
      filtered = filtered.filter(b => b.branchCode === selectedBranch);
    }
    if (selectedStatus) {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }
    setFilteredBranches(filtered);
  }, [branches, selectedBranch, selectedStatus]);

  // Get unique branches for branch dropdown based on selected zone
  const branchOptions = React.useMemo(() => {
    let filtered = branches;
    if (selectedZone) {
      filtered = filtered.filter(b => b.branchCode.startsWith(selectedZone));
    }
    // Remove duplicates by branchCode
    const seen = new Set();
    return filtered.filter(b => {
      if (seen.has(b.branchCode)) return false;
      seen.add(b.branchCode);
      return true;
    });
  }, [branches, selectedZone]);


  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  const getFullAddress = (branch: BranchData) =>
    [branch.address1, branch.address2, branch.address3, branch.address4]
      .filter(Boolean)
      .join(', ');


  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});

  const handleAccordionToggle = async (branchCode: string) => {
    if (expandedBranch === branchCode) {
      setExpandedBranch(null);
      return;
    }
    setExpandedBranch(branchCode);

    setTimeout(() => {
      const ref = rowRefs.current[branchCode];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100); // Delay to ensure DOM update

    if (!alertData[branchCode]) {
      setAlertLoading(prev => ({ ...prev, [branchCode]: true }));
      try {
        const res = await axios.get(`${API_BASE_URL}/getLatestRecordWithAlertType?branchCode=${branchCode}`);
        // --- CHANGED: handle new response structure ---
        if (res.data?.payload) {
          // Merge zoneValues into latestRecord for easier access
          const latestRecord = res.data.payload.latestRecord || {};
          console.log(JSON.stringify(latestRecord))
          latestRecord.zoneValues = res.data.payload.zoneValues || [];
          setAlertData(prev => ({ ...prev, [branchCode]: latestRecord }));
        } else {
          setAlertData(prev => ({ ...prev, [branchCode]: null }));
        }
      } catch (err) {
        setAlertData(prev => ({ ...prev, [branchCode]: null }));
      } finally {
        setAlertLoading(prev => ({ ...prev, [branchCode]: false }));
      }
    }
  };

  // Status helpers (Same as before)

  const getMainStatus = (v: number) => v == 1 ? "Power Off" : "Power On";
  const getSolarStatus = (v: number) => v == 0 ? "Not Connected" : "Connected";
  const getBatteryStatus = (v: number) =>
    v == 0 ? "Not Installed"
      : v == 1 ? "Charging"
        : v == 2 ? "Battery Low"
          : "Battery Full";
  const getSignalStatus = (v: number) =>
    v == 0 ? "No Signal"
      : v == 1 ? "Unknown Signal"
        : v == 2 ? "Very Poor Signal"
          : v == 3 ? "Poor Signal"
            : v == 4 ? "Fair Signal"
              : "Good Signal";
  const getArmedStatus = (v: number) => v == 0 ? "Connected" : "Disconnected";

  // Color helpers (Slightly Lightened Dark Theme)

  const getMainColor = (v: number) => v == 1 ? "#A94442" : "#3C763D"; // Medium Red, Medium Green
  const getMainTextColor = (v: number) => "#FFFFFF";
  const getMainIcon = (v: number) => v == 1 ? "fa fa-power-off" : "fa fa-bolt";

  const getSolarColor = (v: number) => v == 0 ? "#666666" : "#FF9933"; // Medium Gray, Medium Orange
  const getSolarTextColor = (v: number) => "#FFFFFF";
  const getSolarIcon = (v: number) => v == 0 ? "fa fa-cloud" : "fa fa-sun-o";

  const getBatteryColor = (v: number) =>
    v == 0 ? "#666666"        // Medium Gray
      : v == 1 ? "#E6B800"      // Medium Yellow
        : v == 2 ? "#D9534F"      // Medium Red
          : "#5CB85C";               // Medium Green
  const getBatteryTextColor = (v: number) => "#FFFFFF";
  const getBatteryIcon = (v: number) =>
    v == 0 ? "fa fa-battery-empty"
      : v == 1 ? "fa fa-battery-half"
        : v == 2 ? "fa fa-battery-quarter"
          : "fa fa-battery-full";

  const getSignalColor = (v: number) =>
    v == 0 ? "#666666"        // Medium Gray
      : v == 1 ? "#D58512"      // Medium Brown-Orange
        : v == 2 ? "#C9302C"      // Medium Red
          : v == 3 ? "#E6B800"      // Yellow
            : v == 4 ? "#31B0D5"      // Light Blue
              : "#5CB85C";               // Medium Green
  const getSignalTextColor = (v: number) => "#FFFFFF";
  const getSignalIcon = (v: number) =>
    // v == 0 ? "fa fa-ban"
    v == 0 ? "fa fa-signal"
      : v == 1 ? "fa fa-question-circle"
        : "fa fa-signal";

  const getArmedColor = (v: number) => v == 0 ? "#5CB85C" : "#C9302C"; // Medium Green, Medium Red
  const getArmedTextColor = (v: number) => "#FFFFFF";
  const getArmedIcon = (v: number) => v == 0 ? "fa fa-shield" : "fa fa-shield-alt";

  const getSyncColor = () => "#337AB7"; // Medium Blue
  const getSyncTextColor = () => "#FFFFFF";
  const getSyncIcon = () => "fa fa-refresh";


  const parseZoneValues = (zoneValues: string[] = []) => {
    return zoneValues.map((str, idx) => {

      const parts = str.split(':').map(s => s.trim());
      return {
        serial: idx + 1,
        device: parts[0] || '',
        alertType: parts[1] || '',
        status: (parts[2] || '').toUpperCase(),
      };
    });
  };


  const getZoneStatusIcon = (status: string) => {
    if (status == 'N') {

      return (
        <span title="Normal" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    }
    if (status == 'A') {

      return (
        <span title="Alarmed" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </span>
      );
    }

    return (
      <span title="Not Working" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());

    if (hours === '00' && mins === '00' && secs === '00') {
      return `${day}/${month}/${year}`;
    }
    return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  };

  // Export to Excel (with enhanced header, font size, status color, alternate row color, heading and date)
  const handleExportExcel = () => {
    const now = new Date();
    const dateStr = now.toLocaleString();

    // Prepare export data with colored status
    const exportData = filteredBranches.map((branch, idx) => ({
      'S.No': idx + 1,
      'Site Name': branch.branchDesc,
      'Controlling Office': branch.createdBy,
      'Contact No.': branch.mobile,
      'Address': toTitleCase(getFullAddress(branch)),
      'Status': branch.status,
    }));

    // Add heading and date row
    const heading = [["Site Details"]];
    const dateRow = [[`Downloaded at: ${dateStr}`]];
    const header = ["S.No", "Site Name", "Controlling Office", "Contact No.", "Address", "Status"];

    // SheetJS does not support rich text or per-cell font size/color in community edition,
    // but we can style header, alternate rows, and status cell background.
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, heading, { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, dateRow, { origin: "A2" });
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A4" });
    XLSX.utils.sheet_add_json(ws, exportData, { origin: "A5", skipHeader: true });

    // Set column widths for better appearance
    ws['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 24 },  // Site Name
      { wch: 16 },  // Controlling Office
      { wch: 16 },  // Contact No.
      { wch: 36 },
      { wch: 12 },
    ];

    // Style heading (A1) with blue background, white text, bold, large font
    ws['A1'].s = {
      font: { bold: true, sz: 20, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F509A" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

    // Style date row (A2) with yellow background, black text, italic
    ws['A2'].s = {
      font: { italic: true, sz: 13, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "FFF200" } },
      alignment: { horizontal: "left", vertical: "center" }
    };
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });

    // Style header row (A4:F4) with black background, white bold text, center
    for (let C = 0; C < header.length; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: 3, c: C })];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 15, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "000000" } },
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

    // Style data rows (starting from row 5, i.e., r=4)
    for (let R = 0; R < exportData.length; ++R) {
      const excelRow = R + 4;
      // Alternate row color
      const fillColor = excelRow % 2 === 0 ? "FFFFFF" : "F5F5F5";
      for (let C = 0; C < header.length; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: excelRow, c: C })];
        if (cell) {
          cell.s = {
            font: { sz: 13, color: { rgb: "222222" } },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          };
        }
      }
      // Status cell color (Active: green, Inactive: red)
      const statusCell = ws[XLSX.utils.encode_cell({ r: excelRow, c: 5 })];
      if (statusCell) {
        statusCell.s = {
          ...statusCell.s,
          font: { ...statusCell.s.font, bold: true, color: { rgb: exportData[R]['Status'] === 'Active' ? "008000" : "C00000" } }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Branches');
    XLSX.writeFile(wb, 'branches.xlsx', { cellStyles: true });
  };

  // Export to PDF (with header styling)
  const handleExportPDF = () => {
    const logoImg = new Image();
    logoImg.src = `${window.location.origin}/Digitals45.jpg`;

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
      doc.text('Site Details', 700, 50, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        'ABOUT: Site Details provides an overview of all sites, including their codes, contact numbers, addresses, and status. This helps in managing and monitoring all branches efficiently.',
        40, 110,
        { maxWidth: 760 }
      );

      // Subtitle
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();

      doc.setFontSize(13);
      doc.setFillColor(255, 255, 255);
      doc.rect(40, 140, 760, 28, 'F');
      doc.setTextColor(128, 128, 128);
      doc.text(`DI-HMS : Site Details - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

      // Prepare Table
      const headers = [["S.No", "Site Name", "Controlling Office", "Contact No.", "Address", "Status"]];
      const rows = filteredBranches.map((branch, idx) => [
        idx + 1,
        branch.branchDesc,
        branch.createdBy,
        branch.mobile,
        toTitleCase(getFullAddress(branch)),
        branch.status,
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
          2: { halign: 'left' },
          3: { halign: 'left' },
          4: { halign: 'left' },
          5: { halign: 'center' },
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'Active') {
              data.cell.styles.textColor = [0, 128, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'Inactive') {
              data.cell.styles.textColor = [178, 34, 34];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
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

      doc.save('branches.pdf');
    };
  };

  // Store initial data for reset
  const [initialBranches, setInitialBranches] = useState<BranchData[]>([]);

  // Fetch all data for table on first load (when no zone is selected)
  useEffect(() => {
    if (!selectedZone) {
      setLoading(true);
      fetch(`${API_BASE_URL}/getAllChildren?branchCode=${branchCode}`)
        .then(res => res.json())
        .then(data => {
          if (data?.payload) {
            setBranches(data.payload);
            setInitialBranches(data.payload); 
            
          } else {
            setBranches([]);
            setInitialBranches([]);
          }
        })
        .catch(() => {
          setBranches([]);
          setInitialBranches([]);
        })
        .finally(() => setLoading(false));
    }
  }, [branchCode, selectedZone]);

  // --- NEW: derive select options for react-select ---
  const zoneOptions: Option[] = zones.map(z => ({ value: z.branchCode, label: `${z.branchDesc} → ${z.branchCode}` }));
  const branchSelectOptions: Option[] = branchOptions.map(b => ({ value: b.branchCode, label: `${b.branchDesc} → ${b.branchCode}` }));
  const statusOptions: Option[] = [{ value: '', label: 'All Status' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];

  // --- NEW: portal target & styles so menus float above table / overflow containers ---
  const selectPortalTarget = typeof document !== 'undefined' ? document.body : null;
  const selectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({ ...base, zIndex: 9999 }),
  };

  // Helpers to get selected option object from value (used as value prop for react-select)
  const getZoneSelectedOption = (): Option | null => zoneOptions.find(o => o.value === selectedZone) || null;
  const getBranchSelectedOption = (): Option | null => branchSelectOptions.find(o => o.value === selectedBranch) || null;
  const getStatusSelectedOption = (): Option | null => statusOptions.find(o => o.value === selectedStatus) || null;

  return (
    <div className="bg-white rounded-md border  mb-2">
      <div className="p-2 bg-gray-600 text-white font-medium flex items-center justify-between">
        <span>Site Details</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-3 py-1 rounded bg-red-200 text-red-700 hover:bg-red-300 transition-all border border-red-700 shadow-sm text-xs md:text-sm font-bold"
            title="Download as PDF"
          >

            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1 rounded bg-green-200 text-green-700 hover:bg-green-300 transition-all border border-green-700 shadow-sm text-xs md:text-sm font-bold"
            title="Download as Excel"
          >

            Excel
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1 rounded bg-white text-gray-700 hover:bg-blue-100 transition-all border border-gray-300 shadow-sm text-xs md:text-sm"
            onClick={() => setShowFilters(v => !v)}
          >
           <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-2-1A1 1 0 009 18v-4.586a1 1 0 00-.293-.707L2.293 6.707A1 1 0 012 6V4z" />
            </svg>
            <span className="font-semibold">Filter</span>
          </button>
        </div>
      </div>
      <div className="p-3">
        {/* Animated Filter Section */}
        <div
          className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}
        >
          <div className="flex flex-row flex-wrap gap-4 items-end bg-gray-50 rounded-md p-4 shadow-inner">
            {/* Controlling Office Dropdown */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Controlling Office</label>

              {/* REPLACED: native select with react-select */}
              <Select
                options={zoneOptions}
                value={getZoneSelectedOption()}
                onChange={handleZoneChange}
                isClearable
                isSearchable
                placeholder="Select Controlling Office"
                classNamePrefix="react-select"
                menuPortalTarget={selectPortalTarget}        // <-- added
                menuPosition="fixed"                         // <-- added
                styles={selectStyles}                        // <-- added
              />
            </div>

            {/* Branch Dropdown */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Site</label>

              {/* REPLACED: native select with react-select */}
              <Select
                options={branchSelectOptions}
                value={getBranchSelectedOption()}
                onChange={handleBranchSelectChange}
                isClearable
                isSearchable
                placeholder={branchLoading ? 'Loading...' : 'All Sites'}
                isDisabled={branchDisabled || !selectedZone}
                classNamePrefix="react-select"
                menuPortalTarget={selectPortalTarget}        // <-- added
                menuPosition="fixed"                         // <-- added
                styles={selectStyles}                        // <-- added
              />
            </div>

            {/* Status Dropdown */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Status</label>

              {/* REPLACED: native select with react-select */}
              <Select
                options={statusOptions.filter(o => o.value !== '')}
                value={getStatusSelectedOption() && getStatusSelectedOption()!.value ? getStatusSelectedOption() : null}
                onChange={handleStatusSelectChange}
                isClearable
                isSearchable={false}
                placeholder="All Status"
                classNamePrefix="react-select"
                menuPortalTarget={selectPortalTarget}        // <-- added
                menuPosition="fixed"                         // <-- added
                styles={selectStyles}                        // <-- added
              />
            </div>

            <div className="flex-1 flex justify-end items-end min-w-[150px]">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedZone('');
                    setSelectedBranch('');
                    setSelectedStatus('');
                    setBranches(initialBranches); // Restore initial data
                  }}
                  className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-1 rounded text-sm font-semibold shadow transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full border  rounded-lg shadow bg-white table-fixed border-separate" style={{ borderSpacing: 0 }}>
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="text-nowrap">
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">S.No</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Site Name</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Controlling Office</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Contact No.</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Address</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <span className="text-blue-600 font-medium animate-pulse">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">No branches found</td>
                </tr>
              ) : (
                filteredBranches.map((branch, index) => [
                  <tr
                    key={branch.branchCode}
                    ref={el => { rowRefs.current[branch.branchCode] = el; }}
                    className={branch.branchDesc === 'DI NOIDA BRANCH' ? 'bg-green-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleAccordionToggle(branch.branchCode)}
                    title={expandedBranch === branch.branchCode ? 'Hide Details' : 'Show Details'}
                  >
                    <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">
                      <span className="mr-2 text-blue-600">
                        {expandedBranch === branch.branchCode ? (
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        )}
                      </span>
                      {index + 1}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">{branch.branchDesc}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">{branch.createdBy}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">{branch.mobile}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">
                      {/* Address in Title Case */}
                      {toTitleCase(getFullAddress(branch))}
                    </td>
                    <td className="px-2 py-2 text-sm border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {branch.status === 'Active' ? (
                          <span title="Active" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        ) : (
                          <span title="Inactive" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                              <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </span>
                        )}
                        <span className={branch.status === 'Active' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                          {branch.status}
                        </span>
                      </div>
                    </td>
                  </tr>,
                  expandedBranch === branch.branchCode && (
                    <tr key={branch.branchCode + '-details'}>
                      <td colSpan={6} className="bg-gray-200 p-3 border-b border-blue-200">
                        {alertLoading[branch.branchCode] ? (
                          <div className="text-blue-600">Loading alert details...</div>
                        ) : alertData[branch.branchCode] ? (
                          <>
                            <div style={{
                              marginTop: 0,
                              padding: 10,
                              backgroundColor: "#FBFBFB",
                              border: "1px solid #ccc",
                              borderRadius: 5,
                            }}>
                              <h6 style={{ color: "#1F509A", marginBottom: 15 }} className='font-semibold'>
                                Health of Smart Communicator : {alertData[branch.branchCode].panelSerialNo}
                              </h6>

                              {/* 🔹 First Row: Status Boxes (Centered + Scrollable + Responsive) */}
                              <div
                                style={{
                                  display: "flex",
                                  overflowX: "auto",
                                  marginBottom: 15,
                                  paddingBottom: 5,
                                  justifyContent: "center",
                                  width: "100%",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 10,
                                    flexWrap: "nowrap",
                                    minWidth: "fit-content",
                                    justifyContent: "flex-start",
                                    fontSize: "clamp(12px, 1vw, 12px)",
                                    fontWeight: 700,
                                  }}
                                >
                                  {/* Sync Time */}
                                  <div
                                    style={{
                                      flex: "0 0 auto",
                                      minWidth: 130,
                                      backgroundColor: getSyncColor(),
                                      color: getSyncTextColor(),
                                      padding: "5px 10px",
                                      borderRadius: 5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                    }}
                                  >
                                    <i className={getSyncIcon()} aria-hidden="true" />
                                    <strong>Sync Time:</strong>{" "}
                                    {formatDate(
                                      alertData[branch.branchCode].dateTimes ||
                                      alertData[branch.branchCode].dateTime
                                    )}
                                  </div>
                                  {/* Main */}
                                  <div
                                    style={{
                                      flex: "0 0 auto",
                                      minWidth: 130,
                                      backgroundColor: getMainColor(Number(alertData[branch.branchCode].main)),
                                      color: getMainTextColor(Number(alertData[branch.branchCode].main)),
                                      padding: "5px 10px",
                                      borderRadius: 5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                    }}
                                  >
                                    <i className={getMainIcon(Number(alertData[branch.branchCode].main))} aria-hidden="true" />
                                    <strong>Main:</strong> {getMainStatus(Number(alertData[branch.branchCode].main))}
                                  </div>
                                  {/* Solar */}
                                  {/* <div
                                    style={{
                                      flex: "0 0 auto",
                                      minWidth: 130,
                                      backgroundColor: getSolarColor(Number(alertData[branch.branchCode].solar)),
                                      color: getSolarTextColor(Number(alertData[branch.branchCode].solar)),
                                      padding: "5px 10px",
                                      borderRadius: 5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                    }}
                                  >
                                    <i className={getSolarIcon(Number(alertData[branch.branchCode].solar))} aria-hidden="true" />
                                    <strong>Solar:</strong> {getSolarStatus(Number(alertData[branch.branchCode].solar))}
                                  </div> */}
                                  {/* Battery */}
                                  <div
                                    style={{
                                      flex: "0 0 auto",
                                      minWidth: 130,
                                      backgroundColor: getBatteryColor(Number(alertData[branch.branchCode].battery)),
                                      color: getBatteryTextColor(Number(alertData[branch.branchCode].battery)),
                                      padding: "5px 10px",
                                      borderRadius: 5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                    }}
                                  >
                                    <i className={getBatteryIcon(Number(alertData[branch.branchCode].battery))} aria-hidden="true" />
                                    <strong>Battery Voltage:</strong> 
                                    {/* {getBatteryStatus(Number(alertData[branch.branchCode].battery))} */}
                                    <span style={{ fontWeight: 700, fontSize: 12, marginLeft: 2 }}>
                                       {alertData[branch.branchCode].battery_VOLTAGE ?? "N/A"}
                                    </span>
                                  </div>
                                  {/* Signal */}
                                  <div
                                    style={{
                                      flex: "0 0 auto",
                                      minWidth: 130,
                                      backgroundColor: getSignalColor(Number(alertData[branch.branchCode].signalFlag)),
                                      color: getSignalTextColor(Number(alertData[branch.branchCode].signalFlag)),
                                      padding: "5px 10px",
                                      borderRadius: 5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                    }}
                                  >
                                    <i className={getSignalIcon(Number(alertData[branch.branchCode].signalFlag))} aria-hidden="true" />
                                    <strong>Signal:</strong> 
                                    {/* {getSignalStatus(Number(alertData[branch.branchCode].signalFlag))} */}
                                    <span style={{ fontWeight: 700, fontSize: 12, marginLeft: 2 }}>
                                      {alertData[branch.branchCode].gsm_SIGNAL ?? "N/A"}
                                    </span>
                                  </div>
                                  {/* Armed */}
                                  {/* <div
                                    style={{
                                      flex: "0 0 auto",
                                      minWidth: 130,
                                      backgroundColor: getArmedColor(Number(alertData[branch.branchCode].armed)),
                                      color: getArmedTextColor(Number(alertData[branch.branchCode].armed)),
                                      padding: "5px 10px",
                                      borderRadius: 5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                    }}
                                  >
                                    <i className={getArmedIcon(Number(alertData[branch.branchCode].armed))} aria-hidden="true" />
                                    <strong>Status:</strong> {getArmedStatus(Number(alertData[branch.branchCode].armed))}
                                  </div> */}
                                </div>
                              </div>

                             {/* 🔹 Second Row: ADC Boxes (Responsive + Heading from API) */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  }}
>
  {["adc1", "adc2", "adc3"].map((adcKey, idx) => {
    const rawValue = alertData[branch.branchCode][adcKey] ?? "N/A";
    const [value, label] = rawValue !== "N/A" ? rawValue.split(",") : ["N/A", adcKey.toUpperCase()];

    return (
      <div
        key={idx}
        style={{
          backgroundColor: "#E0E7FF",
          color: "#1E40AF",
          padding: "5px 10px",
          borderRadius: 5,
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: "clamp(12px, 1vw, 12px)",
          minWidth: 100,
        }}
      >
        <i className="fa fa-tachometer" aria-hidden="true" />
        <strong>{label}:</strong> {value} <strong>DC</strong>
      </div>
    );
  })}
</div>


                            </div>

                            {/* --- ZONE TABLE --- */}
                            <div className="w-full overflow-x-auto mt-3">
                              <div style={{ maxHeight: 5 * 42 + 2, overflowY: 'auto' }}>
                                <table className="min-w-full border  rounded-lg shadow bg-white table-fixed border-separate" style={{ borderSpacing: 0 }}>
                                  <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider w-12">S.No</th>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Device Name</th>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Alert Type</th>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b  tracking-wider">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* Debug output */}
                                    {/* <tr><td colSpan={4}><pre>{JSON.stringify(alertData[branch.branchCode].zoneValues)}</pre></td></tr> */}
                                    {Array.isArray(alertData[branch.branchCode].zoneValues) && alertData[branch.branchCode].zoneValues.length > 0 ? (
                                      parseZoneValues(alertData[branch.branchCode].zoneValues)
                                        .slice(0, alertData[branch.branchCode].zoneValues.length) // show all, but scroll will limit visible
                                        .map((row, idx) => (
                                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-2 py-2 text-sm border-b border-gray-100 border-r text-right ">{row.serial}</td>
                                            <td className="px-2 py-2 text-sm border-b border-gray-100 border-r ">{row.device}</td>
                                            <td className="px-2 py-2 text-sm border-b border-gray-100 border-r ">{row.alertType}</td>
                                            <td className="px-2 py-2 text-sm border-b border-gray-100 text-center">
                                              {getZoneStatusIcon(row.status)}
                                            </td>
                                          </tr>
                                        ))
                                    ) : (
                                      <tr>
                                        <td colSpan={4} className="text-center text-gray-500 py-2">
                                          No zone data available.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-red-600 text-center">No Alert Data Found for this Branch.</div>
                        )}
                      </td>
                    </tr>
                  )
                ])
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default BranchTable;

