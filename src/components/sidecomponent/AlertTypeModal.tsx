import React, { useEffect, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';

interface AlertTypeData {
  zone: string;
  alertType: string;
  message: string;
  isPrimary: boolean;
  isAlert: boolean;
  isCritical?: boolean; // <-- add this
}

interface AlertTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedZones: string[];
  productType?: string;
  onDone?: (alertData: AlertTypeData[]) => void;
  alertData?: AlertTypeData[]; // <-- add this prop
}

const AlertTypeModal: React.FC<AlertTypeModalProps> = ({
  isOpen,
  onClose,
  selectedZones,
  productType,
  onDone,
  alertData: incomingAlertData = [], // <-- default to empty array
}) => {
  const [alertData, setAlertData] = useState<AlertTypeData[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Map selectedZones to alertData, preserving existing data if present
      setAlertData(
        selectedZones.map(zone => {
          const existing = incomingAlertData.find(d => d.zone === zone);
          return (
            existing || {
              zone,
              alertType: '',
              message: '',
              isPrimary: false,
              isAlert: false,
              isCritical: false,
            }
          );
        })
      );
    }
  }, [selectedZones, isOpen, incomingAlertData]);

  const updateAlertData = (index: number, field: keyof AlertTypeData, value: string | boolean) => {
    const newData = [...alertData];
    
    // If setting primary zone, ensure only one can be primary
    if (field === 'isPrimary' && value === true) {
      newData.forEach((item, i) => {
        if (i !== index) {
          item.isPrimary = false;
        }
      });
    }
    
    newData[index] = { ...newData[index], [field]: value };
    setAlertData(newData);
  };

  const handleDone = () => {
    if (onDone) onDone(alertData); // <-- call parent with alert data
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0"onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}>
        <DialogHeader className="relative bg-gradient-to-r from-slate-700 to-blue-700 text-white px-6 py-4 rounded-t-lg z-10 overflow-hidden">
         
          <DialogTitle className="text-xl font-semibold text-center">
            Alert Type Details
          </DialogTitle>

          <DialogClose className="absolute top-4 right-4">
            <X className="h-4 w-4" onClick={onClose}/>
          </DialogClose>
          
        </DialogHeader>

        <div className="overflow-x-auto max-h-[70vh] p-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r bg-gray-200 text-gray-800">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Zone</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Alert Type</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Message</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Primary Zone</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Critical Alert</th> {/* New column */}
              </tr>
            </thead>
            <tbody>
              {alertData.map((data, index) => (
                <tr key={data.zone} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    {data.zone}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      value={data.alertType}
                      onChange={(e) => updateAlertData(index, 'alertType', e.target.value)}
                      placeholder="Enter alert type"
                      className="max-w-[210px]"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Textarea
                      value={data.message}
                      onChange={(e) => updateAlertData(index, 'message', e.target.value)}
                      disabled={productType === "D"}
                      placeholder="Enter message"
                      className="w-full min-h-[75px] resize-none"
                      rows={3}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <input
                      type="radio"
                      name="primaryZone"
                      checked={data.isPrimary}
                      onChange={(e) => updateAlertData(index, 'isPrimary', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!data.isCritical}
                      onChange={(e) => updateAlertData(index, 'isCritical', e.target.checked)}
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end p-4 border-t">
          <Button 
            onClick={handleDone}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertTypeModal;
