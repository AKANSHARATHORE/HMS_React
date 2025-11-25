import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select';
import { API_BASE_URL } from "@/config/api";

const AlertReports = () => {
  const [branches, setBranches] = useState([]);
  const [zoneNames, setZoneNames] = useState([]);
  const [alertTypes, setAlertTypes] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [zoneName, setZoneName] = useState(null);
  const [alertType, setAlertType] = useState(null);
  const [deviceType, setDeviceType] = useState(null);

  // Holds the current page data (either default listing or search results page)
  const [defaultData, setDefaultData] = useState([]);

  // Search mode: when true we are showing server-side filtered results
  const [searchActive, setSearchActive] = useState(false);
  // Stored filters for server-side search so paging can re-use them
  type SearchFilters = {
    branchCode?: string;
    zoneDesiredName?: string;
    alertType?: string;
    fromDate?: string;
    toDate?: string;
  };
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 10;
  const branchCode = sessionStorage.getItem('branch');

  // Head Office filter state
  const [headOffices, setHeadOffices] = useState([]);
  const [selectedHead, setSelectedHead] = useState(null);
  const [headDisabled, setHeadDisabled] = useState(false);

  // Zone filter state
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDisabled, setZoneDisabled] = useState(true);

  // Branch filter state
  const [branchDisabled, setBranchDisabled] = useState(true);

  // Add loading states for dependent dropdowns
  const [zoneLoading, setZoneLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);

  //const { refreshKey } = useDashboardRefresh();
  
  // Fetch branches when Zone changes
  useEffect(() => {
    if (!selectedZone) {
      setBranches([]);
      setBranchDisabled(true);
      setSelectedBranch(null);
      return;
    }
    const getBranches = async () => {
      try {
        const url = `${API_BASE_URL}/getAllBranchesAndDevicesbyBranchCode?branchCode=${selectedZone.value}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        const data = result.payload || [];
        if (data && data.length > 0) {
          const mappedBranches = data.map(b => ({ value: b.branchCode, label: b.branchName }));
          setBranches(mappedBranches);
          setBranchDisabled(false);
          setSelectedBranch(mappedBranches[0]);
        } else {
          setBranches([]);
          setBranchDisabled(true);
          setSelectedBranch(null);
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch(null);
      }
    };
    getBranches();
    // eslint-disable-next-line
  }, [selectedZone]);

  // Helper to convert string to Title Case
  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  // Helper to format date to dd/mm/yyyy (with time if present)
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
    // If time is 00:00:00, just show date
    if (hours === '00' && mins === '00' && secs === '00') {
      return `${day}/${month}/${year}`;
    }
    return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  };

  // Helper to get date string in yyyy-mm-dd format
  const getDateNDaysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  // Helper to get today's date in yyyy-mm-dd format
  const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  // Set default fromDate to 2 days ago, toDate to today
  const [fromDate, setFromDate] = useState(getDateNDaysAgo(2));
  const [toDate, setToDate] = useState(getTodayDate());

  useEffect(() => {
    setBranches([]);
    fetchAlerts(0);
  }, []);

  useEffect(() => {
    // When page changes, either fetch default data or fetch the server-side search results page
    if (searchActive) {
      // fetch the same search with new page
      performSearchPage(page);
    } else {
      fetchAlerts(page);
    }
    // eslint-disable-next-line
  }, [page, searchActive]);

  // Helper to fetch a specific page of server-side search results using stored filters
  const performSearchPage = async (pageNum: number) => {
    setLoading(true);
    try {
      const branchCodeParam = selectedBranch?.value || selectedHead?.value || branchCode;
      const zoneDesiredName = zoneName?.value || undefined;
      const alertTypeVal = alertType?.value || undefined;
      const res = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
        params: {
          branchCode: branchCodeParam,
          page: pageNum,
          size: pageSize,
          zoneDesiredName,
          alertType: alertTypeVal,
          fromDate: searchFilters.fromDate || undefined,
          toDate: searchFilters.toDate || undefined
        }
      });
      setDefaultData(res.data.payload || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching search page:', err);
      setDefaultData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Track if head office was fetched from getAllChildren
  const [headOfficeFromChildren, setHeadOfficeFromChildren] = useState(false);
  const [defaultParentCode, setDefaultParentCode] = useState<string | null>(null);

  // Fetch Head Offices for filter
  useEffect(() => {
    const getHeadBranch = async () => {
      try {
        let url = `${API_BASE_URL}/getHeadOfficeByBranchCode?branchCode=${branchCode}`;
        let response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        let result = await response.json();
        let data = result.payload || [];
        if (!data || data.length === 0) {
          const childUrl = `${API_BASE_URL}/getAllChildren?branchCode=${branchCode}`;
          const childRes = await fetch(childUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          const childData = await childRes.json();
          if (
            childData.payload &&
            Array.isArray(childData.payload) &&
            childData.payload.length > 0 &&
            childData.payload[0].parentCode
          ) {
            const parentCode = childData.payload[0].parentCode;
            if (parentCode) {
              url = `${API_BASE_URL}/getHeadOfficeByBranchCode?branchCode=${parentCode}`;
              response = await fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                }
              });
              result = await response.json();
              data = result.payload || [];
              setHeadOfficeFromChildren(true);
              setDefaultParentCode(parentCode);
              setSelectedHead({ value: parentCode, label: parentCode });
            } else {
              setHeadOfficeFromChildren(false);
              setDefaultParentCode(null);
            }
          } else {
            setHeadOfficeFromChildren(false);
            setDefaultParentCode(null);
          }
        } else {
          setHeadOfficeFromChildren(false);
          setDefaultParentCode(null);
        }
        if (data && data.length > 0) {
          const filtered = data.filter(
            (branch) => branch.branchType === 'HEAD OFFICE'
          );
          const mappedHeads = filtered.map(h => ({ value: h.branchCode, label: h.branchDesc }));
          setHeadOffices(mappedHeads);
          setHeadDisabled(mappedHeads.length === 0);
        } else {
          setHeadDisabled(true);
        }
      } catch (err) {
        console.error('Error fetching head offices:', err);
        setHeadOfficeFromChildren(false);
        setDefaultParentCode(null);
      }
    };
    getHeadBranch();
  }, []);
  
  // Fetch Zones when Head Office changes
  useEffect(() => {
    if (!selectedHead) {
      setZones([]);
      setZoneDisabled(true);
      setSelectedZone(null);
      setBranches([]);
      setBranchDisabled(true);
      setSelectedBranch(null);
      return;
    }
    const getZones = async () => {
      setZoneLoading(true);
      try {
        const url = `${API_BASE_URL}/getAllZonesByBranchCode?branchCode=${selectedHead.value}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        let data = result.payload || [];
        if (headOfficeFromChildren && data.length > 1) {
          data = data.filter((zone) => zone.branchCode === branchCode);
        }
        const mappedZones = data.map(z => ({ value: z.branchCode, label: z.branchDesc }));
        setZones(mappedZones);
        setZoneDisabled(!mappedZones.length);
        setSelectedZone(null);
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch(null);
      } catch (err) {
        console.error('Error fetching zones:', err);
        alert('Error loading zones. Please try again.');
        setZones([]);
        setZoneDisabled(true);
        setSelectedZone(null);
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch(null);
      } finally {
        setZoneLoading(false);
      }
    };
    getZones();
    // eslint-disable-next-line
  }, [selectedHead, branchCode, headOfficeFromChildren]);

  const handleHeadChange = (option) => {
    setSelectedHead(option);
    setSelectedZone(null);
    setZones([]);
    setZoneDisabled(true);
    setSelectedBranch(null);
    setBranches([]);
    setBranchDisabled(true);
    setZoneName(null);
    setAlertType(null);
    setDeviceType(null);
    setSearchActive(false);
    setSearchFilters({});
    setPage(0);
  };

  const handleZoneChange = (option) => {
    setSelectedZone(option);
    setZoneName(null);
    setAlertType(null);
    setDeviceType(null);
    setSearchActive(false);
    setSearchFilters({});
    setPage(0);
  };

  useEffect(() => {
    if (!selectedZone) {
      setBranches([]);
      setBranchDisabled(true);
      setSelectedBranch(null);
      return;
    }
    setBranchLoading(true);
    setBranchDisabled(true);
    const getBranches = async () => {
      try {
        const url = `${API_BASE_URL}/getAllBranchesAndDevicesbyBranchCode?branchCode=${selectedZone.value}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        const data = result.payload || [];
        const mappedBranches = data.map(b => ({ value: b.branchCode, label: b.branchName }));
        setBranches(mappedBranches);
        setBranchDisabled(!mappedBranches.length);
        setSelectedBranch(null);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch(null);
      } finally {
        setBranchLoading(false);
      }
    };
    getBranches();
    // eslint-disable-next-line
  }, [selectedZone]);

  const handleBranchChange = async (option) => {
    setSelectedBranch(option);
    setZoneName(null);
    setAlertType(null);
    setSearchActive(false);
    setSearchFilters({});
    setPage(0);
    if (!option) {
      await fetchAlerts(0);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/getAllDeviceZoneNameByBranchCode`, {
        params: { branchCode: option.value }
      });
      const payload = res.data.payload;
      if (payload?.zoneList?.length) {
        const zoneSet = new Set();
        const alertTypeSet = new Set();
        payload.zoneList.forEach(zone => {
          if (zone.zoneDesiredName) zoneSet.add(zone.zoneDesiredName);
          if (zone.alertType) alertTypeSet.add(zone.alertType);
        });
        setZoneNames(Array.from(zoneSet).map(z => ({ value: z, label: z })));
        setAlertTypes(Array.from(alertTypeSet).map(a => ({ value: a, label: a })));
      }
    } catch (err) {
      console.error('Error fetching zone info:', err);
    }
  };

  const fetchAlerts = async (pageNum) => {
    setLoading(true);
    try {
      const codeToUse = selectedBranch?.value || selectedHead?.value || branchCode;
      const today = getTodayDate();
      const twoDaysAgo = getDateNDaysAgo(2);
      const res = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
        params: {
          branchCode: codeToUse,
          page: pageNum,
          size: pageSize,
          fromDate: twoDaysAgo,
          toDate: today
        }
      });
      setDefaultData(res.data.payload || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching alert data:', error);
      setDefaultData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch?.value || selectedHead?.value || branchCode;

      const filters = {
        branchCode: branchParam,
        zoneDesiredName: zoneName?.value || undefined,
        alertType: alertType?.value || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      };

      setSearchFilters(filters);
      setSearchActive(true);
      setPage(0);

      const res = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
        params: {
          ...filters,
          page: 0,
          size: pageSize
        }
      });

      setDefaultData(res.data.payload || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Error searching data:', err);
      setDefaultData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  // Refactor handleReset for full reset and smooth data reload
  const handleReset = async () => {
    setLoading(true);
    try {
      // First, fetch the default data
      const codeToUse = branchCode;
      const today = getTodayDate();
      const twoDaysAgo = getDateNDaysAgo(2);
      const res = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
        params: {
          branchCode: codeToUse,
          page: 0,
          size: pageSize,
          fromDate: twoDaysAgo,
          toDate: today
        }
      });

  // Then, reset all states including the data states
      setSelectedHead(null);
      setZones([]);
      setZoneDisabled(true);
      setSelectedZone(null);
      setBranches([]);
      setBranchDisabled(true);
      setSelectedBranch(null);
      setZoneName(null);
      setAlertType(null);
      setDeviceType(null);
      setFromDate(twoDaysAgo);
      setToDate(today);
  // exit search mode and reset filters
  setSearchActive(false);
  setSearchFilters({});
  setPage(0);
      setZoneNames([]);
      setAlertTypes([]);
      
      // Finally, update the data states
      setDefaultData(res.data.payload || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error resetting data:', error);
      setDefaultData([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel (with enhanced styling)
  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleString();

      // Determine params: if search is active, reuse searchFilters, otherwise use current selected filters
      const sizeForExcel = 1000; // Use 1000 only for Excel export

      const baseParams: any = {};
      if (searchActive && searchFilters && Object.keys(searchFilters).length) {
        Object.assign(baseParams, searchFilters);
      } else {
        const branchParam = selectedBranch || selectedHead || branchCode;
        baseParams.branchCode = branchParam;
        // include date range if set
        if (fromDate) baseParams.fromDate = fromDate;
        if (toDate) baseParams.toDate = toDate;
      }

      // Fetch first page (page 0) with large size, then fetch additional pages if totalPages > 1
      const firstRes = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
        params: { ...baseParams, page: 0, size: sizeForExcel }
      });
      const allData: any[] = firstRes.data.payload || [];
      const totalPagesForExport = firstRes.data.totalPages || 1;

      for (let p = 1; p < totalPagesForExport; p++) {
        const res = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
          params: { ...baseParams, page: p, size: sizeForExcel }
        });
        const payload = res.data.payload || [];
        allData.push(...payload);
      }

      const exportData = allData.map((alert, idx) => ({
        'S.No': idx + 1,
        'Site Code': alert.ifsc,
        'Site Address': toTitleCase(alert.address || ''),
        'System Integrator': alert.vendorName || '-',
        'Product Name': alert.zoneDesiredName,
        'Alert Type': alert.alertType,
        'Time Stamp': alert.timeStamp ? formatDate(alert.timeStamp) : '',
      }));

      const heading = [["Alert Reports"]];
      const dateRow = [[`Downloaded at: ${dateStr}`]];
      const header = ["S.No", "Site Code", "Site Address", "Device Type", "System Integrator", "Product Name", "Alert Type", "Time Stamp"];

      const ws = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.sheet_add_aoa(ws, heading, { origin: "A1" });
      XLSX.utils.sheet_add_aoa(ws, dateRow, { origin: "A2" });
      XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A4" });
      XLSX.utils.sheet_add_json(ws, exportData, { origin: "A5", skipHeader: true });

      ws['!cols'] = [
        { wch: 6 },   // S.No
        { wch: 16 },  // Branch Code
        { wch: 32 },  // Branch Address
        { wch: 16 },  // Device Type
        { wch: 22 },  // Service Integrator
        { wch: 18 },  // Product Name
        { wch: 16 },  // Alert Type
        { wch: 22 },  // Time Stamp
      ];

      // Heading (A1): blue bg, white, bold, large
      ws['A1'].s = {
        font: { bold: true, sz: 20, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1F509A" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

      // Date row (A2): yellow bg, black, italic
      ws['A2'].s = {
        font: { italic: true, sz: 13, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: "FFF200" } },
        alignment: { horizontal: "left", vertical: "center" }
      };
      ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } });

      // Header row (A4:H4): black bg, white, bold, center
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

      // Data rows (starting from row 5, i.e., r=4)
      for (let R = 0; R < exportData.length; ++R) {
        const excelRow = R + 4;
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
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AlertReports');
      XLSX.writeFile(wb, 'alert_reports.xlsx', { cellStyles: true });
    } catch (err) {
      console.error('Error exporting Excel:', err);
    } finally {
      setLoading(false);
    }
  };

   const handleExportPDF = async () => {
    setLoading(true);
    try {
      // Prepare params (reuse same logic as Excel export)
      const sizeForPdf = 1000;
      const baseParams: any = {};
      if (searchActive && searchFilters && Object.keys(searchFilters).length) {
        Object.assign(baseParams, searchFilters);
      } else {
        const branchParam = selectedBranch || selectedHead || branchCode;
        baseParams.branchCode = branchParam;
        if (fromDate) baseParams.fromDate = fromDate;
        if (toDate) baseParams.toDate = toDate;
      }

      // Fetch first page
      const firstRes = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
        params: { ...baseParams, page: 0, size: sizeForPdf }
      });
      const allData: any[] = firstRes.data.payload || [];
      const totalPagesForExport = firstRes.data.totalPages || 1;

      // Fetch remaining pages if any
      for (let p = 1; p < totalPagesForExport; p++) {
        const res = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
          params: { ...baseParams, page: p, size: sizeForPdf }
        });
        const payload = res.data.payload || [];
        allData.push(...payload);
      }

      // Prepare PDF content
      const logoImg = new Image();
      logoImg.src = `${window.location.origin}/Digitals45.jpg`;

      const generatePdf = () => {
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: 'a4'
        });

        // Add logo if loaded
        try {
          if (logoImg && logoImg.naturalWidth) {
            doc.addImage(logoImg, 'JPEG', 40, 20, 120, 60);
          }
        } catch (e) {
          // ignore image errors
        }

        // Horizontal rule
        doc.setDrawColor(180);
        doc.line(40, 90, 800, 90);

        // Heading + About
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Alert Reports', 700, 50, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(
          'ABOUT: Alert Reports provide a detailed log of all alert events, including site code, address, System integrator, product, alert type, and timestamp. This report helps in analyzing and auditing alert history.',
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
        doc.text(`DI-HMS : Alert Reports - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

        // Prepare Table rows from full data
        const headers = [["S.No", "Site Code", "Site Address", "Service Integrator", "Product Name", "Alert Type", "Time Stamp"]];
        const rows = allData.map((alert, idx) => [
          idx + 1,
          alert.ifsc,
          toTitleCase(alert.address || ''),
          alert.vendorName || '-',
          alert.zoneDesiredName,
          alert.alertType,
          alert.timeStamp ? formatDate(alert.timeStamp) : '',
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
            5: { halign: 'left' },
            6: { halign: 'left' },
          },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          didDrawPage: function () {
            // Watermark
            try {
              doc.saveGraphicsState();
              doc.setGState(doc.GState({ opacity: 0.08 }));
              doc.setFontSize(100);
              doc.setTextColor(128, 128, 128);
              doc.text('Digitals India', 200, 450, { angle: 25 });
              doc.restoreGraphicsState();
            } catch (e) {
              // ignore watermark errors
            }

            // Footer
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Generated on: ${dateStr}`, 40, doc.internal.pageSize.height - 20);
            try {
              doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 20);
            } catch (e) {
              // ignore page number retrieval errors
            }
          }
        });

        doc.save('alert_reports.pdf');
      };

      // If image already loaded use it, otherwise wait for load (or error)
      if (logoImg.complete) generatePdf();
      else {
        logoImg.onload = generatePdf;
        logoImg.onerror = generatePdf;
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  // `defaultData` always contains the current page's data (either default listing or search results page)
  const paginatedData = defaultData || [];

  // Custom styles for react-select to float above table
  const customSelectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 mb-2">
      <div className="p-2 bg-gray-600 text-white font-medium flex items-center justify-between">
        <span>Alert Reports</span>
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
            {/* Head Office Dropdown */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Head Office</label>
              <Select
                value={defaultParentCode ? selectedHead : selectedHead}
                onChange={handleHeadChange}
                options={headOffices}
                isDisabled={headDisabled || !!defaultParentCode}
                placeholder="Select Head Office"
                isClearable
                classNamePrefix="react-select"
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </div>
            {/* Zone Dropdown */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Controlling Office</label>
              <Select
                value={selectedZone}
                onChange={handleZoneChange}
                options={zones}
                isDisabled={zoneDisabled || !selectedHead}
                placeholder={zoneLoading ? 'Loading...' : 'Select Office'}   
                isClearable
                isLoading={zoneLoading}
                classNamePrefix="react-select"
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </div>
            {/* Branch Dropdown */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Site</label>
              <Select
                value={selectedBranch}
                onChange={handleBranchChange}
                options={branches}
                isDisabled={branchDisabled || !selectedZone}
                placeholder={branchLoading ? 'Loading...' : 'All Sites'}
                isClearable
                isLoading={branchLoading}
                classNamePrefix="react-select"
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Product Name</label>
              <Select
                value={zoneName}
                onChange={(option) => setZoneName(option)}
                options={zoneNames}
                placeholder="All Products"
                isClearable
                classNamePrefix="react-select"
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Alert Type</label>
              <Select
                value={alertType}
                onChange={(option) => setAlertType(option)}
                options={alertTypes}
                placeholder="All Alert Types"
                isClearable
                classNamePrefix="react-select"
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
            {/* Buttons aligned right */}
            <div className="flex-1 flex justify-end items-end min-w-[180px]">
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded text-sm  font-semibold shadow transition"
                >
                  Search
                </button>
                <button
                  onClick={handleReset}
                  className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-1 rounded text-sm font-semibold shadow transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full lg:w overflow-x-auto" style={{ maxHeight: '450px', overflowY: 'auto' }}>
          <table className="min-w-full border border-gray-200 rounded-lg shadow bg-white table-fixed border-separate" style={{ borderSpacing: 0 }}>
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr  className="text-nowrap">
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">S.No</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Site Name</th>
                 <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Site Address</th>
                 {/* <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b border-gray-200 border-r border-gray-300 tracking-wider">Device Type</th> */}
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">System Integrator</th>       
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Product Name</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Alert Type</th>
                <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">Time Stamp</th>
                
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      <span className="text-blue-600 font-medium animate-pulse">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">No data found</td>
                </tr>
              ) : (
                paginatedData.map((alert, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">{page * pageSize + index + 1}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">
                      {alert.branchName || alert.branchCode || '-'}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">
                      {toTitleCase(alert.address || '')}
                    </td>
                     {/* <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">{alert.deviceType || '-'}</td> */}
                    <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">{alert.vendorName || '-'}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">{alert.zoneDesiredName}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">{alert.alertType}</td>
                    <td className="px-2 py-2 text-sm text-gray-900 border-b  border-r border-gray-200">
                      {alert.timeStamp ? formatDate(alert.timeStamp) : ''}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center mt-4 space-x-2">
          <button
            onClick={handlePrev}
            disabled={page === 0}
            className={`px-2 py-1 rounded border transition ${
              page === 0
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
            }`}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <button
            onClick={handleNext}
            disabled={page >= totalPages - 1}
            className={`px-2 py-1 rounded border transition ${
              page >= totalPages - 1
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};



export default AlertReports;
