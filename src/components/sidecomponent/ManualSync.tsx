import {
  FileText, FileSpreadsheet, Printer, FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToExcel, exportToPDF, copyToClipboard } from "./MenuSyncButton";
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react'; // Add spinner icon
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";

function ManualSync() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlert, setSelectedAlert] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState<{ [key: string]: string | null }>({}); // Track loading per device
  const tableRef = useRef<HTMLTableElement>(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const branchCode = sessionStorage.getItem("branch");
        const url = `${API_BASE_URL}/getAllDevicesByBranchCode?branchCode=${branchCode}`;

        const response = await fetch(url);
        const result = await response.json();
        console.log("Fetched Data:", result); 

        const data = result?.payload || [];
        setData(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data", err);
        setError("Failed to fetch data");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = async (deviceSerialNo: string) => {
    setLoadingDevice(prev => ({ ...prev, [deviceSerialNo]: 'reset' }));
    try {
      const url = `${API_BASE_URL}/hitUrlForReset?deviceSerialNumber=${deviceSerialNo}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceSerialNumber: deviceSerialNo }),
      });
      const result = await response.text();
      if (result.toLowerCase().includes("done")) {
        Swal.fire("Success", "Reset Successfully", "success");
      } else {
        Swal.fire("Failed", "Status not updated", "error");
      }
    } catch (err) {
      Swal.fire("Error", "API call failed", "error");
    }
    setLoadingDevice(prev => ({ ...prev, [deviceSerialNo]: null }));
  };

  const handleStatus = async (deviceSerialNo: string) => {
    setLoadingDevice(prev => ({ ...prev, [deviceSerialNo]: 'status' }));
    try {
      const url = `${API_BASE_URL}/hitUrlForStatus?deviceSerialNumber=${deviceSerialNo}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceSerialNumber: deviceSerialNo }),
      });
      const result = await response.text();
      if (result.toLowerCase().includes("done")) {
        Swal.fire("Success", "Status Updated", "success");
      } else {
        Swal.fire("Failed", "Status not updated", "error");
      }
    } catch (err) {
      Swal.fire("Error", "API call failed", "error");
    }
    setLoadingDevice(prev => ({ ...prev, [deviceSerialNo]: null }));
  };

  // Robust parser: convert various API date formats to epoch ms (or null if unparsable)
  const parseSyncTimeToMs = (timeString: string): number | null => {
    if (!timeString) return null;
    // Extract time part before the " : " delimiter if present
    const raw = timeString.split(" : ")[0].trim();
    // Strip trailing fractional seconds (e.g. ".0" or ".123") if any
    const withoutMs = raw.replace(/\.\d+$/, "");

    // 1) Try ISO-ish format: YYYY-MM-DD HH:MM:SS
    const isoMatch = withoutMs.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
    if (isoMatch) {
      const iso = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T${isoMatch[4]}`;
      const parsed = Date.parse(iso);
      if (!isNaN(parsed)) return parsed;
    }

    // 2) Try DMY format: DD-MM-YYYY HH:MM:SS (some API responses use this)
    const dmyMatch = withoutMs.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
    if (dmyMatch) {
      // convert to YYYY-MM-DDTHH:MM:SS
      const iso = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}T${dmyMatch[4]}`;
      const parsed = Date.parse(iso);
      if (!isNaN(parsed)) return parsed;
    }

    // 3) Final fallback: let the engine try to parse the cleaned string
    const fallback = Date.parse(withoutMs);
    if (!isNaN(fallback)) return fallback;

    return null;
  };

  // Function to check if time is older than 12 hours
  const isOldSync = (timeString: string) => {
    const ms = parseSyncTimeToMs(timeString);
    if (ms === null) return false; // treat unparsable times as not-old to avoid false positives
    const hoursDiff = (Date.now() - ms) / (1000 * 60 * 60);
    return hoursDiff >= 12;
  };

  // Filter and sort data
  const filteredData = data
    .filter((user) =>
      [user.deviceSerialNo, user.branchName, user.deviceName, user.bankName, user.phoneNumber, ...(Array.isArray(user.lastSyncedTimes) ? user.lastSyncedTimes : [])]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aLastSync = Array.isArray(a.lastSyncedTimes) && a.lastSyncedTimes.length > 0 ? a.lastSyncedTimes[0] : null;
      const bLastSync = Array.isArray(b.lastSyncedTimes) && b.lastSyncedTimes.length > 0 ? b.lastSyncedTimes[0] : null;
      
      if (!aLastSync) return 1;
      if (!bLastSync) return -1;
      
      const aIsOld = isOldSync(aLastSync);
      const bIsOld = isOldSync(bLastSync);
      
      if (aIsOld && !bIsOld) return -1;
      if (!aIsOld && bIsOld) return 1;
      return 0;
    });

  const handleExcelExport = () => exportToExcel(data, 'Manual_Sync_Report');
  const handlePDFExport = () => exportToPDF(data, 'Manual_Sync_Report');
  const handleCopyData = () => copyToClipboard(data);

  // Print only the table section (like SmsLog)
  const printSection = () => {
    const printContents = tableRef.current?.outerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Manual Sync</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; }
              .print-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
              .print-title { font-size: 2rem; font-weight: 600; }
              .print-logo { max-width:320px; max-height:90px; margin-left: 20px; }
              table { border-collapse: collapse; width: 100%; font-size: 1rem; }
              th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
              th { background: #f3f4f6; font-weight: 600; }
              tr:nth-child(even) { background: #fafbfc; }
              th:last-child, td:last-child { display: none !important; }
            </style>
          </head>
          <body>
            <div class="print-header">
              <div class="print-title">Manual Sync</div>
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
        <div className='w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 font-sans text-sm'>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
          Manual Sync
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          {/* <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handleCopyData}>
            <FileText className="w-4 h-4 text-yellow-500" /> Copy
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
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handleExcelExport}>
            <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handlePDFExport}>
            <FileSignature className="w-4 h-4 text-red-500" /> PDF
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={printSection}>
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </Button>
        </div>
      </div>

      {/* Counter for devices not synced in 12 hours */}
      {filteredData.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-2">
            <span className="text-red-700 font-medium">
              {filteredData.filter(row => 
                Array.isArray(row.lastSyncedTimes) && 
                row.lastSyncedTimes.length > 0 && 
                isOldSync(row.lastSyncedTimes[0])
              ).length}
            </span>
            <span className="text-gray-700 ml-2">devices haven't synced in last 12 hours</span>
          </div>
        </div>
      )}

      <div className="border rounded shadow-sm max-h-[70vh] overflow-y-auto">
        <table ref={tableRef} className="w-full text-sm text-left">
          <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
            <tr>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">S.No</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">Serial No</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Site Name</th>
              {/* <th className="px-3 py-3 font-semibold text-gray-700 text-left">Panel Name</th> */}
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Bank Name</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">Phone Number</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">Last 5 Sync Time</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            { filteredData.length > 0 ? filteredData.map((row, idx) => (
              <tr
                key={`${row.deviceSerialNo}-${idx}`}
                className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
              >
                <td className="px-3 py-2 text-right">{idx + 1}</td>
                <td className="px-3 py-2 text-right">{row?.deviceSerialNo || "N/A"}</td>
                <td className="px-3 py-2 text-left">{row?.branchName || "N/A"}</td>
                {/* <td className="px-3 py-2 text-left">{row?.deviceName || "N/A"}</td> */}
                <td className="px-3 py-2 text-left">{row?.bankName || "N/A"}</td>
                <td className="px-3 py-2 text-right">{row?.phoneNumber || "N/A"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-col items-end">
                    {Array.isArray(row?.lastSyncedTimes)
                      ? row.lastSyncedTimes.slice(0, 5).map((time: string, index: number) => (
                          <span 
                            key={index} 
                            className={index === 0 && isOldSync(time) ? "bg-red-400 text-white px-2 py-1 rounded" : ""}
                          >
                            {time}
                          </span>
                        ))
                      : <span className="text-gray-400">N/A</span>}
                  </div>
                </td>
                <td className="px-2 py-2 text-center flex gap-2">
                  {/* Hide Reset button if productType is CMS */}
                  {row.productType !== "CMS" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReset(row.deviceSerialNo)}
                      disabled={loadingDevice[row.deviceSerialNo] === 'reset'}
                    >
                      {loadingDevice[row.deviceSerialNo] === 'reset' ? (
                        <Loader2 className="animate-spin w-4 h-4 mr-1" />
                      ) : null}
                      Reset
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatus(row.deviceSerialNo)}
                    disabled={loadingDevice[row.deviceSerialNo] === 'status'}
                  >
                    {loadingDevice[row.deviceSerialNo] === 'status' ? (
                      <Loader2 className="animate-spin w-4 h-4 mr-1" />
                    ) : null}
                    Status
                  </Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="text-center py-3 text-gray-500">
                  {isLoading ? "Loading..." : "No data available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 text-sm text-gray-700 text-right">
        Showing 1 to {data.length} of {data.length} entries
      </div>
    </div>
    <Alert/>
    </>
  );
}

export default ManualSync;
