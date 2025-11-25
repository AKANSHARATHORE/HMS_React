import React, { useEffect, useState } from 'react';
import StatusRing from './StatusRing';
import Alert from './DashboardAlert';
import DvrModal from './DvrModal';
import { color } from 'framer-motion';
import { API_BASE_URL } from "@/config/api";

const DeviceStatus = () => {
  const branchCode = sessionStorage.getItem('branch');
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<{ zoneType: string, status: string } | null>(null);
  const [expandedZone, setExpandedZone] = useState<Record<string, any>>({});
  const [zoneData, setZoneData] = useState<Record<string, any[]>>({}); // zoneDTOList holder
  const [dvrModalOpen, setDvrModalOpen] = useState(true);
  const [dvrDetails, setDvrDetails] = useState<any>(null);
  const [dvrLoading, setDvrLoading] = useState<string | null>(null); // branchCode or null
  //const { refreshKey } = useDashboardRefresh();

  const zoneTypes = ['CCTV', 'Security Alarm', 'Fire Alarm', 'BACS', 'ETL'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/getCountsByZoneStatus?branchCode=${branchCode}`);
        const json = await res.json();
        setData(json.payload || {});
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setData({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchCode]);

  const fetchDetailData = async (zoneType: string, status: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/countingZonesByStatus?branchCode=${branchCode}&zoneType=${zoneType}&status=${status}`
      );
      const json = await res.json();
      if (json.statusCode == 200) {
        setDetailData(json.payload || []);
        setSelectedDetail({ zoneType, status });
        setExpandedZone({});
        setZoneData({});
      } else {
        alert(json.message || 'Error fetching data');
      }
    } catch (err) {
      console.error('Error fetching zone details:', err);
    }
  };

  // Status helpers (Same as before)
  const getMainStatus = (v: number) => v == 1 ? "Power Off" : "Power On";
  const getSolarStatus = (v: number) => v == 0 ? "Not Connected" : "Connected";
  const getBatteryStatus = (v: number) =>
    v == 0 ? "Not Installed"
    : v == 1 ? "Charging"
    : v == 2 ? "Battery Low"
    : "Battery Full";
  const getSignalStatus = (v: number) =>
    v == 0 ? "Poor Signal"
    : v == 1 ? "Unknown Signal"
    : v == 2 ? "Very Poor Signal"
    : v == 3 ? "Poor Signal"
    : v == 4 ? "Fair Signal"
    : "Good Signal";
  const getArmedStatus = (v: number) => v == 0 ? "Connected" : "Disconnected";

  // Color helpers (Slightly Lightened Dark Theme)
  const getMainColor = (v: number) => v == 1 ? "#A94442" : "#3C763D"; // Medium Red, Medium Green
  const getMainTextColor = (v: number) => "#FFFFFF";
  const getMainIcon = (v: number) => v == 1 ? "fa fa-power-off" : "fa fa-bolt";

  const getSolarColor = (v: number) => v == 0 ? "#666666" : "#FF9933"; // Medium Gray, Medium Orange
  const getSolarTextColor = (v: number) => "#FFFFFF";
  const getSolarIcon = (v: number) => v == 0 ? "fa fa-cloud" : "fa fa-sun";

  const getBatteryColor = (v: number) =>
    v == 0 ? "#666666"        // Medium Gray
    : v == 1 ? "#E6B800"      // Medium Yellow
    : v == 2 ? "#D9534F"      // Medium Red
    : "#5CB85C";               // Medium Green
  const getBatteryTextColor = (v: number) => "#FFFFFF";
  const getBatteryIcon = (v: number) =>
    v == 0 ? "fa fa-battery-empty"
    : v == 1 ? "fa fa-battery-half"
    : v == 2 ? "fa fa-battery-quarter"
    : "fa fa-battery-full";

  const getSignalColor = (v: number) =>
    v == 0 ? "#666666"        
    : v == 1 ? "#D58512"   
    : v == 2 ? "#C9302C" 
    : v == 3 ? "#E6B800" 
    : v == 4 ? "#31B0D5"   
    : "#5CB85C";    
  const getSignalTextColor = (v: number) => "#FFFFFF";
  const getSignalIcon = (v: number) =>
    v == 0 ? "fa fa-signal"
    : v == 1 ? "fa fa-question-circle"
    : "fa fa-signal";

  const getArmedColor = (v: number) => v == 0 ? "#5CB85C" : "#C9302C"; // Medium Green, Medium Red
  const getArmedTextColor = (v: number) => "#FFFFFF";
  const getArmedIcon = (v: number) => v == 0 ? "fa fa-shield" : "fa fa-shield-alt";

  const getSyncColor = () => "#337AB7"; // Medium Blue
  const getSyncTextColor = () => "#FFFFFF";
  const getSyncIcon = () => "fa fa-refresh";


  return (
    <div className="bg-white rounded-md border border-gray-200">
      <div className="p-2 bg-gray-600 text-white font-medium mb-4">
        Status of Connecting Devices
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5DB996' }}></span>
          <span className="text-sm">Working</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFD66B' }}></span>
          <span className="text-sm">Partially Working</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF5350' }} ></span>
          <span className="text-sm">Not Working</span>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="text-center text-gray-600 py-10">Loading device status...</div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8 pb-4">
          {zoneTypes.map((zone) => (
            <StatusRing
              key={zone}
              title={zone}
              working={data[zone]?.['Working'] || 0}
              notWorking={data[zone]?.['Not Working'] || 0}
              partiallyWorking={data[zone]?.['Partially Working'] || 0}
              onSegmentClick={fetchDetailData}
            />
          ))}
        </div>
      )}

      {/* Detail Table */}
      {selectedDetail && (
        <div className="bg-white border rounded-md shadow-md p-3 m-3">
          <div className="flex justify-between items-center mb-2">
            <div className="text-md font-semibold">
              Showing <span>{selectedDetail.status}</span> devices for <b>{selectedDetail.zoneType}</b>
            </div>
            <button
              className="text-sm bg-red-500 text-white p-1 rounded-md"
              onClick={() => {
                setSelectedDetail(null);
                setExpandedZone({});
                setZoneData({});
              }}
            >
              Close
            </button>
          </div>

          {/* Responsive Table Wrapper */}
          <div className="w-full overflow-x-auto">
            <table
              className="min-w-full table-fixed border border-gray-200 rounded-lg shadow bg-white border-separate text-xs"
              style={{ borderSpacing: 0 }}
            >
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="text-nowrap">
                  <th className="px-2 py-3  text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
                    S.No
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
                    Bank Name
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider">
                    Site Name
                  </th>
                  <th className="px-2 py-3  text-xs font-bold text-blue-900 uppercase border-b  border-r border-gray-300 tracking-wider text-right">
                    Contact No.
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-blue-900 uppercase border-b border-gray-200 tracking-wider">
                    View Zones &amp; Health
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs bg-white">
                {detailData.length == 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">No data available</td>
                  </tr>
                ) : (
                  detailData.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <tr
                        className={`
                          ${idx % 2 == 0 ? 'bg-white' : 'bg-gray-50'}
                          hover:bg-gray-100 transition
                          ${idx > 0 ? 'border-t border-gray-200' : ''}
                        `}
                      >
                        <td className="px-2 py-2 border-r border-gray-200 text-right">{idx + 1}</td>
                        <td className="px-2 py-2 border-r border-gray-200 text-left">{item.bank}</td>
                        <td className="px-2 py-2 border-r border-gray-200 text-left">{item.branchName}</td>
                        <td className="px-2 py-2 border-r border-gray-200 text-right">{item.mobile}</td>
                        <td className="px-2 py-2 text-left space-x-2">
                          <button
                            className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-semibold"
                            onClick={async () => {
                              const res1 = await fetch(
                                `${API_BASE_URL}/getLatestRecordWithAlertType?branchCode=${item.branchCode}`
                              );
                              const health = await res1.json();
                              const zoneList = item.zoneDTOList || [];
                              setExpandedZone((prev) => {
                                // If already open, close it; otherwise, open only this one
                                if (prev[item.branchCode]) {
                                  return {};
                                } else {
                                  return { [item.branchCode]: health.payload.latestRecord };
                                }
                              });
                              setZoneData((prev) => {
                                if (expandedZone[item.branchCode]) {
                                  return {};
                                } else {
                                  return { [item.branchCode]: zoneList };
                                }
                              });
                            }}
                          >
                            View Zones
                          </button>

                          {selectedDetail.zoneType === 'CCTV' && (
                            <button
                              className={
                                item.branchCode !== 'BR-256'
                                  ? "bg-gray-400 text-gray-100 px-2 py-1 rounded text-xs font-semibold cursor-not-allowed"
                                  : "bg-purple-700 text-purple-100 px-2 py-1 rounded text-xs font-semibold"
                              }
                              onClick={async () => {
                                if (item.branchCode !== 'BR-256') {
                                  return;
                                }
                                setDvrLoading(item.branchCode);
                                try {
                                  // Step 1: Get NVR Time
                                  const nvrTimeRes = await fetch(
                                    'https://digitalshealthmonitoring.in/proxy/proxy?url=http%3A%2F%2F122.176.136.51%3A8025%2FDahua%2Fapi%2Fdhauha%2FgetNvrTime%3FpanelSerialNo%3D1'
                                  );
                                  const nvrTimeJson = await nvrTimeRes.json();
                                  const nvrTime =
                                    nvrTimeJson.details && nvrTimeJson.details[0] ? nvrTimeJson.details[0] : 'N/A';

                                  // Step 2: Get DVR Details
                                  const cameraRes = await fetch(
                                    // `http://122.176.136.51:8025/Dahua/api/dhauha/getCameraInfo?panelSerialNo=1&_t=${Date.now()}`
                                    'https://digitalshealthmonitoring.in/proxy/proxy?url=http%3A%2F%2F122.176.136.51%3A8025%2FDahua%2Fapi%2Fdhauha%2FgetCameraInfo%3FpanelSerialNo%3D1'
                                  );
                                  const cameraJson = await cameraRes.json();

                                  if (cameraJson.valid && cameraJson.details?.length > 0) {
                                    const fullDvrDetails = {
                                      ...cameraJson.details[0],
                                      branchName: item.branchName,
                                      deviceSerialNo: item.deviceSerialNo,
                                      nvrTime,
                                    };

                                    setDvrDetails(fullDvrDetails);
                                    setDvrModalOpen(true);
                                  } else {
                                    alert('Invalid DVR Details');
                                  }
                                } catch (error) {
                                  console.error('Error fetching DVR info:', error);
                                  alert('Failed to fetch DVR details');
                                } finally {
                                  setDvrLoading(null);
                                }
                              }}
                              disabled={dvrLoading === item.branchCode || item.branchCode !== 'BR-256'}
                            >
                              {item.branchCode !== 'BR-256'
                                ? "DVR Info"
                                : dvrLoading === item.branchCode
                                  ? "Loading..."
                                  : "DVR Details"}
                            </button>
                          )}


                        </td>

                      </tr>

                      {/* Health Table (above) */}
                      {expandedZone[item.branchCode] && (
                        <tr className="bg-gray-200">
                          <td colSpan={5}>
                            {/* --- FLEX HEALTH SUMMARY --- */}
                            <div
                              style={{
                                margin: 10,
                                padding: 10,
                                backgroundColor: "#FBFBFB",
                                border: "1px solid #ccc",
                                borderRadius: 5,
                                fontSize: 16,
                                fontWeight: 500,
                                justifyContent: "flex-start",
                              }}
                            >
                              <h5 style={{ color: "#1F509A", marginBottom: 15 }} className="font-semibold">
                                Health of Smart Communicator : {expandedZone[item.branchCode].panelSerialNo}
                              </h5>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "nowrap",
                                  gap: 10,
                                  overflowX: "auto",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  justifyContent: "center",
                                }}
                              >
                                {/* Sync Time */}
                                <div
                                  style={{
                                    flex: "0 0 auto",
                                    backgroundColor: getSyncColor(),
                                    color: getSyncTextColor(),
                                    padding: 5,
                                    borderRadius: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  <i className={getSyncIcon()} aria-hidden="true" />
                                  <strong>Sync Time:</strong>{" "}
                                  {new Date(expandedZone[item.branchCode].dateTime).toLocaleString()}
                                </div>
                                {/* Main */}
                                <div
                                  style={{
                                    flex: "0 0 auto",
                                    backgroundColor: getMainColor(expandedZone[item.branchCode].main),
                                    color: getMainTextColor(expandedZone[item.branchCode].main),
                                    padding: 5,
                                    borderRadius: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  <i className={getMainIcon(expandedZone[item.branchCode].main)} aria-hidden="true" />
                                  <strong>Main:</strong> {getMainStatus(expandedZone[item.branchCode].main)}
                                </div>
                                {/* Solar */}
                                {/* <div
                                  style={{
                                    flex: "0 0 auto",
                                    backgroundColor: getSolarColor(expandedZone[item.branchCode].solar),
                                    color: getSolarTextColor(expandedZone[item.branchCode].solar),
                                    padding: 5,
                                    borderRadius: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  <i className={getSolarIcon(expandedZone[item.branchCode].solar)} aria-hidden="true" />
                                  <strong>Solar:</strong> {getSolarStatus(expandedZone[item.branchCode].solar)}
                                </div> */}
                                {/* Battery */}
                                <div
                                  style={{
                                    flex: "0 0 auto",
                                    backgroundColor: getBatteryColor(expandedZone[item.branchCode].battery),
                                    color: getBatteryTextColor(expandedZone[item.branchCode].battery),
                                    padding: 5,
                                    borderRadius: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  <i className={getBatteryIcon(expandedZone[item.branchCode].battery)} aria-hidden="true" />
                                  <strong>Battery Voltage:</strong> 
                                  <span style={{ fontWeight: 700, fontSize: 11, marginLeft: 2 }}>
                                     {expandedZone[item.branchCode].battery_VOLTAGE ?? "N/A"}
                                  </span>
                                </div>
                                {/* Signal */}
                                <div
                                  style={{
                                    flex: "0 0 auto",
                                    backgroundColor: getSignalColor(expandedZone[item.branchCode].signalFlag),
                                    color: getSignalTextColor(expandedZone[item.branchCode].signalFlag),
                                    padding: 5,
                                    borderRadius: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  <i className={getSignalIcon(expandedZone[item.branchCode].signalFlag)} aria-hidden="true" />
                                  { <strong>Signal:</strong> }
                                  <span style={{ fontWeight: 700, fontSize: 11, marginLeft: 2 }}>
                                     {expandedZone[item.branchCode].gsm_SIGNAL ?? "N/A"}
                                  </span>
                                </div>
                                {/* Armed */}
                                {/* <div
                                  style={{
                                    flex: "0 0 auto",
                                    backgroundColor: getArmedColor(expandedZone[item.branchCode].armed),
                                    color: getArmedTextColor(expandedZone[item.branchCode].armed),
                                    padding: 5,
                                    borderRadius: 5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                > */}
                                  {/* <i className={getArmedIcon(expandedZone[item.branchCode].armed)} aria-hidden="true" />
                                  <strong>Status:</strong> {getArmedStatus(expandedZone[item.branchCode].armed)}
                                </div> */}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Zone Table (below) */}
                      {zoneData[item.branchCode] && (
                        <tr className="bg-gray-200">
                          <td colSpan={5}>
                            {/* --- ZONE TABLE --- */}
                            <div className="w-full overflow-x-auto p-2">
                              <div style={{ maxHeight: 5 * 42 + 2, overflowY: 'auto' }}>
                                <table className="min-w-full border border-gray-200 rounded-lg shadow bg-white table-fixed border-separate" style={{ borderSpacing: 0 }}>
                                  <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b border-gray-200 border-r  tracking-wider w-12">S.No</th>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b border-gray-200 border-r  tracking-wider">Device Name</th>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b border-gray-200 border-r  tracking-wider">Alert Type</th>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b border-gray-200 border-r  tracking-wider">Zone</th>
                                      <th className="px-2 py-2 text-left text-xs font-bold text-blue-900 uppercase border-b border-gray-200 tracking-wider">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Array.isArray(zoneData[item.branchCode]) && zoneData[item.branchCode].length > 0 ? (
                                      zoneData[item.branchCode].map((zone, idx) => (
                                        <tr key={idx} className={idx % 2 == 0 ? 'bg-white' : 'bg-gray-50'}>
                                          <td className="px-2 py-2 text-sm border-b  border-r border-gray-200 text-right" >{idx + 1}</td>
                                          <td className="px-2 py-2 text-sm border-b  border-r border-gray-200">{zone.zoneType}</td>
                                          <td className="px-2 py-2 text-sm border-b  border-r border-gray-200">{zone.alertType}</td>
                                          <td className="px-2 py-2 text-sm border-b  border-r border-gray-200">{zone.zone}</td>
                                          <td className="px-2 py-2 text-sm border-b border-gray-100 text-center">
                                            {/* Status Icon */}
                                            {zone.status === 'N' ? (
                                              <span title="Normal" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                              </span>
                                            ) : zone.status === 'A' ? (
                                              <span title="Alarmed" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                  <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                                                </svg>
                                              </span>
                                            ) : (
                                              <span title="Not Working" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                  <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                  <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={5} className="text-center text-gray-500 py-2">
                                          No zone data available.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <DvrModal
        isOpen={dvrModalOpen}
        onClose={() => setDvrModalOpen(false)}
        dvrDetails={dvrDetails}
      />

      <Alert />
    </div>
  );
};

export default DeviceStatus;

