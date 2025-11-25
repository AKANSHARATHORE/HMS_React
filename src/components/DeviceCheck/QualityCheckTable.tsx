import { Button } from "@/components/ui/button";
import { ClipboardCopy, FileSignature, FileSpreadsheet, FileText, Printer, Search, Upload, X, Camera } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/config/api";
// import { exportToExcel, exportToPDF, copyToClipboard } from "@/components/sidecomponent/CopyExcelPdf";

// import swal from "sweetalert2";

function TechnicalSupport() {
    const dummyUsers = [];

    type User = {
        id: string;
        productType: string;
        panelId: string;
        panelSerialNo: string;
        m2mSimNumber: string;
        qcReportImagePath: string | null;
        m2mSimImagePath: string | null;
        m2mSimSerialNumber?: string;
        opertaor?: string;
        branchName?: string;
        branchCode?: string;
        bankName?: string;
    };

    type SimDetail = {
        userId: string;
        image: File | null;
        description: string;
        notes: string;
    };
    const [formData, setFormData] = useState({
        id: "",
        m2mSimNumber: "",
        m2mSimImage: null as File | null,
      });

    const [selectedUser, setSelectedUser] = useState<User>({
        id: "",
        productType: "",
        panelId: "",
        panelSerialNo: "",
        m2mSimNumber: "",
        qcReportImagePath: "",
        m2mSimImagePath: "",
    });
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
    const [simDetailModal, setSimDetailModal] = useState<{ open: boolean; userIndex: number | null; userId: string | null }>({
        open: false,
        userIndex: null,
        userId: null
    });
    
    // SIM Detail form states
    const [simImage, setSimImage] = useState<File | null>(null);
    const [simDescription, setSimDescription] = useState("");
    const [simNotes, setSimNotes] = useState("");
    const [simSerialNumber, setSimSerialNumber] = useState(""); // NEW: m2mSimSerialNumber
    const [simOperator, setSimOperator] = useState(""); // NEW: opertaor
    const simImageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const getData = async () => {
            try {
                const url = `${API_BASE_URL}/api/device/integrator/getAllIntegratedDeviceDetails`;
                const response = await fetch(url, { headers: { Accept: "*/*" } });
                const result = await response.json();
                const data = result.payload;
                if (result?.statusCode === 200 && Array.isArray(data)) {
                    const transformed: User[] = data.map((emp: any) => ({
                        id: emp.id || "",
                        productType: emp.productType || "",
                        panelId: emp.panelId || "",
                        panelSerialNo: emp.panelSerialNo || "",
                        m2mSimNumber: emp.m2mSimNumber || "",
                        qcReportImagePath: emp.qcReportImagePath || null,
                        m2mSimImagePath: emp.m2mSimImagePath || null,
                        m2mSimSerialNumber: emp.m2mSimSerialNumber || "",
                        opertaor: emp.opertaor || "",
                        branchName: emp.branchName || "",
                        branchCode: emp.branchCode || "",
                        bankName: emp.bankName || "",
                    }));
                    setUsers(transformed);
                }
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Failed to fetch branch data");
            }
        };
        getData();
    }, []);

    const handleRowClick = (user: User) => {
        setSelectedUser(user);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const filteredUsers = users.filter((user) =>
    [user.productType, user.panelId, user.panelSerialNo, user.m2mSimNumber, user.qcReportImagePath, user.m2mSimImagePath]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    

    const printSection = () => {
        const printContents = document.getElementById('print-section')?.innerHTML;
        if (!printContents) return;
        const printWindow = window.open('', '', 'height=800,width=1000');
        if (printWindow) {
            printWindow.document.write(`
          <html>
            <head>
              <title>Quality Check Details</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; }
                h2 { font-size: 2rem; font-weight: 600; margin-bottom: 1.5rem; }
                table { border-collapse: collapse; width: 100%; font-size: 1rem; }
                th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
                th { background: #f3f4f6; font-weight: 600; }
                tr:nth-child(even) { background: #fafbfc; }
                .print-title { font-size: 2rem; font-weight: 600; margin-bottom: 1.5rem; }
                .no-print { display: none !important; }
              </style>
            </head>
            <body>
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
  const displayValue = (value: string | null | undefined) => value || "N/A";

    

    const [showFilters, setShowFilters] = useState(false);

    // Handle Add SIM Detail click
    const handleAddSimDetail = (index: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setSimDetailModal({ open: true, userIndex: index, userId: filteredUsers[index].id });
        setExpandedRowIndex(index);
    };

    // Handle SIM image upload
    const handleSimImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSimImage(file);
        }
    };

     const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setSimDetailModal({ open: true, userIndex: null, userId: formData.id });
        setExpandedRowIndex(null);
    
        const formPayload = new FormData();
        formPayload.append("id", formData.id);
        formPayload.append("m2mSimNumber", formData.m2mSimNumber);
        if (formData.m2mSimImage) {
          formPayload.append("m2mSimImage", formData.m2mSimImage);
        }
    
        try {
          const response = await fetch("${API_BASE_URL}/api/device/integrator/save", {
            method: "POST",
            body: formPayload,
          });
          const result = await response.json();
    
          if (response.ok && result.statusCode === 200) {
            Swal.fire({
              icon: "success",
              title: "Saved!",
              text: "Device Configuration Saved Successfully!",
              confirmButtonColor: "#2563eb",
            });
    
            setFormData({
                id: "",
                m2mSimNumber: "",
                m2mSimImage: null,
            });
    
            setIsModalOpen(false);
          } else {
            Swal.fire({
              icon: "error",
              title: "Failed!",
              text: "Failed to save device configuration.",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error saving device configuration.",
          });
          console.error(error);
        }
      };

    // Handle SIM detail save (calls the API with id)
    const handleSimDetailSave = async () => {
        if (!simImage) {
            alert("Please upload a SIM image.");
            return;
        }
        if (!simDescription) {
            alert("Please enter a SIM number.");
            return;
        }
        if (!simSerialNumber) {
            alert("Please enter a SIM Serial Number.");
            return;
        }
        if (!simOperator) {
            alert("Please enter Operator.");
            return;
        }
        try {
            const formPayload = new FormData();
            formPayload.append("id", simDetailModal.userId || "");
            formPayload.append("m2mSimNumber", simDescription);
            formPayload.append("m2mSimImage", simImage);
            formPayload.append("m2mSimSerialNumber", simSerialNumber); // NEW
            formPayload.append("opertaor", simOperator); // NEW

            const response = await fetch("${API_BASE_URL}/api/device/integrator/ContinueIntegratorDeviceForSim", {
                method: "PUT",
                body: formPayload,
            });
            const result = await response.json();

            if (response.ok && result.statusCode === 200) {
                alert("Success: SIM detail saved successfully");
                resetSimDetailForm();
                closeSimDetailModal();
            } else {
                alert("Failed to save SIM detail");
            }
        } catch (error) {
            console.error("Error saving SIM detail:", error);
            alert("Error: Failed to save SIM detail");
        }
    };

    // Reset SIM detail form
    const resetSimDetailForm = () => {
        setSimImage(null);
        setSimDescription("");
        setSimNotes("");
        setSimSerialNumber(""); // NEW
        setSimOperator(""); // NEW
        if (simImageInputRef.current) {
            simImageInputRef.current.value = "";
        }
    };

    // Close SIM detail modal
    const closeSimDetailModal = () => {
        setSimDetailModal({ open: false, userIndex: null, userId: null });
        setExpandedRowIndex(null);
        resetSimDetailForm();
    };

    // Handle SIM detail cancel
    const handleSimDetailCancel = () => {
        closeSimDetailModal();
    };

    return (
        <>
            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 mt-2 mb-2 font-sans text-sm font-medium">
                {/* Title */}
                <div className="text-2xl font-bold text-gray-800 border-l-4 border-gray-800 pl-4 py-2 w-full md:w-auto">
                    {/* Technical Support  */}
                    Quality Check Details
                </div>
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
                {/* <div className="w-full flex justify-end px-2 mb-4">
                
                    
                
                  </div> */}

                {/* Action Buttons */}
                {/* <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handleCopyData}>
                        <FileText className="h-3 w-3 mr-1 text-yellow-500" /> Copy
                    </Button>

                    <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handleExcelExport}>
                        <FileSpreadsheet className="h-4 w-4 mr-1 text-green-500" /> Excel
                    </Button>

                    <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={handlePDFExport}>
                        <FileSignature className="h-4 w-4 mr-1 text-red-500" /> PDF
                    </Button>

                    <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg" style={{ width: "85px", height: "25px", fontSize: "12px" }} onClick={printSection}>
                        <Printer className="h-3 w-3 mr-1 text-blue-500" /> Print
                    </Button>
                </div> */}
            </div>

            {/* Search + Add New Row - Aligned to Right */}
            

            <div className="overflow-x-auto bg-white shadow mt-6"
                style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    maxHeight: '62vh',
                    overflowY: 'auto',
                    margin: "10px"
                }}>
                <div id="print-section" className="contents">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-200" style={{ position: "sticky", top: "0", fontSize: "13px" }}>
                            <tr>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-right">S.No</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder">Branch Name</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder">Bank Name</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-left">Product Type</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-right">Panel Id</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-right">Panel Serial No.</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder text-right">SIM Number</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder text-right">SIM Serial No.</th>
                                <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder">Operator</th>
                                {/* <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder text-right">QC Report Image</th> */}
                                {/* <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bolder text-right">SIM Image</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", padding: "1rem" }}>
                                        No matching data found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr
                                        key={user.id || index}
                                        className="cursor-pointer hover:bg-blue-100"
                                        style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: index % 2 !== 0 ? "#f9fafb" : "#ffffff", fontSize: "12px" }}
                                    >
                                        <td className="px-3 py-2 text-sm text-gray-700 text-right">{index + 1}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 ">{displayValue(user.branchName)}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 ">{displayValue(user.bankName)}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 text-left">{user.productType}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 text-right">{user.panelId}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 text-right">{user.panelSerialNo}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 text-right">{displayValue(user.m2mSimNumber)}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 text-right">{displayValue(user.m2mSimSerialNumber)}</td>
                                        <td className="px-3 py-2 text-sm text-gray-700 ">{displayValue(user.opertaor)}</td>
                                        {/* <td className="px-3 py-2 text-sm text-gray-700 text-right">
                                            {user.qcReportImagePath ? (
                                                <img src={`/${user.qcReportImagePath}`} alt="QC Report" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, border: "1px solid #ccc" }} />
                                            ) : (
                                                "N/A"
                                            )}
                                        </td> */}
                                        {/* <td className="px-3 py-2 text-sm text-gray-700 text-right">
                                            {user.m2mSimImagePath ? (
                                                <img src={`/${user.m2mSimImagePath}`} alt="SIM" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, border: "1px solid #ccc" }} />
                                            ) : (
                                                "N/A"
                                            )}
                                        </td> */}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="px-3 py-2 text-sm text-gray-700 text-right">
                Showing 1 to {users.length} of {users.length} entries
            </div>
        </>
    );
};

export default TechnicalSupport;