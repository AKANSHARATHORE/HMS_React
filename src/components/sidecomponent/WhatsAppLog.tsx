import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { exportWhatsAppToExcel, exportWhatsAppToPDF, copyWhatsAppToClipboard } from "./SmsLogButton";
import { format } from 'date-fns';
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";

// WhatsApp log data interface
interface WhatsAppLogItem {
  ticketId: any;
  id: number;
  phoneNo: string;
  whatsappMessage: string;
  responseMessage: string;
  timestamp: string;
}

const WhatsAppLogs = () => {
  const [logsData, setLogsData] = useState<WhatsAppLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilterPhone, setTempFilterPhone] = useState<string | null>(null);
  const [filterPhone, setFilterPhone] = useState<string | null>(null);
  const [tempFilterFrom, setTempFilterFrom] = useState<string | null>(null);
  const [tempFilterTo, setTempFilterTo] = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState<string | null>(null);
  const [filterTo, setFilterTo] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Fetch WhatsApp logs
  const fetchWhatsAppLogs = async () => {
    setIsLoading(true);
    try {
      const branchCode = sessionStorage.getItem("branch");
      const url = `${API_BASE_URL}/getWhatsappLogsByBranchCode?branchCode=${branchCode}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const result = await response.json();
      // Sort by timestamp descending (latest first)
      const sorted = (result.payload || []).slice().sort((a: WhatsAppLogItem, b: WhatsAppLogItem) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setLogsData(sorted);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to fetch WhatsApp logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchWhatsAppLogs(); }, []);

  // Format timestamp to dd-MM-yyyy HH:mm:ss
  const formatTimestamp = (timestamp: string = '') => {
    try {
      return format(new Date(timestamp), 'dd-MM-yyyy HH:mm:ss');
    } catch {
      return '';
    }
  };

  // Unique phone numbers for filter dropdown
  const uniquePhones = useMemo(
    () => Array.from(new Set(logsData.map(item => item.phoneNo).filter(Boolean))),
    [logsData]
  );

  // Filtered data
  const filteredData = useMemo(() => {
    return logsData.filter(item => {
      let phoneMatch = true, fromMatch = true, toMatch = true;
      if (filterPhone) phoneMatch = item.phoneNo === filterPhone;
      if (filterFrom) fromMatch = new Date(item.timestamp) >= new Date(filterFrom);
      if (filterTo) toMatch = new Date(item.timestamp) <= new Date(filterTo + 'T23:59:59');
      return phoneMatch && fromMatch && toMatch;
    });
  }, [logsData, filterPhone, filterFrom, filterTo]);

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

  // Prepare export data with only required columns
  const exportData = useMemo(() => 
    filteredData.map((item, idx) => ({
      "S.No": idx + 1,
      "Site Name": item.ticketId,
      "Phone No": item.phoneNo,
      "WhatsApp Message": item.whatsappMessage,
      "Time Stamp": formatTimestamp(item.timestamp),
    }))
  , [filteredData]);

  // Export/copy handlers
  const handleExcelExport = () => exportWhatsAppToExcel(exportData as any, 'WhatsApp_Logs');
  const handlePDFExport = () => exportWhatsAppToPDF(exportData as any, 'WhatsApp_Logs');
  const handleCopyData = () => copyWhatsAppToClipboard(exportData as any);

  // Print only the table section
  const printSection = () => {
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>WhatsApp Log</title>
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
              <div class="print-title">WhatsApp Log</div>
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
        <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4">WhatsApp Log</h2>
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
              setTempFilterFrom(filterFrom);
              setTempFilterTo(filterTo);
              setShowFilters(prev => !prev);
            }}
            className="bg-gray-100 text-gray-700 px-3 py-1 text-xs flex items-center gap-1"
          >
            <FileText className="w-4 h-4 text-blue-500" /> Filter
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="flex flex-row flex-wrap gap-4 items-end bg-gray-50 rounded-md p-4 shadow-inner">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm mb-1 font-semibold text-blue-900">Phone No</label>
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
            <label className="block text-sm mb-1 font-semibold text-blue-900">From Date</label>
            <input
              type="date"
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              value={tempFilterFrom ?? ""}
              onChange={e => setTempFilterFrom(e.target.value || null)}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm mb-1 font-semibold text-blue-900">To Date</label>
            <input
              type="date"
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              value={tempFilterTo ?? ""}
              onChange={e => setTempFilterTo(e.target.value || null)}
            />
          </div>
          <div className="flex-1 flex justify-end items-end min-w-[180px]">
            <div className="flex gap-2">
              <button onClick={() => {
                setFilterPhone(tempFilterPhone);
                setFilterFrom(tempFilterFrom);
                setFilterTo(tempFilterTo);
                setShowFilters(false);
                setCurrentPage(1);
              }} className="bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded text-sm font-semibold shadow transition">
                Search
              </button>
              <button onClick={() => {
                setTempFilterPhone(null);
                setTempFilterFrom(null);
                setTempFilterTo(null);
                setFilterPhone(null);
                setFilterFrom(null);
                setFilterTo(null);
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
          <p className="mt-2 text-gray-600">Loading WhatsApp logs...</p>
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
              <th className="px-2 py-3 text-right font-semibold text-gray-700">Site Name</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Phone No</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">WhatsApp Message</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Message Status</th>
              <th className="px-2 py-3 text-left font-semibold text-gray-700">Time Stamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((item, index) => (
              <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="px-2 py-2 text-right">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="px-2 py-2 text-left">{item.ticketId}</td>
                <td className="px-2 py-2 text-left">{item.phoneNo}</td>
                <td className="px-3 py-2 whitespace-pre-wrap font-sans text-sm text-gray-800">
                  {item.whatsappMessage}
                </td>
                <td className="px-3 py-2">{JSON.parse(item.responseMessage).status+" -  "+JSON.parse(item.responseMessage).message}</td>
                <td className="px-3 py-2">{formatTimestamp(item.timestamp)}</td>
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
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, logsData.length)} to {Math.min(currentPage * itemsPerPage, logsData.length)} of {logsData.length} entries
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

export default WhatsAppLogs;

