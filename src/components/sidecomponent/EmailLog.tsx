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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { exportToExcel, exportToPDF, copyToClipboard } from "./EmailLogButton";
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";
import { constants } from 'node:fs/promises';

interface ReportDataItem {
  emailLogId?: number;
  emailIdTo?: string;
  branchName?: string;
  subject?: string;
  bodyText?: string;
}

const EmailLogs = () => {
  const [emailLogData, setEmailLogData] = useState<ReportDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempFilterEmail, setTempFilterEmail] = useState<string | null>(null);
  const [tempFilterDate, setTempFilterDate] = useState<Date | null>(null);

  const [filterEmail, setFilterEmail] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  const itemsPerPage = 10;

  const fetchEmailLogData = async () => {
    setIsLoading(true);
    try {
      const branchCode = sessionStorage.getItem("branch");
      // alert(branchCode);
      
      const url = `${API_BASE_URL}/getAllEmailLogReport?branchCode=${branchCode}`;
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

      setEmailLogData(sorted);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to fetch alert data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEmailLogData(); }, []);

  const formatDate = (text: string = '') => {
  const match = text.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    return `${day}-${month}-${year}`; // or `${year}-${month}-${day}` if you prefer
  }
  return '';
};


  const uniqueEmails = useMemo(
    () => Array.from(new Set(emailLogData.map(item => item.emailIdTo).filter(Boolean))),
    [emailLogData]
  );

  // Helper to extract branch/site name from bodyText
  const extractBranchName = (bodyText: string = ''): string => {
   
    const match = bodyText.match(/TIME\s+([A-Za-z0-9\- ]+?)\s+is encountering/i);
    return match ? match[1].trim() : '';
  };

  const uniqueBranchNames = useMemo(
    () => Array.from(new Set(emailLogData.map(item => extractBranchName(item.bodyText)).filter(Boolean))),
    [emailLogData]
  );

  const [filterBranch, setFilterBranch] = useState<string | null>(null);
  const [tempFilterBranch, setTempFilterBranch] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return emailLogData.filter(item => {
      let emailMatch = true, dateMatch = true, branchMatch = true;
      if (filterEmail) emailMatch = item.emailIdTo === filterEmail;
      if (filterDate) {
        const dateStr = formatDate(item.bodyText); // "dd-mm-yyyy"
        const [d, m, y] = dateStr.split("-");
        const itemDate = new Date(`${y}-${m}-${d}`);
        dateMatch = itemDate.toDateString() === filterDate.toDateString();
      }
      if (filterBranch) branchMatch = extractBranchName(item.bodyText) === filterBranch;
      return emailMatch && dateMatch && branchMatch;
    });
  }, [emailLogData, filterEmail, filterDate, filterBranch]);

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

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      buttons.push(
        <button key={1} onClick={() => setCurrentPage(1)} className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">1</button>
      );
      if (start > 2) buttons.push(<span key="start-ellipsis" className="px-2">...</span>);
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 border rounded ${currentPage === i ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) buttons.push(<span key="end-ellipsis" className="px-2">...</span>);
      buttons.push(
        <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded">{totalPages}</button>
      );
    }

    return buttons;
  };

  const handleExcelExport = () => exportToExcel(filteredData as any, 'Filtered_Email_Logs');
  const handlePDFExport = () => exportToPDF( filteredData as any, 'Filtered_Email_Logs');
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
            <title>Email Log</title>
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
              <div class="print-title">Email Log</div>
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
        <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4">Email Log</h2>
        <div className="flex flex-wrap gap-2">
          {/* <Button variant="outline" onClick={handleCopyData} className="bg-gray-100 text-gray-700 px-3 py-1 text-xs flex items-center gap-1">
            <FileText className="w-4 h-4 text-yellow-500" /> Copy
          </Button> */}
          <Button variant="outline" onClick={handleExcelExport} className="bg-gray-100 text-gray-700 px-3 py-1 text-xs flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
          </Button>
          <Button variant="outline" onClick={handlePDFExport} className="bg-gray-100 text-gray-700 px-3 py-1 text-xs flex items-center gap-1">
            <FileSignature className="w-4 h-4 text-red-500" /> PDF
          </Button>
          <Button variant="outline" onClick={printSection} className="bg-gray-100 text-gray-700 px-3 py-1 text-xs flex items-center gap-1">
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setTempFilterEmail(filterEmail);
              setTempFilterDate(filterDate);
              setShowFilters((prev) => !prev);
            }}
            className="bg-gray-100 text-gray-700 px-3 py-1 text-xs flex items-center gap-1"
          >
            <Filter className="w-4 h-4 text-blue-500" /> Filter
          </Button>

        </div>
      </div>

      <div
        className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'
          }`}
      >
        <div className="flex flex-row flex-wrap gap-4 items-end bg-gray-50 rounded-md p-4 shadow-inner">
          {/* Email ID */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm mb-1 font-semibold text-blue-900">Email ID</label>
            <select
              className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              value={tempFilterEmail ?? ""}
              onChange={e => setTempFilterEmail(e.target.value || null)}
            >
              <option value="">All</option>
              {uniqueEmails.map(email => (
                <option key={email} value={email}>{email}</option>
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
          {/* Date */}
          {/* Buttons */}
          <div className="flex-1 flex justify-end items-end min-w-[180px]">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterEmail(tempFilterEmail);
                  setFilterDate(tempFilterDate);
                  setFilterBranch(tempFilterBranch);
                  setShowFilters(false);
                  setCurrentPage(1); // Optionally reset to first page
                }}
                className="bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded text-sm font-semibold shadow transition"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setTempFilterEmail(null);
                  setTempFilterDate(null);
                  setTempFilterBranch(null);
                  setFilterEmail(null);
                  setFilterDate(null);
                  setFilterBranch(null);
                  setShowFilters(false);
                  setCurrentPage(1);
                }}
                className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-2 rounded text-sm font-semibold shadow transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

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
              {[ "Email Send To", "Email Date", "Email Subject", "Email Body"].map((header) => (
                <th key={header} className="px-2 py-3 text-left font-semibold text-gray-700">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((item, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="px-2 py-2 text-right">{(currentPage - 1) * itemsPerPage + index + 1}</td>
               
                <td className="px-3 py-2 text-left">{item.branchName}</td>
                <td className="px-3 py-2 text-left">{item.emailIdTo}</td>
                <td className="px-3 py-2 text-left">{formatDate(item.bodyText)}</td>
                <td className="px-3 py-2 text-left">{item.subject}</td>
                <td className="px-3 py-2 max-w-sm overflow-hidden">
                  <div dangerouslySetInnerHTML={{ __html: item.bodyText || '' }} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-6">
        <span className="text-gray-600 text-sm">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
        </span>
        <div className="flex items-center gap-1 mt-2 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            <ChevronLeft size={16} />
          </Button>
          {renderPaginationButtons()}
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
    <Alert/>
    </>
  );
};

export default EmailLogs;
