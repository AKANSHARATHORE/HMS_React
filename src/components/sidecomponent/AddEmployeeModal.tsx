import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Added for Address field
import { X } from 'lucide-react';
import { set } from 'date-fns';
import { API_BASE_URL } from "@/config/api";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?:boolean
  data?:{
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

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ data, isOpen, onClose,isEditMode }) => {
  if (!isOpen) {
    return null;
  }
  // const [formData,setFormData]=useState({...data});
  const [formData, setFormData] = useState({
  code: '',
  name: '',
  role: '',
  group: '',
  branch: '',
  address: '',
  pincode: '',
  city: '',
  state: '',
  country: '',
  mobile: '',
  email: '',
});





useEffect(() => {
  if (data) {
    setFormData(prev => ({
      code: data.code ?? "",
      name: data.name ?? "",
      role: (data.role) ?? "",
      group: (data.group) ?? "",
      branch: (data.branch) ?? "",
      address: data.address ?? "",
      pincode: data.pincode ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      country: data.country ?? "",
      mobile: data.mobile ?? "",
      email: data.email ?? "",
    }));
  }
}, [data]);

  
  
  const updateData = async() => {

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
      updationStatus: isEditMode ? "Update" : "Save",
      count: 1,
    };



    
    if (!FormData) {
      console.error("No data provided for update.");
      return;
    }

    try {

      const url = `${API_BASE_URL}/HMS/saveOrUpdateEmployee`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization':'Bearer '+ sessionStorage.getItem('token') || '',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.statusCode === 200) {
        console.log("Employee updated successfully:", result.payload);
        onClose();
      } else {
        console.error("Failed to update employee:", result.message);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }

    console.log("Data updated:", data);
  };


  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-white dark:bg-gray-900 p-0" style={{
        backgroundColor:"grey-600",
      maxHeight: '70vh',
      maxWidth: '60%',
      overflowY: 'auto',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      paddingRight: '12px', 
      boxSizing: 'border-box',
    }}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{fontFamily: 'Inter, sans-serif',fontSize: '18px', textAlign:"left" }}>ADD USER </DialogTitle>
          <hr></hr>
          
          <DialogClose asChild className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            
            
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-6" >
           
          <div style={{marginTop:"-30px"}}>
            <h5 className="text-lg font-small text-blue-600 dark:text-blue-400 mb-3">User Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div style={{fontFamily: 'Inter, sans-serif',fontSize: '13px'}}>
                <Label htmlFor="userId" className=" text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>USER ID</Label>
                <Input id="userId" placeholder="User Id" 
                value={formData.code} 
                onChange={(e)=>{setFormData({...formData,code:e.target.value})
                }}
                style={{fontFamily: 'Inter, sans-serif',fontSize: '13px', textAlign:"left",borderRadius:"10px", width:"60%"}}
                className="mt-1 bg-gray-50 dark:bg-gray-800 border-blue-300 dark:border-blue-700" />
              </div>
              <div style={{fontFamily: 'Inter, sans-serif',fontSize: '13px', marginLeft:"-70px", marginRight:"20px" }}>
                <Label htmlFor="userName" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>NAME</Label>
                <Input id="userName" placeholder="Name" 
                value={formData.name} 
                onChange={(e)=>{setFormData({...formData,name:e.target.value})
                }} 
                style={{fontFamily: 'Inter, sans-serif',fontSize: '13px', textAlign:"left",border:"1px solid #ccc",borderRadius:"10px", width:"100%"}}
                className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>

              <div>
                <Label htmlFor="userRole" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>SELECT ROLE</Label>
                <Select value={formData.role} 
                onValueChange={(value)=>{setFormData({...formData,role:value})
                }}>
                  <SelectTrigger
                    className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      borderRadius: "10px",
                    }}
                  >
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{data?.role}</SelectLabel>
                      <SelectItem value="Data Admin">Data Admin</SelectItem>
                      <SelectItem value="Super User">Super User</SelectItem>
                      <SelectItem value="CRO/ Security Guard">CRO/ Security Guard</SelectItem>
                      <SelectItem value="Security Officer">Security Officer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employeeGroup" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>SELECT GROUP</Label>
                <Select value={formData.group} 
                onValueChange={(value)=>{setFormData({...formData,group:value})
                }}>
                  <SelectTrigger className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      borderRadius: "10px",
                      width:"120%"
                    }}>
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{formData.group}</SelectLabel>
                      <SelectItem value="Admin Group"> Admin Group</SelectItem>
                      <SelectItem value="Super Admin Group"> Super Admin Group</SelectItem>
                      <SelectItem value="Trainee Group">Trainee Group</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div style={{marginLeft:"50px"}}>
                <Label htmlFor="userBranch" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>SELECT BRANCH</Label>
                <Select value={formData.branch} 
                onValueChange={(value)=>{setFormData({...formData,branch:value})
                }}>
                  <SelectTrigger className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      borderRadius: "10px",
                    }}>
                    <SelectValue placeholder="Select Branch" 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{data?.branch}</SelectLabel>
                      <SelectItem value="branchX">Branch X</SelectItem>
                      <SelectItem value="branchY">Branch Y</SelectItem>
                      <SelectItem value="branchZ">Branch Z</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Details Section */}
          <div style={{fontFamily: 'Inter, sans-serif',fontSize: '13px'}}>
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-3">Address Details</h3>
            <div className="mb-4">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>ADDRESS</Label>
              <Textarea id="address" placeholder="Address" 
               value={formData.address} 
                onChange={(e)=>{setFormData({...formData,address:e.target.value})
                }} 
              className="mt-1 h-24 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="pincode" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>PINCODE</Label>
                <Input id="pincode" placeholder="Pincode"
                 value={formData.pincode} 
                onChange={(e)=>{setFormData({...formData,pincode:e.target.value})
                }} 
                className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>CITY</Label>
                <Input id="city" placeholder="City"
                 value={formData.city} 
                onChange={(e)=>{setFormData({...formData,city:e.target.value})
                }} 
                className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <Label htmlFor="state" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>STATE</Label>
                <Input id="state" placeholder="State"
                 value={formData.state} 
                onChange={(e)=>{setFormData({...formData,state:e.target.value})
                }} 
                className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <Label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>COUNTRY</Label>
                <Input id="country" placeholder="Country"
                 value={formData.country} 
                onChange={(e)=>{setFormData({...formData,country:e.target.value})
                }} 
                className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
            </div>
          </div>

           <div style={{marginTop:"20px",fontFamily: 'Inter, sans-serif',
            fontSize: '13px', borderRadius: "10px",}}>
            <h4 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-3">Contact Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{}}>
              <div >
                <Label htmlFor="userId" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>MOBILE</Label>
                <Input id="userId" placeholder="mobile"
                 value={formData.mobile} 
                onChange={(e)=>{setFormData({...formData,mobile:e.target.value})
                }} 
                className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <Label htmlFor="userName" className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{fontFamily: 'Inter, sans-serif',fontSize: '12px', textAlign:"left",fontWeight:"bold" }}>E-MAIL</Label>
                <Input id="userName" placeholder="email" 
                 value={formData.email} 
                onChange={(e)=>{setFormData({...formData,email:e.target.value})
                }} style={{
                      width:"120%"
                    }}
                 className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
              
              
             
            </div>
          </div>
          
        </div>
        <DialogFooter className="sticky bottom-0 left-0 w-full bg-white z-10 border-t p-2 flex justify-end space-x-2">
         {isEditMode ? (
          <>
              <Button
                variant="destructive"
                className="bg-red-300 hover:bg-red-400 text-red-900"
                onClick={() => {
                  // Handle delete
                  console.log("Delete clicked");
                  onClose();
                }}>
                Delete
              </Button>

              <Button
                variant="default"
                className="bg-green-300 hover:bg-green-300 text-green-900"
                onClick={() => {updateData();
                  // Handle submit
                  console.log("Submit clicked");
                  onClose();
                }} >
                Update
              </Button>
              
          </>
         ) : (
          <Button
            variant="default"
            className="bg-gray-300 hover:bg-gray-400 text-gray-900"
            onClick={() => {
              // Handle cancel
              console.log("save clicked");
              onClose();
            }}>Save</Button>
        )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeModal;