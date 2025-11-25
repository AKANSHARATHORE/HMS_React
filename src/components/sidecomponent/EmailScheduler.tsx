import { Button } from '@/components/ui/button';
import { exportToExcel, exportToPDF, copyToClipboard } from "./AllAlertButton";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Input } from '../ui/input';
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";

function EmailSchedular() {
  const [data, setData] = useState<any[]>([]);
  const [emailSchedular, setEmailSchedular] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const flattenBranchData = (branchData: any[], result: any[] = []) => {
    branchData.forEach(branch => {
      const flatBranch = {
        branchCode: branch.branchCode,
        branchDesc: branch.branchDesc,
        ifsc: branch.ifsc,
        controllingOffice: branch.parentBranchName
      };
      result.push(flatBranch);
      if (branch.children) flattenBranchData(branch.children, result);
    });
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const branchCode = sessionStorage.getItem("branch");

        const branchUrl = `${API_BASE_URL}/getAllBranchForHierarchy?loggedInBranch=${branchCode}`;
        const schedularUrl = `${API_BASE_URL}/getAllRecords`;

        const [branchRes, schedularRes] = await Promise.all([
          fetch(branchUrl),
          fetch(schedularUrl)
        ]);

        const branchResult = await branchRes.json();
        const schedularResult = await schedularRes.json();

        const flattenedData = flattenBranchData(branchResult.payload || []);
        setData(flattenedData);
        setEmailSchedular(schedularResult.payload || []);
        setIsLoading(false);

      } catch (err) {
        console.error("Error fetching data", err);
        setError("Failed to fetch data");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const isChecked = (branchCode: string, timePeriod: string) => {
    return emailSchedular.some(
      (record: any) =>
        record.branchId === branchCode &&
        record.timePeriod === timePeriod
    );
  };

  const togglePeriod = (branchCode: string, timePeriod: string) => {
    setEmailSchedular(prev => {
      const exists = prev.some(
        record => record.branchId === branchCode && record.timePeriod === timePeriod
      );

      if (exists) {
        return prev.filter(
          record => !(record.branchId === branchCode && record.timePeriod === timePeriod)
        );
      } else {
        return [...prev, { branchId: branchCode, timePeriod }];
      }
    });
  };

  const handleSave = async (branchCode: string, branchName: string, controllingOffice: string) => {
  const selectedPeriods = emailSchedular
    .filter(record => record.branchId === branchCode)
    .map(record => record.timePeriod);

  const timePeriodArray: string[] = [];         // for update
  const timePeriodArrayForSave: string[] = [];  // for create

  for (const timePeriod of selectedPeriods) {
    try {
      const response = await fetch(`${API_BASE_URL}/getEmailSchedulerByBranchIdAndTimePeriod?branchId=${branchCode}&timePeriod=${timePeriod}`);
      if (response.ok) {
        timePeriodArray.push(timePeriod); // for update
      } else {
        timePeriodArrayForSave.push(timePeriod); // for create
      }
    } catch {
      timePeriodArrayForSave.push(timePeriod);  
    }
  }

  // 🔄 Update existing records in a single request
  for (const period of timePeriodArray) {
  try {
    const updateRes = await fetch(`${API_BASE_URL}/saveEmailSchedularService`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        branchId: branchCode,
        branchName: branchName,
        controllingOffice: controllingOffice,
        timePeriod: period
      })
    });

    if (updateRes.ok) {
      console.log(`Updated ${period} for ${branchName}`);
    } else {
      console.error(`Failed to update ${period}`);
    }
  } catch (error) {
    console.error(`Error updating ${period}:`, error);
  }
}


 
  for (const period of timePeriodArrayForSave) {
    try {
      const saveRes = await fetch(`${API_BASE_URL}/saveEmailSchedularService`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          branchId: branchCode,
          branchName: branchName,
          timePeriod: period
        })
      });

      if (saveRes.ok) {
        console.log(`Saved ${period} for ${branchName}`);
      } else {
        console.error(`Failed to save ${period}`);
      }
    } catch (error) {
      console.error(`Error saving ${period}:`, error);
    }
  }

  // ✅ Final success message
  Swal.fire({
    icon: 'success',
    title: 'Saved!',
    text: `Data for ${branchName} has been saved successfully.`,
    timer: 1500,
    showConfirmButton: false
  });
};

  const handleExcelExport = () => {
    exportToExcel(emailSchedular as any, 'All_Alert_Data');
  };
    
    const handlePDFExport = () => {
        exportToPDF(emailSchedular as any, 'All_Alert_Data');
    };
    
    const handleCopyData = () => {
        copyToClipboard(emailSchedular as any);
    };

    const filteredDevices = data.filter((device) =>
     [
      device.branchDesc,
      device.branchCode,    
      ]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
    );

  return (
    <>
    <div className='w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 font-sans text-sm'>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
          Email Scheduler
        </h2>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 w-full md:w-auto"  style={{ height: "20px",fontSize:"12px" }}>
                <Input
                id="search"
                type="text"
                className="w-full md:w-52 h-8"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}/>

            </div>
        </div>
      </div>

      <div className="border rounded shadow-sm max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
            <tr>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">S.No</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Site Name</th>
              <th className ="px-3 py-3 font-semibold text-gray-700 text-left">Controlling Office</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-center">Time Period</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                                                No matching data found.
                                            </td>
                                        </tr>
                                    ) : 
            data.length > 0 ? filteredDevices.map((row, idx) => (
              <tr
                key={row.branchCode}
                data-branch-code={row.branchCode}
                className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
              >
                <td className="px-3 py-2 text-right">{idx + 1}</td>
                <td className="px-3 py-2 text-left">{row.branchDesc}</td>
                <td className="px-3 py-2 text-left">{row.controllingOffice}</td>
                <td className="px-3 py-2 text-center">
                  {["Daily", "Weekly", "Monthly"].map(period => (
                    <label key={period} className="mx-2">
                      <input
                        type="checkbox"
                        className="mr-1"
                        value={period}
                        checked={isChecked(row.branchCode, period)}
                        onChange={() => togglePeriod(row.branchCode, period)}
                      />
                      {period}
                    </label>
                  ))}
                </td>
                <td className="px-2 py-2 text-center">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleSave(row.branchCode, row.branchDesc, row.controllingOffice)}
                  >
                    Save
                  </Button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-3 text-gray-500">
                  {isLoading ? "Loading..." : "No data available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 text-sm text-gray-700 text-right">
        Showing 1 to {data.length} of {data.length} entries
      </div>
    </div>
    <Alert/>
    </>
  );
}

export default EmailSchedular;
