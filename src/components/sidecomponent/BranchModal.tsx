import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';
import { json } from 'stream/consumers';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { API_BASE_URL } from "@/config/api";

interface BranchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  initialData?: any;
  selectedBranch?: any;
  onSuccess?: () => void;
}

interface BranchFormData {
  branchName: string;
  bankName: string;
  branchType: string;
  parentBranch: string;
  branchCode: string;
  latitude: string;
  longitude: string;
  telephoneNumber: string;
  faxNo: string;
  mobile: string;
  mobile2: string;
  mobile3: string;
  mobile4: string;
  mobile5: string;
  mobile6: string;
  email: string;
  email2: string;
  email3: string;
  email4: string;
  email5: string;
  email6: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  contactPerson: string;
  status: string;
  systemIntegrator: string;
}

const BranchDetailsModal: React.FC<BranchDetailsModalProps> = ({
  isOpen,
  onClose,
  isEditMode = false,
  onSuccess,
  selectedBranch,
  initialData
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [parentCode, setParentCode] = useState('');
  const [formData, setFormData] = useState<BranchFormData>({
    branchName: initialData?.branchName || '',
    bankName: initialData?.bankName || '',
    branchType: initialData?.branchType || '',
    parentBranch: initialData?.branchType === "SUPER HO" ? "0" : (initialData?.parentBranch || ''),
    branchCode: initialData?.branchType === "SUPER HO" ? "0" : (initialData?.branchCode || ''),
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    telephoneNumber: initialData?.telephoneNumber || '',
    faxNo: initialData?.faxNo || '',
    mobile: initialData?.mobile || '',
    mobile2: initialData?.mobile2 || '',
    mobile3: initialData?.mobile3 || '',
    mobile4: initialData?.mobile4 || '',
    mobile5: initialData?.mobile5 || '',
    mobile6: initialData?.mobile6 || '',
    email: initialData?.email || '',
    email2: initialData?.email2 || '',
    email3: initialData?.email3 || '',
    email4: initialData?.email4 || '',
    email5: initialData?.email5 || '',
    email6: initialData?.email6 || '',
    address: initialData?.address || '',
    pincode: initialData?.pincode || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    contactPerson: initialData?.contactPerson || '',
    status: initialData?.status || '',
    systemIntegrator: initialData?.systemIntegrator || 'Digitals' // default to Digitals
  });




  const [fgmoList, setFgmoList] = useState<string[]>([]);

  const [parentBranchOptions, setParentBranchOptions] = useState<string[]>([]);

  const [zoneOptions, setZoneOptions] = useState<string[]>([]);

  const [parentBranchObjects, setParentBranchObjects] = useState<any[]>([]);
  const [selectedParentBranchObj, setSelectedParentBranchObj] = useState<any>(null);

  // Add state for fetched branch data (for edit mode)
  const [editBranchData, setEditBranchData] = useState<any>(null);
  const [vendorOptions, setVendorOptions] = useState<{ vendorId: string, vendorName: string }[]>([]);

  // Get logged-in branch code (adjust as needed, e.g. from initialData, context, or props)
  const loggedInBranchCode = sessionStorage.getItem('branch') || "";
  const bankType = sessionStorage.getItem('bankType') || "";

  // alert(`Logged-in branch code: ${loggedInBranchCode}, Bank Type: ${bankType}`);


  // State for Super HO options
  const [superHoOptions, setSuperHoOptions] = useState<string[]>([]);

  // Fetch SUPER HO branches for HEAD OFFICE parent dropdown using logged-in branch code
  useEffect(() => {
    if (formData.branchType === "HEAD OFFICE" && loggedInBranchCode) {

      fetch(`${API_BASE_URL}/getBranchByBranchCode?branchCode=${loggedInBranchCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.statusCode === 200 && Array.isArray(data.payload)) {
            const superHos = data.payload
              .filter((item: any) => item.branchType === "SUPER HO")
              .map((item: any) => `${item.branchCode}->${item.branchDesc}->${item.ifsc}`);
            setSuperHoOptions(superHos);
          } else {
            setSuperHoOptions([]);
          }
        })
        .catch(() => setSuperHoOptions([]));
    } else {
      setSuperHoOptions([]);
    }
  }, [formData.branchType, loggedInBranchCode]);

  // // Fetch all branches and filter SUPER HO for HEAD OFFICE parent dropdown
  // useEffect(() => {
  //   if (formData.branchType === "HEAD OFFICE") {
  //     fetch("${API_BASE_URL}/getBranchByBranchCode?branchCode=")
  //       .then(res => res.json())
  //       .then(data => {
  //         if (data.statusCode === 200 && Array.isArray(data.payload)) {
  //           // Filter only SUPER HO branches
  //           const superHos = data.payload
  //             .filter((item: any) => item.branchType === "SUPER HO")
  //             .map((item: any) => `${item.branchCode}->${item.branchDesc}->${item.ifsc}`);
  //           setSuperHoOptions(superHos);
  //         } else {
  //           setSuperHoOptions([]);
  //         }
  //       })
  //       .catch(() => setSuperHoOptions([]));
  //   } else {
  //     setSuperHoOptions([]);
  //   }
  // }, [formData.branchType]);

  const handleInputChange = (field: keyof BranchFormData, value: string) => {
    // Numeric-only validation for pincode and mobile fields
    if (
      ["pincode", "mobile", "mobile2", "mobile3", "mobile4", "mobile5", "mobile6"].includes(field)
    ) {
      value = value.replace(/\D/g, ""); // Remove non-digits
    }
    setFormData(prev => {
      // If changing branchType to SUPER HO, fetch IFSC and set as branchCode
      if (field === "branchType" && value === "SUPER HO") {
        // The effect above will handle fetching and setting branchCode
        return {
          ...prev,
          branchType: value,
          parentBranch: "0",

        };
      }

      if (field === "branchType" && prev.branchType === "SUPER HO" && value !== "SUPER HO") {
        return {
          ...prev,
          branchType: value,
          parentBranch: "",
          branchCode: "",
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });

    // Live validation for pincode, mobile, email
    if (field === "pincode") {
      if (!/^\d{0,6}$/.test(value)) {
        setErrors((prev) => ({ ...prev, pincode: "Pincode must be 6 digits" }));
      } else if (value.length === 6) {
        setErrors((prev) => ({ ...prev, pincode: "" }));
      } else if (value.length > 0 && value.length < 6) {
        setErrors((prev) => ({ ...prev, pincode: "Pincode must be 6 digits" }));
      } else {
        setErrors((prev) => ({ ...prev, pincode: "" }));
      }
    }
    if (
      ["mobile", "mobile2", "mobile3", "mobile4", "mobile5", "mobile6"].includes(field)
    ) {
      if (value.length > 0 && value.length < 10) {
        setErrors((prev) => ({ ...prev, [field]: "Mobile number must be 10 digits" }));
      } else if (value.length === 10) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      } else {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
    if (
      ["email", "email2", "email3", "email4", "email5", "email6"].includes(field)
    ) {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors((prev) => ({ ...prev, [field]: "Invalid email format" }));
      } else {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
  };




  useEffect(() => {
    const fetchAddressFromPincode = async () => {
      if (formData.pincode.length === 6) {
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const result = await response.json();
          const data = result[0];
          if (data.Status === "Success" && data.PostOffice && data.PostOffice.length > 0) {
            const postOffice = data.PostOffice[0];
            handleInputChange("city", postOffice.District);
            handleInputChange("state", postOffice.State);
          } else {
            console.error("Invalid Pincode or data not found");
          }
        } catch (error) {
          console.error("Error fetching address from pincode", error);
        }
      }
    };

    fetchAddressFromPincode();
  }, [formData.pincode]);

  const [errors, setErrors] = useState({
    email: "",
    email2: "",
    email3: "",
    email4: "",
    email5: "",
    email6: "",
    mobile: "",
    mobile2: "",
    mobile3: "",
    mobile4: "",
    mobile5: "",
    mobile6: "",
    pincode: "",
    branchCode: "",
  });

  // Refs for scrolling to invalid fields
  const refs = {
    branchName: useRef<HTMLInputElement>(null),
    bankName: useRef<HTMLInputElement>(null),
    branchType: useRef<HTMLDivElement>(null),
    parentBranch: useRef<HTMLDivElement>(null),
    branchCode: useRef<HTMLDivElement>(null),
    latitude: useRef<HTMLInputElement>(null),
    longitude: useRef<HTMLInputElement>(null),
    telephoneNumber: useRef<HTMLInputElement>(null),
    faxNo: useRef<HTMLInputElement>(null),
    mobile: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    address: useRef<HTMLTextAreaElement>(null),
    pincode: useRef<HTMLInputElement>(null),
    city: useRef<HTMLInputElement>(null),
    state: useRef<HTMLInputElement>(null),
    contactPerson: useRef<HTMLInputElement>(null),
    status: useRef<HTMLDivElement>(null),
    systemIntegrator: useRef<HTMLDivElement>(null),
  };

  // List of mandatory fields
  const mandatoryFields: (keyof BranchFormData)[] = [
    "branchName", "bankName", "branchType", "branchCode", "mobile", "email", "address", "pincode", "city", "state", "contactPerson", "status", "systemIntegrator"
  ];

  // Add SUPER HO logic for disabling Parent Site and Site Code
  const isSuperHO = formData.branchType === "SUPER HO";
  const isHeadOffice = formData.branchType === "HEAD OFFICE";

  // Validation
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;
    const pincodeRegex = /^\d{6}$/;

    const newErrors: any = {
      email: "",
      email2: "",
      email3: "",
      email4: "",
      email5: "",
      email6: "",
      mobile: "",
      mobile2: "",
      mobile3: "",
      mobile4: "",
      mobile5: "",
      mobile6: "",
      pincode: "",
      branchCode: "",
    };

    let firstInvalid: string | null = null;

    // Check mandatory fields
    // for (const field of mandatoryFields) {
    //   if (!formData[field] || (typeof formData[field] === "string" && formData[field].trim() === "")) {
    //     if (!firstInvalid) firstInvalid = field;
    //     newErrors[field] = "This field is required";
    //   }
    // }

    // Site Code (branchCode) must not be placeholder or empty
    // if (
    //   !formData.branchCode ||
    //   formData.branchCode === "Select Site Code" ||
    //   formData.branchCode === ""
    // ) {
    //   newErrors.branchCode = "Please select a valid Site Code";
    //   if (!firstInvalid) firstInvalid = "branchCode";
    // }

    // Email validation
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      if (!firstInvalid) firstInvalid = "email";
    }
    const optionalEmails = ["email2", "email3", "email4", "email5", "email6"];
    optionalEmails.forEach((field) => {
      if (formData[field] && !emailRegex.test(formData[field])) {
        newErrors[field] = "Invalid email format";
        if (!firstInvalid) firstInvalid = field;
      }
    });

    // Mobile validation (10 digits only)
    if (formData.mobile && !mobileRegex.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
      if (!firstInvalid) firstInvalid = "mobile";
    }
    const optionalMobiles = ["mobile2", "mobile3", "mobile4", "mobile5", "mobile6"];
    optionalMobiles.forEach((field) => {
      if (formData[field] && !mobileRegex.test(formData[field])) {
        newErrors[field] = "Mobile number must be 10 digits";
        if (!firstInvalid) firstInvalid = field;
      }
    });

    // Pincode validation (6 digits only)
    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
      if (!firstInvalid) firstInvalid = "pincode";
    }

    setErrors(newErrors);

    // Scroll to first invalid field if any
    if (firstInvalid && refs[firstInvalid] && refs[firstInvalid].current) {
      refs[firstInvalid].current!.scrollIntoView({ behavior: "smooth", block: "center" });
      refs[firstInvalid].current!.focus();
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: newErrors[firstInvalid] || "Please fill all required fields correctly.",
        timer: 2000,
        showConfirmButton: false,
      });
      return false;
    }

    return true;
  };

  // --- BEGIN: UserModal-like validation logic for BranchModal ---

  // Dummy emailExists state for compatibility (implement real check if needed)


  // List of mandatory fields for branch (adapted for branch fields)
  const branchMandatoryFields = [
    "branchName", "bankName", "branchType", "branchCode", "pincode", "city", "state", "email", "mobile", "address", "contactPerson", "systemIntegrator"
  ];

  // Validation function using UserModal.tsx logic, adapted for branch fields
  const branchValidateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const newErrors: any = {
      branchName: "",
      bankName: "",
      branchType: "",
      branchCode: "",
      pincode: "",
      city: "",
      state: "",
      email: "",
      mobile: "",
      address: "",
      contactPerson: "",
      status: "",
      systemIntegrator: "",
    };

    // Map field names to user-friendly labels for error messages
    const fieldLabels: Record<string, string> = {
      branchName: "Site Name",
      bankName: "Bank Name",
      branchType: "Site Type",
      branchCode: "Site Code",
      pincode: "Pincode",
      city: "City",
      state: "State",
      email: "Email Address",
      mobile: "Phone Number",
      address: "Address",
      contactPerson: "Contact Person",
      status: "Status",
      systemIntegrator: "System Integrator",
    };

    let firstInvalid: string | null = null;


    for (const field of branchMandatoryFields) {

      if (field === "branchCode" && formData.branchType === "SUPER HO") continue;
      if (!formData[field] || (typeof formData[field] === "string" && formData[field].trim() === "")) {
        if (!firstInvalid) firstInvalid = field;
        newErrors[field] = `${fieldLabels[field] || field} is required`;
      }
    }

    // Email validation (if entered)
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      if (!firstInvalid) firstInvalid = "email";
    }



    setErrors((prev: any) => ({ ...prev, ...newErrors }));

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


  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/getAllVendors`);
        const result = await response.json();
        if (result.statusCode === 200 && Array.isArray(result.payload)) {
          setVendorOptions(result.payload.map((vendor: any) => ({
            vendorId: vendor.vendorId,
            vendorName: vendor.vendorName
          })));
        } else {
          setVendorOptions([]);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setVendorOptions([]);
      }
    };
    fetchVendors();
  }, []);

  // Add state for IFSC for SUPER HO
  const [superHoIfsc, setSuperHoIfsc] = useState<string>("");

  // Fetch IFSC for SUPER HO when branchType changes to SUPER HO
  useEffect(() => {
    if (formData.branchType === "SUPER HO") {
      fetch(`${API_BASE_URL}/updateIfscForSuperHO`, {
        method: "GET",
        headers: { Accept: "text/plain" }
      })
        .then(res => res.text())
        .then(ifsc => {
          setSuperHoIfsc(ifsc || "");
          setFormData(prev => ({
            ...prev,
            branchCode: ifsc || "",
          }));
        })
        .catch(() => {
          setSuperHoIfsc("");
          setFormData(prev => ({
            ...prev,
            branchCode: "",
          }));
        });
    } else {
      setSuperHoIfsc("");
      // Only clear branchCode if not already set by user for other types
      setFormData(prev => ({
        ...prev,
        branchCode: prev.branchType === "SUPER HO" ? "" : prev.branchCode,
      }));
    }
    // eslint-disable-next-line
  }, [formData.branchType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode) {
      updateData()
    } else {
      saveData()
    }
  }

  const getParentCodeFromDropdown = (branchType: string, parentBranchValue: string) => {
    // For ZONE and BRANCH, parentBranchValue is in the format "branchCode->branchDesc->ifsc"
    if (branchType === "ZONE" || branchType === "BRANCH") {
      if (parentBranchValue && parentBranchValue.includes("->")) {
        return parentBranchValue.split("->")[0];
      }
    }
    // For HEAD OFFICE, parentBranchValue is also in the same format
    if (branchType === "HEAD OFFICE") {
      if (parentBranchValue && parentBranchValue.includes("->")) {
        return parentBranchValue.split("->")[0];
      }
    }
    // For SUPER HO or fallback
    return parentBranchValue || "";
  };

  const saveData = async () => {
    if (!branchValidateForm()) {
      return;
    }
    const isSuperHO = formData.branchType === "SUPER HO";
    // Use the helper to get the correct parentCode from dropdown value
    let parentCodeValue = isSuperHO ? "0" : getParentCodeFromDropdown(formData.branchType, formData.parentBranch);

    // Use IFSC from API for SUPER HO, otherwise use formData.branchCode
    const branchCodeToUse = isSuperHO ? (superHoIfsc || formData.branchCode) : formData.branchCode;

    const payload = {
      address1: formData.address,
      address2: formData.city,
      address3: formData.pincode,
      address4: formData.state,
      bank: formData.bankName,
      branchCode: branchCodeToUse,
      ifsc: branchCodeToUse,
      parentCode: parentCodeValue,
      branchDesc: formData.branchName,
      branchType: formData.branchType,
      children: [],
      contractPerson: formData.contactPerson,
      email: formData.email,
      email2: formData.email2,
      email3: formData.email3,
      email4: formData.email4,
      email5: formData.email5,
      email6: formData.email6,
      faxNo: formData.faxNo,
      geoLocation: null,
      latitude: formData.latitude,
      longitude: formData.longitude,
      mobile: formData.mobile,
      mobileSecondary: formData.mobile2,
      mobileTertiary: formData.mobile3,
      mobileQuaternary: formData.mobile4,
      mobileQuinary: formData.mobile5,
      mobileSenary: formData.mobile6,
      status: formData.status,
      systemIntegrator: 'Digitals', // force Digitals in payload
      telephone: formData.telephoneNumber,
      vendorEmail: null,
      vendorName: null,
      zonalName: null,
    };

    try {
      const url = `${API_BASE_URL}/addBranchMaster`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();


      if (response.ok && result.statusCode === 200) {
        setShowSuccess(true);
        Swal.fire({
          icon: 'success',
          title: 'Site saved successfully!',
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
          if (typeof onSuccess === 'function') onSuccess();
        }, 1000);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to save branch',
          text: result.message || "",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error saving branch',
        text: (error as any)?.message || "",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const updateData = async () => {
    if (!branchValidateForm()) {
      return;
    }
    const selectedBranchCode = selectedBranch.branchCode;
    const isSuperHO = formData.branchType === "SUPER HO";
    // Use the helper to get the correct parentCode from dropdown value
    let parentCodeValue = isSuperHO ? "0" : getParentCodeFromDropdown(formData.branchType, formData.parentBranch);
    const branchCodeToUse = isSuperHO ? (superHoIfsc || formData.branchCode) : formData.branchCode;




    const payload = {
      address1: formData.address,
      address2: formData.city,
      address3: formData.pincode,
      address4: formData.state,
      bank: formData.bankName,
      branchCode: isSuperHO ? selectedBranchCode : selectedBranchCode,
      ifsc: branchCodeToUse,
      parentCode: parentCodeValue,
      branchDesc: formData.branchName,
      branchType: formData.branchType,
      children: [],
      contractPerson: formData.contactPerson,
      email: formData.email,
      email2: formData.email2,
      email3: formData.email3,
      email4: formData.email4,
      email5: formData.email5,
      email6: formData.email6,
      faxNo: formData.faxNo,
      geoLocation: null,
      latitude: formData.latitude,
      longitude: formData.longitude,
      mobile: formData.mobile,
      mobileSecondary: formData.mobile2,
      mobileTertiary: formData.mobile3,
      mobileQuaternary: formData.mobile4,
      mobileQuinary: formData.mobile5,
      mobileSenary: formData.mobile6,
      status: formData.status,
      systemIntegrator: 'Digitals', // force Digitals in payload
      telephone: formData.telephoneNumber,
      vendorEmail: null,
      vendorName: null,
      zonalName: null,
    };

    try {
      const url = `${API_BASE_URL}/editBranch`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.statusCode === 200) {
        setShowSuccess(true);
        Swal.fire({
          icon: 'success',
          title: 'Site updated successfully!',
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
          if (typeof onSuccess === 'function') onSuccess();
        }, 1000);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to update branch',
          text: result.message || "",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error updating branch',
        text: (error as any)?.message || "",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };


  const handleReset = () => {
    setFormData({
      branchName: '',
      bankName: '',
      branchType: '',
      parentBranch: '',
      branchCode: '',
      latitude: '',
      longitude: '',
      telephoneNumber: '',
      faxNo: '',
      mobile: '',
      mobile2: '',
      mobile3: '',
      mobile4: '',
      mobile5: '',
      mobile6: '',
      email: '',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
      address: '',
      pincode: '',
      city: '',
      state: '',
      contactPerson: '',
      status: '',
      systemIntegrator: 'Digitals', // keep Digitals on reset
    });
  };

  // Fetch FGMO list when branchType is HEAD OFFICE
  useEffect(() => {
    const fetchFgmoList = async () => {
      if (formData.branchType === "HEAD OFFICE") {
        try {
          const response = await fetch(`${API_BASE_URL}/findAllFgmo?bankName=${encodeURIComponent(bankType)}`);
          const result = await response.json();
          if (result.statusCode === 200 && Array.isArray(result.payload)) {
            setFgmoList(result.payload);
          } else {
            setFgmoList([]);
          }
        } catch (error) {
          setFgmoList([]);
        }
      } else {
        setFgmoList([]);
      }
    };
    fetchFgmoList();
  }, [formData.branchType]);

  // Fetch parent branch options based on branchType
  useEffect(() => {
    const fetchParentBranches = async () => {
      // Determine API params based on selected Site Type
      let apiBranchType = "";
      if (formData.branchType === "HEAD OFFICE") apiBranchType = "SUPER HO";
      else if (formData.branchType === "ZONE") apiBranchType = "HEAD OFFICE";
      else if (formData.branchType === "BRANCH") apiBranchType = "ZONE";
      else apiBranchType = "";

      if (apiBranchType) {
        try {
          const url = `${API_BASE_URL}/getAllHeadOfficeAndZones?branchType=${encodeURIComponent(apiBranchType)}&bank=${encodeURIComponent(bankType)}`;
          // alert(`Fetching parent branches from: ${url}`);
          const response = await fetch(url);
          const result = await response.json();
          if (result.statusCode === 200 && Array.isArray(result.payload)) {
            setParentBranchObjects(result.payload);
            setParentBranchOptions(
              result.payload.map((item: any) =>
                `${item.branchCode}->${item.branchDesc}->${item.ifsc}`
              )
            );
          } else {
            setParentBranchObjects([]);
            setParentBranchOptions([]);
          }
        } catch {
          setParentBranchObjects([]);
          setParentBranchOptions([]);
        }
      } else {
        setParentBranchObjects([]);
        setParentBranchOptions([]);
      }
    };
    fetchParentBranches();
  }, [formData.branchType, bankType]);

  // When parentBranch is selected and branchType is BRANCH, set selectedParentBranchObj and fetch site codes
  useEffect(() => {
    if (formData.branchType === "BRANCH" && formData.parentBranch) {
      // Find the selected parent branch object
      const obj = parentBranchObjects.find(
        (item: any) =>
          `${item.branchCode}->${item.branchDesc}->${item.ifsc}` === formData.parentBranch
      );
      setSelectedParentBranchObj(obj || null);

      // If found and has ifsc, fetch site codes
      if (obj && obj.ifsc) {
        const fetchSiteCodes = async () => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/findAllBranchByZoneName?branchCode=${encodeURIComponent(obj.ifsc)}&bankName=${encodeURIComponent(bankType)}`
            );
            const result = await response.json();
            if (result.statusCode === 200 && Array.isArray(result.payload)) {
              setZoneOptions(result.payload);
            } else {
              setZoneOptions([]);
            }
          } catch {
            setZoneOptions([]);
          }
        };
        fetchSiteCodes();
      } else {
        setZoneOptions([]);
      }
    }

    if (formData.branchType === "ZONE" && formData.parentBranch) {
      // Extract IFSC from parentBranch string (format: branchCode->branchDesc->ifsc)
      const parts = formData.parentBranch.split("->");
      const ifsc = parts.length === 3 ? parts[2] : formData.parentBranch;

      const fetchZones = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/findAllZoneNameByFgmo?fgmo=${encodeURIComponent(ifsc)}&bankName=${encodeURIComponent(bankType)}`
          );
          const result = await response.json();
          if (result.statusCode === 200 && Array.isArray(result.payload)) {
            setZoneOptions(result.payload);
          } else {
            setZoneOptions([]);
          }
        } catch {
          setZoneOptions([]);
        }
      };
      fetchZones();
    }
  }, [formData.branchType, formData.parentBranch, parentBranchObjects]);

  // Set form data from API in edit mode
  const [editOptionsLoaded, setEditOptionsLoaded] = useState(false);

  // Set form data from API in edit mode
  useEffect(() => {
    if (isEditMode && isOpen) {
      setEditOptionsLoaded(false);
      const branchCode = selectedBranch.branchCode;
      fetch(`${API_BASE_URL}/getBranchByBranchCode?branchCode=${branchCode}`)
        .then(res => res.json())
        .then(async data => {
          if (data.statusCode === 200 && Array.isArray(data.payload) && data.payload.length > 0) {
            const apiBranch = data.payload[0];
            let normalizedParentBranch = apiBranch.parentCode || '';
            let normalizedBranchCode = apiBranch.branchCode || '';

            // Fetch zoneOptions or fgmoList if needed before setting formData
            if (apiBranch.branchType === "BRANCH") {
              // Fetch parent branch object to get IFSC for zoneOptions
              let parentObj = null;
              if (parentBranchObjects.length > 0) {
                parentObj = parentBranchObjects.find(
                  (item: any) => item.branchCode === apiBranch.parentCode
                );
              }
              let ifsc = parentObj?.ifsc || apiBranch.parentCode;
              // Fetch zoneOptions
              try {
                const response = await fetch(
                  `${API_BASE_URL}/findAllBranchByZoneName?branchCode=${encodeURIComponent(ifsc)}&bankName=${encodeURIComponent(bankType)}`
                );
                const result = await response.json();
                if (result.statusCode === 200 && Array.isArray(result.payload)) {
                  setZoneOptions(result.payload);
                } else {
                  setZoneOptions([]);
                }
              } catch {
                setZoneOptions([]);
              }
            } else if (apiBranch.branchType === "ZONE") {
              // Fetch zoneOptions for ZONE type
              try {
                const response = await fetch(
                  `${API_BASE_URL}/findAllZoneNameByFgmo?fgmo=${encodeURIComponent(apiBranch.parentCode)}&bankName=${encodeURIComponent(bankType)}`
                );
                const result = await response.json();
                if (result.statusCode === 200 && Array.isArray(result.payload)) {
                  setZoneOptions(result.payload);
                } else {
                  setZoneOptions([]);
                }
              } catch {
                setZoneOptions([]);
              }
            } else if (apiBranch.branchType === "HEAD OFFICE") {
              // Fetch fgmoList for HEAD OFFICE
              try {
                const response = await fetch(`${API_BASE_URL}/findAllFgmo?bankName=${encodeURIComponent(bankType)}`);
                const result = await response.json();
                if (result.statusCode === 200 && Array.isArray(result.payload)) {
                  setFgmoList(result.payload);
                } else {
                  setFgmoList([]);
                }
              } catch {
                setFgmoList([]);
              }
            }

            // ...existing normalization logic...
            if (formData.branchType === "ZONE" || formData.branchType === "BRANCH") {
              normalizedParentBranch = normalizeParentBranch(
                apiBranch.parentCode || '',
                parentBranchOptions
              );
            }

            // ...existing code...
            const removeCountryCode = (number: string) => {
              if (typeof number === 'string' && number.startsWith('91') && number.length === 12) {
                return number.slice(2);
              }
              return number || '';
            };

            // Wait a tick for options to be set before setting formData
            setTimeout(() => {
              setFormData({
                branchName: apiBranch.branchDesc || '',
                bankName: apiBranch.bank || '',
                branchType: apiBranch.branchType || '',
                parentBranch: normalizedParentBranch,
                branchCode: apiBranch.ifsc,
                latitude: apiBranch.latitude || '',
                longitude: apiBranch.longitude || '',
                telephoneNumber: apiBranch.telephone || '',
                faxNo: apiBranch.faxNo || '',
                mobile: removeCountryCode(apiBranch.mobile),
                mobile2: removeCountryCode(apiBranch.mobileSecondary),
                mobile3: removeCountryCode(apiBranch.mobileTertiary),
                mobile4: removeCountryCode(apiBranch.mobileQuaternary),
                mobile5: removeCountryCode(apiBranch.mobileQuinary),
                mobile6: removeCountryCode(apiBranch.mobileSenary),
                email: apiBranch.email || '',
                email2: apiBranch.email2 || '',
                email3: apiBranch.email3 || '',
                email4: apiBranch.email4 || '',
                email5: apiBranch.email5 || '',
                email6: apiBranch.email6 || '',
                address: apiBranch.address1 || '',
                pincode: apiBranch.address3 || '',
                city: apiBranch.address2 || '',
                state: apiBranch.address4 || '',
                contactPerson: apiBranch.contractPerson || '',
                status: apiBranch.status || '',
                systemIntegrator: apiBranch.systemIntegrator || 'Digitals', // default fallback
              });
              setEditOptionsLoaded(true);
            }, 200);
          } else {
            setEditBranchData(null);
            setEditOptionsLoaded(true);
          }
        })
        .catch(() => {
          setEditBranchData(null);
          setEditOptionsLoaded(true);
        });
    } else {
      setEditBranchData(null);
      setEditOptionsLoaded(true);
    }
  }, [isEditMode, isOpen, selectedBranch, initialData, parentBranchObjects, parentBranchOptions, bankType]);

  function normalizeParentBranch(value: string, options: string[]): string {

    if (!value) return "";

    if (options.includes(value)) return value;
    const code = value.split("->")[0];
    const found = options.find(opt => opt.startsWith(code + "->"));
    return found || "";
  }


  useEffect(() => {
    if (isEditMode && editBranchData) {

      let normalizedParentBranch = editBranchData.parentCode || '';
      let normalizedBranchCode = editBranchData.branchCode || '';

      // Use normalization only if options are available
      if (formData.branchType === "ZONE" || formData.branchType === "BRANCH") {
        normalizedParentBranch = normalizeParentBranch(
          editBranchData.parentCode || '',
          parentBranchOptions
        );
      }
      if (
        (formData.branchType === "BRANCH" && zoneOptions.length > 0) ||
        (formData.branchType === "ZONE" && zoneOptions.length > 0) ||
        (formData.branchType === "HEAD OFFICE" && fgmoList.length > 0)

      ) {

        let allOptions: string[] = [];
        if (formData.branchType === "BRANCH" || formData.branchType === "ZONE") {
          allOptions = zoneOptions;
        } else if (formData.branchType === "HEAD OFFICE") {
          allOptions = fgmoList;
        }

      }
      const removeCountryCode = (number) => {
        if (typeof number === 'string' && number.startsWith('91') && number.length === 12) {
          return number.slice(2);
        }
        return number || '';
      };

      setFormData({
        branchName: editBranchData.branchDesc || '',
        bankName: editBranchData.bank || '',
        branchType: editBranchData.branchType || '',
        parentBranch: normalizedParentBranch,
        branchCode: editBranchData.ifsc,
        latitude: editBranchData.latitude || '',
        longitude: editBranchData.longitude || '',
        telephoneNumber: editBranchData.telephone || '',
        faxNo: editBranchData.faxNo || '',
        mobile: removeCountryCode(editBranchData.mobile),
        mobile2: removeCountryCode(editBranchData.mobileSecondary),
        mobile3: removeCountryCode(editBranchData.mobileTertiary),
        mobile4: removeCountryCode(editBranchData.mobileQuaternary),
        mobile5: removeCountryCode(editBranchData.mobileQuinary),
        mobile6: removeCountryCode(editBranchData.mobileSenary),
        email: editBranchData.email || '',
        email2: editBranchData.email2 || '',
        email3: editBranchData.email3 || '',
        email4: editBranchData.email4 || '',
        email5: editBranchData.email5 || '',
        email6: editBranchData.email6 || '',
        address: editBranchData.address1 || '',
        pincode: editBranchData.address3 || '',
        city: editBranchData.address2 || '',
        state: editBranchData.address4 || '',
        contactPerson: editBranchData.contractPerson || '',
        status: editBranchData.status || '',
        systemIntegrator: editBranchData.systemIntegrator || 'Digitals', 
      });

    }

  }, [editBranchData, parentBranchOptions, zoneOptions, fgmoList]);


  return (
    <div className="min-h-screen flex items-center justify-center p-0">
      <Dialog open={isOpen} onOpenChange={() => { }}>
        <DialogContent
          className="sm:max-w-5xl max-h-[80vh] overflow-y-auto p-0"
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
        >
          <DialogHeader className="p-2 bg-gradient-to-r from-gray-800 to-blue-800 text-white relative overflow-hidden" style={{
            position: "sticky",
            top: "0",
            zIndex: "1"
          }}>
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>
            <div className="relative z-10 text-center">
              <DialogTitle className="text-2xl font-bold mb-2">
                {isEditMode ? "Edit Site Details" : "Add Site Details"}
              </DialogTitle>
              <p className="text-blue-100">
                {isEditMode ? "Please update the Site details below" : "Please enter the Site details below to add a new branch"}
              </p>
              <DialogClose className="absolute top-4 right-4" onClick={onClose}>
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>

          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mt-4">
              Site {isEditMode ? "updated" : "saved"} successfully!
            </div>
          )}

          {/* Only render the form when options are loaded in edit mode */}
          {(!isEditMode || editOptionsLoaded) ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6 p-6">
                <div className="border border-blue-300 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">
                    Site Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="branchName" className="text-sm font-medium text-gray-700">
                        Site Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="branchName"
                        placeholder="Site Name"
                        value={formData.branchName}
                        onChange={(e) => handleInputChange('branchName', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        ref={refs.branchName}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName" className="text-sm font-medium text-gray-700">
                        Bank Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bankName"
                        placeholder="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"

                        ref={refs.bankName}
                      />
                    </div>
                    <div className="space-y-2" ref={refs.branchType}>
                      <Label htmlFor="branchType" className="text-sm font-medium text-gray-700">
                        Site Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.branchType}
                        onValueChange={(value) => handleInputChange('branchType', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select Site " />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="SUPER HO">SUPER HO</SelectItem>
                            <SelectItem value="HEAD OFFICE">HEAD OFFICE</SelectItem>
                            <SelectItem value="ZONE">ZONE</SelectItem>
                            <SelectItem value="BRANCH">BRANCH</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Parent Site */}
                    <div className="space-y-2" ref={refs.parentBranch}>
                      <Label htmlFor="parentBranch" className="text-sm font-medium text-gray-700">
                        Parent Site
                      </Label>
                      <Select
                        value={
                          isSuperHO
                            ? "SUPER HO"
                            : isHeadOffice
                              ? formData.parentBranch
                              : formData.parentBranch
                        }
                        onValueChange={(value) => handleInputChange('parentBranch', value)}
                        disabled={isSuperHO}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue
                            placeholder={
                              isSuperHO
                                ? "SUPER HO"
                                : isHeadOffice
                                  ? "Select Super HO"
                                  : "Select Parent Site"
                            }
                          >
                            {/* For HEAD OFFICE only: show the full value as fetched */}
                            {isHeadOffice && formData.parentBranch
                              ? formData.parentBranch
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {isSuperHO ? (
                              <SelectItem value="SUPER HO">SUPER HO</SelectItem>
                            ) : isHeadOffice ? (
                              superHoOptions.length > 0 ? (
                                superHoOptions.map((desc) => (
                                  <SelectItem key={desc} value={desc}>
                                    {desc}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="No Super HO Found">No Super HO Found</SelectItem>
                              )
                            ) : formData.branchType === "BRANCH" && parentBranchOptions.length > 0 ? (
                              parentBranchOptions.map((desc) => (
                                <SelectItem key={desc} value={desc}>
                                  {desc}
                                </SelectItem>
                              ))
                            ) : parentBranchOptions.length > 0 ? (
                              parentBranchOptions.map((desc) => (
                                <SelectItem key={desc} value={desc}>
                                  {desc}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="Select Parent Branch">Select Parent Branch</SelectItem>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Site Code */}
                    <div className="space-y-2" ref={refs.branchCode}>
                      <Label htmlFor="branchCode" className="text-sm font-medium text-gray-700">
                        Site Code <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={
                          isSuperHO
                            ? (superHoIfsc && superHoIfsc.trim() ? superHoIfsc : "NO_IFSC")
                            : (formData.branchCode || "")
                        }
                        onValueChange={(value) => handleInputChange('branchCode', value)}
                        disabled={isSuperHO}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue
                            placeholder={
                              isSuperHO
                                ? (superHoIfsc && superHoIfsc.trim() ? superHoIfsc : "No IFSC")
                                : "Select Site Code"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {isSuperHO ? (
                              <SelectItem value={superHoIfsc && superHoIfsc.trim() ? superHoIfsc : "NO_IFSC"} disabled>
                                <span style={{ color: "#222" }}>
                                  {superHoIfsc && superHoIfsc.trim() ? `SITE CODE` : "No IFSC Available"}
                                </span>
                              </SelectItem>
                            ) : formData.branchType === "BRANCH" && zoneOptions.length > 0 ? (
                              zoneOptions.map((zone) => (
                                <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                              ))
                            ) : formData.branchType === "HEAD OFFICE" && fgmoList.length > 0 ? (
                              fgmoList.map((fgmo) => (
                                <SelectItem key={fgmo} value={fgmo}>{fgmo}</SelectItem>
                              ))
                            ) : formData.branchType === "ZONE" && zoneOptions.length > 0 ? (
                              zoneOptions.map((zone) => (
                                <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="NO_SITE_CODE" disabled>No Site Code Available</SelectItem>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {errors.branchCode && <p className="text-red-500 text-xs mt-1">{errors.branchCode}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                        Latitude
                      </Label>
                      <Input
                        id="latitude"
                        placeholder="Latitude"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        ref={refs.latitude}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                        Longitude
                      </Label>
                      <Input
                        id="longitude"
                        placeholder="Longitude"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        ref={refs.longitude}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="border border-blue-300 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">
                    Contact Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="telephoneNumber" className="text-sm font-medium text-gray-700">
                        Telephone Number
                      </Label>
                      <Input
                        id="telephoneNumber"
                        placeholder="Telephone Number"
                        value={formData.telephoneNumber}
                        onChange={(e) => handleInputChange('telephoneNumber', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        ref={refs.telephoneNumber}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faxNo" className="text-sm font-medium text-gray-700">
                        Fax No
                      </Label>
                      <Input
                        id="faxNo"
                        placeholder="Fax No"
                        value={formData.faxNo}
                        onChange={(e) => handleInputChange('faxNo', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        ref={refs.faxNo}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                        Mobile <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="mobile"
                        placeholder="Mobile"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.mobile ? 'border-red-500' : ''}`}
                        ref={refs.mobile}
                        maxLength={10}
                      />{errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile2" className="text-sm font-medium text-gray-700">
                        Mobile-2
                      </Label>
                      <Input
                        id="mobile2"
                        placeholder="Mobile-2"
                        value={formData.mobile2}
                        onChange={(e) => handleInputChange('mobile2', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.mobile2 ? 'border-red-500' : ''}`}
                        ref={refs.mobile}
                        maxLength={10}
                      />{errors.mobile2 && <p className="text-red-500 text-xs mt-1">{errors.mobile2}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile3" className="text-sm font-medium text-gray-700">
                        Mobile-3
                      </Label>
                      <Input
                        id="mobile3"
                        placeholder="Mobile-3"
                        value={formData.mobile3}
                        onChange={(e) => handleInputChange('mobile3', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.mobile3 ? 'border-red-500' : ''}`}
                        ref={refs.mobile}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="\d*"
                      />{errors.mobile3 && <p className="text-red-500 text-xs mt-1">{errors.mobile3}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile4" className="text-sm font-medium text-gray-700">
                        Mobile-4
                      </Label>
                      <Input
                        id="mobile4"
                        placeholder="Mobile-4"
                        value={formData.mobile4}
                        onChange={(e) => handleInputChange('mobile4', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.mobile4 ? 'border-red-500' : ''}`}
                        ref={refs.mobile}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="\d*"
                      />{errors.mobile4 && <p className="text-red-500 text-xs mt-1">{errors.mobile4}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile5" className="text-sm font-medium text-gray-700">
                        Mobile-5
                      </Label>
                      <Input
                        id="mobile5"
                        placeholder="Mobile-5"
                        value={formData.mobile5}
                        onChange={(e) => handleInputChange('mobile5', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.mobile5 ? 'border-red-500' : ''}`}
                        ref={refs.mobile}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="\d*"
                      />{errors.mobile5 && <p className="text-red-500 text-xs mt-1">{errors.mobile5}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile6" className="text-sm font-medium text-gray-700">
                        Mobile-6
                      </Label>
                      <Input
                        id="mobile6"
                        placeholder="Mobile-6"
                        value={formData.mobile6}
                        onChange={(e) => handleInputChange('mobile6', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.mobile6 ? 'border-red-500' : ''}`}
                        ref={refs.mobile}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="\d*"
                      />{errors.mobile6 && <p className="text-red-500 text-xs mt-1">{errors.mobile6}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
                        ref={refs.email}
                      />{errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email2" className="text-sm font-medium text-gray-700">
                        Email-2
                      </Label>
                      <Input
                        id="email2"
                        type="email"
                        placeholder="Email-2"
                        value={formData.email2}
                        onChange={(e) => handleInputChange('email2', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.email2 ? 'border-red-500' : ''}`}
                        ref={refs.email}
                      />{errors.email2 && <p className="text-red-500 text-xs">{errors.email2}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email3" className="text-sm font-medium text-gray-700">
                        Email-3
                      </Label>
                      <Input
                        id="email3"
                        type="email"
                        placeholder="Email-3"
                        value={formData.email3}
                        onChange={(e) => handleInputChange('email3', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.email3 ? 'border-red-500' : ''}`}
                        ref={refs.email}
                      />{errors.email3 && <p className="text-red-500 text-xs">{errors.email3}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email4" className="text-sm font-medium text-gray-700">
                        Email-4
                      </Label>
                      <Input
                        id="email4"
                        type="email"
                        placeholder="Email-4"
                        value={formData.email4}
                        onChange={(e) => handleInputChange('email4', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.email4 ? 'border-red-500' : ''}`}
                        ref={refs.email}
                      />{errors.email4 && <p className="text-red-500 text-xs">{errors.email4}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email5" className="text-sm font-medium text-gray-700">
                        Email-5
                      </Label>
                      <Input
                        id="email5"
                        type="email"
                        placeholder="Email-5"
                        value={formData.email5}
                        onChange={(e) => handleInputChange('email5', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.email5 ? 'border-red-500' : ''}`}
                        ref={refs.email}
                      />{errors.email5 && <p className="text-red-500 text-xs">{errors.email5}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email6" className="text-sm font-medium text-gray-700">
                        Email-6
                      </Label>
                      <Input
                        id="email6"
                        type="email"
                        placeholder="Email-6"
                        value={formData.email6}
                        onChange={(e) => handleInputChange('email6', e.target.value)}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.email6 ? 'border-red-500' : ''}`}
                        ref={refs.email}
                      />{errors.email6 && <p className="text-red-500 text-xs">{errors.email6}</p>}
                    </div>
                  </div>
                </div>

                {/* Address Details Section */}
                <div className="border border-blue-300 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">
                    Address Details
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Address <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
                        ref={refs.address}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="Pincode" className="text-sm font-medium text-gray-700">
                          Pincode <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pincode"
                          placeholder="Pincode"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                          className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${errors.pincode ? 'border-red-500' : ''}`}
                          ref={refs.pincode}
                          maxLength={6}
                          inputMode="numeric"
                          pattern="\d*"
                        />{errors.pincode && <p className="text-red-500 text-xs">{errors.pincode}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"

                          ref={refs.city}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="State" className="text-sm font-medium text-gray-700">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="state"
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"

                          ref={refs.state}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Details Section */}
                <div className="border border-blue-300 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">
                    Other Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">
                        Contact Person <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactPerson"
                        placeholder="Contact Person"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"

                        ref={refs.contactPerson}
                      />
                    </div>
                    <div className="hidden" ref={refs.status}>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 hidden" ref={refs.systemIntegrator} >
                      <Label htmlFor="systemIntegrator" className="text-sm font-medium text-gray-700">
                        System Integrator <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.systemIntegrator}
                        onValueChange={(value) => handleInputChange('systemIntegrator', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select System Integrator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {vendorOptions.length > 0 ? (
                              vendorOptions.map((vendor) => (
                                <SelectItem key={vendor.vendorId} value={vendor.vendorId}>
                                  {vendor.vendorName}
                                </SelectItem>
                              ))
                            ) : (
                              null
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="sticky bottom-0 z-10 bg-white flex flex-col sm:flex-row justify-between items-center p-2 border-t border-gray-200">
                <div className="flex gap-4 mb-2 sm:mb-0">
                  {/* <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="bg-gradient-to-r from-gray-600 to-blue-600 text-white hover:bg-purple-50"
                  >
                    
                  Reset
                  </Button> */}

                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-gray-600 to-blue-600 text-white hover:bg-purple-50"
                  >
                    {isEditMode ? "Update" : "Save"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          ) : (
            <div className="p-8 text-center text-blue-700">Loading site code options...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default BranchDetailsModal;




