import { Search, Upload, Download, Copy, FileText, Printer, Plus, Save, RefreshCw, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeviceList } from "./DeviceMaster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoneDetailsModal } from "./ZoneModal";
import ZoneDetail from "./ZoneDetail";
import ZoneDetailsTable from "./ZoneModal2";
import { set } from "date-fns";
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/config/api";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  data?: {
    
     deviceId?: string;
     deviceName?: string;
     deviceType?: string;
     deviceLocation?: string;
     phoneNumber?: string;
     protectionType?: string;
     userNo?: string;
     userPassword?: string;
       voltage1?: string;
     voltage2?: string;
     voltage3?: string;
     email1?: string;
     productType?: string;
     passcode?: string;
     address?: string;
     supportNo?: string;
     branchCode?: string;
     deviceSerialNo?: string;
     vendorName?: string;
     vendorEmail?: string;
     vendorMobile?: string;
     status?: string;
     branchName?: string;
     branchAddress?: string;
     bankName?: string;
     ifsc?: string;
   
  }
  onDeviceUpdated?: () => void; 
}

const removeCountryCode = (number) => {

  if (typeof number === 'string') {
    let num = number.trim();
    if (num.startsWith('+91')) num = num.slice(3);
    else if (num.startsWith('91')) num = num.slice(2);
   
    num = num.replace(/\D/g, '');
    if (num.length > 14) num = num.slice(-14);
    return num;
  }
  return number || '';
};

const DeviceModal: React.FC<AddDeviceModalProps> = ({
  data, isOpen, onClose, isEditMode = false, onDeviceUpdated
})=> {

  const initialFormData = {
    deviceId: "",
    deviceName: "",
    deviceType: "",
    deviceLocation: "",
    voltage1: "",
    voltage2: "",
    voltage3: "",
    phoneNumber: "",
    protectionType: "",
    userNo: "",
    userPassword: "",
    email1: "",
    productType: "",
    passcode: "",
    address: "",
    supportNo: "",
    branchCode: "",
    deviceSerialNo: "",
    vendorName: "",
    vendorEmail: ""

  };


  const [formData, setFormData] = useState(initialFormData)
  const [branchCode, setBranchCode] = useState([]);
  const [zoneList, setZoneList] = useState([]);
  const [isZoneOpen, setIsZoneOpen] = useState(false);
  const [isZoneDetailsOpen, setIsZoneDetailsOpen] = useState(false);
  const [isZoneTableOpen, setIsZoneTableOpen] = useState(false);

  // Add state for dropdown options
  const [deviceTypeOptions, setDeviceTypeOptions] = useState([
    { value: "Smart Communicator", label: "Smart Communicator" },
    { value: "SIA", label: "SIA Device" },
    { value: "other", label: "Other" }
  ]);
  const [productTypeOptions, setProductTypeOptions] = useState([
    { value: "#", label: "Select Product Type" },
    { value: "D", label: "Digitals" },
    { value: "N", label: "Guard NG" },
    { value: "Fire", label: "Fire Alarm" },
    { value: "CMS", label: "CMS" },
    { value: "O", label: "Other" }
  ]);
  const [protectionTypeOptions, setProtectionTypeOptions] = useState([
    
    { value: "passcode", label: "passcode" },
    { value: "callerid", label: "Caller ID" },
    { value: "passcodeid", label: "passcode+ID" },
    { value: "none", label: "None" }
  ]);

  // Fetch site (branch) list from API and store as objects with branchCode and branchDesc
useEffect(() => {
  const getAllBranchDetail = async () => {
    const branch = sessionStorage.getItem("branch");
    const url = `${API_BASE_URL}/getAllChildren?branchCode`;
    const response = await fetch(url + "=" + branch);
    const result = await response.json();
    const data = result.payload;
    
    setBranchCode(Array.isArray(data) ? data : []);
  };
  getAllBranchDetail();
}, [isOpen]);



  // Set form data for edit mode, ensuring dropdowns show correct value
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && data && branchCode.length > 0) {
        // Normalize branch
        let normalizedBranch = "";
        if (data.branchCode) {
          const found = branchCode.find(
            (b) =>
              b.branchCode === data.branchCode ||
              b.branchDesc === data.branchCode ||
              (b.branchCode && b.branchCode.toLowerCase() === data.branchCode?.toLowerCase()) ||
              (b.branchDesc && b.branchDesc.toLowerCase() === data.branchCode?.toLowerCase())
          );
          normalizedBranch = found ? found.branchDesc : data.branchCode;
        }

        // Normalize deviceType
        let normalizedDeviceType = "";
        if (data.deviceType) {
          const found = deviceTypeOptions.find(
            (opt) =>
              opt.value === data.deviceType ||
              opt.label === data.deviceType ||
              opt.value.toLowerCase() === data.deviceType?.toLowerCase() ||
              opt.label.toLowerCase() === data.deviceType?.toLowerCase()
          );
          normalizedDeviceType = found ? found.value : data.deviceType;
        }

        // Normalize productType
        let normalizedProductType = "";
        if (data.productType) {
          const found = productTypeOptions.find(
            (opt) =>
              opt.value === data.productType ||
              opt.label === data.productType ||
              opt.value.toLowerCase() === data.productType?.toLowerCase() ||
              opt.label.toLowerCase() === data.productType?.toLowerCase()
          );
          normalizedProductType = found ? found.value : data.productType;
        }

        // Normalize protectionType
        let normalizedProtectionType = "";
        if (data.protectionType) {
          const found = protectionTypeOptions.find(
            (opt) =>
              opt.value === data.protectionType ||
              opt.label === data.protectionType ||
              opt.value.toLowerCase() === data.protectionType?.toLowerCase() ||
              opt.label.toLowerCase() === data.protectionType?.toLowerCase()
          );
          normalizedProtectionType = found ? found.value : data.protectionType;
        }



        setFormData({
          deviceId: data.deviceId || "",
          deviceName: data.deviceName || "",
          deviceType: normalizedDeviceType || "",
          deviceLocation: data.deviceLocation || "",
          phoneNumber: removeCountryCode(data.phoneNumber) || "",
          protectionType: normalizedProtectionType || "",
          userNo: data.userNo || "",
          voltage1: data.voltage1 || "",
          voltage2: data.voltage2 || "",
          voltage3: data.voltage3 || "",
          userPassword: data.userPassword || "",
          email1: data.email1 || "",  
          productType: normalizedProductType || "",
          passcode: data.passcode || "",
          address: data.address || "",
          supportNo: data.supportNo || "",
          branchCode: normalizedBranch || "",
          deviceSerialNo: data.deviceSerialNo || "",
          vendorName: data.vendorName || "",
          vendorEmail: data.vendorEmail || ""
        });
      } else if (!isEditMode) {
        // Only reset if you want a truly fresh form every time
        // setFormData(initialFormData);
        // Instead, do nothing to preserve previous add-device data
      }
    } 
  }, [data, isEditMode, isOpen, branchCode, deviceTypeOptions, productTypeOptions, protectionTypeOptions]);

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      if (isEditMode && data?.deviceId) {
        try {
          const url = `${API_BASE_URL}/getDeviceAndZoneDetailsByDeviceId?deviceId=${data.deviceId}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          const result = await response.json();
          if (result.statusCode == 200) {
            // Find matching branchCode from branchCode array
            let matchedBranchCode = "";
            if (result.payload.branchCode && branchCode.length > 0) {
              const found = branchCode.find(
                (b: any) =>
                  b.branchCode === result.payload.branchCode ||
                  b.branchDesc === result.payload.branchCode ||
                  (b.branchCode && b.branchCode.toLowerCase() === result.payload.branchCode?.toLowerCase()) ||
                  (b.branchDesc && b.branchDesc.toLowerCase() === result.payload.branchCode?.toLowerCase())
              );
              matchedBranchCode = found ? found.branchCode : result.payload.branchCode;
            }
            setFormData((prev) => ({
              ...prev,
              voltage1: result.payload.voltage1,
              voltage2: result.payload.voltage2,
              voltage3: result.payload.voltage3,
              branchCode: matchedBranchCode || prev.branchCode,
            }));
          }
        } catch (err) {
          console.error('Error fetching device details:', err);
        }
      }
    };
    fetchDeviceDetails();
  }, [isOpen, isEditMode, data?.deviceId, branchCode]);

  const[selectedValue, setSelectedValue] = useState();
      const handleSelectChange = (value) => {
        setFormData((prev) => ({ ...prev, deviceType: value })); 
        
        setSelectedValue(value);
        };
  

  const ModalOpen = (selectedValue) => {
  if ( selectedValue=== "SIA" ) {
    setIsZoneDetailsOpen(true);
  } else {
    setIsZoneTableOpen(true);
  }
};

const EditModalOpen = (selectedValue) => {
  if ( selectedValue=== "SIA" ) {
      setIsZoneDetailsOpen(true);
  } else {
    setIsZoneOpen(true);
  }
};


  // Handler to be called from ZoneModal when saving
  const handleZoneSave = async (data) => {
    let payload = { ...data };
    
    // Add SIA protocol data if device type is SIA
    if (data.deviceType === "SIA") {
      payload.siaProtocol = [
        { command: "AR", messageType: "Service", message: "Restore", deviceId: "" },
        { command: "AT", messageType: "Service", message: "AC Trouble", deviceId: "" },
        { command: "BA", messageType: "Burglary", message: "Burglary Alarm", deviceId: "" },
        { command: "BB", messageType: "Service", message: "Burglary Bypass", deviceId: "" },
        { command: "BC", messageType: "Burglary", message: "Burglary Cancel vishal", deviceId: "" },
        { command: "BH", messageType: "Burglary", message: "Burglary Alarm Reset", deviceId: "" },
        { command: "BJ", messageType: "Bulglary", message: "Burglary Trouble Reset", deviceId: "" },
        { command: "BR", messageType: "Bulglary", message: "Burglary Restoral", deviceId: "" },
        { command: "BS", messageType: "Burglary", message: "Burglary Supervisory", deviceId: "" },
        { command: "BT", messageType: "Burglary", message: "Burglary Trouble", deviceId: "" },
        { command: "BU", messageType: "Burglary", message: "Burglary Unbypass", deviceId: "" },
        { command: "BV", messageType: "Burglary", message: "Burglary Verified", deviceId: "" },
        { command: "BX", messageType: "TEST", message: "Bulglary Test", deviceId: "" },
        { command: "cE", messageType: "Arm/Disarm", message: "âArming Delay", deviceId: "" },
        { command: "CF", messageType: "Arm/Disarm", message: "Forced Arm", deviceId: "" },
        { command: "cG", messageType: "Arm/Disarm", message: "Armed area.", deviceId: "" },
        { command: "cl", messageType: "Arm/Disarm", message: "Fail to Arm", deviceId: "" },
        { command: "CJ", messageType: "Arm/Disarm", message: "Late Arm", deviceId: "" },
        { command: "cK", messageType: "Arm/Disarm", message: "Early Arm", deviceId: "" },
        { command: "cL", messageType: "Arm/Disarm", message: "Arming Report", deviceId: "" },
        { command: "cP", messageType: "Arm/Disarm", message: "Automatic Arm", deviceId: "" },
        { command: "cR", messageType: "Arm/Disarm", message: "Recent Arming", deviceId: "" },
        { command: "cT", messageType: "Arm/Disarm", message: "Late to Disarm", deviceId: "" },
        { command: "cw", messageType: "Arm/Disarm", message: "Was Force Armed", deviceId: "" },
        { command: "CZ", messageType: "Arm/Disarm:", message: "Point Closing", deviceId: "" },
        { command: "Dc", messageType: "Report", message: "Access Closed", deviceId: "" },
        { command: "DD", messageType: "Report", message: "Access Denied", deviceId: "" },
        { command: "DF", messageType: "Report", message: "Door Forced", deviceId: "" },
        { command: "DG", messageType: "Report", message: "Access Granted", deviceId: "" },
        { command: "DK", messageType: "Report", message: "Access Lockout.", deviceId: "" },
        { command: "Do", messageType: "Report", message: "Access Open", deviceId: "" },
        { command: "DR", messageType: "Report", message: "Door Restoral", deviceId: "" },
        { command: "Ds", messageType: "Report", message: "Door Station", deviceId: "" },
        { command: "DT", messageType: "Report", message: "Access Trouble.", deviceId: "" },
        { command: "DU", messageType: "Report", message: "DealerID", deviceId: "" },
        { command: "EA", messageType: "Service", message: "Exit Alarm", deviceId: "" },
        { command: "EE", messageType: "Service", message: "Exit Error,", deviceId: "" },
        { command: "ER", messageType: "Service", message: "Restore Expansion Rest.", deviceId: "" },
        { command: "eT", messageType: "Service", message: "Expansion Trouble", deviceId: "" },
        { command: "FA", messageType: "Fire", message: "Alarm: Fire Alarm:", deviceId: "" },
        { command: "FB", messageType: "Fe", message: "Alorm Fire Bynace", deviceId: "" },
        { command: "FH", messageType: "Fire Alarm", message: "Fire Alarm Restore", deviceId: "" },
        { command: "FI", messageType: "TEST", message: "Fire Test Begin", deviceId: "" },
        { command: "FJ", messageType: "Fire Alarm", message: "Fire Trouble Restore", deviceId: "" },
        { command: "FK", messageType: "TEST", message: "Fire Test End", deviceId: "" },
        { command: "FR", messageType: "Fire Alarm", message: "Fire Restoral", deviceId: "" },
        { command: "FS", messageType: "Fire Alarm", message: "Fire Supervisory", deviceId: "" },
        { command: "FT", messageType: "Fire Alarm", message: "Fire Trouble", deviceId: "" },
        { command: "FU", messageType: "Fire Alarm", message: "Fire Unbypass", deviceId: "" },
        { command: "FX", messageType: "TEST", message: "Fire Test", deviceId: "" },
        { command: "FY", messageType: "Fire Alarm", message: "Missing Fire Trouble", deviceId: "" },
        { command: "GA", messageType: "Fire Alarm", message: "Gas Alarm", deviceId: "" },
        { command: "GB", messageType: "Fire Alarm", message: "Gas Bypass", deviceId: "" },
        { command: "GH", messageType: "Fire Alarm", message: "Gas Alarm Restore", deviceId: "" },
        { command: "GJ", messageType: "Fire Alarm", message: "Gas Trouble Restore", deviceId: "" },
        { command: "GR", messageType: "Fire Alarm", message: "Gas Restoral", deviceId: "" },
        { command: "GS", messageType: "Fire Alarm", message: "Gas Supervisory", deviceId: "" },
        { command: "GT", messageType: "Fire Alarm", message: "Gas Trouble", deviceId: "" },
        { command: "GU", messageType: "Fire Alarm", message: "Gas Unbypass", deviceId: "" },
        { command: "GX", messageType: "TEST", message: "Gas Test", deviceId: "" },
        { command: "HA", messageType: "Panic", message: "Hold-up Alarm", deviceId: "" },
        { command: "HB", messageType: "Panic", message: "Hold-up Bypass", deviceId: "" },
        { command: "HH", messageType: "Panic", message: "Hold-up Alarm Reset", deviceId: "" },
        { command: "HJ", messageType: "Panic", message: "Hold-up Trouble Reset", deviceId: "" },
        { command: "HR", messageType: "Panic", message: "Hold-up Restoral", deviceId: "" },
        { command: "HS", messageType: "Panic", message: "Hold-up Supervisory", deviceId: "" },
        { command: "HT", messageType: "Panic", message: "Hold-up Trouble", deviceId: "" },
        { command: "HU", messageType: "Panic", message: "Hold-up Unbypass", deviceId: "" },
        { command: "JA", messageType: "Service", message: "User Code Tamper", deviceId: "" },
        { command: "JD", messageType: "Service", message: "Date Changed", deviceId: "" },
        { command: "JH", messageType: "Service", message: "Holiday Changed", deviceId: "" },
        { command: "JL", messageType: "Service", message: "Log Threshold", deviceId: "" },
        { command: "JO", messageType: "Service", message: "Log Overflow", deviceId: "" },
        { command: "JR", messageType: "Service", message: "Schedule Execute", deviceId: "" },
        { command: "JS", messageType: "Service", message: "Schedule Change", deviceId: "" },
        { command: "JT", messageType: "Service", message: "Time Changed", deviceId: "" },
        { command: "JV", messageType: "Service", message: "User Code Change", deviceId: "" },
        { command: "JX", messageType: "Service", message: "User Code Delete", deviceId: "" },
        { command: "KA", messageType: "Fire Alarm", message: "Heat Alarm", deviceId: "" },
        { command: "KB", messageType: "Fire Alarm", message: "Heat Bypass", deviceId: "" },
        { command: "KH", messageType: "Fire Alarm", message: "Heat Alarm Restore", deviceId: "" },
        { command: "KJ", messageType: "Fire Alarm", message: "Heat Trouble Restore", deviceId: "" },
        { command: "KR", messageType: "Fire Alarm", message: "Heat Restoral", deviceId: "" },
        { command: "KS", messageType: "Fire Alarm", message: "Heat Supervisory", deviceId: "" },
        { command: "KT", messageType: "Fire Alarm", message: "Heat Trouble", deviceId: "" },
        { command: "KU", messageType: "Fire Alarm", message: "Heat Unbypass", deviceId: "" },
        { command: "LB", messageType: "Service", message: "Local Program", deviceId: "" },
        { command: "LD", messageType: "Service", message: "Local Program Denied", deviceId: "" },
        { command: "LE", messageType: "Service", message: "Listen-in ended", deviceId: "" },
        { command: "LF", messageType: "Service", message: "Listen-in begin", deviceId: "" },
        { command: "LR", messageType: "Service Restore", message: "Phone Line Rest.", deviceId: "" },
        { command: "LS", messageType: "Service", message: "Local Program", deviceId: "" },
        { command: "LT", messageType: "Service", message: "Phone Line Trouble", deviceId: "" },
        { command: "LU", messageType: "Service", message: "Local Program Fail", deviceId: "" },
        { command: "LX", messageType: "Service", message: "Local Program Ended", deviceId: "" },
        { command: "MA", messageType: "Report", message: "Medical Alarm", deviceId: "" },
        { command: "MB", messageType: "Report", message: "Medical Bypass", deviceId: "" },
        { command: "MH", messageType: "Report", message: "Medical Alarm Restore", deviceId: "" },
        { command: "MJ", messageType: "Report", message: "Medical Trouble Restore", deviceId: "" },
        { command: "MR", messageType: "Report", message: "Medical Restore", deviceId: "" },
        { command: "MS", messageType: "Report", message: "Medical Supervisory", deviceId: "" },
        { command: "MT", messageType: "Report", message: "Medical Trouble", deviceId: "" },
        { command: "MU", messageType: "Report", message: "Medical Unbypass", deviceId: "" },
        { command: "NA", messageType: "Arm/Disarm", message: "No Activity", deviceId: "" },
        { command: "NF", messageType: "Arm/Disarm", message: "Forced Perimeter Arm", deviceId: "" },
        { command: "NL", messageType: "Arm/Disarm", message: "Perimeter Armed", deviceId: "" },
        { command: "OA", messageType: "Arm/Disarm", message: "Automatic Disarming", deviceId: "" },
        { command: "OC", messageType: "Arm/Disarm", message: "Cancel Report", deviceId: "" },
        { command: "OG", messageType: "Arm/Disarm", message: "Open Area", deviceId: "" },
        { command: "OI", messageType: "Arm/Disarm", message: "Fail to Open", deviceId: "" },
        { command: "OJ", messageType: "Arm/Disarm", message: "Late Open", deviceId: "" },
        { command: "OK", messageType: "Arm/Disarm", message: "Early Open", deviceId: "" },
        { command: "OP", messageType: "Arm/Disarm", message: "Disarming Report", deviceId: "" },
        { command: "OR", messageType: "Arm/Disarm", message: "Disarm after alarm", deviceId: "" },
        { command: "OS", messageType: "Arm/Disarm", message: "Opening Keyswitch", deviceId: "" },
        { command: "OT", messageType: "Arm/Disarm", message: "Late to Close", deviceId: "" },
        { command: "OZ", messageType: "Arm/Disarm", message: "Point Opening", deviceId: "" },
        { command: "PA", messageType: "Panic", message: "Panic Alarm", deviceId: "" },
        { command: "PB", messageType: "Panic", message: "Panic Bypass", deviceId: "" },
        { command: "PH", messageType: "Panic", message: "Panic Alarm Restore", deviceId: "" },
        { command: "PJ", messageType: "Panic", message: "Panic Trouble Restore", deviceId: "" },
        { command: "PR", messageType: "Panic", message: "Panic Restoral", deviceId: "" },
        { command: "PS", messageType: "Panic", message: "Panic Supervisory", deviceId: "" },
        { command: "PT", messageType: "Panic", message: "Panic Trouble", deviceId: "" },
        { command: "PU", messageType: "Panic", message: "Panic Unbypass", deviceId: "" },
        { command: "QA", messageType: "Panic", message: "Emergency Alarm", deviceId: "" },
        { command: "QB", messageType: "Panic", message: "Emergency Bypass", deviceId: "" },
        { command: "QH", messageType: "Panic", message: "Emergency Alarm Restore", deviceId: "" },
        { command: "QJ", messageType: "Panic", message: "Emergency Trouble Restore", deviceId: "" },
        { command: "QR", messageType: "Panic", message: "Emergency Restoral", deviceId: "" },
        { command: "QS", messageType: "Panic", message: "Emergency Supervisory", deviceId: "" },
        { command: "QT", messageType: "Panic", message: "Emergency Trouble", deviceId: "" },
        { command: "QU", messageType: "Panic", message: "Emergency Unbypass", deviceId: "" },
        { command: "RA", messageType: "Service", message: "Remote Programmer Call Failed", deviceId: "" },
        { command: "RB", messageType: "Service", message: "Remote program begin", deviceId: "" },
        { command: "RC", messageType: "Service", message: "Relay Close", deviceId: "" },
        { command: "RD", messageType: "Service", message: "Remote Program Denied", deviceId: "" },
        { command: "RN", messageType: "Service", message: "Remote Reset", deviceId: "" },
        { command: "RO", messageType: "Service", message: "Rele Open", deviceId: "" },
        { command: "RP", messageType: "Test", message: "Automatic Test", deviceId: "" },
        { command: "RR", messageType: "Service", message: "Power up", deviceId: "" },
        { command: "RS", messageType: "Service Restore", message: "Remote Program Success", deviceId: "" },
        { command: "RT", messageType: "Service", message: "Data Lost", deviceId: "" },
        { command: "RU", messageType: "Service", message: "Remote Program Fail", deviceId: "" },
        { command: "RX", messageType: "Test", message: "Manual Test", deviceId: "" },
        { command: "SA", messageType: "Fire Alarm", message: "Sprinkler Alarm", deviceId: "" },
        { command: "SB", messageType: "Fire Alarm", message: "Sprinkler Bypass", deviceId: "" },
        { command: "SH", messageType: "Fire Alarm", message: "Sprinkler Alarm Restore", deviceId: "" },
        { command: "SJ", messageType: "Fire Alarm", message: "Sprinkler Trouble Restore", deviceId: "" },
        { command: "SR", messageType: "Fire Alarm", message: "Sprinkler Restore", deviceId: "" },
        { command: "SS", messageType: "Fire Alarm", message: "Sprinkler Supervisory", deviceId: "" },
        { command: "ST", messageType: "Fire Alarm", message: "Sprinkler Trouble", deviceId: "" },
        { command: "SU", messageType: "Fire Alarm", message: "Sprinkler Unbypass", deviceId: "" },
        { command: "TA", messageType: "Report", message: "Tamper Alarm", deviceId: "" },
        { command: "TB", messageType: "Report", message: "Tamper Bypass", deviceId: "" },
        { command: "TE", messageType: "Test", message: "Test End", deviceId: "" },
        { command: "TR", messageType: "Report", message: "Tamper Restoral", deviceId: "" },
        { command: "TS", messageType: "Test", message: "Test Start", deviceId: "" },
        { command: "TU", messageType: "Report", message: "Tamper Unbypass", deviceId: "" },
        { command: "TX", messageType: "Test", message: "Test Report", deviceId: "" },
        { command: "UA", messageType: "Burglary", message: "Untyped Zone Alarm", deviceId: "" },
        { command: "UB", messageType: "Burglary", message: "Untyped Zone Bypass", deviceId: "" },
        { command: "UH", messageType: "Burglary", message: "Untyped Alarm Restoral", deviceId: "" },
        { command: "UJ", messageType: "Burglary", message: "Untyped Trouble Restoral", deviceId: "" },
        { command: "UR", messageType: "Burglary", message: "Untyped Zone Restoral", deviceId: "" },
        { command: "US", messageType: "Burglary", message: "Untyped Zone Supervisory", deviceId: "" },
        { command: "UT", messageType: "Burglary", message: "Untyped Zone Trouble", deviceId: "" },
        { command: "UU", messageType: "Burglary", message: "Untyped Zone Unbypass", deviceId: "" },
        { command: "UX", messageType: "Burglary", message: "Undefined", deviceId: "" },
        { command: "UY", messageType: "Burglary", message: "Untyped Missing Trouble", deviceId: "" },
        { command: "UZ", messageType: "Burglary", message: "Untyped Missing Alarm", deviceId: "" },
        { command: "VI", messageType: "Service Restore", message: "Printer Paper In", deviceId: "" },
        { command: "VO", messageType: "Service", message: "Printer Paper Out", deviceId: "" },
        { command: "VR", messageType: "Service Restore", message: "Printer Restore", deviceId: "" },
        { command: "VT", messageType: "Service", message: "Printer Trouble", deviceId: "" },
        { command: "VX", messageType: "Test", message: "Printer Test", deviceId: "" },
        { command: "VY", messageType: "Service Restore", message: "Printer Online", deviceId: "" },
        { command: "VZ", messageType: "Service", message: "Printer Offline", deviceId: "" },
        { command: "WA", messageType: "Report", message: "Water Alarm", deviceId: "" },
        { command: "WB", messageType: "Report", message: "Water Bypass", deviceId: "" },
        { command: "WH", messageType: "Report", message: "Water Alarm Restoral", deviceId: "" },
        { command: "WJ", messageType: "Report", message: "Water Trouble Restoral", deviceId: "" },
        { command: "WP", messageType: "Report", message: "Walk test pass", deviceId: "" },
        { command: "WR", messageType: "Report", message: "Water Restore", deviceId: "" },
        { command: "WS", messageType: "Report", message: "Water Supervisory", deviceId: "" },
        { command: "WT", messageType: "Report", message: "Water Trouble", deviceId: "" },
        { command: "WU", messageType: "Report", message: "Water Unbypass", deviceId: "" },
        { command: "XE", messageType: "Service", message: "Extra Point", deviceId: "" },
        { command: "XF", messageType: "Service", message: "Extra RF Point", deviceId: "" },
        { command: "XI", messageType: "Service", message: "Sensor Reset", deviceId: "" },
        { command: "XR", messageType: "Service Restore", message: "TX Battery Restoral", deviceId: "" },
        { command: "XT", messageType: "Service", message: "TX Battery Trouble", deviceId: "" },
        { command: "XW", messageType: "Service", message: "Forced Point", deviceId: "" },
        { command: "YB", messageType: "Service", message: "Busy Seconds", deviceId: "" },
        { command: "YC", messageType: "Service", message: "Communications fail", deviceId: "" },
        { command: "YD", messageType: "Service", message: "RX Line Card Trouble", deviceId: "" },
        { command: "YE", messageType: "Service Restore", message: "RX Line Card Restoral", deviceId: "" },
        { command: "YF", messageType: "Service", message: "Parameter Checksum Fail", deviceId: "" },
        { command: "YG", messageType: "Service", message: "Parameter Changed", deviceId: "" },
        { command: "YK", messageType: "Service Restore", message: "Communication Restoral", deviceId: "" },
        { command: "YM", messageType: "Service", message: "System Battery Missing", deviceId: "" },
        { command: "YN", messageType: "Service", message: "Invalid Report", deviceId: "" },
        { command: "YO", messageType: "Service", message: "Unknown Message", deviceId: "" },
        { command: "YP", messageType: "Service", message: "Power Supply Trouble", deviceId: "" },
        { command: "YQ", messageType: "Service Restore", message: "Power Supply Restored", deviceId: "" },
        { command: "YR", messageType: "Service Restore", message: "System Battery Restoral", deviceId: "" },
        { command: "YS", messageType: "Service", message: "Communication Trouble", deviceId: "" },
        { command: "YT", messageType: "Service", message: "System Battery Trouble", deviceId: "" },
        { command: "YW", messageType: "Service", message: "Watchdog Reset", deviceId: "" },
        { command: "YX", messageType: "Service", message: "Service Required", deviceId: "" },
        { command: "YY", messageType: "Service", message: "Status Report", deviceId: "" },
        { command: "YZ", messageType: "Service", message: "Service Completed", deviceId: "" },
        { command: "ZA", messageType: "Report", message: "Freeze Alarm", deviceId: "" },
        { command: "ZB", messageType: "Report", message: "Freeze Bypass", deviceId: "" },
        { command: "ZH", messageType: "Report", message: "Freeze Alarm Restore", deviceId: "" },
        { command: "ZJ", messageType: "Report", message: "Freeze Trouble Restore", deviceId: "" },
        { command: "ZR", messageType: "Report", message: "Freeze Restoral", deviceId: "" },
        { command: "ZT", messageType: "Report", message: "Freeze Trouble", deviceId: "" },
        { command: "ZS", messageType: "Report", message: "Freeze Supervisory", deviceId: "" },
        { command: "ZU", messageType: "Report", message: "Freeze Unbypass", deviceId: "" }
      ];
      
      // Set deviceId for each protocol entry
      payload.siaProtocol = payload.siaProtocol.map(protocol => ({
        ...protocol,
        deviceId: data.deviceId
      }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/addDeviceMaster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.status === "success" || result.statusCode === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: result.message || "Device saved successfully",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            setIsZoneOpen(false);
            setIsZoneDetailsOpen(false);
            setIsZoneTableOpen(false);
            onClose();
            // window.location.reload();
          }
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Failed to save device.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          willClose: () => {
            setIsZoneOpen(false);
            setIsZoneDetailsOpen(false);
            setIsZoneTableOpen(false);
            onClose();
            // No reload on error
          }
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save device.",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        willClose: () => {
          setIsZoneOpen(false);
          setIsZoneDetailsOpen(false);
          setIsZoneTableOpen(false);
          onClose();
          // No reload on error
        }
      });
    }
  };

  // Update effect to set protectionType to "none" for specific product types
useEffect(() => {
  const defaultTypes = ["D", "Fire", "CMS", "O", "digital"];
  if (defaultTypes.includes(formData.productType)) {
    setFormData((prev) => ({ ...prev, protectionType: "none" }));
  }
}, [formData.productType]);

  // Handler to fetch voltages before opening next modal in edit mode
  const handleEditNext = async () => {
    if (isEditMode && formData.deviceId) {
      try {
        const url = `${API_BASE_URL}/getDeviceAndZoneDetailsByDeviceId?deviceId=${formData.deviceId}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (result.statusCode === 200) {
          setFormData((prev) => ({
            ...prev,
            voltage1: result.payload.voltage1,
            voltage2: result.payload.voltage2,
            voltage3: result.payload.voltage3,
          }));
        }
      } catch (err) {
        // Optionally show error or fallback
      }
    }
    EditModalOpen(formData.deviceType);
  };

  const [errors, setErrors] = useState({
    deviceName: "",
    deviceType: "",
    branchCode: "",
    phoneNumber: "",
    email1: "",
    productType: "",
    vendorName: "",
    deviceLocation: "",
    deviceSerialNo: "",
    address: "",
    userNo: "",
    supportNo: "",
  });


  const mandatoryFields = [
    "deviceName", "deviceType", "branchCode", "phoneNumber", "email1", "productType", "deviceSerialNo", "deviceLocation",
    "address", "userNo"
  ];

  // Validation function
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   
    const newErrors: any = {
      deviceName: "",
      deviceType: "",
      branchCode: "",
      phoneNumber: "",
      email1: "",
      productType: "",
      // vendorName: "",
      deviceLocation: "",
      deviceSerialNo: "",
      address: "",
      userNo: "",
    };

    // Map field names to user-friendly labels for error messages
    const fieldLabels: Record<string, string> = {
      deviceName: "Device Name",
      deviceType: "Device Type",
      branchCode: "Site",
      phoneNumber: "Phone Number",
      email1: "Email Address",
      productType: "Product Type",
      // vendorName: "Vendor Name",
      deviceLocation: "Device Location",
      deviceSerialNo: "Device Serial Number",
      address: "Address",
      userNo: "User Number",
      supportNo: "Support Number",
    };

    let firstInvalid: string | null = null;

    // Only validate fields with red star (mandatoryFields)
    for (const field of mandatoryFields) {
      if (!formData[field] || (typeof formData[field] === "string" && formData[field].trim() === "")) {
        if (!firstInvalid) firstInvalid = field;
        newErrors[field] = `${fieldLabels[field] || field} is required`;
      }
    }

    // Email validation (if entered)
    if (formData.email1 && !emailRegex.test(formData.email1)) {
      newErrors.email1 = "Invalid email format";
      if (!firstInvalid) firstInvalid = "email1";
    }

    setErrors(newErrors);

    // SweetAlert and scroll to first invalid field
    if (firstInvalid) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: newErrors[firstInvalid] || "Please fill all required fields correctly.",
        timer: 2000,
        showConfirmButton: false,
      });
      setTimeout(() => {
        const el = document.getElementById(firstInvalid);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el && "focus" in el) (el as any).focus();
      }, 100);
      return false;
    }

    return true;
  };

  // Update handleSelectChange and all onChange for phone/email to do live validation
  const handleInputChange = (field: string, value: string) => {
    // Only allow numeric input for phoneNumber
    if (field === "phoneNumber") {
      value = value.replace(/\D/g, "");
    }
    setFormData(prev => ({ ...prev, [field]: value }));


    if (field === "email1") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors((prev) => ({ ...prev, email1: "Invalid email format" }));
      } else {
        setErrors((prev) => ({ ...prev, email1: "" }));
      }
    }
  };

  // Compute voltageDisabled for voltage fields
  const voltageDisabled = !isEditMode && formData.productType !== "CMS";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => { /* do nothing to prevent accidental close */ }}>
        <DialogContent
          className="sm:max-w-5xl max-h-[80vh] overflow-y-auto p-0"
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <DialogHeader className="overflow-hidden z-10 bg-gradient-to-r from-gray-800 to-blue-800 text-white sticky top-0 m-0 w-full" >
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>
            <div className="flex flex-col items-center py-2">
              <DialogTitle className="text-2xl font-bold mb-2">
                {isEditMode ? "Edit Device Details" : "Add Device Details"}
              </DialogTitle>
              <p className="text-blue-100">
                {isEditMode ? "Please update the device details below" : "Please enter the device details below to add a new device."}
              </p>
              
              <DialogClose className="absolute top-4 right-4" onClick={onClose}>
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>

          {/* Step Indicator */}
        {/* <div className="flex items-center justify-center py-6 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-semibold">
              1
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-500 rounded-full font-semibold">
              2
            </div>
          </div>
        </div> */}

          


  <div className="min-h-screen  p-4">
    
      <div className="space-y-6">
        {/* Basic Information Section */}
        <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">Device</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 d-none">
            <Label htmlFor="deviceId" className="text-sm font-medium text-gray-700">
              Device ID *
            </Label>
            <Input 
              id="deviceId" 
              placeholder="Enter device ID"
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              className="border-gray-300 focus:border-blue-500"
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="deviceName" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="text-red-500">*</span> Device Name
            </Label>
            <Input 
              id="deviceName" 
              placeholder="Enter device name"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              className={`border-gray-300 focus:border-blue-500 ${errors.deviceName ? 'border-red-500' : ''}`}
            />
            {errors.deviceName && <p className="text-red-500 text-xs">{errors.deviceName}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deviceType" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="text-red-500">*</span> Device Type
            </Label>
          <Select value={formData.deviceType} onValueChange={handleSelectChange}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              {deviceTypeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.deviceType && <p className="text-red-500 text-xs">{errors.deviceType}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deviceSerial" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span className="text-red-500">*</span> Device Serial Number
            </Label>
            <Input 
              id="deviceSerial" 
              placeholder="Device serial number"
              value={formData.deviceSerialNo}
              onChange={(e) => setFormData({ ...formData, deviceSerialNo: e.target.value })}
              onBlur={async (e) => {
                const serial = e.target.value.trim();
                if (!serial) return;
                try {
                  const res = await fetch(`https://digitalshealthmonitoring.in/checkPanelSerialNo?panelSerialNo=${serial}`, {
                    headers: { Accept: '*/*' }
                  });
                  const result = await res.json();
                  if (result?.payload === true) {
                    setFormData((prev) => ({ ...prev, deviceSerialNo: '' }));
                    Swal.fire({
                      icon: 'warning',
                      title: 'Already Present',
                      text: 'This serial number is already present. Please enter another serial number.',
                      timer: 2000,
                      showConfirmButton: false
                    });
                  }
                } catch {}
              }}
              className="border-gray-300 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
              <Label htmlFor="deviceLocation" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> Device Location
              </Label>
              <Input 
                id="deviceLocation" 
                placeholder="Device location"
                value={formData.deviceLocation}
                onChange={(e) => setFormData({ ...formData, deviceLocation: e.target.value })}
                className={`border-gray-300 focus:border-blue-500 ${errors.deviceLocation ? 'border-red-500' : ''}`}
              />
              {errors.deviceLocation && <p className="text-red-500 text-xs">{errors.deviceLocation}</p>}
          </div>

          <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> Phone Number
              </Label>
              <Input 
                id="phoneNumber" 
                placeholder="Phone number"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                onBlur={async (e) => {
                  let phone = e.target.value.trim();
                  if (!phone) return;
                  if (!phone.startsWith('+91')) phone = '+91' + phone.replace(/^0+/, '');
                  try {
                    const res = await fetch(`https://digitalshealthmonitoring.in/checkPhoneNo?phoneNo=${encodeURIComponent(phone)}`, {
                      headers: { Accept: '*/*' }
                    });
                    const result = await res.json();
                    if (result?.payload === true) {
                      setFormData((prev) => ({ ...prev, phoneNumber: '' }));
                      Swal.fire({
                        icon: 'warning',
                        title: 'Already Present',
                        text: 'This phone number is already present, Please enter another number.',
                        timer: 2000,
                        showConfirmButton: false
                      });
                    }
                  } catch {}
                }}
                className={`border-gray-300 focus:border-blue-500 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                maxLength={13}
                inputMode="numeric"
                pattern="\d*"
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber}</p>}
            </div>
        </div>

        {/* Location & Contact Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">Location & Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            
            
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> Email Address
              </Label>
              <Input 
                id="email" 
                type="email"
                placeholder="email@example.com"
                value={formData.email1}
                onChange={(e) => handleInputChange("email1", e.target.value)}
                className={`border-gray-300 focus:border-blue-500 ${errors.email1 ? 'border-red-500' : ''}`}
              />
              {errors.email1 && <p className="text-red-500 text-xs">{errors.email1}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> Address
              </Label>
              <Input 
                id="address" 
                placeholder="Complete address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`border-gray-300 focus:border-blue-500 ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="branchCode" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> Site 
              </Label>
              <Select
                value={
                  branchCode.some((b: any) => b.branchCode === formData.branchCode)
                    ? formData.branchCode
                    : ""
                }
                onValueChange={async (value) => {
            
                  const selectedBranch = branchCode.find((b: any) => b.branchCode === value);
              
                  setFormData({
                    ...formData,
                    branchCode: value,
                    address: selectedBranch?.address1 || ""
                  });
                  try {
                    const res = await fetch(`${API_BASE_URL}/checkBranch?branchCode=${value}`);
                    const result = await res.json();
                    if (result.statusCode === 200 && result.message?.toLowerCase().includes("device already exists")) {
                      Swal.fire({
                        icon: "warning",
                        title: "Device Already Exists",
                        text: result.message,
                        timer: 2000,
                        showConfirmButton: false
                      });
                      // Only clear form data if device exists
                      setFormData((prev) => ({
                        ...prev,
                        branchCode: "",
                        address: "",
                      }));
                      return;
                    }
                  } catch (err) {
                    // Optionally handle error
                  }
                }}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#" disabled>
                    Select Site
                  </SelectItem>
                  {branchCode.map((branch: any) => (
                    <SelectItem key={branch.branchCode} value={branch.branchCode}>
                      {branch.branchDesc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchCode && <p className="text-red-500 text-xs">{errors.branchCode}</p>}
            </div>
            
            <div className="space-y-2 hidden">
              <Label htmlFor="supportNo" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> Support Number
              </Label>
              <Input 
                id="supportNo" 
                placeholder="Support Number"
                value={formData.supportNo}
                onChange={(e) => setFormData({ ...formData, supportNo: e.target.value })}
                className={`border-gray-300 focus:border-blue-500 ${errors.supportNo ? 'border-red-500' : ''}`}
              />
              {errors.supportNo && <p className="text-red-500 text-xs">{errors.supportNo}
                </p>}
            </div>
          </div>
        </div>

        {/* Technical Configuration Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">Technical Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productType" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> Product Type
              </Label>
              <Select
  value={
    productTypeOptions.some((opt: any) => opt.value === formData.productType)
      ? formData.productType
      : ""
  }
  onValueChange={(value) => setFormData({ ...formData, productType: value })}
>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select Product Type" />
                </SelectTrigger>
                <SelectContent >
                  {productTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="protectionType" className="text-sm font-medium text-gray-700">
                Protection Type
              </Label>
              <Select
                value={
                  formData.productType !== "Guard NG"
                    ? formData.protectionType || "passcode"
                    : formData.protectionType
                }
                onValueChange={(value) => setFormData({ ...formData, protectionType: value })}
                disabled={formData.productType !== "Guard NG"}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select Option" />
                </SelectTrigger>
                <SelectContent>
                  {protectionTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passcode" className="text-sm font-medium text-gray-700">
                Passcode
              </Label>
              <Input 
                id="passcode" 
                placeholder="Enter Passcode"
                value={formData.passcode}
                onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userRole" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <span className="text-red-500">*</span> User Number
              </Label>
              <Input 
                id="userRole" 
                placeholder="User Number"
                value={formData.userNo}
                onChange={(e) => setFormData({ ...formData, userNo: e.target.value })}
                className={`border-gray-300 focus:border-blue-500 ${errors.userNo ? 'border-red-500' : ''}`}
              />
              {errors.userNo && <p className="text-red-500 text-xs">{errors.userNo}</p>}
            </div>
            
            {/* Vendor dropdown removed from device modal */}
            
            {/* <div className="space-y-2">
              <Label htmlFor="vendorEmail" className="text-sm font-medium text-gray-700">
                Vendor Email
              </Label>
              <Input 
                id="vendorEmail" 
                type="email"
                placeholder="vendor@example.com"
                value={formData.vendorEmail}
                onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
              />
            </div> */}
          </div>
        </div>
        {/* Voltage Information Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">Voltage Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voltage1" className="text-sm font-medium text-gray-700">Voltage 1</Label>
              <Input
                id="voltage1"
                placeholder="Enter Voltage 1"
                value={formData.voltage1}
                onChange={(e) => setFormData({ ...formData, voltage1: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                disabled={voltageDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voltage2" className="text-sm font-medium text-gray-700">Voltage 2</Label>
              <Input
                id="voltage2"
                placeholder="Enter Voltage 2"
                value={formData.voltage2}
                onChange={(e) => setFormData({ ...formData, voltage2: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                disabled={voltageDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voltage3" className="text-sm font-medium text-gray-700">Voltage 3</Label>
              <Input
                id="voltage3"
                placeholder="Enter Voltage 3"
                value={formData.voltage3}
                onChange={(e) => setFormData({ ...formData, voltage3: e.target.value })}
                className="border-gray-300 focus:border-blue-500"
                disabled={voltageDisabled}
              />
            </div>
          </div>
        </div>
      </div>
    

    
  </div>
          <DialogFooter className="sticky bottom-0 bg-gray-50 border-t px-4 py-3 flex justify-end">
            <Button variant="outline" onClick={() => {
              setFormData(initialFormData); // Reset only on explicit cancel
              onClose();
            }} className="mr-2">
              Cancel
            </Button>
            {isEditMode ? (
              <Button
                type="button"
                onClick={() => {
                  if (validateForm()) handleEditNext();
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                NEXT
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={async () => {
                  // Check serial before submit
                  const serial = formData.deviceSerialNo?.trim();
                  if (serial) {
                    try {
                      const res = await fetch(`https://digitalshealthmonitoring.in/checkPanelSerialNo?panelSerialNo=${serial}`, {
                        headers: { Accept: '*/*' }
                      });
                      const result = await res.json();
                      if (result?.payload === true) {
                        setFormData((prev) => ({ ...prev, deviceSerialNo: '' }));
                        return; // Don't submit if serial is invalid
                      }
                    } catch {}
                  }
                  if (validateForm()) ModalOpen(formData.deviceType);
                }}
              >
                Add Device
              </Button>
            )}
          </DialogFooter>


        </DialogContent>
      </Dialog>

      {isZoneTableOpen && (
        <ZoneDetailsTable
          isOpen={isZoneTableOpen}
          onClose={() => setIsZoneTableOpen(false)}
          productType={formData.productType}
          deviceData={formData}
          onSave={() => setIsZoneTableOpen(false)} 
        />
      )}

     {isZoneOpen && (
        <ZoneDetailsModal
          isOpen={isZoneOpen}
          onClose={() => setIsZoneOpen(false)}
          deviceId={formData.deviceId}
          deviceMasterData={formData}
          voltage1={formData.voltage1}
          voltage2={formData.voltage2}
          voltage3={formData.voltage3}
          onVoltageChange={(v1, v2, v3) =>
            setFormData((prev) => ({
              ...prev,
              voltage1: v1,
              voltage2: v2,
              voltage3: v3,
            }))
          }
          onDeviceUpdated={onDeviceUpdated}
        />
      )}

      
      {isZoneDetailsOpen && (
        <ZoneDetail
          isOpen={isZoneDetailsOpen}
          onClose={() => setIsZoneDetailsOpen(false)}
          onSaveZones={(selectedZones) => handleZoneSave({
            ...formData,
            zoneList: selectedZones
          })}
        />
      )}
    </>
  );
}


export default DeviceModal;
