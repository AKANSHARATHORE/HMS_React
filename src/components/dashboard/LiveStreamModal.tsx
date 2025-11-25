import React, { useRef, useState, useEffect } from 'react';

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel?: string;
  rtspUrl?: string;
}

interface StreamState {
  isStreaming: boolean;
  loading: boolean;
  error: string | null;
}

const LiveStreamModal: React.FC<LiveStreamModalProps> = ({ isOpen, onClose, channel = '102', rtspUrl }) => {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const videoRef3 = useRef<HTMLVideoElement>(null);
  const videoRef4 = useRef<HTMLVideoElement>(null);
  const videoRef5 = useRef<HTMLVideoElement>(null);
  const videoRef6 = useRef<HTMLVideoElement>(null);


  
  const [streams, setStreams] = useState<Record<string, StreamState>>({
    '102': { isStreaming: false, loading: false, error: null },
    '201': { isStreaming: false, loading: false, error: null },
    '301': { isStreaming: false, loading: false, error: null },
    '401': { isStreaming: false, loading: false, error: null },
    '501': { isStreaming: false, loading: false, error: null },
    '601': { isStreaming: false, loading: false, error: null },


  });

  const channels = ['102', '201', '301', '401', '501', '601'];
  const videoRefs: Record<string, React.RefObject<HTMLVideoElement>> = {
    '102': videoRef1,
    '201': videoRef2,
    '301': videoRef3,
    '401': videoRef4,
    '501': videoRef5,
    '601': videoRef6,
  };

  const startStream = async (ch: string) => {
    try {
      setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], loading: true, error: null } }));
      const video = videoRefs[ch].current;
      if (!video) return;

      // Use provided rtspUrl or construct default based on channel
      const rawStreamUrl = rtspUrl || `rtsp://admin:disppl@12@203.145.171.162:1024/Streaming/Channels/${ch}`;
      const backendBase = 'https://digitalshealthmonitoring.in/api/secure/livestream';
      const rtspParam = /%3A/.test(rawStreamUrl) ? rawStreamUrl : encodeURIComponent(rawStreamUrl);
      const backendUrl = `${backendBase}?rtspUrl=${rtspParam}`;
      
      // Set video source to the backend streaming endpoint
      video.src = backendUrl;
      
      const handleLoadStart = () => {
        setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], isStreaming: true } }));
      };

      const handleError = (e: Event) => {
        console.error('Video error:', e);
        setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], error: 'Failed to load video stream', isStreaming: false } }));
      };

      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('error', handleError);

      await video.play().catch((err) => {
        console.error('Play error:', err);
        setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], error: 'Failed to play video', isStreaming: false } }));
      });
    } catch (err) {
      console.error('Failed to start stream', err);
      setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], error: 'Failed to initialize stream', isStreaming: false } }));
    } finally {
      setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], loading: false } }));
    }
  };

  const stopStream = async (ch: string) => {
    try {
      setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], loading: true } }));

      const video = videoRefs[ch].current;
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }

      setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], isStreaming: false } }));
    } catch (err) {
      console.error('Failed to stop stream', err);
    } finally {
      setStreams(prev => ({ ...prev, [ch]: { ...prev[ch], loading: false } }));
    }
  };

  // cleanup when modal is closed/unmounted
  useEffect(() => {
    if (!isOpen) {
      channels.forEach(ch => {
        if (streams[ch].isStreaming) {
          stopStream(ch);
        }
      });
    }
    return () => {
      channels.forEach(ch => {
        const video = videoRefs[ch].current;
        if (video) {
          video.pause();
          video.src = '';
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Streams (Channels 102, 201, 301)</h3>
          <button
            className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
            onClick={async () => {
              channels.forEach(ch => {
                if (streams[ch].isStreaming) {
                  stopStream(ch);
                }
              });
              onClose();
            }}
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map(ch => (
            <div key={ch} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Channel {ch}</h4>
                <span className={`text-xs px-2 py-1 rounded ${streams[ch].isStreaming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {streams[ch].isStreaming ? 'Live' : 'Idle'}
                </span>
              </div>

              {streams[ch].error && (
                <div className="mb-2 p-2 bg-red-100 text-red-700 text-xs rounded">
                  {streams[ch].error}
                </div>
              )}

              <div className="mb-2 bg-black rounded overflow-hidden">
                <video
                  ref={videoRefs[ch]}
                  controls
                  muted
                  playsInline
                  className="w-full h-[250px] bg-black"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startStream(ch)}
                  disabled={streams[ch].isStreaming || streams[ch].loading}
                  className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-60"
                >
                  {streams[ch].loading ? 'Wait...' : 'Start'}
                </button>
                <button
                  onClick={() => stopStream(ch)}
                  disabled={!streams[ch].isStreaming || streams[ch].loading}
                  className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-60"
                >
                  Stop
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamModal;
