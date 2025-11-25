import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash, X, ArrowLeft } from "lucide-react";
import MultiSelectZone from "./MultiSelectZone";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AlertTypeModal from './AlertTypeModal';
import { DialogClose } from '@radix-ui/react-dialog';
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/config/api";

interface ZoneRow {
  id: string;
  inputDesiredName: string;
  groupType: string;
  zones: string[];
  alertType: string;
  vendorName: string;
}
interface ZoneDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType?: string;
  deviceData?: any; 
  onSave?: () => void; 
}

export interface MultiSelectZoneProps {
  selectedZones: string[];
  onZoneChange: (zones: string[]) => void;
  disabledZones?: string[];
}

const ZoneDetailsTable: React.FC<ZoneDetailsModalProps> = ({
  isOpen,
  onClose,
  productType,
  deviceData,
  onSave,
}) => {
  // Move rows state outside the component to preserve across modal open/close
  // But for per-instance preservation, useRef is enough

  const [rows, setRows] = useState<ZoneRow[]>([
    { id: '1', inputDesiredName: 'CCTV', groupType: '', zones: [], alertType: '', vendorName: '' },
  ]);

  // Vendor dropdown state
  const [vendorOptions, setVendorOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch vendor dropdown from API and store as objects with vendorId and vendorName
  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/getAllVendors`);
        const result = await response.json();
        if ((result.statusCode === 200 || result.status === "success") && Array.isArray(result.payload)) {
          setVendorOptions(result.payload.map((vendor: any) => ({
            value: vendor.vendorId,
            label: vendor.vendorName
          })));
        } else {
          setVendorOptions([]);
        }
      } catch {
        setVendorOptions([]);
      }
    };
    fetchVendors();
  }, []);

  const deviceTypes = ['CCTV', 'Security Alarm', 'Fire Alarm', 'ETL', 'BACS', 'Integrated Panel'];

  // Generate zone options: "ZONE1", "ZONE2", ..., "ZONE40" (skip ZONE21 if needed)
  const zoneOptions = Array.from({ length: 40 }, (_, i) => `ZONE${i + 1}`); // ["ZONE1", "ZONE2", ..., "ZONE40"]


  // Compute all selected zones across all rows
  const allSelectedZones = rows.flatMap(row => row.zones);

  // Compute all selected zones across all rows except the current row
  const getDisabledZones = (currentRowId: string) => {
    return rows
      .filter(row => row.id !== currentRowId)
      .flatMap(row => row.zones);
  };

  const addNewRow = () => {
    const newRow: ZoneRow = {
      id: Date.now().toString(),
      inputDesiredName: 'CCTV',
      groupType: '',
      zones: [],
      alertType: '',
      vendorName: '',
    };
    setRows([...rows, newRow]);
  };


  const deleteRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof ZoneRow, value: any) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const [alertTypeModalOpen, setAlertTypeModalOpen] = useState(false);
  const [selectedRowZones, setSelectedRowZones] = useState<string[]>([]);
  // Also preserve alertTypeMap state
  const [alertTypeMap, setAlertTypeMap] = useState<{ [zone: string]: { alertType: string; message: string; isPrimary: boolean; isAlert: boolean; isCritical?: boolean } }>({});
  // Add a new state to hold the alert data for the modal
  const [alertTypeModalData, setAlertTypeModalData] = useState<any[]>([]);

  const handleAlertTypeClick = (rowZones: string[]) => {
    if (rowZones.length > 0) {
      setSelectedRowZones(rowZones);

      // Prepare alert data for the modal: preserve existing, add defaults for new
      const modalData = rowZones.map(zone => {
        if (alertTypeMap[zone]) {
          return {
            zone,
            ...alertTypeMap[zone],
          };
        }
        // Default values for new zones
        return {
          zone,
          alertType: "",
          message: "",
          isPrimary: false,
          isAlert: false,
          isCritical: false,
        };
      });
      setAlertTypeModalData(modalData);

      setAlertTypeModalOpen(true);
    } else {
      // Show a toast or alert that zones must be selected first
      console.log('Please select zones first');
    }
  };

  // Handle AlertTypeModal Done
  const handleAlertTypeDone = (alertData: any[]) => {
    const newMap: { [zone: string]: { alertType: string; message: string; isPrimary: boolean; isAlert: boolean; isCritical?: boolean } } = {};
    alertData.forEach(item => {
      newMap[item.zone] = {
        alertType: item.alertType,
        message: item.message,
        isPrimary: item.isPrimary,
        isAlert: item.isAlert,
        isCritical: item.isCritical || false,
      };
    });

    // Update zones in the rows if user changed zones in AlertTypeModal
    if (alertData.length > 0) {
      const newZones = alertData.map(item => item.zone);
      setRows(prevRows =>
        prevRows.map(row =>
          row.zones.length > 0 && row.zones.every(z => selectedRowZones.includes(z))
            ? { ...row, zones: newZones }
            : row
        )
      );
    }

    setAlertTypeMap(prev => ({ ...prev, ...newMap }));
    setAlertTypeModalOpen(false);
  };

  const mapRowsToApiZoneList = (deviceId: string) => {
    const apiList: any[] = [];
    rows.forEach((row) => {
      (row.zones || []).forEach((zoneName) => {
        const alertInfo: { isAlert?: boolean; alertType?: string; message?: string; isPrimary?: boolean; isCritical?: boolean } = alertTypeMap[zoneName] || { isAlert: false, alertType: "", message: "", isPrimary: false, isCritical: false };
        const {
          isAlert = false,
          alertType = "",
          message = "",
          isPrimary = false,
          isCritical = false,
        } = alertInfo;
        apiList.push({
          alertFlag: isAlert ? "Y" : "N",
          alertType,
          criticalAlertFlag: isCritical ? "Y" : "N",
          deviceId: deviceId,
          id: row.id,
          inputType: row.groupType || "",
          message,
          primaryFlag: isPrimary ? "Y" : "N",
          zoneDesiredName: row.inputDesiredName || "",
          zoneOriginalName: zoneName,
          vendors: row.vendorName || "",
        });
      });
    });
    return apiList;
  };

  const handleSave = async () => {
    try {
      // Debug: log deviceData before sending
      console.log('Saving device master, deviceData:', deviceData);
      const deviceRes = await fetch(`${API_BASE_URL}/addDeviceMaster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deviceData),
      });
      const deviceResult = await deviceRes.json();
      // Debug: log API response
      console.log('Device master save response:', deviceResult);

      if (!(deviceResult.status === "success" || deviceResult.statusCode === 200)) {
        Swal.fire({
          icon: "error",
          title: "Error Saving Device Master",
          text: deviceResult.message || JSON.stringify(deviceResult),
          timer: 4000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            if (onClose) onClose();
          }
        });
        return;
      }

      const savedDeviceId =
        deviceResult.payload?.deviceId ||
        deviceResult.deviceId ||
        deviceData?.deviceId ||
        "";

      // 2. Save multiple zone details with deviceId and alertType info
      const zoneList = mapRowsToApiZoneList(savedDeviceId);
      const zoneRes = await fetch(`${API_BASE_URL}/addMultipleDeviceZoneDetails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zoneList),
      });
      const zoneResult = await zoneRes.json();
      // Debug: log zone API response
      console.log('Zone save response:', zoneResult);

      if (zoneResult.status === "success" || zoneResult.statusCode === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: zoneResult.message || "Device  Saved successfully",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            if (onSave) onSave(), window.location.reload();
            if (onClose) onClose();
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error Saving Zones",
          text: zoneResult.message || JSON.stringify(zoneResult),
          timer: 4000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            if (onClose) onClose();
          }
        });
      }
    } catch (err: any) {
      console.error('Error in handleSave:', err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (err?.message as string),
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        willClose: () => {
          if (onClose) onClose();
        }
      });
    }
  };

  // For Clear All, reset rows and alertTypeMap
  const handleClearAll = () => {
    setRows([
      { id: '1', inputDesiredName: 'CCTV', groupType: '', zones: [], alertType: '', vendorName: '' }
    ]);
    setAlertTypeMap({});
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={() => { /* do nothing to prevent accidental close */ }}
      >
        <DialogContent
          className="max-w-7xl max-h-[90vh] flex flex-col p-0"
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          {/* Header */}
          <DialogHeader className="relative bg-gradient-to-r from-slate-700 to-blue-700 text-white px-6 py-4 rounded-t-lg z-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="mr-2 text-white hover:bg-blue-800"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-xl font-semibold text-center flex-1">
                Zone Details Configuration
              </DialogTitle>
              <DialogClose className="absolute top-4 right-4" onClick={onClose}>
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>

       <div className="flex-1 min-h-0 overflow-hidden px-4 pb-2">
  <div className="rounded-lg shadow-lg border min-h-[400px] max-h-[420px] overflow-y-auto">
    <table className="w-full text-sm">
      <thead className="text-gray-600 bg-gray-200 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3">Input Desired Name</th>
          <th className="px-4 py-3">Group Type</th>
          <th className="px-4 py-3">Zone</th>
          <th className="px-4 py-3">Vendor</th>
          <th className="px-4 py-3">Alert Type</th>
          <th className="px-4 py-3">Add</th>
          <th className="px-4 py-3">Delete</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
            <td className="px-4 py-3">
              <Select
                value={row.inputDesiredName}
                onValueChange={(value) => updateRow(row.id, 'inputDesiredName', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </td>

            <td className="px-4 py-3">
              <Input
                value={row.groupType}
                onChange={(e) => updateRow(row.id, 'groupType', e.target.value)}
                placeholder="Enter group type"
              />
            </td>

            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1 mb-1">
                {row.zones && row.zones.length > 0 ? (
                  <>
                    {row.zones.slice(0, 3).map((zone) => (
                      <span
                        key={zone}
                        className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                      >
                        {zone.toUpperCase().replace(/\s+/g, '')}
                      </span>
                    ))}
                    {row.zones.length > 3 && (
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">
                        +{row.zones.length}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">No zones selected</span>
                )}
              </div>
              <MultiSelectZone
                selectedZones={row.zones}
                onZoneChange={(zones) =>
                  updateRow(row.id, 'zones', zones.map(z => z.toUpperCase().replace(/\s+/g, '')))
                }
                disabledZones={getDisabledZones(row.id).map(z => z.toUpperCase().replace(/\s+/g, ''))}
              />
            </td>

            <td className="px-4 py-3">
              <Select
                value={row.vendorName}
                onValueChange={(value) => updateRow(row.id, 'vendorName', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendorOptions.map((vendor) => (
                    <SelectItem key={vendor.value} value={vendor.label}>
                      {vendor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </td>

            <td className="px-4 py-3">
              <Button
                onClick={() => handleAlertTypeClick(row.zones)}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={row.zones.length === 0}
              >
                Configure Alert Types
              </Button>
            </td>

            <td className="px-4 py-3 text-center">
              <Button onClick={addNewRow} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </td>

            <td className="px-4 py-3 text-center">
              <Button onClick={() => deleteRow(row.id)} size="sm" variant="destructive">
                <Trash className="w-4 h-4" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


          {/* Footer */}
          <DialogFooter className="bg-gray-50 border-t px-2 py-2 rounded-b-lg flex justify-end gap-2">
           
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertTypeModal
        isOpen={alertTypeModalOpen}
        onClose={() => setAlertTypeModalOpen(false)}
        selectedZones={selectedRowZones}
        productType={productType}
        onDone={handleAlertTypeDone}
        // Pass the pre-filled data to the modal
        alertData={alertTypeModalData}
      />
    </>



  );
};

export default ZoneDetailsTable;
