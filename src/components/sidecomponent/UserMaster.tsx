import { Button } from "@/components/ui/button";
import { ClipboardCopy, FileSignature, FileSpreadsheet, FileText, Printer, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle  } from "@radix-ui/react-dialog";

; // or your preferred modal/dialog component
import { Input } from "@/components/ui/input";
import AddEmployeeModal from "@/components/sidecomponent/AddEmployeeModal";
import { Pagination } from "../ui/pagination";
import { useRef } from "react";
import { exportToExcel, exportToPDF, copyToClipboard } from "./CopyExcelPdf";
import AddEmployeeModal2 from "./UserModal";
import swal from "sweetalert2";
import Alert from "../dashboard/DashboardAlert";
import { API_BASE_URL } from "@/config/api";

function UserMaster() {


    const dummyUsers = [   
    ];

    type User = {
        code?: string;
        name?: string;
        address?: string;
        pincode?: string;
        city?: string;
        state?: string;
        country?: string;
        mobile?: string;
        email?: string;
        group?: string;
        branch?: string;
        role?: string;
    };


    const [selectedUser, setSelectedUser] = useState<User>({});
    const [users, setUsers] = useState<User[]>([]);
    const [error,setError]=useState(null)
    const [isEditMode, setIsEditMode] = useState(false); 
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        const getData=async()=>{
            const branch = sessionStorage.getItem("branch");
            try{const url=`${API_BASE_URL}/getAllEmployeesOfBranch?branchCode`;
             const response = await fetch(url+"="+ branch, {
                method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                      
                  },
              });
             const result = await response.json();
             const data=result.payload
                if (result?.statusCode === 200 && Array.isArray(data)) {
                    const transformed: User[] = data.map((emp: any) => ({
                        code: emp.empId || "",
                        name: emp.empName || "",
                        address: emp.address || "",
                        pincode: emp.pin || "",
                        city: emp.city || "",
                        state: emp.state || "",
                        country: emp.country || "",
                        mobile: emp.mobile || "",
                        email: emp.email || "",
                        group: emp.groupId || "",
                        branch: emp.branch || "",
                        role: emp.empRole ? emp.empRole.toUpperCase() : "",
                    }));
                    setUsers(transformed);
                }
            }catch (err) {
            console.error("Error fetching data", err);
            setError("Failed to fetch branch data");
            }
        }
        getData();

            
    },[])
    

    const handleRowClick = (user: User) => {
        setSelectedUser(user);
    }

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);


    function handleDelete(code: string) {
        swal.fire({
            title: "Are you sure you want to delete this user",
            text: "Once deleted, you will not be able to recover this user!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'OK',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_BASE_URL}/deleteEmployee?empId=${code}`, {
                        method: "DELETE",
                    });
                    if (!response.ok) {
                        throw new Error("Failed to delete user");
                    }
                    swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: "The user has been deleted.",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    const updatedUsers = users.filter((user) => user.code !== code);
                    setUsers(updatedUsers);
                } catch (error) {
                    swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Failed to delete the user",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                }
            }
        });
      
   }


   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const handleClick = () => {
      fileInputRef.current.click();  
    };
  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (selectedFile) {
    swal.fire("File already selected", "Remove the current file to upload another one.", "info");
    event.target.value = ''; 
    return;
  }

  const file = event.target.files?.[0];
  if (file) {
    setSelectedFile(file);
  }
};

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      swal.fire("No file selected", "Please Select an Excel file first", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("employeeMasterFile", selectedFile);

    try {
      swal.fire({
        title: "Uploading File...",
        text: "Please wait",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          swal.showLoading();
        },
        timer: 2000,
        timerProgressBar: true,
      });

        const url = `${API_BASE_URL}/importEmployeeMaster`;
        const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const result = await response.text();
      console.log("Upload result:", result);

    if (result.toLowerCase().includes("saved")) {
      swal.fire("Success", "File uploaded and format matched", "success");

      
    } else {
      swal.fire("Upload Failed", "File uploaded but format mismatch or error in response", "error");
    }
 } catch (error) {
      console.error("Error uploading file:", error);
      swal.fire("Error", "File upload failed", "error");
    }
  };

    const filteredUsers = users.filter((user) =>
     [user.code, user.name, user.mobile, user.role]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
    );

    const handleExcelExport = () => {
        exportToExcel(filteredUsers, 'user_master_data');
    };

    const handlePDFExport = () => {
        exportToPDF(filteredUsers, 'user_master_data');
    };

    const handleCopyData = () => {
        copyToClipboard(filteredUsers);
    }

    const printSection = () => {
      const printContents = document.getElementById('print-section')?.innerHTML;
      if (!printContents) return;
      const printWindow = window.open('', '', 'height=800,width=1000');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>User Master</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; }
                .print-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                .print-title { font-size: 2rem; font-weight: 600; }
                .print-logo { max-width:320px; max-height:90px; margin-left: 20px; }
                table { border-collapse: collapse; width: 100%; font-size: 1rem; }
                th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
                th { background: #f3f4f6; font-weight: 600; }
                tr:nth-child(even) { background: #fafbfc; }
                .no-print { display: none !important; }
              </style>
            </head>
            <body>
              <div class="print-header">
                <div class="print-title">USER MASTER</div>
                <img src="${window.location.origin}/Digitals45.jpg" alt="Digitals Logo" class="print-logo" />
              </div>
              ${printContents}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    };

    // Add a refetch function to reload users after modal closes
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const branch = sessionStorage.getItem("branch");
            const url = `${API_BASE_URL}/getAllEmployeesOfBranch?branchCode`;
            const response = await fetch(url + "=" + branch, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();
            const data = result.payload;
            if (result?.statusCode === 200 && Array.isArray(data)) {
                const transformed: User[] = data.map((emp: any) => ({
                    code: emp.empId || "",
                    name: emp.empName || "",
                    address: emp.address || "",
                    pincode: emp.pin || "",
                    city: emp.city || "",
                    state: emp.state || "",
                    country: emp.country || "",
                    mobile: emp.mobile || "",
                    email: emp.email || "",
                    group: emp.groupId || "",
                    branch: emp.branch || "",
                    role: emp.empRole ? emp.empRole.toUpperCase() : "",
                }));
                setUsers(transformed);
            }
        } catch (err) {
            console.error("Error fetching data", err);
            setError("Failed to fetch branch data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    

    // Utility function to capitalize first letter of each word
    function capitalizeWords(str: string = ""): string {
        return (str.toLocaleUpperCase());
    }

    return (
        <>
          {/* USER MASTER Header and Actions */}
<div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 mt-2 mb-2 font-sans text-sm font-medium">

  {/* Title */}
  <div className="text-2xl font-bold text-gray-800 border-l-4 border-gray-800 pl-4 py-2 w-full md:w-auto">
    USER MASTER
  </div>

  {/* Action Buttons */}
  <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 w-full md:w-auto">

    
    {/* <div className="flex items-center gap-2.5 bg-white rounded-lg px-2 py-1 shadow-sm">
      <div className="flex items-center">
        <Button
          className="bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm truncate"
          style={{ width: selectedFile ? "160px" : "85px", height: "25px", fontSize: selectedFile ? "14px" : "12px" }}
          title="Upload Excel"
          onClick={handleClick}
        >
          {selectedFile ? selectedFile.name : "Upload Excel"}
        </Button>

        {selectedFile && (
          <button
            onClick={handleRemoveFile}
            className="ml-2 text-gray-600 hover:text-red-500 font-bold"
            title="Remove file"
          >
            &times;
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <Button
        className="bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-800 text-sm flex items-center justify-center"
        style={{ width: "30px", height: "25px", fontSize: "12px" }}
        title="Upload Data"
        onClick={handleSubmit}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </Button>
    </div> */}

    {/* Export Buttons */}
       {/* <Button
        variant="outline"
        className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-800 text-sm"
        style={{ width: '30px', height: '25px', fontSize: '12px' }}
        title="Download Format for adding Branch"
      >
        <a
    href="./ExcelUserMasterFile.xlsx" 
    download="UserMasterFormat.xlsx"
  >
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  </a>
      </Button> */}

    {/* <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handleCopyData}>
      <FileText className="h-3 w-3 mr-1 text-yellow-500" /> Copy
    </Button> */}

    <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handleExcelExport}>
      <FileSpreadsheet className="h-4 w-4 mr-1 text-green-500" /> Excel
    </Button>

    <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handlePDFExport}>
      <FileSignature className="h-4 w-4 mr-1 text-red-500" /> PDF
    </Button>

    <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={printSection}>
      <Printer className="h-3 w-3 mr-1 text-blue-500" /> Print
    </Button>
  </div>
</div>

{/* Search + Add New Row - Aligned to Right */}
<div className="w-full flex justify-end px-2 mb-4">
  <div className="flex items-center gap-2">
    <div className="w-52">
      <Input
        id="search"
        type="text"
        className="w-full h-8 text-sm border-gray-300 focus:ring-green-700 focus:border-green-700"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <Button
      className="flex items-center gap-2 px-2 py-1 h-7 bg-green-700 hover:bg-green-800 text-white rounded-md text-xs"
      onClick={() => {
        setSelectedUser({});
        setIsEditMode(false);
        openModal();
      }}
    > Add User
    </Button>
  </div>
</div>






            <div className="overflow-x-auto bg-white  shadow mt-6"
                style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    maxHeight: '62vh',
                    overflowY: 'auto',
                    margin: "10px"
                }}>
                <div id="print-section" className="contents">
                {isLoading ? (
                    <div className="flex justify-center items-center h-60">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
                        <span className="ml-4 text-gray-600 text-lg">Loading...</span>
                    </div>
                ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200" style={{ position: "sticky", top: "0",fontSize:"13px" }}>
                        <tr>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-right"> S.No</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-left">USER NAME</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-left">ROLE</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder text-right">MOBILE NO.</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-center fw-bolder no-print">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                                    No Data Available.
                                </td>
                            </tr>
                        ) :(
                        
                        filteredUsers.map((user, index) => (

                                <tr
                                    key={user.code || index}
                                    className="cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleRowClick(user)}
                                    style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: index % 2 !== 0 ? "#f9fafb" : "#ffffff" ,fontSize:"12px"}}
                                >
                                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{index + 1}</td>
                                    
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">{capitalizeWords(user.name)}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">
                                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${user.role === 'DATA ADMIN' ? 'bg-green-100 text-green-800' :
                                                user.role === 'USER' ? 'bg-yellow-100 text-yellow-600' :
                                                 user.role === 'ADMIN' ?'bg-indigo-100 text-indigo-800':'bg-cyan-100 text-cyan-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{user.mobile}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-center no-print">
                                        <div className="flex justify-center gap-2">
                                            <div className="px-1 py-2 text-sm  border-Blue border rounded-md text-appBlue hover:bg-blue-200"
                                                onClick={() => {
                                                    setIsEditMode(true);
                                                    setSelectedUser(user); // Pass full user object with branch, role, group
                                                    openModal();
                                                }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-blue-500"  
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >

                                                <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
                                                    />
                                                </svg>
                                            </div>
                                            <div
                                                
                                                className="px-1 py-2 text-sm border-red-500 border rounded-md text-red-500 hover:bg-red-200"
                                                onClick={() => handleDelete(user.code)}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-5-4H6a1 1 0 00-1 1v1h14V4a1 1 0 00-1-1z"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        
                    </tbody>
                </table>
                )}
                </div>

                

            </div>
            <div className="px-3 py-2 text-sm text-gray-700 text-right">
                  Showing 1 to {users.length} of {users.length} entries
                </div>
                <Alert/>

{isModalOpen && (
  <AddEmployeeModal2 isOpen={isModalOpen}
    onClose={closeModal}
    data={selectedUser} 
    isEditMode={isEditMode}
    onSuccess={() => {
      closeModal();
      fetchUsers();
    }}
  />
)}

        </>
    );
}

export default UserMaster;

