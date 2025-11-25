import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectGroup, SelectLabel } from "@radix-ui/react-select"
import { X } from "lucide-react"

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
}

const AddEmployeeModal2: React.FC<AddEmployeeModalProps> = ({ data, isOpen, onClose, isEditMode = false }) => {
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
  const [groupMaster, setGroupMaster] = useState([]);
  
  // Only set formData from data when modal is opened for the first time, not on every groupMaster/data change
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Wait for groupMaster to be loaded before initializing form in edit mode
  useEffect(() => {
    if (isOpen && !isFormInitialized) {
      if (isEditMode && data && groupMaster.length > 0) {
        let normalizedRole = "";
        if (data.role) {
          switch (data.role.trim().toUpperCase()) {
            case "ADMIN":
            case "DATA ADMIN":
              normalizedRole = "admin";
              break;
            case "SUPER USER":
              normalizedRole = "super user";
              break;
            case "USER":
            case "CRO/SECURITY GUARD":
              normalizedRole = "user";
              break;
            case "SECURITY OFFICER":
              normalizedRole = "security officer";
              break;
            default:
              normalizedRole = data.role.toLowerCase();
          }
        }

        let normalizedGroup = "";
        if (data.group) {
          const foundGroup = groupMaster.find(
            (g) =>
              (g.groupId?.toString().toUpperCase() === data.group.trim().toUpperCase()) ||
              (g.groupName?.toString().toUpperCase() === data.group.trim().toUpperCase())
          );
          if (foundGroup) {
            normalizedGroup = foundGroup.groupName;
          } else {
            normalizedGroup = data.group;
          }
        }

        setFormData({
          code: data.code || "",
          name: data.name || "",
          role: normalizedRole,
          group: normalizedGroup,
          branch: data.branch || "",
          address: data.address || "",
          pincode: data.pincode || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          mobile: data.mobile || "",
          email: data.email || "",
        });
        setIsFormInitialized(true);
      } else if (!isEditMode) {
        setFormData(initialFormData);
        setIsFormInitialized(true);
      }
    }
    if (!isOpen) {
      setIsFormInitialized(false);
    }

  }, [isOpen, isEditMode, data, groupMaster]);

  
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
          const url= "http://192.168.1.6:9090/getAllGroupMaster";
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


  const [errors, setErrors] = useState({
    pincode:"",
    mobile: "",
    email: "",
    
  })

   const validateForm = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^\d{10}$/;
  const pincodeRegex = /^\d{6}$/;

  const newErrors = {
    email: "",
    mobile: "",
    pincode: "",
  };

  if (!emailRegex.test(formData.email)) {
    newErrors.email = "Invalid email format";
  }

  if (!mobileRegex.test(formData.mobile)) {
    newErrors.mobile = "Invalid mobile number format";
  }


  if (!pincodeRegex.test(formData.pincode)) {
    newErrors.pincode = "Invalid pincode format";
  }

  setErrors(newErrors);

  if (newErrors.email || newErrors.mobile || newErrors.pincode) {
    return false;
  }else{
    return true;
  }
  
 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode) {
      updateData()
    } else {
      saveData()
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
      const url = "http://122.160.60.151:9090/HMS/saveOrUpdateEmployee"

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.statusCode === 200) {
        console.log("Employee saved successfully:", result.payload)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
        }, 2000)
      } else {
        console.error("Failed to save employee:", result.message)
      }
    } catch (error) {
      console.error("Error saving employee:", error)
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
      const url = "http://192.168.1.6:9090/saveOrUpdateEmployee"

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.statusCode === 200) {
        console.log("Employee updated successfully:", result.payload)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
        }, 2000)
      } else {
        console.error("Failed to update employee:", result.message)
      }
    } catch (error) {
      console.error("Error updating employee:", error)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    console.log(`Updating ${field} with value:`, value)
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-0">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto p-0">
          <DialogHeader className="p-2 bg-gradient-to-r from-gray-800 to-blue-800 text-white relative overflow-hidden" style={{
            position: "sticky",
            top: "0",
            zIndex: "1"
          }}>
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>
            <div className="relative z-10 text-center">
              <DialogTitle className="text-2xl font-bold mb-2">
                {isEditMode ? "Edit User Information" : "Add User Information"}
              </DialogTitle>
              <p className="text-purple-100">
                {isEditMode ? "Please update the details below" : "Please enter the details below to add a new user"}
              </p>
              <DialogClose className="absolute top-4 right-4">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
            
          </DialogHeader>

          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-4 mt-4">
              Employee {isEditMode ? "updated" : "saved"} successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4 p-4">
              <div className="border border-blue-300 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-4 pb-2 border-b border-blue-200">User Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                      User ID <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="code" 
                      placeholder="User Id" 
                      value={formData.code} 
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                      disabled={isEditMode} 
                    />
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Select Role <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="-- Select Role --" />
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
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="-- Select Group --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {groupMaster.map((group, index) => (
                            <SelectItem key={index} value={group.groupName}>
                              {group.groupId} --{">"} {group.groupDescription}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                      Select Branch <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.branch} 
                      onValueChange={(value) => handleInputChange('branch', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="-- Select Branch --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOI Mumbai Head Office">BOI Mumbai Head Office</SelectItem>
                        <SelectItem value="BOI H.O MUMBAI SITE">BOI H.O MUMBAI SITE</SelectItem>
                        <SelectItem value="DI-Noida Branch">DI-Noida Branch</SelectItem>
                        <SelectItem value="BOI Zonal Office Sec 62">BOI Zonal Office Sec 62</SelectItem>
                        <SelectItem value="RO PNB Durgapur">RO PNB Durgapur</SelectItem>
                        <SelectItem value="COKE CC PNB Durgapur">COKE CC PNB Durgapur</SelectItem>
                        <SelectItem value="Prathma UP Gramin Bank HO">Prathma UP Gramin Bank HO</SelectItem>
                        <SelectItem value="ARIHANT AMBER">ARIHANT AMBER</SelectItem>
                        <SelectItem value="Rajnagar PUGB">Rajnagar PUGB</SelectItem>
                        <SelectItem value="BOI Branch Vaishali">BOI Branch Vaishali</SelectItem>
                        <SelectItem value="Kajora PNB">Kajora PNB</SelectItem>
                        <SelectItem value="Vijay Nagar PUPGB">Vijay Nagar PUPGB</SelectItem>
                        <SelectItem value="Dujhan PUPGB">Dujhan PUPGB</SelectItem>
                        <SelectItem value="PNB">PNB</SelectItem>
                        <SelectItem value="Testing By doritech team">Testing By doritech team</SelectItem>
                        <SelectItem value="BOI Branch Indrapuram">BOI Branch Indrapuram</SelectItem>
                        <SelectItem value="test sia">test sia</SelectItem>
                        <SelectItem value="TESTING BRANCH">TESTING BRANCH</SelectItem>
                        <SelectItem value="ty">ty</SelectItem>
                        <SelectItem value="GUARD NG">GUARD NG</SelectItem>
                        <SelectItem value="HEAD OFFICE NOIDA">HEAD OFFICE NOIDA</SelectItem>
                        <SelectItem value="BOI Branch Pantwari">BOI Branch Pantwari</SelectItem>
                        <SelectItem value="Noida 1">Noida 1</SelectItem>
                        <SelectItem value="Noida 2">Noida 2</SelectItem>
                        <SelectItem value="Noida 3">Noida 3</SelectItem>
                        <SelectItem value="Noida 4">Noida 4</SelectItem>
                        <SelectItem value="Digitals HYD Test">Digitals HYD Test</SelectItem>
                        <SelectItem value="Noida 5">Noida 5</SelectItem>
                        <SelectItem value="BOI Branch Haibatpur">BOI Branch Haibatpur</SelectItem>
                        <SelectItem value="BOI Branch Office Sec 62">BOI Branch Office Sec 62</SelectItem>

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
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address} 
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 min-h-[80px]"
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
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        required
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
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        required
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
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        required
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
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        required
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />{errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>
                </div>
              </div>
            </div> 

            <DialogFooter className="sticky bottom-0 z-10 bg-white flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200">
              <div className="flex gap-4 mb-4 sm:mb-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="bg-gradient-to-r from-gray-600 to-blue-600 text-white hover:bg-purple-50"
                >
                  Reset 
                </Button>
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