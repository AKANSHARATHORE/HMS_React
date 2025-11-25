// MapSection.tsx

declare global {
  interface Window {
    google: typeof google;
  }
}

import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { API_BASE_URL } from "@/config/api";

interface Coordinate {
  lat: number;
  lng: number;
  branch: string;
  bank: string;
  branchDesc: string;
  address: string;
  phone: string;
}

interface ZoneDTO {
  zone: string;
  zoneType: string;
  alertType: string;
  status: string;
}

interface ModalBranch {
  branchCode: string;
  branchName: string;
  bank: string;
  mobile: string;
  deviceSerialNo: string;
  zoneDTOList: ZoneDTO[];
}

interface CommunicatorData {
  syncTime: string;
  main: number;
  solar: number;
  battery: number;
  signalFlag: number;
  armed: number;
  branchDesc: string;
}

const MapSection: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);

  // Head branch modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalBranch[]>([]);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [communicatorData, setCommunicatorData] = useState<Record<string, CommunicatorData>>({});

  // Other branches modal states
  const [otherModalOpen, setOtherModalOpen] = useState(false);
  const [otherModalData, setOtherModalData] = useState<any>(null);
  const [otherModalLoading, setOtherModalLoading] = useState(false);

  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [showDeviceHealth, setShowDeviceHealth] = useState(false);


  const branchCode = sessionStorage.getItem('branch');

  

  useEffect(() => {
    fetch(`${API_BASE_URL}/getAllChildren?branchCode=${branchCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.message === 'Branches fetched successfully') {
          const branches = data.payload.map((branch: any) => ({
            lat: parseFloat(branch.latitude),
            lng: parseFloat(branch.longitude),
            branch: branch.branchCode,
            bank: branch.bank,
            branchDesc: branch.branchDesc,
            address: `${branch.address1}, ${branch.address2}, ${branch.address3}, ${branch.address4}`,
            phone: branch.mobile || branch.telephone,
          }));
          setCoordinates(branches);
        }
      })
      .catch(console.error);
  }, []);

  const fetchMainBranchData = async (branchCode: string) => {
    setModalLoading(true);
    setModalOpen(true);
    setExpandedBranch(null);
    setCommunicatorData({});

    try {
      const res = await fetch(`${API_BASE_URL}/countingZonesForReportTable?branchCode=${branchCode}`);
      const data = await res.json();
      if (data.message === 'Data fetched successfully') {
        setModalData(data.payload);
      } else {
        setModalData([]);
      }
    } catch (error) {
      console.error('Error fetching modal data:', error);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchCommunicatorData = async (branchCode: string) => {
    try {
      const latestRes = await fetch(`${API_BASE_URL}/getLatestRecordWithAlertType?branchCode=${branchCode}`);
      const latestData = await latestRes.json();
      if (!latestData?.payload?.latestRecord) return;
      const latestRecord = latestData.payload.latestRecord;

      const branchRes = await fetch(`${API_BASE_URL}/getBranchByBranchCode?branchCode=${branchCode}`);
      const branchData = await branchRes.json();
      if (!branchData?.payload?.[0]) return;

      const branchDesc = branchData.payload[0].branchDesc;
      const dateObj = new Date(latestRecord.dateTime);
      const syncTimeFormatted = `${dateObj.toISOString().split('T')[0]} ${dateObj.toISOString().split('T')[1].split('.')[0]}`;

      setCommunicatorData(prev => ({
        ...prev,
        [branchCode]: {
          syncTime: syncTimeFormatted,
          main: latestRecord.main,
          solar: latestRecord.solar,
          battery: latestRecord.battery_VOLTAGE,
          signalFlag: latestRecord.gsm_SIGNAL,
          armed: latestRecord.armed,
          branchDesc
        }
      }));
    } catch (err) {
      console.error('Failed to fetch communicator data:', err);
    }
  };

  const fetchOtherBranchData = async (branchCode: string) => {
    setOtherModalLoading(true);
    setOtherModalOpen(true);
    setOtherModalData(null);

    try {
      const [statusRes, branchRes, alertRes] = await Promise.all([
        fetch(`${API_BASE_URL}/getCountsByZoneStatus?branchCode=${branchCode}`),
        fetch(`${API_BASE_URL}/getBranchByBranchCode?branchCode=${branchCode}`),
        fetch(`${API_BASE_URL}/getLatestRecordWithAlertType?branchCode=${branchCode}`)
      ]);

      const statusData = await statusRes.json();
      const branchData = await branchRes.json();
      const alertData = await alertRes.json();

      if (statusData?.payload && branchData?.payload?.[0]) {
        const branch = branchData.payload[0];

        setOtherModalData({
          branchDesc: branch.branchDesc,
          address: `${branch.address1}, ${branch.address2}, ${branch.address3}, ${branch.address4}`,
          phone: branch.mobile || branch.telephone,
          systemStatus: statusData.payload,
          alertData: alertData.payload || null  // naya data yahan add kar diya
        });
      } else {
        setOtherModalData(null);
      }
    } catch (error) {
      console.error('Error fetching other branch data:', error);
      setOtherModalData(null);
    } finally {
      setOtherModalLoading(false);
    }
  };

  const renderDeviceHealth = (alertData: any) => {
    if (!alertData || !alertData.latestRecord) return null;

    const latestRecord = alertData.latestRecord;
    const syncTimeFormatted = new Date(latestRecord.dateTime).toLocaleString();

   const getMainStatus = (v: number | string) => {
  const value = Number(v);
  return {
    text: value === 1 ? "Power Off" : "Power On",
    color: value === 1 ? "text-red-600" : "text-green-600",
    dot: value === 1 ? "bg-red-500" : "bg-green-500",
  };
};


    const getSolarStatus = (v: number) => ({
      text:  "Not Connected" ,
      color: v === 0 ? "text-red-500" : "text-red-600",
      dot: v === 0 ? "bg-red-400" : "bg-red-500",
    });

    const getBatteryStatus = (v: number) => {
      const statuses = [
        { text: "Not Installed", color: "text-gray-500", dot: "bg-gray-400" },
        { text: "Charging", color: "text-blue-600", dot: "bg-blue-500" },
        { text: "Battery Low", color: "text-orange-600", dot: "bg-orange-500" },
        { text: "Battery Full", color: "text-green-600", dot: "bg-green-500" },
      ];
      return statuses[v] || { text: "Unknown", color: "text-gray-500", dot: "bg-gray-400" };
    };

    const getSignalStatus = (v: number) => {
      const statuses = [
        { text: "No Signal", color: "text-red-600", dot: "bg-red-500" },
        { text: "Unknown", color: "text-gray-500", dot: "bg-gray-400" },
        { text: "Very Poor", color: "text-red-500", dot: "bg-red-400" },
        { text: "Poor", color: "text-orange-600", dot: "bg-orange-500" },
        { text: "Fair", color: "text-yellow-600", dot: "bg-yellow-500" },
        { text: "Good", color: "text-green-600", dot: "bg-green-500" },
      ];
      return statuses[v] || { text: "Unknown", color: "text-gray-500", dot: "bg-gray-400" };
    };

    const getArmedStatus = (v: number) => ({
      text: v === 0 ? "Active" : "Disarmed",
      color: v === 0 ? "text-green-600" : "text-red-600",
      dot: v === 0 ? "bg-green-500" : "bg-red-500",
    });

    const main = getMainStatus(latestRecord.main);
    // alert(JSON.stringify(latestRecord.main));
    const solar = getSolarStatus(latestRecord.solar);
    const battery = getBatteryStatus(latestRecord.battery_VOLTAGE);
    const signal = getSignalStatus(latestRecord.signalFlag);
    const armed = getArmedStatus(latestRecord.armed);

    const card = (icon: string, label: string, value: any) => (
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <i className={`fas ${icon} ${value.color} text-sm w-4 min-w-[16px] text-center`}></i>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-800">{value.text}</p>
          </div>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${value.dot}`}></span>
      </div>
    );

    return (
      <div className="">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-cyan-200 bg-cyan-50">
            <i className="fas fa-sync-alt text-cyan-600 text-sm w-4 min-w-[16px] text-center"></i>
            <div>
              <p className="text-xs text-gray-500">Last Sync</p>
              <p className="text-sm font-mono text-gray-800">{syncTimeFormatted}</p>
            </div>
          </div>
{/* 
              { text: "Not Installed", color: "text-gray-500", dot: "bg-gray-400" },
        { text: "Charging", color: "text-blue-600", dot: "bg-blue-500" },
        { text: "Battery Low", color: "text-orange-600", dot: "bg-orange-500" },
        { text: "Battery Full", color: "text-green-600", dot: "bg-green-500" }, */}

          {card("fa-bolt", "Main Power", main)}
          {card("fa-solar-panel", "Solar", solar)}
          {/* {card("fa-battery-half", "Battery", battery)} */}
           <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-cyan-200">
            <i className="fas fa-battery text-green-600 text-sm w-4 min-w-[16px] text-center"></i>
            <div>
              <p className="text-xs text-gray-500">Battery</p>
              <p className="text-sm font-mono text-gray-800">{latestRecord.battery_VOLTAGE}</p>
            </div>
          </div>
           <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-cyan-200">
            <i className="fas fa-signal text-green-600 text-sm w-4 min-w-[16px] text-center"></i>
            <div>
              <p className="text-xs text-gray-500">Signal</p>
              <p className="text-sm font-mono text-gray-800">{latestRecord.gsm_SIGNAL}</p>
            </div>
          </div>
          {/* {card("fa-signal", "Signal", signal)} */}
          {card("fa-shield-alt", "System Status", armed)}
        </div>
      </div>
    );
  };



  useEffect(() => {
    if (coordinates.length === 0) return;

    const loadScript = () => {
      const existingScript = document.getElementById('googleMaps');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDMKndzFcfiysofJH9zTVJtOCeIH70nKcc';
        script.id = 'googleMaps';
        script.async = true;
        script.defer = true;
        script.onload = () => initializeMap();
        document.body.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      const map = new window.google.maps.Map(mapRef.current!, {
        zoom: coordinates.length === 1 ? 14 : 8,
        center: coordinates[0],
      });

      if (coordinates.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        coordinates.forEach((coord) => {
          bounds.extend(coord);
        });
        map.fitBounds(bounds);
      }

      coordinates.forEach((coord, index) => {
        const marker = new window.google.maps.Marker({
          position: coord,
          map,
          title:
            index === 0
              ? `Head Office\nSite Name: ${coord.branchDesc}\n${coord.bank}\n${coord.address}\n${coord.phone}`
              : `Site Name: ${coord.branchDesc}\n${coord.bank}\n${coord.address}\n${coord.phone}`,
          icon: index === 0
            ? {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(35, 35)
              }
            : {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(28, 28)
              },
        });

        marker.addListener('click', () => {
          if (index === 0) {
            fetchMainBranchData(coord.branch);
          } else {
            fetchOtherBranchData(coord.branch);
          }
        });

        if (index > 0 && coordinates.length > 1) {
          new window.google.maps.Polyline({
            path: [coordinates[0], coord],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 0,
            icons: [
              {
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillOpacity: 1,
                  scale: 2,
                  strokeColor: index === 0 ? '#1E90FF' : 'red', 
                  fillColor: index === 0 ? '#1E90FF' : 'red',
                },
                offset: '0%',
                repeat: '20px',
              },
            ],
            map,
          });
        }
      });
    };

    loadScript();
  }, [coordinates]);

  const getStatusColor = (status: string) => {
    if (status.includes('Partially Working')) return '#FCC737';
    if (status.includes('Not Working')) return 'crimson';
    if (status.includes('Working')) return '#118B50';
    return '#000';
  };

  // Icon renderers
  const getMainIcon = (v: number | string) =>
    {
      const value = Number(v);
      return (
        value === 1 ? '🔌 Off' : '⚡ On'
      );
    } 
  // const getSolarIcon = (v: number) => (v === 0 ? '🌥️ Not Connected' : '🌞 Connected');

  // const getBatteryIcon = (v: number) =>
  //   ['🪫', '🔋 Charging', '🔋 Low', '🔋 Full'][v] || 'Unknown';
  const getSignalIcon = (v: number) =>
    ['📡 None', '❓ Unknown', '📶 Very Poor', '📶 Poor', '📶 Fair', '📶 Good'][v] || '📶';
  const getStatusIcon = (v: number) => (v === 0 ? '🛡️ Active' : '🔕 Disarmed');

  return (
    <div className="bg-white">
      <div className="p-2 bg-gray-600 text-white font-medium">Site Locations</div>
      <div className="p-2 position-relative" style={{ height: '400px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Head Branch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg overflow-auto w-[70%] h-[80%] text-sm">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-lg font-bold">Head Office Details</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded"
              >
                Close
              </button>
            </div>
            <div className="p-3">
              {modalLoading ? (
                <div className="text-center mt-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-3" />
                  <p className="text-gray-700">Loading...</p>
                </div>
              ) : modalData.length === 0 ? (
                <p className="text-red-600 font-semibold">No data available.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full border border-gray-300 text-sm rounded-lg shadow-md">
                    <thead className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 text-white">
                      <tr>
                        <th className="border p-3">Site Name</th>
                        <th className="border p-3">Phone</th>
                        <th className="border p-3">Device Serial No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.map((branch, idx) => (
                        <React.Fragment key={idx}>
                          <tr
                            className="cursor-pointer hover:bg-gray-100 transition-all duration-300"
                            onClick={() => {
                              const isExpanded = expandedBranch === branch.branchCode;
                              setExpandedBranch(isExpanded ? null : branch.branchCode);
                              if (!isExpanded) fetchCommunicatorData(branch.branchCode);
                            }}
                          >
                            <td className="border p-3 text-gray-700">{branch.branchName}</td>
                            <td className="border p-3 text-gray-700">{branch.mobile}</td>
                            <td className="border p-3 text-gray-700">{branch.deviceSerialNo}</td>
                          </tr>
                          {expandedBranch === branch.branchCode && (
                            <tr>
                              <td colSpan={3} className="p-2 bg-gray-50">
                                {communicatorData[branch.branchCode] && (
                                  <div className="mb-4">
                                    <table className="table-auto border w-full text-sm mb-3 shadow-md">
                                      <thead className="bg-gray-200">
                                        <tr>
                                          {/* <th className="border px-3 py-2">Branch Desc</th> */}
                                          <th className="border px-3 py-2">Sync Time</th>
                                          <th className="border px-3 py-2">Main</th>
                                          {/* <th className="border px-3 py-2">Solar</th> */}
                                          <th className="border px-3 py-2">Battery</th>
                                          <th className="border px-3 py-2">Signal</th>
                                          <th className="border px-3 py-2">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody style={{fontSize:"14px"}}>
                                        <tr>
                                          {/* <td className="border px-3 py-2">{communicatorData[branch.branchCode].branchDesc}</td> */}
                                          <td className="border px-3 py-2">{communicatorData[branch.branchCode].syncTime}</td>
                                          <td className="border px-3 py-2">{getMainIcon(communicatorData[branch.branchCode].main)}</td>
                                          {/* <td className="border px-3 py-2">{getSolarIcon(communicatorData[branch.branchCode].solar)}</td> */}
                                          <td className="border px-3 py-2">{(communicatorData[branch.branchCode].battery)}</td>
                                          <td className="border px-3 py-2">{(communicatorData[branch.branchCode].signalFlag)}</td>
                                          <td className="border px-3 py-2">{getStatusIcon(communicatorData[branch.branchCode].armed)}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                <table className="table-auto border w-full text-sm rounded-lg shadow-md">
                                  <thead className="bg-gray-200">
                                    <tr>
                                      <th className="border px-3 py-2">Zone</th>
                                      <th className="border px-3 py-2">Zone Type</th>
                                      <th className="border px-3 py-2">Alert Type</th>
                                      <th className="border px-3 py-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {branch.zoneDTOList.map((zone, zIdx) => (
                                      <tr key={zIdx}>
                                        <td className="border px-3 py-2">{zone.zone}</td>
                                        <td className="border px-3 py-2">{zone.zoneType}</td>
                                        <td className="border px-3 py-2">{zone.alertType}</td>
                                        <td className="border px-3 py-2">
                                          <span
                                            className="px-3 py-1 rounded-full text-xs text-white"
                                            style={{ backgroundColor: getStatusColor(zone.status) }}
                                          >
                                            {zone.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}


      {/* Other Branches Modal */}
      {otherModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg overflow-auto w-[70%] h-[85%] text-sm">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-lg font-bold">Other Site Details</h2>
              <button
                onClick={() => setOtherModalOpen(false)}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded"
              >
                Close
              </button>
            </div>
            <div className="p-3">
              {otherModalLoading ? (
                <div className="text-center mt-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-3" />
                  <p>Loading...</p>
                </div>
              ) : otherModalData ? (
                <>
                  {/* Branch Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-lg border shadow-sm p-3 mb-6">
                    {/* Branch Name */}
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-200">
                      <i className="fa fa-building text-green-600 text-lg w-5 min-w-[20px] text-center"></i>
                      <div>
                        <p className="font-medium text-gray-700">Site Name</p>
                        <p className="text-gray-600">{otherModalData.branchDesc}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <i className="fa fa-map-marker text-blue-600 text-lg w-5 min-w-[20px] text-center"></i>
                      <div>
                        <p className="font-medium text-gray-700">Address</p>
                        <p className="text-gray-600 text-sm">{otherModalData.address}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <i className="fa fa-phone text-purple-600 text-lg w-5 min-w-[20px] text-center"></i>
                      <div>
                        <p className="font-medium text-gray-700">Phone</p>
                        <p className="text-gray-600">{otherModalData.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* System Status Section */}
                  <div className="bg-white rounded-lg border shadow-sm mb-4">
                    <div
                      className="flex justify-between items-center p-3 cursor-pointer"
                      onClick={() => setShowSystemStatus(!showSystemStatus)}
                    >
                      <div className="flex items-center gap-2">
                        <i className="fa fa-cogs text-gray-700" />
                        <h3 className="text-md font-semibold text-gray-800">System Status Overview</h3>
                      </div>
                      <i className={`fa ${showSystemStatus ? "fa-chevron-up" : "fa-chevron-down"} text-gray-600`} />
                    </div>

                    {showSystemStatus && (
                      <div className="p-3 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Object.entries(otherModalData.systemStatus).map(([system, statuses]) => {
                            const working = statuses["Working"] || 0;
                            const partiallyWorking = statuses["Partially Working"] || 0;
                            const notWorking = statuses["Not Working"] || 0;
                            const total = working + partiallyWorking + notWorking;

                            if (total === 0) return null;

                            return (
                              <div key={system} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-semibold text-gray-800">{system}</h4>
                                  <div className="flex items-center gap-1 text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded border border-blue-200">
                                    <i className="fa fa-layer-group" />
                                    <span className="text-sm font-medium text-blue-700">Total -</span>
                                    <span>{total}</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-green-100 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2">
                                      <i className="fa fa-check-circle text-green-600" />
                                      <span className="text-sm font-medium text-gray-700">Working</span>
                                    </div>
                                    <span className="font-bold text-green-700">{working}</span>
                                  </div>

                                  <div className="flex items-center justify-between p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                                    <div className="flex items-center gap-2">
                                      <i className="fa fa-exclamation-triangle text-yellow-600" />
                                      <span className="text-sm font-medium text-gray-700">Partially Working</span>
                                    </div>
                                    <span className="font-bold text-yellow-700">{partiallyWorking}</span>
                                  </div>

                                  <div className="flex items-center justify-between p-2 bg-red-100 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-2">
                                      <i className="fa fa-times-circle text-red-600" />
                                      <span className="text-sm font-medium text-gray-700">Not Working</span>
                                    </div>
                                    <span className="font-bold text-red-700">{notWorking}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Device Health Section */}
                  <div className="bg-white rounded-lg border shadow-sm mb-4">
                    <div
                      className="flex justify-between items-center p-3 cursor-pointer"
                      onClick={() => setShowDeviceHealth(!showDeviceHealth)}
                    >
                      <div className="flex items-center gap-2">
                        <i className="fa fa-heartbeat text-gray-700" />
                        <h3 className="text-md font-semibold text-gray-800">Communicator Health Overview</h3>
                      </div>
                      <i className={`fa ${showDeviceHealth ? "fa-chevron-up" : "fa-chevron-down"} text-gray-600`} />
                    </div>

                    {showDeviceHealth && <div className="p-3 pt-0">{renderDeviceHealth(otherModalData.alertData)}</div>}
                  </div>
                </>
              ) : (
                <p className="text-red-600">No data available.</p>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MapSection;
