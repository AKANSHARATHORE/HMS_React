import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, FileSpreadsheet, Printer, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, FileSignature } from "lucide-react";
import { exportToExcel, exportToPDF, copyToClipboard } from "./AllAlertButton";
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";

interface ReportDataItem {
  branchCode?: string;
  ifsc?: string;
  branchName?: string;
  branchContact?: string;
  mobileNo?: string;
  systemIntegrator?: string;
  vendorName?: string;
  product?: string;
  alarmtype?: string;
  alertType?: string;
  alertTimeStamp?: string;
  alarmTime?: string;
  resolvedTimeStamp?: string;
  issueResolvedTime?: string;
  resolution?: string;
  timeDifference?: string;
  status?: string;
  alarmDescription?: string;
}

interface VendorDataItem {
  vendorId: string;
  vendorName: string;
}

interface BranchItem {
  branchCode: string;
  branchDesc: string;
  branchName: string;
  branchType?: string;
}

type FilterParams = {
  branch?: string;
  zone?: string;
  branchName?: string;
  systemIntegrator?: string;
  product?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

const AlertsDashboard = () => {
  const [reportData, setReportData] = useState<ReportDataItem[]>([]);
  const [allReportData, setAllReportData] = useState<ReportDataItem[]>([]);
  
  const [vendorData, setVendorData] = useState<VendorDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 2);

  // Set default dates in filter state - ALL fields start with empty/all values
  const defaultFilters = {
    branch: '',
    zone: '',
    branchName: '',
    systemIntegrator: '',
    product: '',
    status: '',
    fromDate: formatDate(sevenDaysAgo),
    toDate: formatDate(today),
    search: ''
  };
  const [filters, setFilters] = useState(defaultFilters);
  
  
  const fetchAlertReportData = async (filterParams: FilterParams = {}) => {
    setIsLoading(true);
    const branchCode = sessionStorage.getItem("branch");
    
    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams({
        branchCode: branchCode || '',
        fromDate: filterParams.fromDate || filters.fromDate,
        toDate: filterParams.toDate || filters.toDate,
        ...(filterParams.branch && { branch: filterParams.branch }),
        ...(filterParams.zone && { zone: filterParams.zone }),
        ...(filterParams.branchName && { branchCode: filterParams.branchName }),
        ...(filterParams.systemIntegrator && { vendorFilter: filterParams.systemIntegrator }),
        ...(filterParams.product && { productFilter: filterParams.product }),
        ...(filterParams.status && { statusFilter: filterParams.status }),
        ...(filterParams.search && { search: filterParams.search })
      });

      const url = `${API_BASE_URL}/getResponseTimeReport?${queryParams.toString()}`;
      console.log('Fetching data with URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      const result = await response.json();
      const allreportData = result.payload.inputStatusDetails || [];
      setAllReportData(allreportData);
      setReportData(allreportData);
      console.log('Fetched data:', allreportData);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to fetch alert data");
    } finally {
      setIsLoading(false);
    }
  };

  const getVenderData = async () => {
    try {
      const url = `${API_BASE_URL}/getAllActiveVendors`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      const result = await response.json();
      const vendorData = result.payload || [];
      setVendorData(vendorData);
    } catch (err) {
      console.error("Error fetching vendor data", err);
      setError("Failed to fetch vendor data");
    }
  }

  useEffect(() => {
    fetchAlertReportData();
    getVenderData();
  }, []);
  
  const [showFilters, setShowFilters] = useState(false);
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const loggedBranchCode = sessionStorage.getItem('branch');
  
  // Track if head office was fetched from getAllChildren
  const [headOfficeFromChildren, setHeadOfficeFromChildren] = useState(false);
  const [defaultParentCode, setDefaultParentCode] = useState<string | null>(null);

  // Fetch Head Offices
  useEffect(() => {
    const getHeadBranch = async () => {
      try {
        // Try to get head office by loggedBranchCode
        let url = `${API_BASE_URL}/getHeadOfficeByBranchCode?branchCode=${loggedBranchCode}`;
        let response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        let result = await response.json();
        let data = result.payload || [];
        // If no head office found, try to get parentCode from getAllChildren and fetch again
        if (!data || data.length === 0) {
          const childUrl = `${API_BASE_URL}/getAllChildren?branchCode=${loggedBranchCode}`;
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
              setFilters(prev => ({ ...prev, branch: parentCode }));
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
            (branch: BranchItem) => branch.branchType === 'HEAD OFFICE'
          );
          setHeadOffices(filtered);
          setZoneDisabled(filtered.length === 0);
        } else {
          setZoneDisabled(true);
        }
      } catch (err) {
        console.error('Error fetching head offices:', err);
        setHeadOfficeFromChildren(false);
        setDefaultParentCode(null);
      }
    }

    getHeadBranch();  
  }, [loggedBranchCode]);

  // Fetch Zones when Head Office changes
  useEffect(() => {
    const getFetchZone = async () => {
      if (!filters.branch) {
        setZones([]);
        setZoneDisabled(true);
        setBranches([]);
        setBranchDisabled(true);
        return;
      }

      try {
        const url = `${API_BASE_URL}/getAllZonesByBranchCode?branchCode=${filters.branch}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        let data = result.payload || [];
        // If head office was fetched from getAllChildren and has multiple child zones, only show logged-in zone
        if (headOfficeFromChildren && data.length > 1) {
          data = data.filter((zone: BranchItem) => zone.branchCode === loggedBranchCode);
        }
        if (data && data.length > 0) {
          setZones(data);
          setZoneDisabled(false);
        } else {
          setZones([]);
          setZoneDisabled(true);
        }
        setBranches([]);
        setBranchDisabled(true);
        setFilters(prev => ({ ...prev, zone: '', branchName: '' }));
      } catch (err) {
        console.error('Error fetching zones:', err);
        alert('Error loading zones. Please try again.');
      }
    }
    getFetchZone();
   
  }, [filters.branch, loggedBranchCode, headOfficeFromChildren]);

  // Fetch Branches when filters.zone (Controlling Office) changes
  useEffect(() => {
    const getBranchDetail = async () => {
      if (!filters.zone) {
        setBranches([]);
        setBranchDisabled(true);
        return;
      }

      try {
        const url = `${API_BASE_URL}/getAllBranchesAndDevicesbyBranchCode?branchCode=${filters.zone}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        })
        const result = await response.json();
        const data = result.payload || [];
        if (data && data.length > 0) {
          setBranches(data);
          setBranchDisabled(false);
        } else {
          setBranches([]);
          setBranchDisabled(true);
        }
        
        // Reset site selection to "All" when controlling office changes
        setFilters(prev => ({ ...prev, branchName: '' }));
      } catch (err) {
        console.error('Error fetching branches:', err);
        alert('Error loading branches. Please try again.');
      }
    }
    getBranchDetail();
  }, [filters.zone]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reportData.slice(startIndex, endIndex);
  }, [reportData, currentPage]);

  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
    fetchAlertReportData(filters);
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    fetchAlertReportData(defaultFilters);
    setCurrentPage(1);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';

    // Match DD/MM/YYYY, HH:mm:ss
    const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})$/);

    if (!match) return 'Invalid Date';

    const [_, day, month, year, hour, minute, second] = match;

    // Build a proper ISO format
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const date = new Date(isoString);

    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

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
        <button key={1} onClick={() => setCurrentPage(1)} 
                className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50">
          1
        </button>
      );
      if (start > 2) {
        buttons.push(<span key="start-ellipsis" className="px-2">...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 border ${
            currentPage === i
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        buttons.push(<span key="end-ellipsis" className="px-2">...</span>);
      }
      buttons.push(
        <button key={totalPages} onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50">
          {totalPages}
        </button>
      );
    }

    return buttons;
  };
  
  const printSection = () => {
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>All Alert Report</title>
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
              <div class="print-title">All Alert Report</div>
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

  const handleExcelExport = () => {
    exportToExcel(reportData as any, 'All_Alert_Data');
  };

  const handlePDFExport = () => {
    exportToPDF(reportData as any, 'All_Alert_Data');
  };

  const handleCopyData = () => {
    copyToClipboard(reportData as any);
  }
  const [headOffices, setHeadOffices] = useState<BranchItem[]>([]);
  const [zones, setZones] = useState<BranchItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [zoneDisabled, setZoneDisabled] = useState(true);
  const [branchDisabled, setBranchDisabled] = useState(true);
 
  return (
    <>
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
          All Alert Report
        </h2>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handleExcelExport}>
            <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handlePDFExport}>
            <FileSignature className="w-4 h-4 text-red-500" /> PDF
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={printSection}>
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </Button>

          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 rounded px-3 py-1 text-xs flex items-center gap-1 border border-blue-300 shadow-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          showFilters ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'
        }`}
      >
        <div className="bg-gray-50 rounded-md p-4 shadow-inner">
          {/* First row: first 3 filters with border, responsive */}
          <div className="flex flex-col md:flex-row gap-4 items-end border-2 border-blue-300 rounded-md p-3 bg-white mb-4">
            {/* Head Office Branch */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Head Office</label>
              <select
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                value={defaultParentCode ? defaultParentCode : filters.branch || ""}
                disabled={headOffices.length === 0 || !!defaultParentCode}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({ ...prev, branch: value, zone: '', branchName: '' }));
                }}
              >
                <option value="">All</option>
                {headOffices.map((branch) => (
                  <option key={branch.branchCode} value={branch.branchCode}>
                    {branch.branchDesc}
                  </option>
                ))}
              </select>
            </div>
            {/* Controlling Office */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Controlling Office</label>
              <select
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                value={filters.zone || ""}
                disabled={zoneDisabled}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({ ...prev, zone: value, branchName: '' }));
                }}
              >
                <option value="">All</option>
                {zones.map((zone) => (
                  <option key={zone.branchCode} value={zone.branchCode}>
                    {zone.branchDesc}
                  </option>
                ))}
              </select>
            </div>
            {/* Branch */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Site</label>
              <select
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                value={filters.branchName}
                disabled={branchDisabled}
                onChange={(e) => handleFilterChange("branchName", e.target.value)}
              >
                <option value="">All</option>
                {branches.map((branch) => (
                  <option key={branch.branchCode} value={branch.branchCode}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Second row: other filters, responsive */}
          <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end">
            {/* System Integrator */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">System Integrator</label>
              <select
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                value={filters.systemIntegrator}
                onChange={(e) => handleFilterChange("systemIntegrator", e.target.value)}
              >
                <option value="">All</option>
                {vendorData.map((vendor) => (
                  <option key={vendor.vendorId} value={vendor.vendorName}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            </div>
            {/* Product */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Product</label>
              <select
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                value={filters.product}
                onChange={(e) => handleFilterChange("product", e.target.value)}
              >
                <option value="">All</option>
                <option value="CCTV">CCTV</option>
                <option value="SECURITY ALARM">Security Alarm</option>
                <option value="FIRE ALARM">Fire Alarm</option>
                <option value="BACS">BACS</option>
                <option value="ETL">ETL</option>
              </select>
            </div>
            {/* Status */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Status</label>
              <select
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            {/* From Date */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
            {/* To Date */}
            <div className="flex-1 min-w-[180px] w-full md:w-auto">
              <label className="block text-sm mb-1 font-semibold text-blue-900">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
            {/* Buttons */}
            <div className="flex-1 flex justify-end items-end min-w-[180px] w-full md:w-auto">
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded text-sm font-semibold shadow transition"
                >
                  Search
                </button>
                <button
                  onClick={handleReset}
                  className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-2 rounded text-sm font-semibold shadow transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading Data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded border border-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Alert Data Table */}
      <div id="print-section" className=" border rounded shadow-sm max-h-[60vh] overflow-y-auto ">
        <table className="w-full text-sm text-left ">
          <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
            <tr>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right ">S.No</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left ">Site Name</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right ">Contact</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Integrator</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Product</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Alert Type</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">Alert Time</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">Resolved Time</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left ">Resolution</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row, index) => (
              <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="px-3 py-2 text-right">{(currentPage -1)*itemsPerPage  + index + 1}</td>
                <td className="px-3 py-2 text-left">{row.branchName || ''}</td>
                <td className="px-3 py-2 text-right">{row.branchContact || row.mobileNo || ''}</td>
                <td className="px-3 py-2 text-left">{row.systemIntegrator || row.vendorName || ''}</td>
                <td className="px-3 py-2 text-left">{row.product || row.alarmtype || ''}</td>
                <td className="px-3 py-2 text-left">{row.alertType || ''}</td>
                <td className="px-3 py-2 text-right">{row.alertTimeStamp ? formatDateTime(row.alertTimeStamp) : row.alarmTime ? formatDateTime(row.alarmTime) : 'N/A'}</td>
                <td className="px-3 py-2 text-right">{row.resolvedTimeStamp ? formatDateTime(row.resolvedTimeStamp) : row.issueResolvedTime ? formatDateTime(row.issueResolvedTime) : 'N/A'}</td>
                <td className="px-3 py-2 text-left">{row.resolution || row.timeDifference || ''}</td>
                <td className="px-3 py-2 text-left">{row.status || row.alarmDescription || ''}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={11} className="text-center py-3 text-gray-500">
                  {isLoading ? 'Loading...' : 'No data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-gray-600">
        <div>
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, reportData.length)} to {Math.min(currentPage * itemsPerPage, reportData.length)} of {reportData.length} entries
        </div>
        <div className="flex items-center space-x-1 mt-2 md:mt-0">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50">
            <ChevronLeft size={16} />
          </button>
          {renderPaginationButtons()}
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
    <Alert/>
    </>
  );
};

export default AlertsDashboard;