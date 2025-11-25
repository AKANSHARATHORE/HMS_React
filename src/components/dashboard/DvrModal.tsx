import React, { useState, useEffect } from 'react';
import ChannelInfoModal from './ChannelInfoModal';
import SnapshotModal from './SnapshotModal';


interface DvrModalProps {
    isOpen: boolean;
    onClose: () => void;
    dvrDetails: any;
}

const DvrModal: React.FC<DvrModalProps> = ({ isOpen, onClose, dvrDetails }) => {
    const [isChannelInfoOpen, setIsChannelInfoOpen] = useState(false);
    const [isStorageInfoOpen, setIsStorageInfoOpen] = useState(false);
    const [storageDetails, setStorageDetails] = useState<any[]>([]);
    const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
    const [recordingDays, setRecordingDays] = useState<any>(null);

    const openSnapshotModal = () => {
        setIsSnapshotOpen(true);
    };

    const closeSnapshotModal = () => {
        setIsSnapshotOpen(false);
    };


    const openChannelInfo = () => {
        setIsChannelInfoOpen(true);
    };

    const closeChannelInfo = () => {
        setIsChannelInfoOpen(false);
    };

    const openStorageInfo = async () => {
        try {
            // const url = `http://122.176.136.51:8025/Dahua/api/dhauha/getStorageInfo?panelSerialNo=${dvrDetails.deviceSerialNo}`;
            const url = 'https://digitalshealthmonitoring.in/proxy/proxy?url=http%3A%2F%2F122.176.136.51%3A8025%2FDahua%2Fapi%2Fdhauha%2FgetStorageInfo%3FpanelSerialNo%3D1';
            const response = await fetch(url);
            const data = await response.json();

            if (data.valid && data.details && data.details.length > 0) {
                setStorageDetails(data.details[0]);
            }

            // Fetch recording days
            try {
                const recordingUrl = 'https://digitalshealthmonitoring.in/proxy/proxy?url=http%3A%2F%2F122.176.136.51%3A8025%2FDahua%2FHikvision%2Fapi%2FgetAlltotalDaysOfRecording';
                // const recordingUrl = 'http://122.176.136.51:8025/Dahua/Hikvision/api/getAlltotalDaysOfRecording';
                const recordingResponse = await fetch(recordingUrl);
                const recordingData = await recordingResponse.json();
                setRecordingDays(recordingData);
            } catch (recordingError) {
                console.error('Error fetching recording days:', recordingError);
            }

            setIsStorageInfoOpen(true);
        } catch (error) {
            console.error('Error fetching storage details:', error);
            alert('Failed to fetch storage details.');
        }
    };

    const closeStorageInfo = () => {
        setIsStorageInfoOpen(false);
    };

    if (!isOpen || !dvrDetails) return null;

    const infoBox = (label: string, value: string | undefined) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '15px', color: 'black' }}>{label}</strong>
            <span
                className="my-2 p-2"
                style={{
                    backgroundColor: '#F6F5F2',
                    color: 'text-blue-800',
                    fontSize: '15px',
                    borderRadius: '7px',
                    padding: '4px',
                    fontWeight: '600',
                }}
            >
                {value || 'N/A'}
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg w-[70%] h-[80%] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">DVR Details</h2>
                    <div className="mt-4 flex justify-end gap-3">
                        <button className="bg-purple-800 text-purple-100 px-2 py-1 rounded text-sm" onClick={openSnapshotModal}>
                            View Snapshot
                        </button>
                        <button className="bg-indigo-800 text-white px-2 py-1 rounded text-sm" onClick={openChannelInfo}>
                            Channel Info
                        </button>
                        <button className="bg-indigo-800 text-white px-2 py-1 rounded text-sm" onClick={openStorageInfo}>
                            Storage Info
                        </button>
                        <button className="bg-red-500 text-white px-2 py-1 rounded text-sm" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>

                <hr className="my-2" />

                {infoBox('Branch Name', dvrDetails.branchName)}
                {infoBox('Device Serial No', dvrDetails.deviceSerialNo)}

                <hr className="my-2" />

                {infoBox('NVR Name', dvrDetails.nvrName)}
                {infoBox('Device Type', dvrDetails.deviceType)}
                {infoBox('Vendor', dvrDetails.vendorInfo)}
                {infoBox('NVR Time', dvrDetails.nvrTime)}
                {infoBox('NVR Type', dvrDetails.nvrType)}
                {infoBox('Update Serial', dvrDetails.updateSerial)}
                {infoBox('Processor', dvrDetails.processor)}
                {infoBox('Software Info', dvrDetails.softwareInfo)}
                {infoBox('Hardware Version', dvrDetails.hardwareVersion)}


            </div>

            <ChannelInfoModal isOpen={isChannelInfoOpen} onClose={closeChannelInfo} deviceSerialNo={dvrDetails.deviceSerialNo} />

            <SnapshotModal
                isOpen={isSnapshotOpen}
                onClose={closeSnapshotModal}
                deviceSerialNo={dvrDetails.deviceSerialNo}
            />


            {/* Storage Info Modal */}
            {isStorageInfoOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded shadow-lg w-[70%] h-[80%] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
  {/* Left side: Title */}
  <h2 className="text-md font-bold">Storage Info</h2>

  {/* Center: Total Recording Days */}
  {recordingDays && (
    <p className="text-sm">
      <span className="font-bold bg-green-500 text-white px-3 py-1 rounded">
        Total Recording Days: {recordingDays.totalDays}
      </span>
    </p>
  )}

  {/* Right side: Close button */}
  <button
    className="text-sm bg-red-500 text-white px-3 py-1 rounded"
    onClick={closeStorageInfo}
  >
    Close
  </button>
</div>


                        <hr className="my-2" />

                        {/* Recording Dates Section */}
                        {/* {recordingDays && recordingDays.dates && recordingDays.dates.length > 0 && (
                            <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                                <h3 className="font-semibold text-sm mb-3 text-blue-900">Recording Dates:</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {recordingDays.dates.map((date: string, index: number) => (
                                        <div
                                            key={index}
                                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded text-xs font-medium text-center"
                                        >
                                            {date}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )} */}

                        <div className="overflow-x-auto text-sm">
                            <table className="min-w-full border border-gray-300">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 border">S.No.</th>
                                        <th className="px-4 py-2 border">SATA Name</th>
                                        <th className="px-4 py-2 border">Total Bytes</th>
                                        <th className="px-4 py-2 border">Bytes Used</th>
                                        <th className="px-4 py-2 border">Type</th>
                                        <th className="px-4 py-2 border">Usage (%)</th>
                                        <th className="px-4 py-2 border">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(storageDetails).map(([key, item], index) => {
                                        const totalBytes = (parseFloat(item.totalBytes) || 0).toFixed(2);
                                        const usedBytes = (parseFloat(item.usedBytes) || 0).toFixed(2);
                                        const isHddError = parseFloat(totalBytes) <= 0;

                                        return (
                                            <tr key={index} className="text-gray-800">
                                                <td className="px-4 py-2 border">{index + 1}</td>
                                                <td className="px-4 py-2 border">{item.name || 'N/A'}</td>
                                                <td className="px-4 py-2 border">{totalBytes} GB</td>
                                                <td className="px-4 py-2 border">{usedBytes} GB</td>
                                                <td className="px-4 py-2 border">ReadWrite</td>
                                                <td className="px-4 py-2 border">{item.usagePercentage || '0'}</td>
                                                <td className="px-4 py-2 border">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded ${isHddError
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-green-500 text-white'
                                                            }`}
                                                    >
                                                        {isHddError ? 'HDD Error' : 'Working'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {Object.keys(storageDetails).length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center text-gray-400 py-4">
                                                No storage data found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DvrModal;
