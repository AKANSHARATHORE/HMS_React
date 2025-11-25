import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface AlertTypeData {
  zone: string;
  alertType: string;
  message: string;
  primaryZone: boolean;
  alert: boolean;
}

interface AlertTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertData: AlertTypeData[];
  onSave: (data: AlertTypeData[]) => void;
}

export const AlertTypeModal: React.FC<AlertTypeModalProps> = ({
  open,
  onOpenChange,
  alertData,
  onSave
}) => {
  const [localData, setLocalData] = useState<AlertTypeData[]>(alertData);

  useEffect(() => {
    setLocalData(alertData);
  }, [alertData]);

  const updateZoneData = (index: number, field: keyof AlertTypeData, value: any) => {
    const newData = [...localData];
    
    // If setting primary zone, ensure only one can be primary
    if (field === 'primaryZone' && value === true) {
      newData.forEach((item, i) => {
        if (i !== index) {
          item.primaryZone = false;
        }
      });
    }
    
    newData[index] = { ...newData[index], [field]: value };
    setLocalData(newData);
  };

  const handleSave = () => {
    onSave(localData);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Alert Type Details</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-blue-500 text-white rounded-t-lg">
            <div className="col-span-2 p-3 border-r border-blue-400 font-medium">Zone</div>
            <div className="col-span-3 p-3 border-r border-blue-400 font-medium">Alert Type</div>
            <div className="col-span-4 p-3 border-r border-blue-400 font-medium">Message</div>
            <div className="col-span-2 p-3 border-r border-blue-400 font-medium">Primary Zone</div>
            <div className="col-span-1 p-3 font-medium">Alert</div>
          </div>

          {/* Data Rows */}
          {localData.map((item, index) => (
            <div key={item.zone} className={`grid grid-cols-12 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}>
              <div className="col-span-2 p-3 border-r border-gray-200 flex items-center">
                <span className="text-sm font-medium">{item.zone}</span>
              </div>
              
              <div className="col-span-3 p-3 border-r border-gray-200">
                <Input
                  value={item.alertType}
                  onChange={(e) => updateZoneData(index, 'alertType', e.target.value)}
                  placeholder="Enter alert type"
                  className="w-full"
                />
              </div>
              
              <div className="col-span-4 p-3 border-r border-gray-200">
                <Input
                  value={item.message}
                  onChange={(e) => updateZoneData(index, 'message', e.target.value)}
                  placeholder="Enter message"
                  className="w-full"
                />
              </div>
              
              <div className="col-span-2 p-3 border-r border-gray-200 flex justify-center items-center">
                <RadioGroup
                  value={item.primaryZone ? item.zone : ''}
                  onValueChange={(value) => updateZoneData(index, 'primaryZone', value === item.zone)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={item.zone} id={`primary-${item.zone}`} />
                    <Label htmlFor={`primary-${item.zone}`} className="sr-only">
                      Primary zone
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="col-span-1 p-3 flex justify-center items-center">
                <Checkbox
                  checked={item.alert}
                  onCheckedChange={(checked) => updateZoneData(index, 'alert', !!checked)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
