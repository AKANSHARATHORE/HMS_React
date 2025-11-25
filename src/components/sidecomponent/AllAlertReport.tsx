import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, FileSpreadsheet, Printer, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, FileSignature } from "lucide-react";
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
  const [vendorData, setVendorData] = useState<VendorDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Set default dates in filter state
  const [filters, setFilters] = useState({
    branch: '',
    zone: '',
    branchName: '',
    systemIntegrator: '',
    product: '',
    status: '',
    fromDate: formatDate(sevenDaysAgo),
    toDate: formatDate(today),
    search: ''
  });

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
        ...(filterParams.branchName && { branchName: filterParams.branchName }),
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

  // Fetch Head Offices
  const [headOffices, setHeadOffices] = useState<BranchItem[]>([]);
  const [zones, setZones] = useState<BranchItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);

  const [selectedHead, setSelectedHead] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  const [zoneDisabled, setZoneDisabled] = useState(true);
  const [branchDisabled, setBranchDisabled] = useState(true);
  const [headDisabled, setHeadDisabled] = useState(true);

  const loggedBranchCode = sessionStorage.getItem('branch');
  
  useEffect(() => {
    const getHeadBranch = async () => {
      try {
        const url = "https://digitalshealthmonitoring.in/getAllChildren?branchCode=" + loggedBranchCode;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        const data = result.payload || [];
        if (data && data.length > 0) {
          const filtered = data.filter(
            (branch: BranchItem) => branch.branchType === 'HEAD OFFICE'
          );
          setHeadOffices(filtered);
          setSelectedHead(filtered.length > 0 ? filtered[0].branchCode : '');
          setHeadDisabled(filtered.length === 0);
        } else {
          setHeadDisabled(true);
        }
      } catch (err) {
        console.error('Error fetching head offices:', err);
      }
    }

    getHeadBranch();  
  }, [loggedBranchCode]);

  // Fetch Zones
  useEffect(() => {
    const getFetchZone = async () => {
      if (!selectedHead) {
        setZones([]);
        setZoneDisabled(true);
        setBranches([]);
        setBranchDisabled(true);
        return;
      }

      try {
        const url = "https://digitalshealthmonitoring.in/getAllZonesByBranchCode?branchCode=" + selectedHead;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        const result = await response.json();
        const data = result.payload || [];

        if (data && data.length > 0) {
          setSelectedZone(data[0].branchCode);
          setZones(data);
          setZoneDisabled(false);
        } else {
          setZones([]);
          setZoneDisabled(true);
        }
        setBranches([]);
        setBranchDisabled(true);
      } catch (err) {
        console.error('Error fetching zones:', err);
        alert('Error loading zones. Please try again.');
      }
    }
    getFetchZone();
  }, [selectedHead]);

  useEffect(() => {
    const getBranchDetail = async () => {
      if (!selectedZone) {
        setBranches([]);
        setBranchDisabled(true);
        return;
      }

      try {
        const url = "https://digitalshealthmonitoring.in/getBranchesByBranchCodes?branchCode=" + selectedZone;
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
      } catch (err) {
        console.error('Error fetching branches:', err);
        alert('Error loading branches. Please try again.');
      }
    }
    getBranchDetail();
  }, [selectedZone]);

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

  return (
    <div className="container mx-auto px-4 py-6 font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
          All Alert Report
        </h2>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Filter Modal Trigger */}
          <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 rounded px-3 py-1 text-xs flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-0 [&>button]:hidden">
              <DialogHeader className="relative p-0">
                <div className="flex justify-between items-center bg-gradient-to-r from-gray-800 to-blue-800 text-white px-6 py-4 rounded-t">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter Options
                  </DialogTitle>
                  <DialogClose asChild>
                    <button className="text-white hover:text-gray-300 focus:outline-none">
                      <X className="w-5 h-5" />
                    </button>
                  </DialogClose>
                </div>
              </DialogHeader>

              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Branch filter */}
                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">Head Office</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.branch}
                      disabled={headDisabled}
                      onChange={(e) => handleFilterChange('branch', e.target.value)}
                    >
                      <option value="All">All</option>
                      {headOffices.map((branch) => (
                        <option key={branch.branchCode} value={branch.branchCode}>
                          {branch.branchDesc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Zone filter */}
                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">Zone</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.zone}
                      onChange={(e) => handleFilterChange('zone', e.target.value)}
                      disabled={zoneDisabled}
                    >
                      <option value="All">All</option>
                      {zones.map((zone) => (
                        <option key={zone.branchCode} value={zone.branchCode}>
                          {zone.branchDesc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Name filter */}
                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">Site</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.branchName}
                      disabled={branchDisabled}
                      onChange={(e) => handleFilterChange('branchName', e.target.value)}
                    >
                      <option value="All">All</option>
                      {branches.map((branch) => (
                        <option key={branch.branchCode} value={branch.branchCode}>
                          {branch.branchDesc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* System Integrator filter */}
                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">System Integrator</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.systemIntegrator}
                      onChange={(e) => handleFilterChange('systemIntegrator', e.target.value)}
                    >
                      <option value="">All</option>
                      {vendorData.map((vendor) => (
                        <option key={vendor.vendorId} value={vendor.vendorName}>
                          {vendor.vendorName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">Product</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.product}
                      onChange={(e) => handleFilterChange('product', e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="CCTV">CCTV</option>
                      <option value="SECURITY ALARM">Security Alarm</option>
                      <option value="FIRE ALARM">Fire Alarm</option>
                      <option value="BACS">BACS</option>
                      <option value="ETL">ETL</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block mb-1 text-gray-700 font-medium">Status</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="open">Open</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Date Filters & Search */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">From Date</label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">To Date</label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Search</label>
                    <Input
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full text-sm"
                      placeholder="Search alerts..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {isLoading ? 'SEARCHING...' : 'SEARCH'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="bg-blue-100 hover:bg-blue-200 text-blue-800 rounded px-2 py-1 text-xs">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileText className="w-4 h-4 text-yellow-500" /> Copy
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1">
            <FileSignature className="w-4 h-4 text-red-500" /> PDF
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </Button>
        </div>
      </div>

      
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading alert data...</p>
        </div>
      )}

      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className=" border rounded shadow-sm max-h-[65vh] overflow-y-auto ">
        <table className="w-full text-sm text-left ">
          <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
            <tr>
              {[ 'Site Name', 'Contact', 'Integrator', 'Product', 'Alert Type', 'Alert Time', 'Resolved Time', 'Resolution', 'Status'].map((h) => (
                <th key={h} className="px-3 py-3 font-semibold text-gray-700 ">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row, index) => (
              <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                <td className="px-3 py-2">{row.branchName || ''}</td>
                <td className="px-3 py-2">{row.branchContact || row.mobileNo || ''}</td>
                <td className="px-3 py-2">{row.systemIntegrator || row.vendorName || ''}</td>
                <td className="px-3 py-2">{row.product || row.alarmtype || ''}</td>
                <td className="px-3 py-2">{row.alertType || ''}</td>
                <td className="px-3 py-2">{row.alertTimeStamp ? formatDateTime(row.alertTimeStamp) : row.alarmTime ? formatDateTime(row.alarmTime) : 'N/A'}</td>
                <td className="px-3 py-2">{row.resolvedTimeStamp ? formatDateTime(row.resolvedTimeStamp) : row.issueResolvedTime ? formatDateTime(row.issueResolvedTime) : 'N/A'}</td>
                <td className="px-3 py-2">{row.resolution || row.timeDifference || ''}</td>
                <td className="px-3 py-2">{row.status || row.alarmDescription || ''}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="text-center py-3 text-gray-500">
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
  );
};

export default AlertsDashboard;
