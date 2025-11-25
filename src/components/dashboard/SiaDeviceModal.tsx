import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from "@/config/api";

interface Device {
  branchName: string;
  branchAddress: string;
  branchIfsc: string;
  branchNumber: string;
  devicePanelSerialNo: string;
  deviceType: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SiaDeviceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const branchCode = sessionStorage.getItem("branch");
      fetch(`${API_BASE_URL}/getAllDeviceOfSia?branchCode=${branchCode}`)
        .then(res => res.json())
        .then(data => {
          setDevices(data.payload || []);
        })
        .catch(err => {
          console.error('Error loading SIA devices:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-sm rounded-md shadow-lg overflow-auto w-[70%] h-[80%]">
        <div className="flex justify-between items-center p-2 border-b">
          <h2 className="text-lg font-bold">SIA Device Details</h2>
          <button onClick={onClose} className="text-sm bg-red-500 text-white px-2 py-1 rounded">Close</button>
        </div>
        <div className="p-2">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full table-auto border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Site Name</th>
                  <th className="border p-2">Site Address</th>
                  <th className="border p-2">Site IFSC</th>
                  <th className="border p-2">Mobile No.</th>
                  <th className="border p-2">Device Serial No</th>
                  {/* <th className="border p-2">Device Type</th> */}
                </tr>
              </thead>
              <tbody>
                {devices.length > 0 ? (
                  devices.map((device, idx) => (
                    <tr key={idx}>
                      <td className="border p-2">{device.branchName}</td>
                      <td className="border p-2">{device.branchAddress}</td>
                      <td className="border p-2">{device.branchIfsc}</td>
                      <td className="border p-2">{device.branchNumber}</td>
                      <td className="border p-2">{device.devicePanelSerialNo}</td>
                      {/* <td className="border p-2">{device.deviceType}</td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-4">No data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiaDeviceModal;
