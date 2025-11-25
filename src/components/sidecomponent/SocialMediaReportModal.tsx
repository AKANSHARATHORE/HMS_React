import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, Mail, MessageCircle, Smartphone, Shield, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { on } from 'events';
import { API_BASE_URL } from "@/config/api";

const notificationChannels = [
    { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle className="inline w-5 h-5 text-green-500 hover:animate-spin" /> },
    { id: 'email', name: 'Email', icon: <Mail className="inline w-5 h-5 text-red-500 hover:animate-spin" /> },
    { id: 'sms', name: 'SMS', icon: <Smartphone className="inline w-5 h-5 text-blue-500 hover:animate-spin" /> },
    { id: 'phone', name: 'Phone', icon: <Phone className="inline w-5 h-5 text-yellow-500 hover:animate-spin" /> },
];

interface AlertConfig {
    critical: number;
    id: string;
    name: string;
    channels: { [key: string]: boolean };
}

export interface AlertsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    siteName: string;
    alertTypes?: string[]; // Add alertTypes to props
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
    isOpen,
    onClose,
    data,
    siteName,
    alertTypes = [],
}) => {
    const [alerts, setAlerts] = useState<AlertConfig[]>([]);
    const [loading, setLoading] = useState(false);

    const branchCode = sessionStorage.getItem('branch');


    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);

        axios
            .get(`${API_BASE_URL}/api/social-media/getSavedAlertTypes?branchCode=${data.branchCode}`)
            .then(res => {
                const payload = res.data.payload;


                const fetchedAlerts = Array.isArray(payload)
                    ? payload.map((alert: any) => ({
                        id: alert.alertType,
                        name: alert.alertType,
                        channels: {
                            whatsapp: alert.whatsapp === 'Y',
                            sms: alert.sms === 'Y',
                            phone: alert.calling === 'Y',
                            email: alert.mail === 'Y',
                        },
                    }))
                    : [];

                const fullAlerts = data.alertTypes.map((type: string) => {
                    // Remove trailing :Y or :N for comparison
                    const baseType = type.split(':')[0];
                    const existing = fetchedAlerts.find(a => a.name.split(':')[0] === baseType);
                    return existing || {
                        id: baseType,
                        name: type,
                        channels: {
                            whatsapp: false,
                            sms: false,
                            phone: false,
                            email: false,
                        },
                    };
                });

                setAlerts(fullAlerts);
            })
            .catch(err => {
                console.error('API error:', err);
                const fallbackAlerts = data.alertTypes.map((type: string) => ({
                    id: type,
                    name: type,
                    channels: {
                        whatsapp: false,
                        sms: false,
                        phone: false,
                        email: false,
                    },
                }));
                setAlerts(fallbackAlerts);
            })
            .finally(() => setLoading(false));
    }, [isOpen, branchCode]);

    const toggleChannel = (alertId: string, channelId: string) => {
        setAlerts(prevAlerts =>
            prevAlerts.map(alert => {
                if (alert.id === alertId) {
                    return {
                        ...alert,
                        channels: {
                            ...alert.channels,
                            [channelId]: !alert.channels[channelId],
                        },
                    };
                }
                return alert;
            })
        );
    };

    const handleSubmit = async () => {
        const now = new Date().toISOString();
        const changesToSave = alerts.map(alert => ({
            bankName: data.bankName,
            branchCode: data.branchCode,
            alertType: alert.name.split(':')[0],
            whatsapp: alert.channels.whatsapp ? 'Y' : 'N',
            sms: alert.channels.sms ? 'Y' : 'N',
            calling: alert.channels.phone ? 'Y' : 'N',
            mail: alert.channels.email ? 'Y' : 'N',
            timestamp: now,
        }));

        try {
            await axios.post(`${API_BASE_URL}/api/social-media/save`, changesToSave);
            setTimeout(() => {
                onClose(); // close modal after saving
            }, 1000); // delay to allow save to complete

            Swal.fire({
                title: 'Success!',
                text: 'Configuration saved successfully.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
            });


        } catch (err) {
            console.error('Save error:', err);

            Swal.fire({
                title: 'Error!',
                text: 'Failed to save alert configuration.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
            });
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={() => { }}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0"
                onInteractOutside={e => e.preventDefault()}
                onEscapeKeyDown={e => e.preventDefault()}>
                <div className="bg-gradient-to-r from-gray-700 to-blue-700 text-white p-6 rounded-t-lg">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5" />
                                <DialogTitle className="text-xl font-semibold">
                                    Alert Configuration : {siteName}
                                </DialogTitle>

                                <DialogClose className="absolute top-4 right-4">
                                    <X className="h-4 w-4" onClick={onClose} />
                                </DialogClose>

                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-6 overflow-y-auto max-h-[60vh] overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 font-semibold text-sm border-b pb-2 top-0 sticky z-10 bg-white">
                        <div>Alert Type</div>
                        {notificationChannels.map(channel => (
                            <div key={channel.id} className="text-center flex flex-col items-center gap-1">
                                {channel.icon}
                                <span>{channel.name}</span>
                            </div>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center text-sm mt-6">Loading...</div>
                    ) : (
                        data?.alertTypes?.length > 0 ? (
                            data.alertTypes.map((alertType: string, idx: number) => {
                               
                                const baseType = alertType.split(':')[0];
                                const alert = alerts.find(a => a.id === baseType);
                                let isCritical = false;
                                if (alert && alert.critical === 1) {
                                    isCritical = true;
                                } else if (data.alertCriticals && Array.isArray(data.alertCriticals)) {
                                    isCritical = data.alertCriticals.includes(alertType);
                                } else if (data.criticalAlerts && Array.isArray(data.criticalAlerts)) {
                                    isCritical = data.criticalAlerts.includes(alertType);
                                }
                                // Add red bg for :Y
                                const isRed = alertType.trim().endsWith(':Y');
                                return (
                                    <div
    key={alertType}
    className="grid grid-cols-5 gap-4 py-3 items-center border-b"
>
    <div className={`flex items-center gap-2 text-sm ${isRed || isCritical ? 'bg-red-600 text-white rounded px-2 py-1' : ''}`}>
        <span>{baseType}</span>
    </div>
                                        {notificationChannels.map(channel => (
                                            <div className="flex justify-center" key={channel.id}>
                                                <Checkbox
                                                    checked={!!(alert && alert.channels[channel.id])}
                                                    onCheckedChange={() => {
                                                        if (alert) {
                                                            toggleChannel(alert.id, channel.id);
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-sm mt-6">No alerts found</div>
                        )
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="bg-gradient-to-r from-gray-700 to-blue-700 text-white">
                        Save Configuration
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
