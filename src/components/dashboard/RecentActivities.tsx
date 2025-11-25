import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
//import { useDashboardRefresh } from './DashboardRefreshContext';
import { API_BASE_URL } from "@/config/api";

// Register necessary Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

const RecentActivities = () => {
  const [statusCounts, setStatusCounts] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alertData, setAlertData] = useState<Array<{
    id: string;
    provider: string;
    branchName: string;
    alertType: string;
    zone: string;
    timestamp: string;
    status: string;
  }>>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return [start, end];
  });
  const [startDate, endDate] = dateRange;
  const [pendingFilter, setPendingFilter] = useState<[Date | null, Date | null]>(dateRange);

  // Last X hours filter state
  const [lastHours, setLastHours] = useState<number | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number | null>(null);
  //const { refreshKey } = useDashboardRefresh();

  useEffect(() => {
    if (!startDate || !endDate) return;
    const fetchStatusCounts = async () => {
      setLoading(true);
      const format = (date: Date) => date.toISOString().split('T')[0];
      const branchCode = sessionStorage.getItem("branch") || "";
      
      const startDateStr = format(startDate);
      const endDateStr = format(endDate);

      const statusUrl = `${API_BASE_URL}/getStatusCountByDateRange?startDate=${startDateStr}&endDate=${endDateStr}&branchCode=${branchCode}`;
      const recordsUrl = `${API_BASE_URL}/getAllRecordsByDateRange?startDate=${startDateStr}&endDate=${endDateStr}&branchCode=${branchCode}`;
      try {
        // Chart data fetch
        const res = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        const json = await res.json();
        if (json.statusCode === 200 && Array.isArray(json.payload)) {
          const counts: Record<string, number> = {};
          let total = 0;
          json.payload.forEach((item: any) => {
            counts[item.remarks] = item.count;
            total += item.count;
          });
          setStatusCounts(counts);
          setTotalCount(total);
        } else {
          throw new Error(`API error: ${JSON.stringify(json)}`);
        }

        // Table data fetch
        const recordsRes = await fetch(recordsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (!recordsRes.ok) {
          const text = await recordsRes.text();
          throw new Error(`HTTP ${recordsRes.status}: ${text}`);
        }
        const recordsJson = await recordsRes.json();
        if (recordsJson.statusCode === 200 && Array.isArray(recordsJson.payload)) {
          // Map API data to table structure based on actual API response
          setAlertData(
            recordsJson.payload.map((item: any, idx: number) => ({
              id: item.id?.toString() || idx.toString(),
              provider: item.vendorName || '', 
              branchName: item.deviceId || '', 
              alertType: item.activeZone || '', 
              zone: item.zoneName || '', 
              timestamp: item.alertDateTime || '', 
              status: item.remarks || '', 
            }))
          );
        } else {
          
          setAlertData([]);
        }
      } catch (e) {
        console.error('Error fetching status counts or records:', e);
        //alert('Error fetching data from API. Check console for details.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatusCounts();
  }, [startDate, endDate]);

  // Prepare data for doughnut chart
  const baseColors = ['#3674B5', '#40A2E3', '#0ABAB5', '#3ABEF9'];
  const highlightColors = ['#1F509A', '#40A2E3', '#099E98', '#2A9FD6']; // darker for highlight
  const borderColors = ['#1F509A', '#2176AE', '#099E98', '#2A9FD6']; // border color for highlight

  const data = {
    labels: ['SECURITY VENDOR INFORMED', 'TESTING', 'ACKNOWLEDGED', 'FALSE ALARM'],
    datasets: [
      {
        data: [
          statusCounts['SECURITY VENDOR INFORMED'] || 0,
          statusCounts['TESTING'] || 0,
          statusCounts['ACKNOWLEDGED'] || 0,
          statusCounts['FALSE ALARM'] || 0,
        ],
        backgroundColor: baseColors.map((color, idx) =>
          selectedSegmentIdx === idx ? highlightColors[idx] : color
        ),
        borderColor: baseColors.map((color, idx) =>
          selectedSegmentIdx === idx ? borderColors[idx] : '#fff'
        ),
        borderWidth: baseColors.map((_, idx) =>
          selectedSegmentIdx === idx ? 6 : 1
        ),
        hoverBackgroundColor: ['#578FCA', '#40A2E3', '#56DFCF', '#3D90D7'],
        // ...existing code...
      },
    ],
  };

  const options = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false, 
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  // Handler for last X hours filter
  const handleLastXHours = (hours: number) => {
    const now = new Date();
    const prev = new Date();
    prev.setTime(now.getTime() - hours * 60 * 60 * 1000);
    setDateRange([prev, now]);
    setPendingFilter([prev, now]);
    setLastHours(hours);
  };

  // Handler for custom date range apply
  const handleApply = () => {
    if (pendingFilter[0] && pendingFilter[1]) {
      setDateRange(pendingFilter);
      setLastHours(null);
    }
  };

  // Chart click handler
  const handleChartClick = (elems: any, elements: any, chart: any) => {
    if (!chart) return;
    const activePoints = chart.getElementsAtEventForMode(
      elems.native,
      'nearest',
      { intersect: true },
      false
    );
    if (activePoints.length > 0) {
      const idx = activePoints[0].index;
      const label = data.labels?.[idx];
      setSegmentFilter(label as string);
      setSelectedSegmentIdx(idx); // highlight the clicked segment
    }
  };

  // Filtered table data based on chart segment
  const filteredAlertData = segmentFilter
    ? alertData.filter((alert) => {
        if (segmentFilter === 'SECURITY VENDOR INFORMED') return alert.status === 'SECURITY VENDOR INFORMED';
        if (segmentFilter === 'TESTING') return alert.status === 'TESTING';
        if (segmentFilter === 'ACKNOWLEDGED') return alert.status === 'ACKNOWLEDGED';
        if (segmentFilter === 'FALSE ALARM') return alert.status === 'FALSE ALARM';
        return true;
      })
    : alertData;

  // Check if chart and table have no data
  const chartHasData = Object.values(statusCounts).some((v) => Number(v) > 0);
  const tableHasData = filteredAlertData.length > 0;

  // Format date to dd/mm/yyyy (with time if present)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    // If time is 00:00:00, just show date
    if (hours === '00' && mins === '00' && secs === '00') {
      return `${day}/${month}/${year}`;
    }
    return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
  };

  // Export to Excel (with enhanced styling)
  const handleExportExcel = () => {
    const now = new Date();
    const dateStr = now.toLocaleString();

    const exportData = filteredAlertData.map((alert, idx) => ({
      'S.No': idx + 1,
      'Service Provider': alert.provider,
      'Branch Name': alert.branchName,
      'Alert Zones': alert.alertType,
      'Zone': alert.zone,
      'Alert Time Stamp': formatDate(alert.timestamp),
      'Status': alert.status,
    }));

    const heading = [["Recent Activities"]];
    const dateRow = [[`Downloaded at: ${dateStr}`]];
    const header = ["S.No", "Service Provider", "Alert Zones", "Zone", "Alert Time Stamp", "Status"];

    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, heading, { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, dateRow, { origin: "A2" });
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A4" });
    XLSX.utils.sheet_add_json(ws, exportData, { origin: "A5", skipHeader: true });

    ws['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 22 },  // Service Provider
      { wch: 18 },  // Alert Zones
      { wch: 14 },  // Zone
      { wch: 24 },  // Alert Time Stamp
      { wch: 14 },  // Status
    ];

    // Heading (A1): blue bg, white, bold, large
    ws['A1'].s = {
      font: { bold: true, sz: 20, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F509A" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

    // Date row (A2): yellow bg, black, italic
    ws['A2'].s = {
      font: { italic: true, sz: 13, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "FFF200" } },
      alignment: { horizontal: "left", vertical: "center" }
    };
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });

    // Header row (A4:F4): black bg, white, bold, center
    for (let C = 0; C < header.length; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: 3, c: C })];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 15, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "000000" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
      }
    }

    // Data rows (starting from row 5, i.e., r=4)
    for (let R = 0; R < exportData.length; ++R) {
      const excelRow = R + 4;
      const fillColor = excelRow % 2 === 0 ? "FFFFFF" : "F5F5F5";
      for (let C = 0; C < header.length; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: excelRow, c: C })];
        if (cell) {
          cell.s = {
            font: { sz: 13, color: { rgb: "222222" } },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          };
        }
      }
      // Status cell color (different for each status)
      const statusCell = ws[XLSX.utils.encode_cell({ r: excelRow, c: 5 })];
      if (statusCell) {
        let color = "3674B5"; // Default blue
        if (exportData[R]['Status'] === 'SECURITY VENDOR INFORMED') color = "3674B5";
        else if (exportData[R]['Status'] === 'TESTING') color = "40A2E3";
        else if (exportData[R]['Status'] === 'ACKNOWLEDGED') color = "0ABAB5";
        else if (exportData[R]['Status'] === 'FALSE ALARM') color = "3ABEF9";
        statusCell.s = {
          ...statusCell.s,
          font: { ...statusCell.s.font, bold: true, color: { rgb: color } }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RecentActivities');
    XLSX.writeFile(wb, 'recent_activities.xlsx', { cellStyles: true });
  };

  // Export to PDF (with header styling)
   const handleExportPDF = () => {
    const logoImg = new Image();
    logoImg.src = `${window.location.origin}/Digitals45.jpg`;

    logoImg.onload = () => {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });

      // Add logo
      doc.addImage(logoImg, 'JPEG', 40, 20, 120, 60);

      // Horizontal rule
      doc.setDrawColor(180);
      doc.line(40, 90, 800, 90);

      // Heading + About
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Recent Activities', 700, 50, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        'ABOUT: Recent Activities provides a summary of alert events, including service provider, alert zones, zone, timestamp, and status. This helps in tracking and auditing security events.',
        40, 110,
        { maxWidth: 760 }
      );

      // Subtitle
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();

      doc.setFontSize(13);
      doc.setFillColor(255, 255, 255);
      doc.rect(40, 140, 760, 28, 'F');
      doc.setTextColor(128, 128, 128);
      doc.text(`DI-HMS : Recent Activities - ${dateStr}, ${timeStr}`, 420, 160, { align: 'center' });

      // Prepare Table
      const headers = [["S.No", "Service Provider", "Alert Zones", "Zone", "Alert Time Stamp", "Status"]];
      const rows = filteredAlertData.map((alert, idx) => [
        idx + 1,
        alert.provider,
        alert.alertType,
        alert.zone,
        formatDate(alert.timestamp),
        alert.status,
      ]);

      autoTable(doc, {
        startY: 180,
        head: headers,
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [60, 60, 60],
        },
        styles: {
          cellPadding: 5,
          overflow: 'linebreak',
          minCellHeight: 18,
          font: 'helvetica',
        },
        columnStyles: {
          0: { halign: 'right' },
          1: { halign: 'left' },
          2: { halign: 'left' },
          3: { halign: 'left' },
          4: { halign: 'left' },
          5: { halign: 'center' },
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 5) {
            const val = data.cell.raw;
            if (val === 'SECURITY VENDOR INFORMED') {
              data.cell.styles.textColor = [54, 116, 181];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'TESTING') {
              data.cell.styles.textColor = [64, 162, 227];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'ACKNOWLEDGED') {
              data.cell.styles.textColor = [10, 186, 181];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'FALSE ALARM') {
              data.cell.styles.textColor = [58, 190, 249];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: function () {
          // Watermark
          doc.saveGraphicsState();
          doc.setGState(doc.GState({ opacity: 0.08 }));
          doc.setFontSize(100);
          doc.setTextColor(128, 128, 128);
          doc.text('Digitals India', 200, 450, { angle: 25 });
          doc.restoreGraphicsState();

          // Footer
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(`Generated on: ${dateStr}`, 40, doc.internal.pageSize.height - 20);
          doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 20);
        }
      });

      doc.save('recent_activities.pdf');
    };
  };

  return (
    <div className="bg-white rounded-md border  mb-2">
      <div className="p-2 bg-gray-700 text-white font-medium flex items-center justify-between">
        <span>Recent Activities</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-3 py-1 rounded bg-red-200 text-red-700 hover:bg-red-300 transition-all border border-red-700 shadow-sm text-xs md:text-sm font-bold"
            title="Download as PDF"
          >
           
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1 rounded bg-green-200 text-green-700 hover:bg-green-300 transition-all border border-green-700 shadow-sm text-xs md:text-sm font-bold"
            title="Download as Excel"
          >
           
            Excel
          </button>
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
      <div className="p-3">
        {/* Animated Filter Section */}
        <div
          className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-[1000px] opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}
        >
          <div className="flex flex-row flex-wrap gap-4 items-end bg-gray-50 rounded-md p-4 shadow-inner">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Date Range</label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <DatePicker
                  selectsRange
                  startDate={pendingFilter[0]}
                  endDate={pendingFilter[1]}
                  onChange={(update: [Date | null, Date | null]) => setPendingFilter(update)}
                  dateFormat="yyyy-MM-dd"
                  className="rounded px-2 py-1 text-xs"
                  isClearable={false}
                  maxDate={new Date()}
                  showTimeSelect={false}
                  popperPlacement="bottom"
                  popperClassName="z-50"
                  portalId="root-portal"
                  customInput={
                    <input
                      className="rounded px-2 py-1 text-xs bg-white text-gray-900 border border-gray-300"
                      readOnly
                      value={
                        pendingFilter[0] && pendingFilter[1]
                          ? `${pendingFilter[0].toLocaleDateString()} - ${pendingFilter[1].toLocaleDateString()}`
                          : ''
                      }
                      placeholder="Select date range"
                    />
                  }
                />
                <button
                  className="bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded text-xs font-semibold shadow transition"
                  onClick={handleApply}
                  disabled={!pendingFilter[0] || !pendingFilter[1]}
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Last Hours</label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <select
                  className="rounded px-2 py-1 text-xs bg-white text-gray-900 border border-gray-300"
                  value={lastHours ?? ''}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val > 0) handleLastXHours(val);
                  }}
                >
                  <option value="">Last Hours</option>
                  <option value="1">Last 1 Hour</option>
                  <option value="2">Last 2 Hours</option>
                  <option value="6">Last 6 Hours</option>
                  <option value="12">Last 12 Hours</option>
                  <option value="24">Last 24 Hours</option>
                  <option value="48">Last 48 Hours</option>
                </select>
                <button
                  className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-1 rounded text-xs font-semibold shadow transition"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 30);
                    setDateRange([start, end]);
                    setPendingFilter([start, end]);
                    setLastHours(null);
                    setSegmentFilter(null);
                  }}
                  type="button"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Show "No data found" if both chart and table have no data */}
        {!loading && !chartHasData && !tableHasData ? (
          <div className="w-full flex flex-col items-center justify-center py-16">
            <span className="text-gray-500 text-lg font-semibold">No data found</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* Chart Section */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              <div className="w-60 h-60 mx-2">
                {loading ? (
                  <div>Loading...</div>
                ) : (
                  <Doughnut
                    data={data}
                    options={{
                      ...options,
                      onClick: (event, elements, chart) => handleChartClick({ native: event }, elements, chart),
                    }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3" style={{ backgroundColor: '#3674B5' }}></span>
                  <span className="text-xs text-dark">
                    SECURITY VENDOR INFORMED: {totalCount ?((statusCounts['SECURITY VENDOR INFORMED'] || 0) / totalCount * 100).toFixed(3) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3" style={{ backgroundColor: '#40A2E3' }}></span>
                  <span className="text-xs text-dark">
                    TESTING: {totalCount ? ((statusCounts['TESTING'] || 0) / totalCount * 100).toFixed(3) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3" style={{ backgroundColor: '#0ABAB5' }}></span>
                  <span className="text-xs text-dark">
                    ACKNOWLEDGED: {totalCount ? ((statusCounts['ACKNOWLEDGED'] || 0) / totalCount * 100).toFixed(3) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3" style={{ backgroundColor: '#3ABEF9' }}></span>
                  <span className="text-xs text-dark">
                    FALSE ALARM: {totalCount ? ((statusCounts['FALSE ALARM'] || 0) / totalCount * 100).toFixed(3) : 0}%
                  </span>
                </div>
              </div>
              {segmentFilter && (
                <button
                  className="mt-2 text-xs text-blue-700 underline"
                  onClick={() => {
                    setSegmentFilter(null);
                    setSelectedSegmentIdx(null);
                  }}
                >
                  Clear Chart Filter
                </button>
              )}
            </div>
            {/* Table Section */}
            {/* Wrapper Section */}
<div className="w-full lg:w-3/4">
  {/* Scrollable Table Section */}
  <div
    className="overflow-x-auto"
    style={{ maxHeight: '320px', overflowY: 'auto' }}
  >
    {loading ? (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        <span className="ml-4 text-gray-600 text-lg">Loading...</span>
      </div>
    ) : (
    <table
      className="min-w-full  border  rounded-lg shadow bg-white table-fixed border-separate"
      style={{ borderSpacing: 0 }}
    >
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
            Service Provider
          </th>
          <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
            Site Name
          </th>
          <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
            Alert Zones
          </th>
          <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
            Zone
          </th>
          <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
            Alert Time Stamp
          </th>
          <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredAlertData.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="text-center py-8 text-gray-500 font-semibold"
            >
              No data found
            </td>
          </tr>
        ) : (
          filteredAlertData.map((alert, idx) => (
            <tr key={alert.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">
                {alert.provider}
              </td>
              <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">
                {alert.branchName}
              </td>
              <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">
                {alert.alertType.split(':')[0]}
              </td>
              <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">
                {alert.zone}
              </td>
              <td className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100 border-r ">
                {formatDate(alert.timestamp)}
              </td>
              <td className="px-2 py-2 text-sm border-b border-gray-100 text-nowrap">
                <span
                  className="px-3 py-1 text-xs rounded-full font-semibold shadow-md"
                  style={{
                    backgroundColor:
                      alert.status === 'SECURITY VENDOR INFORMED'
                        ? '#d1e1f1'
                        : alert.status === 'TESTING'
                        ? '#ebf5fc'
                        : alert.status === 'ACKNOWLEDGED'
                        ? '#c7fcfa'
                        : alert.status === 'FALSE ALARM'
                        ? '#99ddfc'
                        : '#fff',
                    color:
                      alert.status === 'SECURITY VENDOR INFORMED'
                        ? '#3674B5'
                        : alert.status === 'TESTING'
                        ? '#40A2E3'
                        : alert.status === 'ACKNOWLEDGED'
                        ? '#0ABAB5'
                        : alert.status === 'FALSE ALARM'
                        ? '#3ABEF9'
                        : '#e5e7eb',
                    boxShadow: '0 2px 8px 0 rgba(52, 144, 220, 0.15)',
                  }}
                >
                  {alert.status === 'SECURITY VENDOR INFORMED'
                    ? 'VENDOR INFORMED'
                    : alert.status}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    )}
  </div>
  {/* Fixed Text Below Table */}
  <div className="text-sm text-gray-600 mt-2 px-2 text-right">
    Showing {filteredAlertData.length} of {alertData.length} entries
  </div>
</div>

          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;
