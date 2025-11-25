import React, { useState, useEffect, useRef } from 'react';
import { X, Bell, MapPin, Phone, Building } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
//import { useDashboardRefresh } from './DashboardRefreshContext';
import { API_BASE_URL } from "@/config/api";
import { Console } from 'console';


const ALERT_SOUND_URL = "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"; // You can use any alert sound URL

const Alert = () => {
    // Alert queue: only one modal at a time, others are queued
    const [modals, setModals] = useState([]); // Currently shown modal [{ branchCode, alertData }]
    const [alertQueue, setAlertQueue] = useState([]); // Queue of pending alerts [{ branchCode, alertData }]
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
    const [status, setStatus] = useState<{ [key: string]: string }>({});
        // Helper to reset status for all items in alertData
        const resetStatusForAlertData = (alertData) => {
            if (Array.isArray(alertData)) {
                const newStatus = {};
                alertData.forEach(item => {
                    newStatus[item.id] = "ACKNOWLEDGED";
                });
                setStatus(newStatus);
            }
        }
    const [broadcastFlag, setBroadcastFlag] = useState(false);
    const { toast } = useToast();
    const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
    const [modalStates, setModalStates] = useState<{ [key: string]: { isFullscreen: boolean; intervalId?: any; timer?: number; currentAlertId?: number } }>({});
    //const { triggerRefresh } = useDashboardRefresh();

    const branchCode = sessionStorage.getItem('branch') || '';

    const audioRef = useRef<HTMLAudioElement>(null);

    // Close modal and show next in queue if any
    const closeBranchModal = (branchCode) => {
        setModals(prev => {
            const filtered = prev.filter(m => m.branchCode !== branchCode);
            // If modal closed, show next in queue
            if (filtered.length === 0 && alertQueue.length > 0) {
                const next = alertQueue[0];
                setAlertQueue(q => q.slice(1));
                setTimeout(() => setModals([next]), 0);
            }
            return filtered;
        });
        // Clean up timer for this branch
        if (modalStates[branchCode]?.intervalId) {
            clearInterval(modalStates[branchCode].intervalId);
        }
        setModalStates(prev => {
            const newStates = { ...prev };
            delete newStates[branchCode];
            return newStates;
        });
    };

    const handleRemarkChange = (id, value) => {
        setRemarks(prev => ({ ...prev, [id]: value }));
    };

    const handleStatusChange = (id, value) => {
        setStatus({ [id]: value });
    };

    // Update handleSubmit to work per branch modal
    const handleSubmit = (branchCode, item) => {
        fetch(`${API_BASE_URL}/saveAudit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payload: item.devicePayload || {},
                deviceId: item.devicePayload?.deviceId || '',
                branchCode: item.devicePayload?.branchCode || '',
                user: item.devicePayload?.userNo || '',
                activeZone: item.alertZone,
                remarks: status[item.id] || 'ACKNOWLEDGED',
                remarks2: remarks[item.id] || '',
                vendorName: item.vendorName,
                mobile: item.vendorNumber,
                address: item.branchAddress,
                zoneName: item.desiredName,
                alertDateTime: item.alertDateTime || '', // <-- add this line
            }),
        })
            .then(res => res.json())
            .then(data => {

                // alert(JSON.stringify(data));
                toast({
                    title: 'Success',
                    description: 'Alert acknowledged successfully',
                    variant: 'default',
                    duration: 100,
                });
                setModals(prev => prev.map(m => m.branchCode === branchCode ? {
                    ...m,
                    alertData: m.alertData.filter(row => row.id !== item.id)
                } : m).filter(m => m.alertData.length > 0));
                //triggerRefresh(); // <--- trigger dashboard refresh
            })
            .catch(err => {

            });
    };


    useEffect(() => {
        if (broadcastFlag) {
            setIsModalOpen(true);
        }
    }, [broadcastFlag]);



   const getBranchInfo = async (branchCode: string) => {
    try {
        const res = await fetch(`${API_BASE_URL}/getBranchByBranchCode?branchCode=${encodeURIComponent(branchCode)}`);
        const data = await res.json();
        const branch = Array.isArray(data?.payload) && data.payload.length > 0 ? data.payload[0] : {};

        // Gather all available non-empty mobile numbers
        const mobileNumbers = [
            branch.mobile,
            branch.mobileSecondary,
            branch.mobileTertiary,
            branch.mobileQuaternary,
            branch.mobileQuinary,
            branch.mobileSenary
        ].filter(num => !!num); // remove undefined, null, or empty string

        return {
            branchDesc: branch.branchDesc || '',
            parentBranchName: branch.parentBranchName || '',
            mobileNumbers
        };
    } catch {
        return { branchDesc: '', parentBranchName: '', mobileNumbers: [] };
    }
};



  const makeCall = async (zone, mobile, deviceId, branchCode) => {
    const branchInfo = await getBranchInfo(branchCode);

    if (!branchInfo.mobileNumbers.length) {
        console.warn("No valid mobile numbers found for this branch.");
        return;
    }

    const msisdnlist = branchInfo.mobileNumbers.map((number) => ({
        phoneno: number,
        BranchName: branchInfo.branchDesc || branchCode,
        ProductType: branchInfo.branchDesc || branchCode,
        Reason: zone,
        ContactNo: "0000000000"
    }));

    const data = {
        sourcetype: "0",
        customivr: true,
        campaigntype: "4",
        filetype: "2",
        msisdnlist
    };

    fetch(`${API_BASE_URL}/makeCallStop`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(res => res.json())
        .then(responseData => {
            console.log('Response:', responseData);
            console.log(`Call(s) to branch ${branchInfo.branchDesc || branchCode} (${branchCode}) on ${branchInfo.mobileNumbers.length} number(s) initiated.`);
        })
        .catch((err) => {
            console.error('Error:', err);
        });
};


    // Add sendSmsByBranchCode using fetch
    const sendSmsByBranchCode = (branchCode, activeZone) => {

        //  alert("sms-->"+activeZone)
        if (!branchCode) {
            console.error("Branch code is required.");
            return;
        }
        if (!activeZone) {
            console.error("Active zone is required.");
            return;
        }
        fetch(`${API_BASE_URL}/sendSmsByBranchCode?branchCode=${encodeURIComponent(branchCode)}&activeZone=${encodeURIComponent(activeZone)}`)
            .then(res => res.json())
            .then(response => {
                // alert(JSON.stringify(response));
            })
            .catch(error => {
                console.error("Error sending SMS:", error);
            });
    };

    // Add sendMailByBranchCode using fetch
    const sendMailByBranchCode = (branchCode, activeZone) => {

        //  alert("mail-->"+activeZone);
        if (!branchCode) {
            console.error("Branch code is required.");
            return;
        }
        if (!activeZone) {
            console.error("Active zone is required.");
            
            return;
        }


        fetch(`${API_BASE_URL}/sendMailByBranchCode?branchCode=${encodeURIComponent(branchCode)}&activeZone=${encodeURIComponent(activeZone)}`)
            .then(res => res.json())
            .then(response => {
                //  alert(JSON.stringify(response));
            })
            .catch(error => {
                console.error("Error sending Mail:", error);
            });
    };


    useEffect(() => {
        let intervalId;
        function fetchData() {
            fetch(`${API_BASE_URL}/fetchDataAndBroadcast`)
                .then(res => res.json())
                .then(response => {
                    response.forEach(async message => {
                        if (typeof message === 'string') {
                            const dataSplit = message.split(',');
                            const apiBranchCode = dataSplit[0];
                            const localBranchCode = sessionStorage.getItem('branch') || '';
                            let shouldShowModal = false;
                            if (apiBranchCode === localBranchCode) {
                                shouldShowModal = true;
                                //triggerRefresh();
                            } else {
                                try {
                                    const childrenRes = await fetch(`${API_BASE_URL}/getAllChildren?branchCode=${encodeURIComponent(localBranchCode)}`);
                                    const childrenData = await childrenRes.json();
                                    const childrenPayload = childrenData?.payload || [];
                                    if (childrenPayload.some(child => child.branchCode === apiBranchCode)) {
                                        shouldShowModal = true;
                                        //triggerRefresh(); 
                                    }
                                } catch (e) { }
                            }
                            if (!shouldShowModal) return;
                            // --- New logic: fetch device and zone details, filter for critical alerts ---
                            let alertRows = [];
                            let branchInfo = {};
                            let branchName = '';
                            let alertZoneRaw = dataSplit[8];

                            // alert("raw-->"+alertZoneRaw);
                            try {
                                const deviceZoneRes = await fetch(`${API_BASE_URL}/getDeviceAndZoneDetailsByBranchCode?branchCode=${encodeURIComponent(apiBranchCode)}`);
                                const deviceZoneData = await deviceZoneRes.json();
                                branchInfo = await getBranchInfo(apiBranchCode);
                                branchName = (branchInfo as { branchDesc?: string }).branchDesc || '';
                                const parentBranchName = (branchInfo as { parentBranchName?: string }).parentBranchName || '';
                                 sendMailByBranchCode(apiBranchCode, alertZoneRaw);
                                 sendSmsByBranchCode(apiBranchCode, alertZoneRaw);
                                if (!alertZoneRaw || alertZoneRaw.trim() === "" || alertZoneRaw === "null") {
                                    return;
                                }
                                // Extract all alert types with :A from alertZoneRaw
                                const alertTypes = [];
                                const alertTypeRegex = /_([^:]+):/g;
                                let match;
                                while ((match = alertTypeRegex.exec(alertZoneRaw)) !== null) {
                                    if (match[1]) alertTypes.push(match[1].trim());
                                }
                                // alert(alertTypes);
                                if (alertTypes.length === 0) return;
                                const zoneList = deviceZoneData?.payload?.zoneList || [];

                                    // Find zones that are critical and match the alert types
                                    // console.log("zoneList-->"+JSON.stringify(zoneList));

                                const matchingCriticalZones = zoneList.filter(
                                    (zone) => zone.criticalAlertFlag === "Y" && zone.alertType && alertTypes.some(type => zone.alertType.trim().toUpperCase() === type.toUpperCase())
                                );

                                // alert("critical zones-->"+JSON.stringify(matchingCriticalZones));

                                // Send issue mail only if there are critical zones (criticalAlertFlag === "Y")
                                if (matchingCriticalZones.length > 0 && apiBranchCode) {
                                    // Filter to get only critical alert types
                                    const criticalAlertTypes = matchingCriticalZones
                                        .map(zone => zone.alertType)
                                        .filter(Boolean);
                                    
                                    if (criticalAlertTypes.length > 0) {
                                        const url = new URL(`${API_BASE_URL}/sendIssueMail`);
                                        url.searchParams.append('branchCode', apiBranchCode);
                                        criticalAlertTypes.forEach(type => url.searchParams.append('issueDetails', type));

                                        fetch(url)
                                            .then(res => res.text())
                                            .then(response => {
                                                console.log('Issue mail sent:', response);
                                                // alert('Issue mail sent successfully.');
                                            })
                                            .catch(err => {
                                                console.error('Failed to send issue mail:', err);
                                            });
                                    }
                                }

                                if (matchingCriticalZones.length === 0) return;
                                async function fetchVendorDetails(branchCode, alertType) {
                                    try {
                                        const url = new URL(`${API_BASE_URL}/getVendorByBranchCodeAndAlertType`);
                                        url.searchParams.append('branchCode', branchCode);
                                        url.searchParams.append('alertType', alertType);

                                        const res = await fetch(url.toString());
                                        const data = await res.json();

                                        return {
                                            vendorName: data?.payload?.vendorName || '',
                                            vendorNumber: data?.payload?.mobile || ''
                                        };
                                    } catch (error) {
                                        console.error("Vendor API error:", error);
                                        return {
                                            vendorName: '',
                                            vendorNumber: ''
                                        };
                                    }
                                }

                                alertRows = await Promise.all(
                                    matchingCriticalZones.map(async (zone, idx) => {
                                        const { vendorName, vendorNumber } = await fetchVendorDetails(apiBranchCode, zone.alertType);

                                        return {
                                            id: idx + 1,
                                            desiredName: zone.zoneDesiredName || '',
                                            vendorName,
                                            vendorNumber,
                                            branchAddress: deviceZoneData?.payload?.address || '',
                                            contactNo: deviceZoneData?.payload?.supportNo || '',
                                            branchName: branchName,
                                            controllingOffice: parentBranchName,
                                            alertZone: zone.alertType || zone.zoneOriginalName || '',
                                            resolutionStatus: 'ACKNOWLEDGED',
                                            remark: '',
                                            devicePayload: deviceZoneData?.payload || {},
                                            alertDateTime: dataSplit[2] || '',
                                        };
                                    })
                                );

                            } catch (e) {
                                // fallback to old logic if needed
                            }
                            // ...existing code fallback...
                            if (!alertRows.length) {
                                branchInfo = await getBranchInfo(apiBranchCode);
                                branchName = (branchInfo as { branchDesc?: string }).branchDesc || '';
                                alertZoneRaw = dataSplit[8];
                                sendMailByBranchCode(apiBranchCode, alertZoneRaw);
                                sendSmsByBranchCode(apiBranchCode, alertZoneRaw);
                                if (!alertZoneRaw || alertZoneRaw.trim() === "" || alertZoneRaw === "null") {
                                    return;
                                }
                                const alertZone = alertZoneRaw.replace(/_/g, '').replace(/:/g, ' ');
                                const zoneDesiredNameRaw = dataSplit[9];
                                const zoneDesiredNames = zoneDesiredNameRaw ? zoneDesiredNameRaw.split('_').filter(Boolean) : [];
                                const panelSerialNumber = dataSplit[2] || "";
                                const alertDateTime = dataSplit[2] || "";
                                let isSIA = false;
                                let siaDeviceId = "";
                                let siaalarmedZonesList = [];
                                let desiredNamedList = [];
                                try {
                                    const smsRes = await fetch(`${API_BASE_URL}/sendSmsByBranchCode?branchCode=${encodeURIComponent(apiBranchCode)}`);
                                    const smsData = await smsRes.json();
                                    if (smsData && smsData.payload && smsData.payload.deviceType === "SIA") {
                                        isSIA = true;
                                    }
                                } catch (e) { }
                                if (isSIA && panelSerialNumber) {
                                    try {
                                        const siaDeviceRes = await fetch(`${API_BASE_URL}/getDeviceForSiaByPanelSerialNo?deviceSerialNo=${encodeURIComponent(panelSerialNumber)}`);
                                        const siaDeviceData = await siaDeviceRes.json();
                                        siaDeviceId = siaDeviceData?.payload?.deviceId || "";
                                        const rawList = alertZoneRaw.split('_').filter(Boolean);
                                        const siaPromises = rawList.map(async (item) => {
                                            if (item.length >= 6) {
                                                const command = item.substring(1, 3);
                                                try {
                                                    const msgRes = await fetch(`${API_BASE_URL}/getAllDeviceSiaMessageType?command=${encodeURIComponent(command)}&deviceId=${encodeURIComponent(siaDeviceId)}`);
                                                    const msgData = await msgRes.json();
                                                    if (msgData && msgData.payload && msgData.payload.message) {
                                                        siaalarmedZonesList.push(msgData.payload.message);
                                                        desiredNamedList.push(msgData.payload.messageType);
                                                    } else {
                                                        siaalarmedZonesList.push('N/A');
                                                        desiredNamedList.push('N/A');
                                                    }
                                                } catch {
                                                    siaalarmedZonesList.push('Error');
                                                    desiredNamedList.push('Error');
                                                }
                                            }
                                        });
                                        await Promise.all(siaPromises);
                                        alertRows = siaalarmedZonesList.map((zone, idx) => ({
                                            id: idx + 1,
                                            desiredName: desiredNamedList[idx] || '',
                                            vendorName: '',
                                            vendorNumber: '',
                                            branchAddress: '',
                                            contactNo: '',
                                            branchName: branchName,
                                            controllingOffice: '',
                                            alertZone: zone,
                                            resolutionStatus: 'ACKNOWLEDGED',
                                            remark: '',
                                            devicePayload: { deviceId: siaDeviceId, branchCode: apiBranchCode },
                                            alertDateTime,
                                        }));
                                    } catch (e) { }
                                }
                                if (!alertRows.length) {
                                    // fallback to getDeviceDetailsByBranchCode
                                    try {
                                        const deviceRes = await fetch(`${API_BASE_URL}/getDeviceDetailsByBranchCode?branchCode=${apiBranchCode}`);
                                        const deviceData = await deviceRes.json();
                                        const vendorName = deviceData?.payload?.vendorName || '';
                                        const vendorNumber = deviceData?.payload?.vendorMobile || '';
                                        const branchAddress = deviceData?.payload?.address || '';
                                        const contactNo = deviceData?.payload?.supportNo || '';
                                        const deviceId = deviceData?.payload?.deviceId || '';
                                        alertRows = alertZoneRaw
                                            .split(',')[0]
                                            .split('_')
                                            .filter(Boolean)
                                            .map((zone, idx) => {
                                                const [zoneName, status] = zone.split(':');
                                                let desiredName = '';
                                                if (zoneDesiredNames[idx]) {
                                                    const words = zoneDesiredNames[idx].trim().split(' ');
                                                    desiredName = words.slice(0, 2).join(' ');
                                                } else {
                                                    const zoneWords = zoneName ? zoneName.trim().split(' ') : [];
                                                    desiredName = zoneWords.slice(0, 2).join(' ');
                                                }
                                                const alertCode = zone;
                                                return {
                                                    id: idx + 1,
                                                    desiredName,
                                                    vendorName,
                                                    vendorNumber,
                                                    branchAddress,
                                                    contactNo,
                                                    branchName: branchName,
                                                    controllingOffice: '',
                                                    alertZone: alertCode,
                                                    resolutionStatus: 'ACKNOWLEDGED',
                                                    remark: '',
                                                    devicePayload: deviceData?.payload || {},
                                                    alertDateTime,
                                                };
                                            });
                                    } catch (e) { }
                                }
                                if (!alertRows.length) {
                                    // fallback to minimal
                                    alertRows = alertZoneRaw
                                        .split(',')[0]
                                        .split('_')
                                        .filter(Boolean)
                                        .map((zone, idx) => {
                                            const [zoneName, status] = zone.split(':');
                                            let desiredName = '';
                                            if (zoneDesiredNames[idx]) {
                                                const words = zoneDesiredNames[idx].trim().split(' ');
                                                desiredName = words.slice(0, 2).join(' ');
                                            } else {
                                                const zoneWords = zoneName ? zoneName.trim().split(' ') : [];
                                                desiredName = zoneWords.slice(0, 2).join(' ');
                                            }
                                            const alertCode = zone;
                                            return {
                                                id: idx + 1,
                                                desiredName,
                                                vendorName: '',
                                                vendorNumber: '',
                                                branchAddress: '',
                                                contactNo: '',
                                                branchName: branchName,
                                                controllingOffice: '',
                                                alertZone: alertCode,
                                                resolutionStatus: '',
                                                remark: ''
                                            };
                                        });
                                }
                            }
                            // Call makeCall and sendSmsByBranchCode for each alert
                            alertRows.forEach(row => {
                                const mobile = row.vendorNumber || row.contactNo || (branchInfo && 'mobile' in branchInfo ? branchInfo.mobile : '');
                                makeCall(row.alertZone, mobile, row.devicePayload?.deviceId, apiBranchCode);
                                // alert(row.alertZone);
                                // sendMailByBranchCode(apiBranchCode, row.alertZone);
                                // sendSmsByBranchCode(apiBranchCode, row.alertZone);
                            });
                            
                            // --- QUEUE LOGIC ---
                            const newAlert = { branchCode: apiBranchCode, alertData: alertRows };
                            setModals(prev => {
                                if (prev.length === 0) {
                                    // No modal open, show this one
                                    resetStatusForAlertData(alertRows); // Reset status for new modal
                                    setModalStates(state => ({
                                        ...state,
                                        [apiBranchCode]: {
                                            timer: 25,
                                            isFullscreen: false,
                                            currentAlertId: alertRows[0]?.id
                                        }
                                    }));
                                    return [newAlert];
                                } else {
                                    // Modal already open, queue this alert if not duplicate
                                    setAlertQueue(q => {
                                        // Avoid duplicate branchCode in queue
                                        if (q.some(a => a.branchCode === apiBranchCode)) return q;
                                        return [...q, newAlert];
                                    });
                                    return prev;
                                }
                            });
                        }
                    });
                })
                .catch(err => console.error('Error fetching data:', err));
        }
        fetchData();
        intervalId = setInterval(fetchData, 200);
         return () => clearInterval(intervalId);
    }, [alertQueue]);


    const startInactivityTimer = () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        // This function is not used in the current code, but if you want to check for modals and their alertData:
        if (setIsModalOpen && modals.length > 0 && modals[0].alertData.length > 0) {
            inactivityTimer.current = setTimeout(() => {
                handleSubmit(modals[0].branchCode, modals[0].alertData[0]);
            }, 25000);
        }
    };


    // Start a single timer per modal (per branchCode)
    const startModalTimer = (branchCode, alertData) => {
        if (modalStates[branchCode]?.intervalId) clearInterval(modalStates[branchCode].intervalId);
        let timer = 25;
        const intervalId = setInterval(() => {
            setModalStates(prev => {
                const newState = { ...prev };
                if (newState[branchCode]) {
                    newState[branchCode].timer = timer;
                }
                return newState;
            });
            timer--;
            if (timer < 0) {
                clearInterval(intervalId);
                // Close the entire modal for this branch after timer expires
                closeBranchModal(branchCode);
            }
        }, 1000);
        setModalStates(prev => ({
            ...prev,
            [branchCode]: {
                ...(prev[branchCode] || {}),
                timer: 25,
                intervalId,
                isFullscreen: prev[branchCode]?.isFullscreen || false
            }
        }));
    };

    // Minimize/Maximize handlers
    const handleMaximize = (branchCode) => {
        setModalStates(prev => ({
            ...prev,
            [branchCode]: {
                ...(prev[branchCode] || {}),
                isFullscreen: true
            }
        }));
    };
    const handleMinimize = (branchCode) => {
        setModalStates(prev => ({
            ...prev,
            [branchCode]: {
                ...(prev[branchCode] || {}),
                isFullscreen: false
            }
        }));
    };

    // Single timer per modal logic
    useEffect(() => {
        modals.forEach(({ branchCode, alertData }) => {
            if (!modalStates[branchCode] || typeof modalStates[branchCode].intervalId === 'undefined') {
                startModalTimer(branchCode, alertData);
            }
        });
        // Clean up timers for removed modals
        Object.keys(modalStates).forEach(branchCode => {
            const modal = modals.find(m => m.branchCode === branchCode);
            if (!modal) {
                if (modalStates[branchCode]?.intervalId) {
                    clearInterval(modalStates[branchCode].intervalId);
                }
            }
        });
    }, [modals, modalStates]);


    useEffect(() => {
        if (!setIsModalOpen) return;
        const resetTimer = () => startInactivityTimer();
        const modal = document.getElementById('alert-modal');
        if (modal) {
            modal.addEventListener('mousemove', resetTimer);
            modal.addEventListener('keydown', resetTimer);
            modal.addEventListener('mousedown', resetTimer);
            modal.addEventListener('touchstart', resetTimer);
        }
        startInactivityTimer();
        return () => {
            if (modal) {
                modal.removeEventListener('mousemove', resetTimer);
                modal.removeEventListener('keydown', resetTimer);
                modal.removeEventListener('mousedown', resetTimer);
                modal.removeEventListener('touchstart', resetTimer);
            }
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [setIsModalOpen, modals]);

    // Play sound when modals open, stop when closed
    useEffect(() => {
        if (modals.length > 0) {
            // Play sound
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
            }
        } else {
            // Pause sound
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [modals.length]);

    return (
        <div>
            {/* Alert sound audio element */}
            <audio ref={audioRef} src={ALERT_SOUND_URL} loop />
            <div className="">
                {modals.map(({ branchCode, alertData }, index) => {
                    const isFullscreen = modalStates[branchCode]?.isFullscreen;
                    // Show only one timer per modal
                    return (
                        <div
                            key={branchCode}
                            id={`alert-modal-${branchCode}`}
                            className={`fixed inset-0 flex items-center justify-center p-4`}
                            style={{
                                zIndex: 9999 // Always on top
                            }}
                        >
                            {/* Overlay to block background interaction */}
                            <div
                                className="fixed inset-0 bg-black-opacity-60"
                                style={{ zIndex: 9998, pointerEvents: 'auto' }}
                                onClick={() => closeBranchModal(branchCode)}
                            />
                            <div className={`bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 max-w-full max-h-full w-full h-full rounded-none' : ''}`}
                                style={{ zIndex: 9999, ...(isFullscreen ? { top: 0, left: 0, right: 0, bottom: 0, margin: 0 } : {}) }}>
                                <div className="bg-red-500 text-white p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-5 h-5 animate-bounce" />
                                        <span className="font-medium">Security Alert: Devices Require Attention</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Single Timer */}
                                        {typeof modalStates[branchCode]?.timer === 'number' && modalStates[branchCode].timer >= 0 && (
                                            <span className="bg-white text-red-600 rounded px-2 py-1 font-bold text-xs animate-pulse mr-2">
                                                Auto acknowledging in {modalStates[branchCode].timer} second{modalStates[branchCode].timer !== 1 ? 's' : ''}...
                                            </span>
                                        )}
                                        {/* Minimize/Maximize Buttons */}
                                        {isFullscreen ? (
                                            <button onClick={() => handleMinimize(branchCode)} className="text-white hover:text-gray-200 transition-colors" title="Minimize">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="16" width="16" height="2" rx="1" /></svg>
                                            </button>
                                        ) : (
                                            <button onClick={() => handleMaximize(branchCode)} className="text-white hover:text-gray-200 transition-colors" title="Maximize">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => closeBranchModal(branchCode)}
                                            className="text-white hover:text-red-200 transition-colors"
                                        >
                                            <X className="w-7 h-7" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">


                                    {/* Data Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                                            <thead>
                                                <tr className="bg-gray-800 text-white text-sm text-nowrap">
                                                    <th className="border border-gray-300 p-2 text-right font-medium">S.NO</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">DESIRED NAME</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">VENDOR NAME</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">VENDOR NUMBER</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">SITE NAME</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">CONTROLLING OFFICE</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">SITE ADDRESS</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">ALERT ZONE</th>
                                                    <th className="border border-gray-300 p-2 text-right font-medium">CONTACT NO.</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">RESOLUTION STATUS</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">REMARK</th>
                                                    <th className="border border-gray-300 p-2 text-left font-medium">ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {alertData.map((item, index) => (
                                                    <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors text-sm text-nowrap`}>
                                                        <td className="border border-gray-300 p-3 text-center font-medium text-sm">{item.id}</td>
                                                        <td className="border border-gray-300 p-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                {item.desiredName === 'FIRE ALARM' && <Building className="w-4 h-4 text-blue-600" />}
                                                                {item.desiredName === 'CCTV' && <Bell className="w-4 h-4 text-red-600" />}
                                                                {item.desiredName === 'SECURITY ALARM' && <Building className="w-4 h-4 text-green-600" />}
                                                                {item.desiredName === 'BACS' && <Building className="w-4 h-4 text-green-600" />}
                                                                <span className="text-nowrap text-sm">{item.desiredName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-300 p-3 text-sm">{item.vendorName}</td>
                                                        <td className="border border-gray-300 p-3 font-mono text-sm">{item.vendorNumber}</td>
                                                        <td className="border border-gray-300 p-3 text-sm">{item.branchName}</td>
                                                        <td className="border border-gray-300 p-3 text-sm">{item.controllingOffice}</td>
                                                        <td className="border border-gray-300 p-3 text-sm">
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-sm">{item.branchAddress}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-300 p-3 text-sm">{item.alertZone}</td>
                                                        <td className="border border-gray-300 p-3 text-sm text-right">
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4 text-green-600" />
                                                                <span className="font-mono text-sm">{item.contactNo}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-300 p-3 text-sm">
                                                            <select
                                                                className="border rounded px-2 py-1 text-sm"
                                                                value={status[item.id] || ''}
                                                                onChange={e => handleStatusChange(item.id, e.target.value)}
                                                            >

                                                                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                                                                <option value="SECURITY VENDOR INFORMED">SECURITY VENDOR INFORMED</option>
                                                                <option value="FALSE ALARM">FALSE ALARM</option>
                                                                <option value="TESTING">TESTING</option>
                                                            </select>
                                                        </td>
                                                        <td className="border border-gray-300 p-3  text-sm">
                                                            <input
                                                                type="text"
                                                                className="border rounded px-2 py-1 w-100 text-sm w-full"
                                                                value={remarks[item.id] || ''}
                                                                onChange={e => handleRemarkChange(item.id, e.target.value)}
                                                                placeholder="Add remark"
                                                            />
                                                        </td>
                                                        <td className="border border-gray-300 p-3 text-center text-sm align-middle">
                                                            <button
                                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap"
                                                                style={{ minWidth: 'auto', width: 'auto' }}
                                                                onClick={() => handleSubmit(branchCode, item)}
                                                            >
                                                                Submit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>

                                {/* Modal Footer */}
                                <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
                                    <button
                                        onClick={() => closeBranchModal(branchCode)}
                                        className="px-4  bg-gray-300 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Close
                                    </button>

                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


function setIsModalOpen(arg0: boolean) {
    throw new Error('Function not implemented.');
}

export default Alert;



