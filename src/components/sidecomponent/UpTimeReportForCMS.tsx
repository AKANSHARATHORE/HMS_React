import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import {
  FileSpreadsheet,
  Printer,
  FileSignature,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { copyToClipboard, exportToExcel, exportToPDF } from './UptimeReportButton';
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";
import { Input } from '../ui/input';

const DEVICE_TYPES = ["CCTV", "SAS", "FAS", "ETL", "BACS"];
const DEVICE_TYPE_LABELS: Record<string, string> = {
  "SAS": "SAS/IAS",
};

// Helper to format date as 'YYYY-MM-DD'
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// NEW: format display date as 'DD/MM/YYYY'
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}

const UpTimeReportForCMS = () => {
  const [data, setData] = useState<any[]>([]); 
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1); 
    return formatDate(start);
  });
  const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()));

  // --- NEW: Filter states for Head Office / Zone / Branch / ZoneName (product) ---
  const [headOffices, setHeadOffices] = useState<any[]>([]);
  const [selectedHead, setSelectedHead] = useState<any | null>(null);
  const [headDisabled, setHeadDisabled] = useState(false);

  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [zoneDisabled, setZoneDisabled] = useState(true);

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [branchDisabled, setBranchDisabled] = useState(true);
  // --- NEW: show/hide filters ---
  const [showFilters, setShowFilters] = useState(false);
  // --------------------------------------------------------------------------

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [startDate, endDate, selectedHead, selectedZone, selectedBranch]);

  const fetchData = async () => {
    setLoading(true);
    // choose branch param from selectedBranch -> selectedZone -> selectedHead -> session
    const sessionBranch = sessionStorage.getItem("branch");
    let branchCodeToUse = null;
    if (selectedBranch?.value) {
      branchCodeToUse = selectedBranch.value;
    } else if (selectedZone?.value) {
      branchCodeToUse = selectedZone.value;
    } else if (selectedHead?.value) {
      branchCodeToUse = selectedHead.value;
    } else {
      branchCodeToUse = sessionBranch;
    }
    try {
      const params: any = { branchCode: branchCodeToUse, startDate, endDate };
      const res = await axios.get(`${API_BASE_URL}/getUptimeReportByDateRange`, {
        params
      });
      const apiData = res.data.payload || [];
      setData(apiData);

      // Group by branchName + IFSC
      const grouped: Record<string, any> = {};
      apiData.forEach((item: any) => {
        const branchKey = `${item.branchName}-${item.ifsc || "-"}`;
        if (!grouped[branchKey]) {
          grouped[branchKey] = {
            branchName: item.branchName,
            ifsc: item.ifsc || "-",
            devices: {},
          };
        }
        const normalizedType = normalizeDeviceType(item.deviceType);
        if (DEVICE_TYPES.includes(normalizedType)) {
          grouped[branchKey].devices[normalizedType] = item;
        }
      });
      setGroupedData(Object.values(grouped));
    } catch (err) {
      console.error("Error fetching data:", err);
      setGroupedData([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeDeviceType = (deviceType: string): string => {
    switch ((deviceType || "").toUpperCase()) {
      case "CCTV": return "CCTV";
      case "SECURITY ALARM": return "SAS";
      case "FIRE ALARM": return "FAS";
      case "ETL": return "ETL";
      case "BACS": return "BACS";
      default: return (deviceType || "").toUpperCase();
    }
  };

  const getUptimeValue = (device: any): string => {
    return device && device.uptime ? `${device.uptime}` : "-";
  };

  const filteredData = groupedData.filter((user) =>
    [user.branchName, user.ifsc, ...Object.values(user.devices)]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleExcelExport = () => {
    exportToExcel(groupedData, DEVICE_TYPES, getUptimeValue, startDate, endDate);
  };

  const handlePDFExport = () => {
    exportToPDF(groupedData, DEVICE_TYPES, getUptimeValue, startDate, endDate);
  };

  const handleCopyData = () => {
    copyToClipboard(groupedData, DEVICE_TYPES, getUptimeValue);
  };

  const printSection = () => {
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Uptime Report</title>
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
              <div class="print-title">Uptime Report</div>
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

  // --- NEW: Fetch head offices on mount (uses same endpoint pattern as AlertReports) ---
  useEffect(() => {
    const getHeadBranch = async () => {
      try {
        const branchCode = sessionStorage.getItem("branch");
        let url = `${API_BASE_URL}/getHeadOfficeByBranchCode?branchCode=${branchCode}`;
        let response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
        let result = await response.json();
        let data = result.payload || [];

        // if no head offices found for the session branch, try find parent via getAllChildren and retry
        if (!data || data.length === 0) {
          try {
            const childUrl = `${API_BASE_URL}/getAllChildren?branchCode=${branchCode}`;
            const childRes = await fetch(childUrl, { method: 'GET', headers: { Accept: 'application/json' } });
            const childJson = await childRes.json();
            const childPayload = childJson.payload || [];
            if (childPayload.length > 0 && childPayload[0].parentCode) {
              const parentCode = childPayload[0].parentCode;
              if (parentCode) {
                url = `${API_BASE_URL}/getHeadOfficeByBranchCode?branchCode=${parentCode}`;
                response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
                result = await response.json();
                data = result.payload || [];
                // set selectedHead to parent so dropdown becomes accessible
                if (data && data.length > 0) {
                  setSelectedHead({ value: parentCode, label: parentCode });
                }
              }
            }
          } catch (innerErr) {
            // ignore child lookup failures and proceed to mark no head offices
            console.warn('getAllChildren fallback failed', innerErr);
          }
        }

        if (data && data.length > 0) {
          const filtered = data.filter((b: any) => b.branchType === 'HEAD OFFICE');
          const mappedHeads = filtered.map((h: any) => ({ value: h.branchCode, label: h.branchDesc || h.branchCode }));
          setHeadOffices(mappedHeads);
          setHeadDisabled(mappedHeads.length === 0);
        } else {
          setHeadOffices([]);
          setHeadDisabled(true);
        }
      } catch (err) {
        console.error('Error fetching head offices:', err);
        setHeadOffices([]);
        setHeadDisabled(true);
      }
    };
    getHeadBranch();
  }, []);

  // Fetch zones when Head Office changes
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
      try {
        const url = `${API_BASE_URL}/getAllZonesByBranchCode?branchCode=${selectedHead.value}`;
        const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
        const result = await response.json();
        const data = result.payload || [];
        const mappedZones = data.map((z: any) => ({ value: z.branchCode, label: z.branchDesc }));
        setZones(mappedZones);
        setZoneDisabled(!mappedZones.length);
        setSelectedZone(null);
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch(null);
      } catch (err) {
        console.error('Error fetching zones:', err);
        setZones([]);
        setZoneDisabled(true);
        setSelectedZone(null);
        setBranches([]);
        setBranchDisabled(true);
        setSelectedBranch(null);
      }
    };
    getZones();
    // eslint-disable-next-line
  }, [selectedHead]);

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
        const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
        const result = await response.json();
        const data = result.payload || [];
        const mappedBranches = data.map((b: any) => ({ value: b.branchCode, label: b.branchName }));
        setBranches(mappedBranches);
        setBranchDisabled(!mappedBranches.length);
        setSelectedBranch(null);
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

  return (
    <>
      <div className="w-full mx-auto px-4 py-6 font-sans text-sm">
        {/* Header + Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
            Uptime Report - CMS
          </h2>

          {/* Right side: Export buttons + Filters button (always visible) */}
          <div className="flex items-center gap-2">
            <Button onClick={handleExcelExport} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
              <FileSpreadsheet className="w-4 h-4 mr-1 text-green-500" /> Excel
            </Button>
            <Button onClick={handlePDFExport} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
              <FileSignature className="w-4 h-4 mr-1 text-red-500" /> PDF
            </Button>
            <Button onClick={printSection} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
              <Printer className="w-4 h-4 mr-1 text-blue-600" /> Print
            </Button>

            {/* NEW: Filters toggle button aligned with export buttons */}
            <Button
              onClick={() => setShowFilters(v => !v)}
              variant="outline"
              className="bg-blue-100 text-blue-800 rounded px-3 py-0.5 text-xs flex items-center gap-1 border"
            >
              {/* simple label, icon optional */}
              Filters
            </Button>
          </div>
        </div>

        {/* Collapsible Filters Panel (hidden until Filters button clicked) */}
        <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
          <div className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-md p-3 shadow-inner">

             {/* Search */}
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
            
            {/* From Date */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">From:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-sm border-gray-300 focus:ring-green-700 focus:border-green-700"
              />
            </div>

            {/* To Date */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">To:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-sm border-gray-300 focus:ring-green-700 focus:border-green-700"
              />
            </div>

           

            {/* Head Office */}
            <div className="w-44">
              <Select
                value={selectedHead}
                onChange={(opt) => { setSelectedHead(opt); setSelectedZone(null); setSelectedBranch(null); }}
                options={headOffices}
                isDisabled={headDisabled}
                placeholder="Head Office"
                isClearable
                styles={{ menuPortal: (base:any) => ({ ...base, zIndex: 9999 }) }}
                menuPortalTarget={document.body}
              />
            </div>

            {/* Controlling Office */}
            <div className="w-44">
              <Select
                value={selectedZone}
                onChange={(opt) => { setSelectedZone(opt); setSelectedBranch(null); }}
                options={zones}
                isDisabled={zoneDisabled}
                placeholder="Controlling Office"
                isClearable
                styles={{ menuPortal: (base:any) => ({ ...base, zIndex: 9999 }) }}
                menuPortalTarget={document.body}
              />
            </div>

            {/* Site */}
            <div className="w-44">
              <Select
                value={selectedBranch}
                onChange={(opt) => { setSelectedBranch(opt); }}
                options={branches}
                isDisabled={branchDisabled}
                placeholder="Site"
                isClearable
                styles={{ menuPortal: (base:any) => ({ ...base, zIndex: 9999 }) }}
                menuPortalTarget={document.body}
              />
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading uptime data...</p>
          </div>
        )}

        {/* NOTE: Selected date range displayed just above the table */}
        {startDate && endDate && (
          <div className="mb-3 text-sm p-3 bg-green-200 text-green-600">
            <span className="font-medium">Filtered Data:</span>{' '}
            Showing data from{' '}
            <span className="font-semibold">
              {startDate === endDate
                ? formatDisplayDate(startDate)
                : `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`}
            </span>
          </div>
        )}

        {/* Table */}
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
              {!loading && filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No data available.
                  </td>
                </tr>
              )}
              {filteredData.map((branch: any, index: number) => (
                <tr
                  key={index}
                  className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
                >
                  <td className="px-3 py-2 text-right">{index + 1}</td>
                  <td className="px-3 py-2">{branch.branchName}</td>
                  {DEVICE_TYPES.map(type => {
                    const device = branch.devices[type];
                    const uptime = getUptimeValue(device);
                    const uptimeNum = uptime !== "-" ? parseFloat(uptime.replace('%', '')) : null;
                    return (
                      <td key={type} className="px-3 py-2">
                        {uptime !== "-" ? (
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            uptimeNum !== null && uptimeNum > 75
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>{uptime}</span>
                        ) : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Print Section */}
        <div id="print-section" className="hidden">
          {/* Add filtered date note into print content so printed page shows it */}
          {startDate && endDate && (
            <div style={{ marginBottom: 12, fontSize: 12, color: '#1f2937' }}>
              <strong>Filtered Data:</strong>{' '}
              {startDate === endDate
                ? formatDisplayDate(startDate)
                : `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`}
            </div>
          )}

          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '1rem' }}>
            <thead>
              <tr>
                <th style={{ background: '#f3f4f6', fontWeight: 600 }}>S.No</th>
                <th style={{ background: '#f3f4f6', fontWeight: 600 }}>Site Name</th>
                <th style={{ background: '#f3f4f6', fontWeight: 600 }}>Site Code</th>
                {DEVICE_TYPES.map(type => (
                  <th key={type} style={{ background: '#f3f4f6', fontWeight: 600 }}>
                    {DEVICE_TYPE_LABELS[type] || type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedData.map((branch: any, index: number) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{branch.branchName}</td>
                  <td>{branch.ifsc}</td>
                  {DEVICE_TYPES.map(type => {
                    const device = branch.devices[type];
                    const uptime = getUptimeValue(device);
                    return (
                      <td key={type}>
                        {uptime}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Alert />
    </>
  );
};

export default UpTimeReportForCMS;
