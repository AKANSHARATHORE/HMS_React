import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/config/api";

function DeviceFullEntry() {
  // Quality Check states
  const [qcForm, setQcForm] = useState({
    productType: "Smart Communicator",
    panelId: "",
    panelSerialNo: "",
    qcReportImage: null as File | null,
  });
  const [qcPreview, setQcPreview] = useState<string | null>(null);
  const qcFileInputRef = useRef<HTMLInputElement | null>(null);

  // SIM/Technical Support states
  const [simForm, setSimForm] = useState({
    simDescription: "",
    simSerialNumber: "",
    simOperator: "",
    branchCode: "",
    branchName: "",
    bankName: "",
  });
  const [loading, setLoading] = useState(false);

  // Branch list state
  const [branchList, setBranchList] = useState<{ branchCode: string; branchDesc: string; bankName?: string }[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

  // Fetch branch list on mount
  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/getBranchDetailsByVendorId?vendorId=V-1`, {
          headers: { Accept: "*/*" },
        });
        const data = await res.json();
        if (res.ok && data.statusCode === 200 && Array.isArray(data.payload)) {
          setBranchList(data.payload.map((b: any) => ({ branchCode: b.branchCode, branchDesc: b.branchDesc, bankName: b.bankName || "" })));
        }
      } catch (e) {
        // ignore error
      }
    };
    fetchBranches();
  }, []);

  // Handle input changes
  const handleQcInput = (field: keyof typeof qcForm, value: string | File | null) => {
    setQcForm(prev => ({ ...prev, [field]: value }));
  };
  const handleSimInput = (field: keyof typeof simForm, value: string) => {
    setSimForm(prev => ({ ...prev, [field]: value }));
  };

  // For branch dropdown: set both code and name
  const handleBranchChange = (code: string) => {
    const branch = branchList.find(b => b.branchCode === code);
    setSimForm(prev => ({
      ...prev,
      branchCode: code,
      branchName: branch ? branch.branchDesc : "",
      bankName: branch ? branch.bankName || "" : ""
    }));
  };

  // Image handlers
  const handleQcImage = (files: FileList | null) => {
    if (files && files[0]) {
      handleQcInput("qcReportImage", files[0]);
      const reader = new FileReader();
      reader.onloadend = () => setQcPreview(reader.result as string);
      reader.readAsDataURL(files[0]);
    }
  };
  // No SIM image handler needed

  // Submit handler: calls both APIs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // 1. Quality Check API
    const qcPayload = new FormData();
    qcPayload.append("productType", "Smart Communicator");
    qcPayload.append("panelId", qcForm.panelId);
    qcPayload.append("panelSerialNo", qcForm.panelSerialNo);
    if (qcForm.qcReportImage) qcPayload.append("qcReportImage", qcForm.qcReportImage);
    let qcSuccess = false;
    let qcId = "";
    try {
      const qcRes = await fetch(`${API_BASE_URL}/api/device/integrator/save`, {
        method: "POST",
        body: qcPayload,
      });
      const qcResult = await qcRes.json();
      if (qcRes.ok && qcResult.statusCode === 200) {
        qcSuccess = true;
        qcId = qcResult.payload?.id || "";
      } else {
        Swal.fire({ icon: "error", title: "QC Save Failed", text: "Failed to save Quality Check details." });
        setLoading(false);
        return;
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "QC Error", text: "Error saving Quality Check details." });
      setLoading(false);
      return;
    }
    // 2. SIM/Technical API (only if QC succeeded)
    if (qcSuccess) {
      const simPayload = new FormData();
      simPayload.append("id", qcId); // Use returned id from QC API
      simPayload.append("m2mSimNumber", simForm.simDescription);
      simPayload.append("m2mSimSerialNumber", simForm.simSerialNumber);
      simPayload.append("opertaor", simForm.simOperator);
      simPayload.append("branchCode", simForm.branchCode);
      simPayload.append("branchName", simForm.branchName);
      simPayload.append("bankName", simForm.bankName);
      try {
        const simRes = await fetch(`${API_BASE_URL}/api/device/integrator/ContinueIntegratorDeviceForSim`, {
          method: "PUT",
          body: simPayload,
        });
        const simResult = await simRes.json();
        if (simRes.ok && simResult.statusCode === 200) {
          Swal.fire({ icon: "success", title: "Saved!", text: "All details saved successfully!", confirmButtonColor: "#2563eb" });
          // Reset all
          setQcForm({ productType: "", panelId: "", panelSerialNo: "", qcReportImage: null });
          setQcPreview(null);
          setSimForm({ simDescription: "", simSerialNumber: "", simOperator: "", branchCode: "", branchName: "", bankName: "" });
          setLoading(false);
          if (qcFileInputRef.current) qcFileInputRef.current.value = "";
        } else {
          Swal.fire({ icon: "error", title: "SIM Save Failed", text: "Failed to save SIM details." });
          setLoading(false);
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "SIM Error", text: "Error saving SIM details." });
        setLoading(false);
      }
    }
  };


  // For navigation
  const navigate = useNavigate();

  return (
    <div className="justify-center relative">
      {/* Technical Support Button */}
      <button
        className="absolute right-4 top-4 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow text-sm z-10"
        type="button"
        onClick={() => navigate("/qualitychecktable")}
      >
        View Table
      </button>
      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-xl bg-white rounded-lg shadow-lg p-6 mt-6 mx-auto">
          <h2 className="text-2xl font-bold text-blue-800 mb-6 pb-2 border-b border-blue-200 text-center">
            {/* Device Full Entry */}
            Quality Check
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Type */}
            <div className="space-y-2">
              <Label htmlFor="productType" className="text-sm font-semibold text-gray-700">
                Product Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productType"
                value="Smart Communicator"
                readOnly
                className="w-full bg-gray-100 cursor-not-allowed"
              />
            </div>
            {/* Panel ID */}
            <div className="space-y-2">
              <Label htmlFor="panelId" className="text-sm font-semibold text-gray-700">
                Panel ID <span className="text-red-500">*</span>
              </Label>
              <Input id="panelId" value={qcForm.panelId} onChange={e => handleQcInput("panelId", e.target.value)} required />
            </div>
            {/* QC Report Image */}
            <div className="space-y-2">
              <Label htmlFor="qcReportImage" className="text-sm font-semibold text-gray-700">
                Upload QC Report Image <span className="text-red-500">*</span>
              </Label>
              <Input id="qcReportImage" type="file" accept="image/*" onChange={e => handleQcImage(e.target.files)} ref={qcFileInputRef} required />
              {qcPreview && (
                <img src={qcPreview} alt="QC Preview" className="mt-2 rounded border w-32 h-32 object-cover" />
              )}
            </div>
            {/* Panel Serial No. */}
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="panelSerialNo" className="text-sm font-semibold text-gray-700">
                Panel Serial No. <span className="text-red-500">*</span>
              </Label>
              <Input id="panelSerialNo" value={qcForm.panelSerialNo} onChange={e => handleQcInput("panelSerialNo", e.target.value)} required />
            </div>
            {/* SIM Number */}
            <div className="space-y-2">
              <Label htmlFor="simDescription" className="text-sm font-semibold text-gray-700">
                SIM Number <span className="text-red-500">*</span>
              </Label>
              <Input id="simDescription" value={simForm.simDescription} onChange={e => handleSimInput("simDescription", e.target.value)} required />
            </div>
            {/* SIM Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="simSerialNumber" className="text-sm font-semibold text-gray-700">
                SIM Serial Number <span className="text-red-500">*</span>
              </Label>
              <Input id="simSerialNumber" value={simForm.simSerialNumber} onChange={e => handleSimInput("simSerialNumber", e.target.value)} required />
            </div>
            {/* Branch Name Dropdown (searchable custom) */}
            <div className="space-y-2 relative">
              <Label htmlFor="branchName" className="text-sm font-semibold text-gray-700">
                Branch Name <span className="text-red-500">*</span>
              </Label>
              {/* <Input
                placeholder="Search branch..."
                value={branchSearch}
                onChange={e => setBranchSearch(e.target.value)}
                className="mb-1"
                autoComplete="off"
                onFocus={e => e.target.select()}
              /> */}
              <div className="relative">
                <select
                  id="branchName"
                  value={simForm.branchCode}
                  onChange={e => handleBranchChange(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring focus:ring-blue-300"
                >
                  <option value="">Select Branch</option>
                  {branchList
                    .filter(branch =>
                      branch.branchDesc.toLowerCase().includes(branchSearch.toLowerCase())
                    )
                    .map(branch => (
                      <option key={branch.branchCode} value={branch.branchCode}>{branch.branchDesc}</option>
                    ))}
                </select>
              </div>
            </div>
            {/* Bank Name Dropdown (searchable custom) */}
            <div className="space-y-2 relative">
              <Label htmlFor="bankName" className="text-sm font-semibold text-gray-700">
                Bank Name <span className="text-red-500">*</span>
              </Label>
              {/* <Input
                placeholder="Search bank..."
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                className="mb-1"
                autoComplete="off"
                onFocus={e => e.target.select()}
              /> */}
              <div className="relative">
                <select
                  id="bankName"
                  value={simForm.bankName}
                  onChange={e => setSimForm(prev => ({ ...prev, bankName: e.target.value }))}
                  required
                  className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring focus:ring-blue-300"
                >
                  <option value="">Select Bank</option>
                  {branchList
                    .map(branch => branch.bankName)
                    .filter((v, i, arr) => v && arr.indexOf(v) === i)
                    .filter(bank => bank.toLowerCase().includes(bankSearch.toLowerCase()))
                    .map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                </select>
              </div>
            </div>
            {/* Operator */}
            <div className="space-y-2">
              <Label htmlFor="simOperator" className="text-sm font-semibold text-gray-700">
                Operator <span className="text-red-500">*</span>
              </Label>
              <select
                id="simOperator"
                value={simForm.simOperator}
                onChange={e => handleSimInput("simOperator", e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring focus:ring-blue-300"
              >
                <option value="">Select Operator</option>
                <option value="Airtel">Airtel</option>
                <option value="Vodafone">Vodafone</option>
                <option value="BSNL">BSNL</option>
                <option value="Jio">Jio</option>
                <option value="Idea">Idea</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 items-center">
            {loading && (
              <span className="text-blue-700 font-semibold mr-4 flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Saving...
              </span>
            )}
            <Button
              type="reset"
              variant="outline"
              onClick={() => {
                setQcForm({ productType: "", panelId: "", panelSerialNo: "", qcReportImage: null });
                setQcPreview(null);
                setSimForm({ simDescription: "", simSerialNumber: "", simOperator: "", branchCode: "", branchName: "", bankName: "" });
              }}
              disabled={loading}
            >
              Reset
            </Button>
            <Button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white" disabled={loading}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceFullEntry;
