import type React from "react"
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectGroup, SelectLabel } from "@radix-ui/react-select"
import { X } from "lucide-react"
import { API_BASE_URL } from "@/config/api";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean
  data?: {
    code?: string;
    name?: string;
    role?: string;
    group?: string;
    branch?: string;
    address?: string;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
    mobile?: string;
    email?: string;
  }

  onSuccess?: () => void;
}

const AddEmployeeModal2: React.FC<AddEmployeeModalProps> = ({ data, isOpen, onClose, isEditMode = false, onSuccess }) => {
  const initialFormData = {
    code: "",
    name: "",
    role: "",
    group: "",
    branch: "",
    address: "",
    pincode: "",
    city: "",
    state: "",
    country: "",
    email: "",
    mobile: "",
  }

  const [formData, setFormData] = useState(initialFormData)
  const [showSuccess, setShowSuccess] = useState(false)
  const [groupMaster, setGroupMaster] = useState<any[]>([]);
  const [branchData, setBranchData] = useState<any[]>([]); // Store full branch objects
  const [emailExists, setEmailExists] = useState(false);
  
  // Only set formData from data when modal is opened for the first time, not on every groupMaster/data change
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Wait for groupMaster and branchData to be loaded before initializing form in edit mode
  useEffect(() => {
    if (isOpen && !isFormInitialized) {
      if (isEditMode && data) {
        // Wait for both groupMaster and branchData to be loaded
        if (groupMaster.length > 0 && branchData.length > 0) {
          // --- Role normalization ---
          // Ensure role matches exactly one of the SelectItem values
          let normalizedRole = "";
          const allowedRoles = ["admin", "super user", "user", "security officer"];
          if (data.role) {
            const lower = data.role.toLowerCase();
            normalizedRole = allowedRoles.find(r => r === lower) || "";
          }

          // --- Group normalization ---
          // Set group to groupId (used as value in SelectItem)
          let normalizedGroup = "";
          if (data.group && groupMaster.length > 0) {
            const found = groupMaster.find(
              (g: any) =>
                g.groupId === data.group ||
                g.groupDescription === data.group ||
                g.groupName === data.group
            );
            normalizedGroup = found ? found.groupId : "";
          }

          // --- Branch normalization ---
          // Set branch to branchCode (used as value in SelectItem)
          let normalizedBranch = "";
          if (data.branch && branchData.length > 0) {
            const foundBranch = branchData.find(
              (b: any) =>
                b.branchCode === data.branch ||
                b.branchDesc === data.branch ||
                b.branchCode?.toLowerCase() === data.branch?.toLowerCase() ||
                b.branchDesc?.toLowerCase() === data.branch?.toLowerCase()
            );
            normalizedBranch = foundBranch ? foundBranch.branchCode : "";
          }

          setFormData({
            code: data.code || "",
            name: data.name || "",
            role: normalizedRole,
            group: normalizedGroup,
            branch: normalizedBranch,
            address: data.address || "",
            pincode: data.pincode || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            mobile: data.mobile || "",
            email: data.email || "",
          });
          setIsFormInitialized(true);
        }
      } else if (!isEditMode) {
        // For add mode, initialize with empty form
        setFormData(initialFormData);
        setIsFormInitialized(true);
      }
    }
    
    // Reset form initialization when modal closes
    if (!isOpen) {
      setIsFormInitialized(false);
    }
  }, [isOpen, isEditMode, data, groupMaster, branchData, isFormInitialized]);

  
  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false)
      if (!isEditMode) {
        setFormData(initialFormData)
      }
    }
  }, [isOpen, isEditMode])
  useEffect(()=>{
    const fetchGroupMaster = async () => {
      
        try {
          const url= `${API_BASE_URL}/getAllGroupMaster`;
          const response = await fetch(url);
          const result = await response.json();
          
  
          if (result.statusCode === "OK") {
            const data = result.payload || [];
            setGroupMaster(data);
            
          } else {
            console.error("Invalid ");
          }
        } catch (error) {
          console.error("Error fetching Group Master", error);
        }
      
    };
    
    fetchGroupMaster();


  },[formData])

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
            handleInputChange("country", postOffice.Country);
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



   useEffect(() => {
    const getBranchData = async () => {
      try {
        const url = `${API_BASE_URL}/getAllBranch`;
        const response = await fetch(url);
        const result = await response.json();
        
        console.log("Fetched Branch Data:", result);
        
  
        if (result.statusCode == "200") {
          const data = result.payload;
          setBranchData(data); // Store array of branch objects
        } else {
          console.error("Failed to fetch branch data:", result);
        }
      } catch (error) {
        console.error("Error fetching branch data:", error);
      }
    };
  
      getBranchData();
     }, [isOpen]);


  const [errors, setErrors] = useState({
    pincode: "",
    mobile: "",
    email: "",
    name: "",
    role: "",
    group: "",
    branch: "",
    city: "",
    state: "",
    country: "",
  });

  // List of mandatory fields for validation (matching UserModal columns)
  const mandatoryFields = [
    "name", "role", "group", "branch","address" ,"pincode", "city", "state", "country", "email", "mobile"
  ];

  // Validation function using deviceModal.tsx logic for user columns
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const newErrors: any = {
      name: "",
      role: "",
      group: "",
      branch: "",
      address: "",
      pincode: "",
      city: "",
      state: "",
      country: "",
      email: "",
      mobile: "",
    };

    // Map field names to user-friendly labels for error messages
    const fieldLabels: Record<string, string> = {
      name: "Name",
      role: "Role",
      group: "Group",
      branch: "Site",
      address: "Address",
      pincode: "Pincode",
      city: "City",
      state: "State",
      country: "Country",
      email: "Email Address",
      mobile: "Phone Number",
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
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      if (!firstInvalid) firstInvalid = "email";
    }

    if (emailExists) {
      Swal.fire({
        icon: "error",
        title: "Email already exists",
        text: "This email is already registered. Please use another email.",
        timer: 2000,
        showConfirmButton: false,
      });
      return false;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check email existence before submit/update
    

    if (!validateForm()) {
      return;
    }

    if (isEditMode) {
      updateData();
    } else {
      saveData();
    }
  }

  const handleReset = () => {
    if (isEditMode && data) {
      
      setFormData({
        code: data.code || "",
        name: data.name || "",
        role: data.role || "",
        group: data.group || "",
        branch: data.branch || "",
        address: data.address || "",
        pincode: data.pincode || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        mobile: data.mobile || "",
        email: data.email || "",
      })
    } else {
      
      setFormData(initialFormData)
    }
    setShowSuccess(false)
  }

  const saveData = async () => {
    if (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/checkEmailExists?email=${encodeURIComponent(formData.email)}`
        );
        const result = await res.json();
        if (result === true) {
          setEmailExists(true);
          setErrors((prev) => ({ ...prev, email: "Email already exists" }));
          Swal.fire({
            icon: "error",
            title: "Email already exists",
            text: "This email is already registered. Please use another email.",
            timer: 2000,
            showConfirmButton: false,
          });
          return;
        } else {
          setEmailExists(false);
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      } catch (err) {
        console.error("Email check failed", err);
        return;
      }
    }
    if (!validateForm()) {
      return;
    }
    
    const payload = {
      empId: formData.code,
      empName: formData.name,
      empRole: formData.role,
      address: formData.address,
      city: formData.city,
      pin: formData.pincode,
      state: formData.state,
      country: formData.country,
      mobile: formData.mobile,
      email: formData.email,
      status: "Active",
      branch: formData.branch,
      loginFlag: "0",
      password: "string",
      groupId: formData.group,
      createdBy: null,
      createdDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedBy: null,
      updatedDate: null,
      updationStatus: "Save",
      count: 1,
    }

    try {
      const url = `${API_BASE_URL}/saveOrUpdateEmployee`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (response.ok && result.statusCode === 200) {
        setShowSuccess(true)
        Swal.fire({
          icon: 'success',
          title: 'Employee saved successfully!',
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
          if (typeof onSuccess === 'function') onSuccess();
          window.location.reload();
        }, 2000)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to save employee',
          text: result.message || "",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error saving employee',
        text: (error as any)?.message || "",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }

  const updateData = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      empId: formData.code,
      empName: formData.name,
      empRole: formData.role,
      address: formData.address,
      city: formData.city,
      pin: formData.pincode,
      state: formData.state,
      country: formData.country,
      mobile: formData.mobile,
      email: formData.email,
      status: "Active",
      branch: formData.branch,
      loginFlag: "0",
      password: "string",
      groupId: formData.group,
      createdBy: null,
      createdDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedBy: null,
      updatedDate: null,
      updationStatus: "Update",
      count: 1,
    }

    if (!formData.code) {
      console.error("No employee code provided for update.")
      return
    }

    try {
      const url = `${API_BASE_URL}/saveOrUpdateEmployee`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if ( response.ok && result.statusCode === 200) {
        setShowSuccess(true)
        Swal.fire({
          icon: 'success',
          title: 'Employee updated successfully!',
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
          if (typeof onSuccess === 'function') onSuccess();
          window.location.reload();
        }, 2000)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to update employee',
          text: result.message || "",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error updating employee',
        text: (error as any)?.message || "",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    // Only allow numeric input for pincode and mobile
    if (field === "pincode" || field === "mobile") {
      value = value.replace(/\D/g, "");
    }
    setFormData(prev => ({ ...prev, [field]: value }));

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
    if (field === "mobile") {
      if (value.length > 0 && value.length < 10) {
        setErrors((prev) => ({ ...prev, mobile: "Mobile number must be 10 digits" }));
      } else if (value.length === 10) {
        setErrors((prev) => ({ ...prev, mobile: "" }));
      } else {
        setErrors((prev) => ({ ...prev, mobile: "" }));
      }
    }
    if (field === "email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
        setEmailExists(false);
      }
    }
  };

  // Email existence check onBlur
  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/checkEmailExists?email=${encodeURIComponent(email)}`
        );
        const result = await res.json();
        // result is true if email exists, false if not
        if (result === true) {
          setEmailExists(true);
          setErrors((prev) => ({ ...prev, email: "Email already exists" }));
          Swal.fire({
            icon: "error",
            title: "Email already exists",
            text: "This email is already registered. Please use another email.",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          setEmailExists(false);
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      } catch (err) {
        console.error("Email check failed", err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0">
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-4xl max-h-[80vh] overflow-y-auto  p-0"
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
              <DialogTitle className="text-xl font-bold mb-2">
                {isEditMode ? "Edit User Details" : "Add User Details"}
              </DialogTitle>
              <p className="text-white">
                {isEditMode ? "Please update the details below" : "Please enter the details below to add a new user"}
              </p>
              <DialogClose className="absolute top-4 right-1" onClick={onClose}>
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
            
          </DialogHeader>

          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mt-4">
              Employee {isEditMode ? "Updated" : "Saved"} successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 ">
            <div className="space-y-4 p-4">
              <div className="border border-blue-300 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">User Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 hidden">
                    <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                      User ID <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="code" 
                      placeholder="User Id" 
                      value={formData.code} 
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      type="hidden"
                    />
                    <span className="text-gray-500 text-xs">(User ID will be auto-generated or hidden)</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      placeholder="Name" 
                      value={formData.name} 
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.name ? 'border-red-500' : ''}`}
                      
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Select Role <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="admin">Data Admin</SelectItem>
                          <SelectItem value="super user">Super User</SelectItem>
                          <SelectItem value="user">CRO/ Security Guard</SelectItem>
                          <SelectItem value="security officer">Security Officer</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group" className="text-sm font-medium text-gray-700">
                      Select Group <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.group} 
                      onValueChange={(value) => handleInputChange('group', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {groupMaster.map((group, index) => (
                            <SelectItem key={index} value={group.groupId}>
                               {group.groupDescription}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                 
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                      Select Site<span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.branch}
                      onValueChange={(value) => handleInputChange('branch', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Site" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                        {branchData.map((branch: any) => (
                          <SelectItem key={branch.branchCode} value={branch.branchCode} className="hover:bg-gray-50">
                            {branch.branchDesc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                </div>
              </div>

              <div className="border border-blue-300 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">
                  Address Details
                </h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Address<span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address} 
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
                        Pincode <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.pincode ? 'border-red-500' : ''}`}
                        
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
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.city ? 'border-red-500' : ''}`}
                        
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                        State <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.state ? 'border-red-500' : ''}`}
                        
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.country ? 'border-red-500' : ''}`}
                        
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-blue-300 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={handleEmailBlur}
                      className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.email ? 'border-red-500' : ''}`}
                      
                    />{errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${errors.mobile ? 'border-red-500' : ''}`}
                      
                      maxLength={10}
                      inputMode="numeric"
                      pattern="\d*"
                    />{errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>
                </div>
              </div>
            </div> 

            <DialogFooter className="sticky bottom-0 z-10 bg-white flex flex-col sm:flex-row justify-between items-center pt-1">
              <div className="flex gap-2 mb-2 mr-1 sm:mb-0">
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddEmployeeModal2