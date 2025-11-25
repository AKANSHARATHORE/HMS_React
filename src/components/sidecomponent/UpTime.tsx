import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  FileSignature,
  Filter,
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
const UPTIME_KEYS: Record<string, string> = {
  day: "dayUptime",
  week: "weekUptime",
  month: "monthUptime",
  quarter: "quarterUptime",
};

const UptimeReport = () => {
  const [data, setData] = useState<any[]>([]);
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [uptimeType, setUptimeType] = useState('week');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [uptimeType]);

  const fetchData = async () => {
    setLoading(true);
    const branchCode = sessionStorage.getItem("branch") || "BR-16"; // fallback for demo
    try {
      const res = await axios.get(`${API_BASE_URL}/getUptimeReportByTime`, {
        params: { branchCode },
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
    const key = UPTIME_KEYS[uptimeType];
    return device && device[key] ? `${device[key]}%` : "-";
  };

  const filteredData = groupedData.filter((user) =>
     [user.branchName, user.ifsc, ...Object.values(user.devices)]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())

    );

  const handleExcelExport = () => {
    exportToExcel(
      groupedData, // <-- use groupedData
      DEVICE_TYPES, // <-- just device types
      getUptimeValue
    );
  };

  const handlePDFExport = () => {
    exportToPDF(
      groupedData, // <-- use groupedData
      DEVICE_TYPES, // <-- just device types
      getUptimeValue
    )
  };

  const handleCopyData = () => {
    copyToClipboard(
      groupedData, // <-- use groupedData
      DEVICE_TYPES, // <-- just device types
      getUptimeValue
    );
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

  return (
    <>
    <div className="w-full mx-auto px-4 py-6 font-sans text-sm">
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
          Uptime Report
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          {/* <Button onClick={handleCopyData} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
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
          <Button onClick={handleExcelExport} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4 mr-1 text-green-500" /> Excel
          </Button>
          <Button onClick={handlePDFExport} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileSignature className="w-4 h-4 mr-1 text-red-500" /> PDF
          </Button>
          <Button onClick={printSection} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <Printer className="w-4 h-4 mr-1 text-blue-600" /> Print
          </Button>
          {/* Filter */}
       
          <select
            className="ml-3 border rounded px-2 py-1 text-sm"
            value={uptimeType}
            onChange={e => setUptimeType(e.target.value)}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
          </select>
        </div>
      </div>
      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading uptime data...</p>
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
                <td colSpan={8} className="text-center py-4 text-gray-500">
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
      {/* Only this section will be printed */}
      <div id="print-section" className="hidden">
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
    <Alert/>
    </>
  );
};

export default UptimeReport;