import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Filter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { exportCallLogToExcel, exportCallLogToPDF, copyCallLogToClipboard } from "./SmsLogButton";
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";

// Call log data interface
interface CallLogItem {
  id: number;
  branchName: string;
  phoneNo: string;
  reason: string;
  createdAt: string;
}

const CallLog = () => {
  const [callLogsData, setCallLogsData] = useState<CallLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state (Call Sent To only)
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilterPhone, setTempFilterPhone] = useState<string | null>(null);
  const [filterPhone, setFilterPhone] = useState<string | null>(null);

  // Add branchName filter states
  const [tempFilterBranch, setTempFilterBranch] = useState<string | null>(null);
  const [filterBranch, setFilterBranch] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Fetch Call Logs
  const fetchCallLogsData = async () => {
    setIsLoading(true);
    try {
      const branchCode = sessionStorage.getItem("branch");
      const url = `${API_BASE_URL.replace(/\/$/, '')}/getCallLogsByBranchCode?branchCode=${branchCode}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const result = await response.json();
      // Sort by id descending (latest first)
      const sorted = (result.payload || []).slice().sort((a: CallLogItem, b: CallLogItem) => b.id - a.id);
      setCallLogsData(sorted);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to fetch Call logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCallLogsData(); }, []);

  // Unique phone numbers for filter dropdown
  const uniquePhones = useMemo(
    () => Array.from(new Set(callLogsData.map(item => item.phoneNo).filter(Boolean))),
    [callLogsData]
  );

  // Unique branch names for filter dropdown
  const uniqueBranches = useMemo(
    () => Array.from(new Set(callLogsData.map(item => item.branchName).filter(Boolean))),
    [callLogsData]
  );

  // Filtered data
  const filteredData = useMemo(() => {
    return callLogsData.filter(item => {
      let phoneMatch = true, branchMatch = true;
      if (filterPhone) phoneMatch = item.phoneNo === filterPhone;
      if (filterBranch) branchMatch = item.branchName === filterBranch;
      return phoneMatch && branchMatch;
    });
  }, [callLogsData, filterPhone, filterBranch]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) {
      buttons.push(<button key={1} onClick={() => setCurrentPage(1)} className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">1</button>);
      if (start > 2) buttons.push(<span key="start-ellipsis" className="px-2">...</span>);
    }
    for (let i = start; i <= end; i++) {
      buttons.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 border rounded ${currentPage === i ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          {i}
        </button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) buttons.push(<span key="end-ellipsis" className="px-2">...</span>);
      buttons.push(
        <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">
          {totalPages}
        </button>
      );
    }
    return buttons;
  };

  // Export/copy handlers (only export filteredData)
  const handleExcelExport = () => {
    const exportData = filteredData.map((item, idx) => ({
      "S.No": idx + 1,
      "Branch Name": item.branchName,
      "Call Sent To": item.phoneNo,
      "Reason": item.reason,
        "Created At": new Date(item.createdAt).toLocaleString()
    }));
    exportCallLogToExcel(exportData, 'Call_Logs');
  };
  const handlePDFExport = () => {
    const exportData = filteredData.map((item, idx) => ({
      "S.No": idx + 1,
      "Branch Name": item.branchName,
      "Call Sent To": item.phoneNo,
      "Reason": item.reason,
      "Created At": new Date(item.createdAt).toLocaleString()
    }));
    exportCallLogToPDF(exportData, 'Call_Logs');
  };
  const handleCopyData = () => {
    const exportData = filteredData.map((item, idx) => ({
      "S.No": idx + 1,
      "Branch Name": item.branchName,
      "Call Sent To": item.phoneNo,
      "Reason": item.reason,
      "Created At": new Date(item.createdAt).toLocaleString()
    }));
    copyCallLogToClipboard(exportData);
  };

  // Print only the table section
  const printSection = () => {
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Call Log</title>
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
              <div class="print-title">Call Log</div>
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
    <div className="w-full mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4">Call Log</h2>
        <div className="flex flex-wrap gap-2">
          {/* <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handleCopyData}>
            <FileText className="w-4 h-4 text-yellow-500" /> Copy
          </Button> */}
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handleExcelExport}>
            <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handlePDFExport}>
            <FileSignature className="w-4 h-4 text-red-500" /> PDF
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={printSection}>
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTempFilterPhone(filterPhone);
              setShowFilters(prev => !prev);
            }}
            className="bg-gray-100 text-gray-700 px-3 py-1 text-xs flex items-center gap-1"
          >
            <Filter className="w-4 h-4 text-blue-500" /> Filter
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="flex flex-row flex-wrap gap-4 items-end bg-gray-50 rounded-md p-4 shadow-inner">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm mb-1 font-semibold text-blue-900">Call Sent To</label>
            <select
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              value={tempFilterPhone ?? ""}
              onChange={e => setTempFilterPhone(e.target.value || null)}
            >
              <option value="">All</option>
              {uniquePhones.map(phone => (
                <option key={phone} value={phone}>{phone}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm mb-1 font-semibold text-blue-900">Branch Name</label>
            <select
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              value={tempFilterBranch ?? ""}
              onChange={e => setTempFilterBranch(e.target.value || null)}
            >
              <option value="">All</option>
              {uniqueBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex justify-end items-end min-w-[180px]">
            <div className="flex gap-2">
              <button onClick={() => {
                setFilterPhone(tempFilterPhone);
                setFilterBranch(tempFilterBranch);
                setShowFilters(false);
                setCurrentPage(1);
              }} className="bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded text-sm font-semibold shadow transition">
                Search
              </button>
              <button onClick={() => {
                setTempFilterPhone(null);
                setTempFilterBranch(null);
                setFilterPhone(null);
                setFilterBranch(null);
                setShowFilters(false);
                setCurrentPage(1);
              }} className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-2 rounded text-sm font-semibold shadow transition">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading call logs...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded border border-red-300 mb-4">
          {error}
        </div>
      )}
      <div className="rounded border shadow-sm max-h-[65vh] overflow-auto">
        <div id="print-section" className="contents">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-3 text-right font-semibold text-gray-700">S.No</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Site Name</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Call Sent To</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Reason</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Time Stamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((item, index) => (
              <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="px-2 py-2 text-right">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-2 py-2 text-left">{item.branchName}</td>
                <td className="px-2 py-2 text-left">{item.phoneNo}</td>
                <td className="px-2 py-2 text-left">{item.reason}</td>
                <td className="px-2 py-2 text-left">{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-gray-600">
        <div>
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex items-center space-x-1 mt-2 md:mt-0">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
            <ChevronLeft size={16} />
          </button>
          {renderPaginationButtons()}
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
    <Alert/>
    </>
  );
};

export default CallLog;
