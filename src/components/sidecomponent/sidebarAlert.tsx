import React, { useEffect, useState } from 'react';
import { Search, FileText, FileSpreadsheet, Printer, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import axios from 'axios';
import { Button } from "@/components/ui/button";

import { Building2, FileSignature } from "lucide-react";
import { copyToClipboard, exportToExcel, exportToPDF } from './AlertButton';
import { API_BASE_URL } from "@/config/api";

const AlertReports = () => {
  const [branches, setBranches] = useState([]);
  const [zoneNames, setZoneNames] = useState([]);
  const [alertTypes, setAlertTypes] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [alertType, setAlertType] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [defaultData, setDefaultData] = useState([]);
  const [searchData, setSearchData] = useState(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 100;
  const branchCode = sessionStorage.getItem('branch');

  useEffect(() => {
    fetchBranches();
    fetchAlerts(0);
  }, []);

useEffect(() => {
  
  if (!searchData) {
    fetchAlerts(page); 
  } 
    else {
        const start = page * pageSize;
        const end = start + pageSize;
        setDefaultData(searchData.slice(start, end));
        setTotalPages(Math.ceil(searchData.length / pageSize));
    }
}, [page, searchData]);


  const fetchBranches = async () => {
    try {
      const branchCode = sessionStorage.getItem('branch');
      const res = await axios.get(`${API_BASE_URL}/getAllChildren`, {
        params: { branchCode: branchCode }
      });
      setBranches(res.data.payload || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

const fetchAlerts = async (pageNum) => {
  setLoading(true);
  try {
    // Use selectedBranch if set, else fallback to branchCode from sessionStorage
    const codeToUse = selectedBranch || branchCode;
    const res = await axios.get(`${API_BASE_URL}/getAllAlertsReport`, {
      params: { branchCode: codeToUse, page: pageNum, size: pageSize }
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

  const handleBranchChange = async (e) => {
    const branchCode = e.target.value;
    setSelectedBranch(branchCode);
    setZoneName('');
    setAlertType('');
    setDeviceType('');
    setSearchData(null); 
    setPage(0); 

    if (!branchCode) {
      await fetchAlerts(0); 
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/getAllDeviceZoneNameByBranchCode`, {
        params: { branchCode }
      });

      const payload = res.data.payload;
      if (payload?.zoneList?.length) {
        const zoneSet = new Set();
        const alertTypeSet = new Set();

        payload.zoneList.forEach(zone => {
          if (zone.zoneDesiredName) zoneSet.add(zone.zoneDesiredName);
          if (zone.alertType) alertTypeSet.add(zone.alertType);
        });

        setZoneNames([...zoneSet]);
        setAlertTypes([...alertTypeSet]);
      }
    } catch (err) {
      console.error('Error fetching zone info:', err);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/getAllAlertsReportWithoutPagination`, {
        params: { branchCode: selectedBranch }
      });

      let filtered = res.data.payload || [];

      if (deviceType) {
        filtered = filtered.filter(item => (item.deviceType || '').toLowerCase() === deviceType.toLowerCase());
      }
      if (zoneName) {
        filtered = filtered.filter(item => item.zoneDesiredName === zoneName);
      }
      if (alertType) {
        filtered = filtered.filter(item => item.alertType === alertType);
      }
      if (fromDate) {
        filtered = filtered.filter(item => new Date(item.timeStamp) >= new Date(fromDate));
      }
      if (toDate) {
        filtered = filtered.filter(item => new Date(item.timeStamp) <= new Date(toDate));
      }

      setSearchData(filtered);
      setPage(0);
      setTotalPages(Math.ceil(filtered.length / pageSize));
    } catch (err) {
      console.error('Error filtering data:', err);
      setSearchData([]);
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

  const handleReset = async () => {
    setSelectedBranch('');
    setZoneName('');
    setAlertType('');
    setDeviceType('');
    setFromDate('');
    setToDate('');
    setSearchData(null);
    setPage(0);

    await fetchAlerts(0);
  };

const paginatedData = searchData ? searchData.slice(page * pageSize, (page + 1) * pageSize) : defaultData;

 const handleExcelExport = () => {
          exportToExcel(defaultData as any, 'Alert_Data');
      };
  
      const handlePDFExport = () => {
          exportToPDF(defaultData as any, 'Alert_Data');
      };
  
      const handleCopyData = () => {
          copyToClipboard(defaultData as any);
      }

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, page + 1 - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => setPage(0)}
          className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          1
        </button>
      );
      if (start > 2) {
        buttons.push(
          <span key="start-ellipsis" className="px-2">
            ...
          </span>
        );
      }
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i - 1)}
          className={`px-3 py-1 border ${
            page + 1 === i
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
        buttons.push(
          <span key="end-ellipsis" className="px-2">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages - 1)}
          className="px-3 py-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="w-full mx-auto px-4 py-6 font-sans text-sm">
  
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
        Alert Report
        </h2>

        <div className="flex flex-wrap gap-2 items-center">

            <Button variant="outline" className="bg-blue-100 hover:bg-blue-200 text-blue-800 rounded px-2 py-1 text-xs">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handleCopyData}>
            <FileText className="w-4 h-4 text-yellow-500" /> Copy
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handleExcelExport}>
            <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={handlePDFExport}>
            <FileSignature className="w-4 h-4 text-red-500" /> PDF
          </Button>
          <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs flex items-center gap-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 text-blue-500" /> Print
          </Button>
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
      <div >
        {/* Animated Filter Section */}
        <div
          className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}
        >
          <div className="flex flex-row flex-wrap gap-4 items-end bg-gray-50 rounded-md p-4 shadow-inner">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Branch</label>
              <select
                onChange={handleBranchChange}
                value={selectedBranch}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              >
                <option value="">All Sites</option>
                {branches.map(branch => (
                  <option key={branch.branchCode} value={branch.branchCode}>
                    {branch.branchDesc}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Device Type</label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              >
                <option value="">All Device Types</option>
                <option value="Smart Communicator">Smart Communicator</option>
                <option value="SIA">SIA</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Product Name</label>
              <select
                value={zoneName}
                onChange={e => setZoneName(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              >
                <option value="">All Zones</option>
                {zoneNames.map((zone, idx) => (
                  <option key={idx} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Alert Type</label>
              <select
                value={alertType}
                onChange={e => setAlertType(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              >
                <option value="">All Alert Types</option>
                {alertTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full border border-blue-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>
            {/* Buttons aligned right */}
            <div className="flex-1 flex justify-end items-end min-w-[150px]">
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
        </div>

        {loading &&(
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading alert data...</p>
        </div>
      )}

        {/* Table */}
          <div className="border rounded shadow-sm max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
                      <tr>
                          {/* {[
                              'S.No',
                              'Branch Code',
                              'Branch Address',
                              'Device Type',
                              'Service Integrator',
                              'Product Name',
                              'Alert Type',
                              'Time Stamp',
                          ].map((heading) => ( */}
                              <th className="px-3 py-3 font-semibold text-gray-700 text-right">S.No</th>
                              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Site Code</th>
                              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Site Address</th>
                              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Device Type</th>
                              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Service Integrator</th>
                              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Product Name</th>
                              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Alert Type</th>
                              <th className="px-3 py-3 font-semibold text-gray-700 text-right">Time Stamp</th>
                      </tr>
                  </thead>
                  <tbody>
                      
                      {paginatedData.length === 0 ? (
                          <tr>
                              <td colSpan={8} className="text-center py-4 text-gray-500">
                                  Loading...
                              </td>
                          </tr>
                      ) : (
                          paginatedData.map((alert, index) => (
                              <tr
                                  key={index}
                                  className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                      } hover:bg-blue-50`}
                              >
                                  <td className="px-3 py-2 text-right">{page * pageSize + index + 1}</td>
                                  <td className="px-3 py-2 text-left">{alert.ifsc || ''}</td>
                                  <td className="px-3 py-2 text-left">{alert.address || ''}</td>
                                  <td className="px-3 py-2 text-left">{alert.deviceType || '-'}</td>
                                  <td className="px-3 py- text-left">{alert.vendorName || '-'}</td>
                                  <td className="px-3 py-2 text-left">{alert.zoneDesiredName || ''}</td>
                                  <td className="px-3 py-2 text-left">{alert.alertType || ''}</td>
                                  <td className="px-3 py-2 text-right">
                                      {alert.timeStamp
                                          ? alert.timeStamp.slice(0, 19).replace('T', ' ')
                                          : ''}
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>


        {/* Pagination */}

      < div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-gray-600">
        <div>
          Showing {Math.min(page * pageSize + 1, (searchData ? searchData.length : defaultData.length))} to {Math.min((page + 1) * pageSize, (searchData ? searchData.length : defaultData.length))} of {(searchData ? searchData.length : defaultData.length)} entries
        </div>
        <div className="flex items-center space-x-1 mt-2 md:mt-0">
          <button
            onClick={handlePrev}
            disabled={page === 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          {renderPaginationButtons()}
          <button
            onClick={handleNext}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>


        
        
    
  );
};



export default AlertReports;
