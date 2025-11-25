import {
  FileText, FileSpreadsheet, Printer, FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToExcel, exportToPDF, copyToClipboard } from "./AllAlertButton";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Input } from '../ui/input';
import { AlertsModal } from './SocialMediaReportModal';
import Alert from '../dashboard/DashboardAlert';
import { API_BASE_URL } from "@/config/api";

function SocialMediaReport() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const branchCode = sessionStorage.getItem("branch");
        const url = `${API_BASE_URL}/getAllAlertTypes?branchCode=${branchCode}`;

        const response = await fetch(url);
        const result = await response.json();
        const data = result.payload || [];
        //  alert(data.alertTypes);
        let alertTypes = [];

        data.forEach(branch => {
         alertTypes = (branch.alertTypes);
        });
        // alert(alertTypes);
        // const uniqueAlertTypes = Array.from(new Set(alertTypes));
        // uniqueAlertTypes.sort((a, b) => a.localeCompare(b));
        setData(data);
        setIsLoading(false);

      } catch (err) {
        console.error("Error fetching data", err);
        setError("Failed to fetch data");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);


  

  return (
    <>
    <div className='w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 font-sans text-sm'>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-600 pl-4">
           Alert Configuration
        </h2>
        <div className="w-full md:w-1/3 flex justify-end">
          <Input
            type="text"
            placeholder="Search Site Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="border rounded shadow-sm max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
            <tr>
              <th className="px-3 py-3 font-semibold text-gray-700 text-right">S.No</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Site Name</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left">Site Type</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-left"> Bank Name</th>
              <th className="px-3 py-3 font-semibold text-gray-700 text-center">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {(data.length > 0 ? data.filter(row => row.branchName?.toLowerCase().includes(searchTerm.toLowerCase())) : []).map((row, idx) => (
              <tr
                key={row.branchCode}
                data-branch-code={row.branchCode}
                className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
              >
                <td className="px-3 py-2 text-right">{idx + 1}</td>
                <td className="px-3 py-2 text-left">{row.branchName}</td>
                <td className="px-3 py-2 text-left">{row.branchType}</td>
                <td className="px-3 py-2 text-left">{row.bankName}</td>
               <td className="px-2 py-2 text-center">
                  <Button
                    size="sm"
                    className="bg-rose-500 hover:bg-rose-700 text-white font-medium px-4 py-1.5 rounded-md shadow-sm transition-all duration-200"
                    onClick={() => {
                      setSelectedAlert(row);
                      openModal();
                    }}
                    style={{width: "85px",height: "30px", minWidth: "90px" }}
                  >
                    Select Alert
                  </Button>
                </td>
              </tr>
            ))}
            {data.length > 0 && data.filter(row => row.branchName?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-3 text-gray-500">
                  No results found
                </td>
              </tr>
            )}
            {data.length === 0 && (
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
        Showing 1 to {data.filter(row => row.branchName?.toLowerCase().includes(searchTerm.toLowerCase())).length} of {data.length} entries
      </div>
    </div>
    <Alert/>

    <AlertsModal
              isOpen={isModalOpen}
              onClose={closeModal} 
              data={selectedAlert}
              siteName={selectedAlert?.branchName || ""}
              alertTypes={selectedAlert?.alertTypes || []} 
      />
      </>
  );
}

export default SocialMediaReport;
