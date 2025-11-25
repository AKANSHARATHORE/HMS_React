import React, { useEffect, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash2, X } from 'lucide-react';
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/config/api";

interface ZoneDetail {
  criticalAlertFlag: string;
  id: string;
  inputDesiredName: string;
  groupType: string;
  zone: string;
  alertType: string;
  alert: 'Y' | 'N';
  flag: 'Y' | 'N';
  primaryFlag: 'Y' | 'N';
  criticalFlag?: 'Y' | 'N';
  vendorName?: string;
}

interface ZoneDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  deviceMasterData?: any;
  onDeviceUpdated?: (shouldClose?: boolean) => void;
  voltage1?: string;
  voltage2?: string;
  voltage3?: string;
  onVoltageChange?: (v1: string, v2: string, v3: string) => void;
}

export const ZoneDetailsModal: React.FC<ZoneDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  deviceId,
  deviceMasterData,
  onDeviceUpdated,
  voltage1 = "",
  voltage2 = "",
  voltage3 = "",
  onVoltageChange
}) => {
  const [zoneDetails, setZoneDetails] = useState<ZoneDetail[]>([]);
  // Vendor dropdown state
  const [vendorOptions, setVendorOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch vendor dropdown from API and store as objects with vendorId and vendorName
  useEffect(() => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [inputDesiredNameOptions, setInputDesiredNameOptions] = useState<string[]>([]);
    // Custom confirmation dialog state
    const [confirmOpenModal, setconfirmOpenModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && deviceId) {
      getDeviceZonesDetail();
    }
  }, [isOpen, deviceId]);

  const getDeviceZonesDetail = async () => {
    setIsLoading(true);
    try {
      const url = `${API_BASE_URL}/getDeviceAndZoneDetailsByDeviceId?deviceId=${deviceId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.statusCode == '200') {
        const apiZoneList = result.payload.zoneList;
        // alert(JSON.stringify(apiZoneList))
        const mappedZones: ZoneDetail[] = apiZoneList.map((zone: any, index: number) => ({
          id: zone.id || String(index + 1),
          inputDesiredName: zone.zoneDesiredName || '',
          groupType: zone.inputType || '',
          zone: zone.zoneOriginalName || '',
          alertType: zone.alertType || '',
          alert: zone.primaryFlag == 'Y' ? 'Y' : 'N',
          flag: zone.primaryFlag == 'Y' ? 'Y' : 'N',
          primaryFlag: zone.primaryFlag == 'Y' ? 'Y' : 'N',
          criticalFlag: zone.criticalAlertFlag == 'Y' ? 'Y' : 'N',
          vendorName: typeof zone.vendors === 'string' ? zone.vendors : '',
        }));
        setZoneDetails(mappedZones);
        // Fetch inputDesiredName options from API zoneList
        setInputDesiredNameOptions(
          Array.from(new Set(apiZoneList.map((zone: any) => zone.zoneDesiredName).filter(Boolean)))
        );
      } else {
        console.error('Failed to fetch device zones:', result.message);
      }
    } catch (error) {
      console.error('Error fetching device zones:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleInputChange = (id: string, field: keyof ZoneDetail, value: string) => {
    setZoneDetails((prev) => {
      return prev.map((item) => {
        if (item.id !== id) return item;
        // If editing groupType in a new row, auto-fill vendorName if groupType matches an existing row
        if (field === 'groupType' && item.id.startsWith('new-')) {
          const match = prev.find(
            (row) => row.groupType === value && row.id !== id && row.vendorName
          );
          return {
            ...item,
            groupType: value,
            vendorName: match ? match.vendorName : '',
          };
        }
        if (field == 'flag' || field == 'primaryFlag') {
          return { ...item, flag: value as 'Y' | 'N', primaryFlag: value as 'Y' | 'N' };
        }
        return { ...item, [field]: value };
      });
    });
  };

  // Custom confirmation dialog logic
  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setconfirmOpenModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deviceId || !pendingDeleteId) return;
    try {
      const url = `${API_BASE_URL}/deleteZoneByDeviceId?deviceId=${deviceId}&id=${pendingDeleteId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.statusCode === 200 || result.statusCode === '200') {
        setZoneDetails((prev) => prev.filter((item) => item.id !== pendingDeleteId));
        if (onDeviceUpdated) onDeviceUpdated(false); // don't close modal on delete
      } else {
        // Optionally show error
      }
    } catch (error) {
      // Optionally show error
    }
    setconfirmOpenModal(false);
    setPendingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setconfirmOpenModal(false);
    setPendingDeleteId(null);
  };

  const handleDeleteAll = () => {
    setZoneDetails([]);
  };


  // Handle editable Primary Zone per group
  const handlePrimaryZoneChange = (id: string, value: 'Y' | 'N') => {
    const changedRow = zoneDetails.find(item => item.id === id);
    if (!changedRow) return;
    const group = changedRow.groupType;
    if (value === 'Y') {
      // Only one 'Y' per group
      setZoneDetails(prev =>
        prev.map(item =>
          item.groupType == group
            ? { ...item, flag: item.id == id ? 'Y' : 'N', primaryFlag: item.id === id ? 'Y' : 'N' }
            : item
        )
      );
    } else {
      // Just set this row to 'N', others remain as is
      setZoneDetails(prev =>
        prev.map(item =>
          item.id === id ? { ...item, flag: 'N', primaryFlag: 'N' } : item
        )
      );
    }
  };

  const handleCriticalFlagChange = (id: string, value: 'Y' | 'N') => {
    setZoneDetails(prev =>
      prev.map(item =>
        item.id === id ? { ...item, criticalFlag: value, criticalAlertFlag: value } : item
      )
    );
  };

  // Handler for voltage input changes
  const handleVoltageInputChange = (idx: number, value: string) => {
    let v1 = voltage1, v2 = voltage2, v3 = voltage3;
    if (idx === 1) v1 = value;
    if (idx === 2) v2 = value;
    if (idx === 3) v3 = value;
    if (onVoltageChange) onVoltageChange(v1, v2, v3);
  };

  // Add Row Handler
  const handleAddRow = () => {
    setZoneDetails(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        inputDesiredName: '',
        groupType: '',
        zone: '',
        alertType: '',
        alert: 'N',
        flag: 'N',
        primaryFlag: 'N',
        criticalFlag: 'N',
        criticalAlertFlag: 'N',
      }
    ]);
  };

  // Prepare zone details for editMultipleDeviceZoneDetails API
  const mapZoneDetailsToApi = () => {
    return zoneDetails.map((z) => ({
      alertFlag: z.alert === "Y" ? "Y" : "N",
      alertType: z.alertType || "",
      criticalAlertFlag: z.criticalFlag == "Y" ? "Y" : "N",
      deviceId: deviceId,
      id: z.id,
      inputType: z.groupType || "",
      primaryFlag: z.primaryFlag == "Y" ? "Y" : "N",
      zoneDesiredName: z.inputDesiredName || "",
      zoneOriginalName: z.zone || "",
      vendors: z.vendorName || "",
    }));
  };

  const handleConfirm = async () => {

    // Validation: Prevent saving if any new row has blank fields
    const hasBlankNewRow = zoneDetails.some(
      z =>
        z.id.startsWith('new-') &&
        (
          !z.inputDesiredName ||
          !z.groupType ||
          !z.zone ||
          !z.alertType ||
          !z.flag ||
          !z.criticalFlag ||
          z.inputDesiredName.trim() === '' ||
          z.groupType.trim() === '' ||
          z.zone.trim() === '' ||
          z.alertType.trim() === '' ||
          z.flag.trim() === '' ||
          z.criticalFlag.trim() === ''
        )
    );
    if (hasBlankNewRow) {
      Swal.fire({
        icon: "error",
        title: "All Fields Required",
        text: "Please select or fill all fields for new rows before saving.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    // Validation: At least one primary zone per group
    const groupMap: { [group: string]: ZoneDetail[] } = {};
    zoneDetails.forEach(z => {
      if (!groupMap[z.groupType]) groupMap[z.groupType] = [];
      groupMap[z.groupType].push(z);
    });
    const groupWithNoPrimary = Object.values(groupMap).some(groupArr => groupArr.every(z => z.primaryFlag !== 'Y'));
    if (groupWithNoPrimary) {
      Swal.fire({
        icon: "error",
        title: "Primary Zone Required",
        text: "At least one Primary Zone (Yes) must be selected in each group.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    // Prepare updated deviceMasterData with voltages from props
    const updatedDeviceMasterData = {
      ...deviceMasterData,
      voltage1,
      voltage2,
      voltage3,
    };
    const zoneList = mapZoneDetailsToApi();
    try {
      // Update device voltages
      const editDeviceRes = await fetch(`${API_BASE_URL}/editDeviceMaster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDeviceMasterData),
      });
      const editDeviceResult = await editDeviceRes.json();

      const deviceSuccess =
        editDeviceResult.status === "success" ||
        editDeviceResult.statusCode === 200 ||
        editDeviceResult.statusCode === "200";

      if (!deviceSuccess) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: editDeviceResult.message || "Failed to update device.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            onClose();
          }
        });
        return;
      }

      // Update zones
      const editZoneRes = await fetch(`${API_BASE_URL}/editMultipleDeviceZoneDetails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zoneList),
      });
      const editZoneResult = await editZoneRes.json();

      const zoneSuccess =
        editZoneResult.status === "success" ||
        editZoneResult.statusCode === 200 ||
        editZoneResult.statusCode === "200";

      if (zoneSuccess && deviceSuccess) {
        // Close modal immediately after success
        if (onDeviceUpdated) onDeviceUpdated(true); // Pass true to close parent modal
        onClose();
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: editZoneResult.message || "Zone details updated successfully.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: (!zoneSuccess ? editZoneResult.message : editDeviceResult.message) || "Failed to update device or zone details.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            onClose();
          }
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update device or zone details.",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        willClose: () => {
          onClose();
        }
      });
    }
  };

  // Device types for dropdown (same as ZoneModal2)
  const deviceTypes = ['CCTV', 'Security Alarm', 'Fire Alarm', 'ETL', 'BACS', 'Integrated Panel'];

  // Zone dropdown options (ZONE1 to ZONE40)
  const zoneOptions = Array.from({ length: 40 }, (_, i) => `ZONE${i + 1}`)
   .filter(zone => zone !== 'ZONE21');

  // Compute used zones
  const usedZones = zoneDetails.map(z => z.zone?.toUpperCase().replace(/\s+/g, '')).filter(Boolean);

  // Helper to get available zones for new rows
  const getAvailableZones = () => zoneOptions.filter(z => !usedZones.includes(z));

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* do nothing to prevent accidental close */ }}>
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

        {/* Voltage Info - Editable */}

        {/* Table Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Add Row Button */}
          <div className="flex justify-end px-4 py-2 bg-white border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400"
            >
              + Add Row
            </Button>
          </div>
          {/* Table Header - Fixed */}
          <div className="bg-gradient-to-r from-slate-700 to-blue-700 text-white grid grid-cols-11 gap-3 px-4 py-3 text-sm font-medium sticky top-0 z-10">
            <div className="col-span-2 text-center">Input Desired Name</div>
            <div className="col-span-1 text-center">Group Type</div>
            <div className="col-span-2 text-center">Zone</div>
            <div className="col-span-1 text-center">Vendor</div>
            <div className="col-span-2 text-center">Alert Type</div>
            <div className="col-span-1 text-center">Primary Zone</div>
            <div className="col-span-1 text-center">Critical Flag</div>
            <div className="col-span-1 text-center">Deletion</div>
          </div>
          
          {/* Table Body - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading zone details...</div>
              </div>
            ) : zoneDetails.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">No zone details available</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {zoneDetails.map((detail, index) => (
                  <div
                    key={detail.id}
                    className={`grid grid-cols-11 gap-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    {/* Input Desired Name - Editable */}
                    <div className="col-span-2">
                      {detail.id.startsWith('new-') ? (
                        <Select
                          value={detail.inputDesiredName}
                          onValueChange={value => handleInputChange(detail.id, 'inputDesiredName', value)}
                        >
                          <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select device type" />
                          </SelectTrigger>
                          <SelectContent>
                            {deviceTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={detail.inputDesiredName}
                          readOnly
                          onChange={e => handleInputChange(detail.id, 'inputDesiredName', e.target.value)}
                          placeholder="Enter desired name..."
                          className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      )}
                    </div>

                    {/* Group Type - Editable */}
                    <div className="col-span-1">
                      {detail.id.startsWith('new-') ? (
                        <Input
                          value={detail.groupType}
                          onChange={e => handleInputChange(detail.id, 'groupType', e.target.value)}
                          placeholder="Enter group type..."
                          className="h-9 text-sm focus:border-blue-500 focus:ring-blue-500 text-center font-medium text-blue-700 bg-blue-50 border-blue-300"
                        />
                      ) : (
                        <Input
                          value={detail.groupType}
                          readOnly
                          onChange={e => handleInputChange(detail.id, 'groupType', e.target.value)}
                          placeholder="Enter group type..."
                          className="h-9 text-sm focus:border-blue-500 focus:ring-blue-500 text-center font-medium text-blue-700 bg-blue-50 border-blue-300"
                        />
                      )}
                    </div>

                    {/* Zone - Editable for new rows as dropdown */}
                    <div className="col-span-2">
                      {detail.id.startsWith('new-') ? (
                        <Select
                          value={detail.zone}
                          onValueChange={value => handleInputChange(detail.id, 'zone', value.toUpperCase().replace(/\s+/g, ''))}
                        >
                          <SelectTrigger className="h-9 min-w-[120px] text-sm text-center font-medium text-blue-700 bg-blue-50 border-blue-300">
                            <SelectValue placeholder="Select zone..." />
                          </SelectTrigger>
                          <SelectContent>
                            {[...new Set([detail.zone, ...getAvailableZones()])].filter(Boolean).map(zone => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={detail.zone.toUpperCase().replace(/\s+/g, '')}
                          readOnly
                          onChange={e => handleInputChange(detail.id, 'zone', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                          placeholder="Enter zone..."
                          className="h-9 text-sm text-center font-medium text-blue-700 bg-blue-50 border-blue-300"
                        />
                      )}
                    </div>

                    {/* Vendor - Editable for all rows with dropdown */}
                    <div className="col-span-1">
                      <Select
                        value={detail.vendorName || ''}
                        onValueChange={value => handleInputChange(detail.id, 'vendorName', value)}
                      >
                        <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorOptions.map(vendor => (
                            <SelectItem key={vendor.value} value={vendor.label}>{vendor.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Message column removed */}

                    {/* Alert Type - Editable */}
                    <div className="col-span-2">
                      {detail.id.startsWith('new-') ? (
                        <Input
                          value={detail.alertType}
                          onChange={e => handleInputChange(detail.id, 'alertType', e.target.value)}
                          placeholder="Enter alert type..."
                          className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      ) : (
                        <Input
                          value={detail.alertType}
                          readOnly
                          onChange={e => handleInputChange(detail.id, 'alertType', e.target.value)}
                          placeholder="Enter alert type..."
                          className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      )}
                    </div>

                    {/* Primary Zone - Editable */}
                    <div className="col-span-1">
                      <Select
                        value={detail.flag || 'N'}
                        onValueChange={(value: 'Y' | 'N') => handlePrimaryZoneChange(detail.id, value)}
                      >
                        <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Critical Flag - Editable for all rows */}
                    <div className="col-span-1">
                      <Select
                        value={detail.criticalFlag || 'N'}
                        onValueChange={value => handleCriticalFlagChange(detail.id, value as 'Y' | 'N')}
                      >
                        <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent  className="bg-white border border-gray-200 shadow-lg z-50">
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Deletion */}
                    <div className="col-span-1 flex justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(detail.id)}
                        className="h-9 w-9 p-0 bg-red-500 hover:bg-red-600 transition-colors duration-150"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="bg-gray-50 border-t px-6 py-4 flex-shrink-0">
          <div className="flex justify-end w-full">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  const before = zoneDetails.map(z => z);
                  const result = await handleConfirm();
                  // Only close if handleConfirm did not return early (i.e., validations passed and save succeeded)
                  // onDeviceUpdated is already called inside handleConfirm on success
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150"
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      {/* Custom confirmation dialog */}
      <Dialog open={confirmOpenModal} onOpenChange={handleCancelDelete}>
        <DialogContent>
          <DialogTitle>Are you sure you want to delete this zone?</DialogTitle>
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
            <Button className="bg-red-600 text-white" onClick={handleConfirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>

    
  );
};