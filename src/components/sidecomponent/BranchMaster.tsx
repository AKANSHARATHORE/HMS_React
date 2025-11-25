import React, { useEffect,useRef } from "react";
import { Input } from "../ui/input";
import { useState, } from "react";
import { Button } from "../ui/button";
import { Building2, FileSignature, FileSpreadsheet, FileText, Printer } from "lucide-react";

import { useNavigate } from "react-router-dom";
import BranchModal from "./BranchModal";
import { BranchHierarchyModal } from "./BranchHierarchyModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { BranchHierarchyTree } from "./bm";
import { exportToExcel, exportToPDF, copyToClipboard } from "./CopyExcelPdf3";
import Swal from "sweetalert2";
import Alert from "../dashboard/DashboardAlert";
import { API_BASE_URL } from "@/config/api";

function BranchMaster(){
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBank, setSelectedBank] = useState(null);
    const [data, setData] = useState([]);
    const [error,setError]=useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false);
   
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);

 

    const navigate = useNavigate();

    const handleRowClick = (branch: any) => {
        setSelectedBranch(branch);
    }
 
    const [selectedFile, setSelectedFile] = useState<File | null>(null);


     const handleAddBranch = () => {
    setIsEditMode(false);
    openModal();
    setSelectedBranch({});
  };

  const handleEditBranch = () => {
    setIsEditMode(true);
    setIsModalOpen(true);
    setSelectedBranch(selectedBank);
  };

    

    const flattenBranchData = (branchData,result=[]) => {
        branchData.forEach((branch) => {
            const flatBranch={
                branchCode: branch.branchCode,
                bank: branch.bank,
                parentCode: branch.parentCode,
                branchType: branch.branchType,
                branchDesc: branch.branchDesc,
                contractPerson: branch.contractPerson,
                address: [branch.address1, branch.address2, branch.address3, branch.address4]
                    .filter(Boolean)
                    .join(", "),

                mobile: branch.mobile,
                email: branch.email,
                ifsc: branch.parentBranchName,
                latitude: branch.latitude,
                longitude: branch.longitude,
                status: branch.status

            };
            result.push(flatBranch);


            if (branch.children && branch.children.length > 0) {
             flattenBranchData(branch.children, result);
        }
            
        });
         
        return result;
      
          
    };

    const getData=async()=>{
        setIsLoading(true);
        try{
              const branchCode = sessionStorage.getItem("branch");
              const url =`${API_BASE_URL}/getAllBranchForHierarchy?loggedInBranch`;
              const response = await fetch(url+"="+branchCode);
              const result = await response.json();
              const payload = result.payload || [];
              const flattenedData = flattenBranchData(payload);
              setData(flattenedData)

            } catch (err) {
            console.error("Error fetching data", err);
            setError("Failed to fetch branch data");
            } finally {
                setIsLoading(false);
            }




        }

        
    useEffect(()=>{
        
        getData();
        
    },[])

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (branchCode: string) => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "This action will delete the Site. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    });

    if (confirmResult.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/deleteBranchesbyBranchCode?branchCode=${branchCode}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete Site");
        }

        Swal.fire("Deleted!", "The Site has been deleted.", "success");

        // Remove from local state
        const updatedData = data.filter(branch => branch.branchCode !== branchCode);
        setData(updatedData);
      } catch (error) {
        console.error("Error deleting Site:", error);
        Swal.fire("Error", "Failed to delete the Site", "error");
      }
    }
  };


    const fileInputRef = useRef<HTMLInputElement>(null);
    
       const handleClick = () => {
          fileInputRef.current.click();  
        };
      
    
      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedFile) {
        Swal.fire("File already selected", "Remove the current file to Select another one.", "info");
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
            Swal.fire("No file selected", "Please Select an Excel file first", "warning");
            return;
          }
      
          const formData = new FormData();
          formData.append("employeeMasterFile", selectedFile);
      
          try {
            Swal.fire({
              title: "Uploading File...",
              text: "Please wait",
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
              },
              timer: 2000,
              timerProgressBar: true,
            });
      
              const url = `${API_BASE_URL}/importBranchMaster`;
              const response = await fetch(url, {
              method: "POST",
              body: formData,
            });
      
            const result = await response.text();
            console.log("Upload result:", result);
      
          if (result.toLowerCase().includes("saved")) {
            Swal.fire("Success", "File uploaded and format matched", "success");
      
            
          } else {
            Swal.fire("Upload Failed", "File uploaded but format mismatch or error in response", "error");
          }
       } catch (error) {
            console.error("Error uploading file:", error);
            Swal.fire("Error", "File upload failed", "error");
          }
        };

    const filteredUsers = data.filter((user) =>
     [user.bank, user.branchCode, user.branchType, user.branchDesc, user.contractPerson]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
    );

     const handleExcelExport = () => {
            exportToExcel(data, 'branch_master_data');
        };
    
        const handlePDFExport = () => {
            exportToPDF(data, 'branch_master_data');
        };
    
        const handleCopyData = () => {
            copyToClipboard(data);
        }

        const printSection = () => {
      const printContents = document.getElementById('print-section')?.innerHTML;
      if (!printContents) return;
      const printWindow = window.open('', '', 'height=800,width=1000');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Site Master</title>
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
                <div class="print-title">SITE MASTER</div>
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
    
    
    return(
        <>
             <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 mt-2 font-sans text-sm font-medium
             space-x-3" style={{marginRight: "30px" }}>
                <div className="text-2xl font-bold text-gray-800 border-l-4 border-gray-800 ml-3 pl-4 py-2 md:w-auto w-full ">SITE MASTER</div>
                <div className="flex flex-wrap justify-center items-center gap-2 w-full md:w-auto" style={{ marginRight: "30px" }}>
                    {/* <div className="mx-10 flex-1 flex wrap justify-end items-center gap-auto space-x-4" style={{marginRight: "30px" }}> */}

                    
                    {/* <div className="flex items-center gap-2.5" style={{ height: "40px", fontSize: "12px", backgroundColor: "white", borderRadius: "8px", padding: "5px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <div>
                            <Button
                                className={`bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300 transition max-w-xs truncate ${selectedFile ? "px-8  text-sm" : "px-3 py-2 text-xs"
                                    }`}
                                style={{
                                    width: selectedFile ? "160px" : "85px",
                                    height: "25px",
                                    fontSize: selectedFile ? "14px" : "12px"
                                }}
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



                        <Button variant="outline" className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-800 text-sm" style={{ width: "30px", height: "25px", fontSize: "12px" }} title="Upload Data" onClick={handleSubmit}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </Button>


                    </div> */}


                    {/* <Button
      variant="outline"
      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-800 text-sm"
      style={{ width: '30px', height: '25px', fontSize: '12px' }}
      title="Download Format for adding Site"
    >
      <a
  href="./ExcelBranchMasterFile.xlsx" // Pointing to the file in the public folder
  download="ExcelBranchMasterFile.xlsx" // This will give the file the default name when downloading
>
  <Button
    variant="outline"
    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-800 text-sm"
    style={{ width: '30px', height: '25px', fontSize: '12px' }}
    title="Download Format for adding Site"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  </Button>
</a>
    </Button> */}
                    {/* <Button variant="outline" size="sm" className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handleCopyData}>
                        <FileText className="h-2 w-2 mr-0 text-yellow-500" /> Copy
                    </Button> */}

                    <Button variant="outline" size="sm" className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handleExcelExport}>
                        <FileSpreadsheet className="h-4 w-4 mr-1 text-green-500" /> Excel
                    </Button>

                    <Button variant="outline" size="sm" className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handlePDFExport}>
                        <FileSignature className="h-4 w-4 mr-1 text-red-500" /> PDF
                    </Button>

                    <Button variant="outline" size="sm" className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-sm" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={printSection}>
                        <Printer className="h-2 w-2 mr-0 text-blue-500" /> Print
                    </Button>   
                     
                </div>


             </div>
              <div className="flex justify-end items-center mb-2 gap-2" style={{ marginRight: "30px",marginTop: "-20px" }}>
                <div className="flex items-center gap-2 w-full md:w-auto" style={{ height: "20px", fontSize: "12px" }}>
                        <Input
                            id="search"
                            type="text"
                            className="w-full md:w-52 h-8"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            
                        />


                    </div>
                            <BranchHierarchyModal/>
                             <Button className="px-2 py-1 bg-green-700 hover:bg-green-800 rounded-lg text-white text-sm" style={{ width: "130px",height: "28px",fontSize:"12px" }} onClick={handleAddBranch}>
                             
                                 Add New Site
                                 </Button>
                         </div>

             <div className="overflow-x-auto bg-white shadow mt-6"
                style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    maxHeight: '65vh',
                    overflowY: 'auto',
                    margin: "10px"
                }}>
                <div id="print-section">
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
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left fw-bold">BANK NAME</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left fw-bold">SITE NAME</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left fw-bold">SITE TYPE</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-right fw-bolder">CONTROLLING OFFICE</th>                           
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left fw-bolder">CONTACT PERSON</th>
                            <th className="px-3 py-2 text-sm font-medium text-center text-gray-900 fw-bold no-print">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                                    No Data Available.
                                </td>
                            </tr>
                        ) :(
                        filteredUsers.map((tableData, index) => (
                            <tr
                                    key={tableData.code || index}
                                    className="cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleRowClick(tableData)}
                                    style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: index % 2 !== 0 ? "#f9fafb" : "#ffffff" ,fontSize:"12px"}}
                                >
                                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{index + 1}</td>
                                    <td className="px-3 py-2 text-sm  text-gray-700 text-left">{tableData.bank}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">{tableData.branchDesc}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">
                                        <span className={`px-3 py-2 inline-flex text-xs font-semibold rounded-full ${tableData.branchType === 'ZONE' ? 'bg-green-100 text-green-800' :
                                                tableData.branchType === 'HEAD OFFICE' ? 'bg-indigo-100 text-indigo-800':'bg-yellow-100 text-yellow-800' 
                                            }`}>
                                            {tableData.branchType}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-right">
                                      {tableData.branchType === "SUPER HO" ? "Super HO" : tableData.ifsc}
                                    </td>
                                    
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">{tableData.contractPerson}</td>
                            <td className="px-3 py-2 text-sm text-gray-700 text-center no-print">
                              <div className="flex justify-center gap-2">
                                <div className="px-1 py-2 text-sm  border-Blue border rounded-md text-appBlue hover:bg-blue-200"
                                  onClick={() => {
                                    setIsEditMode(true);
                                    setSelectedBranch(tableData);
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
                                  onClick={() => handleDelete(tableData.branchCode)}
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
                            
                            
                        )))}
                        
                     
                                
                    </tbody>
                </table>
                )}
                </div>
            </div>
            <Alert/>

           {
            isModalOpen && <BranchModal isOpen={isModalOpen} 
            onClose={closeModal} 
            isEditMode={isEditMode}
            selectedBranch={selectedBranch} 
            onSuccess={() => {
              closeModal();
              getData();
              }}  />
           }
           
                    
        </>
    )

}
export default BranchMaster;