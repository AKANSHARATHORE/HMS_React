import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Filter
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportToExcel, exportToPDF, copyToClipboard } from "./SmsLogButton";
import { format } from 'date-fns';
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";

interface ReportDataItem {
  smsLogId?: number;
  branchName?: string;
  sentTo?: string;
  message?: string;
  bodyText?: string;
  messageRef?: string;
}

const SMSLogs = () => {
  const [smsLogsData, setsmsLogsData] = useState<ReportDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilterMobile, setTempFilterMobile] = useState<string | null>(null);
  const [tempFilterDate, setTempFilterDate] = useState<Date | null>(null);
  const [filterMobile, setFilterMobile] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterBranch, setFilterBranch] = useState<string | null>(null);
  const [tempFilterBranch, setTempFilterBranch] = useState<string | null>(null);

  const itemsPerPage = 10;

  const branchCode= sessionStorage.getItem("branchCode");

  const fetchsmsLogsData = async () => {
    setIsLoading(true);
    try {
      const branchCode = sessionStorage.getItem("branch");
      const url = `${API_BASE_URL}/getAllSmsLogReport?branchCode=${branchCode}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const result = await response.json();
      // Sort by date descending (latest first)
      const sorted = (result.payload || []).slice().sort((a: any, b: any) => {
        const getDate = (item: any) => {
          const match = (item.bodyText || '').match(/(\d{2})-(\d{2})-(\d{4})/);
          if (match) {
            const [_, day, month, year] = match;
            return new Date(`${year}-${month}-${day}`);
          }
          // fallback to datetime field if available
          if (item.datetime) return new Date(item.datetime);
          return new Date(0);
        };
        return getDate(b).getTime() - getDate(a).getTime();
      });
      setsmsLogsData(sorted);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to fetch SMS logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchsmsLogsData(); }, []);

  const formatDate = (text: string = '') => {
  const match = text.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    return `${day}-${month}-${year}`; // or `${year}-${month}-${day}` if you prefer
  }
  return '';
};


  const uniqueMobiles = useMemo(
    () => Array.from(new Set(smsLogsData.map(item => item.sentTo).filter(Boolean))),
    [smsLogsData]
  );

  // Helper to extract branch/site name from messageRef
  const extractBranchName = (messageRef: string = ''): string => {
  // Find the sms=... part and decode it
  const smsMatch = messageRef.match(/text=([^&]+)/);
  if (!smsMatch) return '';
  
  const smsDecoded = decodeURIComponent(smsMatch[1]).replace(/\+/g, ' ');

  // Example message: Digitals Alert: Timestamp - 2025-08-20 10:08 Branch - VAISHALI is having the issue of DigitalsIndia
  const branchMatch = smsDecoded.match(/Branch\s*-\s*([A-Za-z0-9\- ]+)\s*is\s+having/i);
  
  return branchMatch ? branchMatch[1].trim() : '';
};


  const uniqueBranchNames = useMemo(
    () => Array.from(new Set(smsLogsData.map(item => extractBranchName(item.messageRef || '')).filter(Boolean))),
    [smsLogsData]
  );

  const filteredData = useMemo(() => {
    return smsLogsData.filter(item => {
      let mobileMatch = true, dateMatch = true, branchMatch = true;
      if (filterMobile) mobileMatch = item.sentTo === filterMobile;
      if (filterDate) {
        const dateStr = formatDate(item.message); // "dd-mm-yyyy"
        const [d, m, y] = dateStr.split("-");
        const itemDate = new Date(`${y}-${m}-${d}`);
        dateMatch = itemDate.toDateString() === filterDate.toDateString();
      }
      if (filterBranch) branchMatch = extractBranchName(item.messageRef || '') === filterBranch;
      return mobileMatch && dateMatch && branchMatch;
    });
  }, [smsLogsData, filterMobile, filterDate, filterBranch]);

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

    const handleExcelExport = () => exportToExcel(filteredData as any, 'Filtered_Email_Logs');
    const handlePDFExport = () => exportToPDF(filteredData as any, 'Filtered_Email_Logs');
    const handleCopyData = () => copyToClipboard(filteredData as any);

  // Print only the table section
  const printSection = () => {
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>SMS Log</title>
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
              <div class="print-title">SMS Log</div>
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
        <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4">SMS Log</h2>
        <div className="flex flex-wrap gap-2">
          {/* <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={() => copyToClipboard(filteredData as any)}>
            <FileText className="w-4 h-4 text-yellow-500" /> Copy
          </Button> */}
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={() => exportToExcel(filteredData as any, 'Filtered_SMS_Logs')}>
            <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={() => exportToPDF(filteredData as any, 'Filtered_SMS_Logs')}>
            <FileSignature className="w-4 h-4 text-red-500" /> PDF
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={printSection}>
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTempFilterMobile(filterMobile);
              setTempFilterDate(filterDate);
              setTempFilterBranch(filterBranch);
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
            <label className="block text-sm mb-1 font-semibold text-blue-900">SMS Send To</label>
            <select
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              value={tempFilterMobile ?? ""}
              onChange={e => setTempFilterMobile(e.target.value || null)}
            >
              <option value="">All</option>
              {uniqueMobiles.map(mobile => (
                <option key={mobile} value={mobile}>{mobile}</option>
              ))}
            </select>
          </div>
          {/* Site Name (Branch) */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm mb-1 font-semibold text-blue-900">Site Name</label>
            <select
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              value={tempFilterBranch ?? ""}
              onChange={e => setTempFilterBranch(e.target.value || null)}
            >
              <option value="">All</option>
              {uniqueBranchNames.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm mb-1 font-semibold text-blue-900"> Date</label>
            <input
              type="date"
              value={tempFilterDate ? format(tempFilterDate, 'yyyy-MM-dd') : ""}
              onChange={e => setTempFilterDate(e.target.value ? new Date(e.target.value) : null)}
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          </div>
          <div className="flex-1 flex justify-end items-end min-w-[180px]">
            <div className="flex gap-2">
              <button onClick={() => {
                setFilterMobile(tempFilterMobile);
                setFilterDate(tempFilterDate);
                setFilterBranch(tempFilterBranch);
                setShowFilters(false);
                setCurrentPage(1);
              }} className="bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded text-sm font-semibold shadow transition">
                Search
              </button>
              <button onClick={() => {
                setTempFilterMobile(null);
                setTempFilterDate(null);
                setTempFilterBranch(null);
                setFilterMobile(null);
                setFilterDate(null);
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
          <p className="mt-2 text-gray-600">Loading email logs...</p>
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
              <th  className="px-2 py-3 text-right font-semibold text-gray-700">S.No</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Site Name</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Controlling Office</th>
              {[ "SMS Send To", "SMS Sent At Date", "SMS Messages"].map(header => (
                <th key={header} className="px-2 py-3 text-left font-semibold text-gray-700">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((item, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="px-2 py-2 text-right">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-2 py-2 text-left">{extractBranchName(item.messageRef || '')}</td>
                <td className="px-2 py-2 text-right">{item.branchName}</td>
                <td className="px-3 py-2">
                  {item.sentTo
                    ? item.sentTo
                        .split(',')
                        .filter(num => num.trim() !== '')
                        .map((num: string, idx: number, arr: string[]) => (
                          <span key={idx}>
                            {num.trim()}
                            {idx !== arr.length - 1 && <br />}
                          </span>
                        ))
                    : ""}
                </td>
               
                <td className="px-3 py-2">{formatDate(item.message).replace(/\+/g, " ")}</td>
                <td className="px-3 py-2 whitespace-pre-wrap font-sans text-sm text-gray-800">
                  {decodeURIComponent(item.message || "")
                    .replace(/\+/g, ' ')
                    .replace(/%0D/g, '\n')
                    .replace(/\r/g, '')
                    .replace(/\n{2,}/g, '\n')}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">No data available</td>
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

export default SMSLogs;
