import React, { useEffect, useState, useRef } from 'react';
import LiveStreamModal from '@/components/dashboard/LiveStreamModal';
import { LiveStream_URL } from '@/config/api';

interface SnapshotModalProps {
    isOpen: boolean;
    onClose: () => void;
    deviceSerialNo: string;
}

const SnapshotModal: React.FC<SnapshotModalProps> = ({ isOpen, onClose, deviceSerialNo }) => {
    const [snapshotSrc, setSnapshotSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    // open/close live stream modal
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSnapshot(); 
        } else {
            cleanup();
        }
    }, [isOpen]);

   
    const fetchSnapshot = async () => {
        try {
            setLoading(true);
const url = `http://122.176.136.51:8025/Dahua/api/dhauha/getCameraLiveSnapShoot?pannelSerialNo=${deviceSerialNo}&channel=1&_ts=${Date.now()}`;      
            const response = await fetch(url);
            if (!response.ok) throw new Error('Snapshot fetch failed');

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            if (snapshotSrc) URL.revokeObjectURL(snapshotSrc); 
            setSnapshotSrc(imageUrl);
        } catch (err) {
            console.error('Error fetching snapshot:', err);
        } finally {
            setLoading(false);
        }
    };


    const cleanup = () => {
        if (snapshotSrc) {
            URL.revokeObjectURL(snapshotSrc);
            setSnapshotSrc(null);
        }
        setIsLiveModalOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg w-[70%] h-[80%] overflow-y-hidden p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">DVR Snapshot</h2>
                    <div className="space-x-2">
                        <button
                            className={`text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded`}
                            onClick={() => setIsLiveModalOpen(true)}
                        >
                            Open Live Stream
                        </button>
                        <button
                            className="text-sm bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
                <hr className="my-2" />
                <div className="text-center" style={{ maxHeight: 'calc(80vh - 100px)', overflow: 'hidden' }}>
                    {loading && !snapshotSrc ? (
                        <p className="text-gray-600">Loading snapshot...</p>
                    ) : snapshotSrc ? (
                        <img
                            src={snapshotSrc}
                            alt="DVR Snapshot"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: 'inline-block',
                            }}
                        />
                    ) : (
                        <p className="text-red-500">Snapshot not available.</p>
                    )}
                </div>
            </div>

            {/* Live stream modal (separate component) */}
            <LiveStreamModal
                isOpen={isLiveModalOpen}
                onClose={() => setIsLiveModalOpen(false)}
                // channel could be derived from deviceSerialNo if mapping exists; using default 102
                channel="102"
            />
        </div>
    );
};

export default SnapshotModal;
