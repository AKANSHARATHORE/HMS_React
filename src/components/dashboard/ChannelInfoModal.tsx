import React, { useEffect, useState } from 'react';
import { LiveStream_URL } from '@/config/api';

interface CameraDetails {
  name: string;
  ipAddress: string;
  mac: string;
  channelName: string;
  vendor: string;
  enabled: boolean;
  connected: boolean;
}

interface ChannelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceSerialNo: string;
}

const ChannelInfoModal: React.FC<ChannelInfoModalProps> = ({
  isOpen,
  onClose,
  deviceSerialNo,
}) => {
  const [cameraDetails, setCameraDetails] = useState<CameraDetails[]>([]);
  const [totalCameras, setTotalCameras] = useState(0);
  const [connectedCameras, setConnectedCameras] = useState(0);
  const [disconnectedCameras, setDisconnectedCameras] = useState(0);

  useEffect(() => {
    if (isOpen && deviceSerialNo) {
      const url = `https://digitalshealthmonitoring.in/proxy/proxy?url=http%3A%2F%2F122.176.136.51%3A8025%2FDahua%2Fapi%2Fdhauha%2FgetChannelInfo%3FpanelSerialNo%3D1`;
      // const url = `http://122.176.136.51:8025/Dahua/api/dhauha/getChannelInfo?panelSerialNo=1`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data.valid) {
            const details = data.details[0];
            setTotalCameras(details.totalCamera || 0);
            setConnectedCameras(details.connectCamera || 0);
            setDisconnectedCameras(details.disconnectCamera || 0);
            setCameraDetails(details.cameraChannelDetails || []);
          } else {
            console.error('Invalid response from the server');
          }
        })
        .catch((error) => {
          console.error('Error fetching channel info:', error);
        });
    }
  }, [isOpen, deviceSerialNo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-[70%] h-[80%] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-bold">Channel Info</h2>
          <button
            className="text-sm bg-red-500 text-white px-3 py-1 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>

         <hr className="my-2" />

        <div className="grid grid-cols-3 gap-4 mb-4 text-white text-sm font-semibold">
          <div className="p-3 rounded bg-gradient-to-br from-[#3D8A97] to-[#2C5D6A]">
            Total Cameras: {totalCameras}
          </div>
          <div className="p-3 rounded bg-gradient-to-br from-[#4C9F70] to-[#387C51]">
            Connected: {connectedCameras}
          </div>
          <div className="p-3 rounded bg-gradient-to-br from-[#D95A5A] to-[#9E3F3F]">
            Disconnected: {disconnectedCameras}
          </div>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 border">S.No.</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">IP Address</th>
                <th className="px-4 py-2 border">MAC</th>
                <th className="px-4 py-2 border">Channel Name</th>
                <th className="px-4 py-2 border">Vendor</th>
                <th className="px-4 py-2 border">Enabled</th>
                <th className="px-4 py-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {cameraDetails.map((camera, index) => (
                <tr key={index} className="text-gray-800">
                  <td className="px-4 py-2 border">{index + 1}</td>
                  <td className="px-4 py-2 border">{camera.name || 'N/A'}</td>
                  <td className="px-4 py-2 border">{camera.ipAddress || 'N/A'}</td>
                  <td className="px-4 py-2 border">{camera.mac || 'N/A'}</td>
                  <td className="px-4 py-2 border">{camera.channelName || 'N/A'}</td>
                  <td className="px-4 py-2 border">{camera.vendor || 'N/A'}</td>
                  <td className="px-4 py-2 border">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        camera.enabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {camera.enabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        camera.connected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {camera.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                </tr>
              ))}
              {cameraDetails.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-4">
                    No camera data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChannelInfoModal;
