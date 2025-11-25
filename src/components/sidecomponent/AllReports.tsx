import React, { useEffect, useState, useRef } from 'react';
import { Button } from '../ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_BASE_URL } from '@/config/api';

const REPORTS = [
  { id: 'branch', label: 'Branch Report' },
  { id: 'uptime', label: 'Uptime Report' },
  { id: 'cctvTat', label: 'CCTV TAT Report' },
  { id: 'fasTat', label: 'FAS TAT Report' },
  { id: 'sasTat', label: 'SAS TAT Report' },
  { id: 'bacsTat', label: 'BACS TAT Report' },
  { id: 'etlTat', label: 'ETL TAT Report' },
];


const AllReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const localBranchCode = sessionStorage.getItem("branch");

  useEffect(() => {
    // Fetch all reports in parallel
    setLoading(true);
    const branchCode = localBranchCode; // You can make this dynamic if needed
    Promise.all([
      fetch(`${API_BASE_URL}/getSystemWiseBranchReport?branchCode=BR-2`).then(response => response.json()),
      fetch(`${API_BASE_URL}/getUptimeReportByTime?branchCode=${branchCode}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/getTATReport?branchCode=${branchCode}&zoneType=CCTV`).then(r => r.json()),
      fetch(`${API_BASE_URL}/getTATReport?branchCode=${branchCode}&zoneType=FIRE ALARM`).then(r => r.json()),
      fetch(`${API_BASE_URL}/getTATReport?branchCode=${branchCode}&zoneType=SECURITY ALARM`).then(r => r.json()),
      fetch(`${API_BASE_URL}/getTATReport?branchCode=${branchCode}&zoneType=BACS`).then(r => r.json()),
      fetch(`${API_BASE_URL}/getTATReport?branchCode=${branchCode}&zoneType=ETL`).then(r => r.json()),
    ])
      .then(([
        branch,
        uptime,
        cctvTat,
        fasTat,
        sasTat,
        bacsTat,
        etlTat,
      ]) => {
        setData({ branch, uptime, cctvTat, fasTat, sasTat, bacsTat, etlTat });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    for (let i = 0; i < REPORTS.length; i++) {
      const ref = sectionRefs.current[i];
      if (ref) {
        const canvas = await html2canvas(ref, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        if (i > 0) doc.addPage();
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
    }
    doc.save('All_Reports.pdf');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} disabled={loading} variant="destructive">
          Export TAT Reports to PDF
        </Button>
      </div>
      {REPORTS.map((report, idx) => (
        <div
          key={report.id}
          ref={el => (sectionRefs.current[idx] = el)}
          className="bg-white rounded shadow p-4"
        >
          <h2 className="text-lg font-bold mb-3">{report.label}</h2>
          {/* Render Branch Report Table */}
          {report.id === 'branch' ? (
            loading ? (
              <div className="text-center text-muted">Loading...</div>
            ) : (
              data.branch && Array.isArray(data.branch.payload) ? (
                data.branch.payload.length > 0 ? (
                  <div className="overflow-x-auto">
                    {(() => {
                      // Fixed zone type order
                      const fixedZoneTypes = ['CCTV', 'Security Alarm', 'Fire Alarm', 'ETL', 'BACS'];
                      return (
                        <table className="min-w-full text-sm border-separate border-spacing-0">
                          <thead>
                            <tr className="bg-gray-100 text-black-400">
                              <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">Branch Name</th>
                              <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">Ifsc Code</th>
                              {fixedZoneTypes.map((zoneType) => (
                                <th key={zoneType} className="px-4 py-2 font-semibold border-b border-gray-400 text-center">{zoneType}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody >
                            {data.branch.payload.map((branch: any, i: number) => {
                              // Map zoneType to status for this branch
                              const zoneStatusMap: Record<string, string> = {};
                              branch.zoneDTOList?.forEach((zone: any) => {
                                if (zone.zoneType) zoneStatusMap[zone.zoneType] = zone.status;
                              });
                              return (
                                <tr key={i}>
                                  <td className="px-4 py-2 border-b border-gray-100 font-medium bg-white align-middle">{branch.branchName}</td>
                                  <td className="px-4 py-2 border-b border-gray-100 bg-white align-middle">{branch.bank}</td>
                                  {fixedZoneTypes.map((zoneType) => {
                                    const status = zoneStatusMap[zoneType];
                                    let label = '';
                                    let badgeClass = '';
                                    if (status === 'Working') {
                                      label = 'Online';
                                      badgeClass = 'bg-green-100 text-green-800';
                                    } else if (status === 'Not Working') {
                                      label = 'Offline';
                                      badgeClass = 'bg-red-100 text-red-800';
                                    } else if (status) {
                                      label = status;
                                      badgeClass = 'bg-gray-100 text-gray-800';
                                    } else {
                                      label = '-';
                                      badgeClass = 'bg-gray-50 text-gray-400';
                                    }
                                    return (
                                      <td key={zoneType} className="px-4 py-2 border-b border-gray-100 text-center align-middle">
                                        <span className={`inline-block min-w-[60px] px-2 py-1 text-xs font-semibold rounded ${badgeClass}`}>{label}</span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-muted">No data found.</div>
                )
              ) : (
                <div className="text-center text-red-500">Branch data not available or invalid format.</div>
              )
            )
          ) : report.id === 'uptime' ? (
            loading ? (
              <div className="text-center text-muted">Loading...</div>
            ) : (
              (() => {
                const deviceTypes = ['CCTV', 'Security Alarm', 'Fire Alarm', 'ETL', 'BACS'];
                const uptimeData = data.uptime && Array.isArray(data.uptime.payload) ? data.uptime.payload : [];
                if (!uptimeData.length) {
                  return <div className="text-center text-muted">No data found.</div>;
                }
                // Group by branchName
                const branchMap: Record<string, Record<string, any>> = {};
                uptimeData.forEach((item: any) => {
                  if (!branchMap[item.branchName]) branchMap[item.branchName] = {};
                  branchMap[item.branchName][item.deviceType] = item;
                });
                const branchNames = Object.keys(branchMap);
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-gray-100 text-black-400">
                          <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">Branch Name</th>
                          {deviceTypes.map(type => (
                            <th key={type} className="px-4 py-2 font-semibold border-b border-gray-400 text-left">{type}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {branchNames.map((branchName, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 border-b border-gray-100 bg-white align-middle">{branchName}</td>
                            {deviceTypes.map(type => (
                              <td key={type} className="px-4 py-2 border-b border-gray-100 bg-white align-middle">
                                {branchMap[branchName][type]?.dayUptime ?? '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            )
          ) : (
            // Render TAT Reports Table for each TAT report
            loading ? (
              <div className="text-center text-muted">Loading...</div>
            ) : (
              (() => {
                let tatData;
                if (report.id === 'cctvTat') tatData = data.cctvTat;
                else if (report.id === 'fasTat') tatData = data.fasTat;
                else if (report.id === 'sasTat') tatData = data.sasTat;
                else if (report.id === 'bacsTat') tatData = data.bacsTat;
                else if (report.id === 'etlTat') tatData = data.etlTat;
                if (tatData && Array.isArray(tatData.payload)) {
                  if (tatData.payload.length === 0) {
                    return <div className="text-center text-muted">No data found.</div>;
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border-separate border-spacing-0">
                        <thead>
                          <tr className="bg-gray-100 text-black-400">
                            <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">Site Name</th>
                            <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">IFSC</th>
                            <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">Alert Type</th>
                            <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">Created Time</th>
                            <th className="px-4 py-2 font-semibold border-b border-gray-400 text-left">TAT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tatData.payload.map((item: any, i: number) => (
                            <tr key={i}>
                              <td className="px-4 py-2 border-b border-gray-100 bg-white align-middle">{item.branchName}</td>
                              <td className="px-4 py-2 border-b border-gray-100 bg-white align-middle">{item.ifsc}</td>
                              <td className="px-4 py-2 border-b border-gray-100 bg-white align-middle">{item.zone}</td>
                              <td className="px-4 py-2 border-b border-gray-100 bg-white align-middle">Faulty Since {item.createdTime ? new Date(item.createdTime).toLocaleString() : '-'}</td>
                              <td className="px-4 py-2 border-b border-gray-100 bg-white align-middle">{item.downtime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                } else {
                  return <div className="text-center text-red-500">TAT data not available</div>;
                }
              })()
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default AllReports;
