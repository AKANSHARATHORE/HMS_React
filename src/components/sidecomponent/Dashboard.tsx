import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileSidebar from '@/components/dashboard/MobileSidebar';
import Header from '@/components/dashboard/Header';
import StatusCard from '@/components/dashboard/StatusCard';
import { SIAStatusCard } from '@/components/dashboard/StatusCard';
import MapSection from '@/components/dashboard/MapSection';
import DeviceStatus from '@/components/dashboard/DeviceStatus';
import BranchTable from '@/components/dashboard/BranchTable';
import RecentActivities from '@/components/dashboard/RecentActivities';
import AlertReports from '@/components/dashboard/AlertReports';
import SiaDeviceModal from '@/components/dashboard/SiaDeviceModal';
import Footer from '@/components/dashboard/Footer';
import LayoutEditorModal from '@/components/dashboard/LayoutEditorModal';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BarChart2, Building2, CheckCircle, AlertTriangle } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DashboardFilters from '../dashboard/DashboardFilters';
import ChatBot from '../dashboard/ChatBot';
//import { DashboardRefreshProvider } from '@/components/dashboard/DashboardRefreshContext';
import { API_BASE_URL } from "@/config/api";

const COMPONENTS: { [key: string]: JSX.Element } = {
  MapSection: <MapSection />,
  DeviceStatus: <DeviceStatus />,
  BranchTable: <BranchTable />,
  RecentActivities: <RecentActivities />,
  AlertReports: <AlertReports />,
};

interface LayoutItem {
  id: string;
  width: string;
}

const Dashboard = () => {
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>([
    { id: 'MapSection', width: 'col-md-12' },
    { id: 'DeviceStatus', width: 'col-md-12' },
    { id: 'BranchTable', width: 'col-md-12' },
    { id: 'RecentActivities', width: 'col-md-12' },
    { id: 'AlertReports', width: 'col-md-12' },
  ]);

  const [workingCount, setWorkingCount] = useState<number | null>(null);
  const [notWorkingCount, setNotWorkingCount] = useState<number | null>(null);
  const [totalSites, setTotalSites] = useState<number | null>(null);
  const [siaDeviceCount, setSiaDeviceCount] = useState<number | null>(null);
  const [isSiaModalOpen, setIsSiaModalOpen] = useState(false);

  // New state variables for SIA device counts
  const [siaWorkingCount, setSiaWorkingCount] = useState<number | null>(null);
  const [siaNotWorkingCount, setSiaNotWorkingCount] = useState<number | null>(null);
  const [siaTotalCount, setSiaTotalCount] = useState<number | null>(null);
  const [notSyncedCount, setNotSyncedCount] = useState<number | null>(null);

  const fetchDeviceStatus = async () => {
    // Get fresh branchCode value from sessionStorage
    const branchCode = sessionStorage.getItem('branch');
    
    if (!branchCode) {
      console.log('No branch code found in sessionStorage');
      return;
    }

    try {
      const statusRes = await fetch(`${API_BASE_URL}/getCountOfWorkingDevices?branchCode=${branchCode}`);
      const statusData = await statusRes.json();
      setWorkingCount(statusData.payload.workingDeviceCount);
      setNotWorkingCount(statusData.payload.notWorkingCount);
    } catch (error) {
      console.error('Error fetching working status:', error);
      setWorkingCount(0);
      setNotWorkingCount(0);
    }

    try {
      const sitesRes = await fetch(`${API_BASE_URL}/getDeviceMaster?branchCode=${branchCode}`);
      const sitesData = await sitesRes.json();
      if (Array.isArray(sitesData.payload)) {
        setTotalSites(sitesData.payload[0]);
      } else {
        setTotalSites(0);
      }
    } catch (error) {
      console.error('Error fetching total sites:', error);
      setTotalSites(0);
    }

    try {
      const siaRes = await fetch(`${API_BASE_URL}/getDeviceCountOfSiaByBranchCode?branchCode=${branchCode}`);
      const siaData = await siaRes.json();
      setSiaDeviceCount(siaData.payload.totalSiaDeviceCount ?? 0);
    } catch (error) {
      console.error('Error fetching SIA device count:', error);
      setSiaDeviceCount(0);
    }

    // Fetch SIA device status counts
    try {
      const branchCode = sessionStorage.getItem('branch');
      if (branchCode) {
        const siaStatusRes = await fetch(`${API_BASE_URL}/getSiaDeviceStatusCount?branchCode=${branchCode}`);
        const siaStatusData = await siaStatusRes.json();
        setSiaWorkingCount(siaStatusData.payload.workingSiaDeviceCount ?? 0);
        setSiaNotWorkingCount(siaStatusData.payload.notWorkingSiaDeviceCount ?? 0);
        setSiaTotalCount(siaStatusData.payload.totalSiaDeviceCount ?? 0);
      }
    } catch (error) {
      setSiaWorkingCount(0);
      setSiaNotWorkingCount(0);
      setSiaTotalCount(0);
    }

    // Fetch not synced device count
    try {
      const branchCode = sessionStorage.getItem('branch');
      if (branchCode) {
        const notSyncedRes = await fetch(`${API_BASE_URL}/getCountOfNotSyncedDevices?branchCode=${branchCode}`);
        const notSyncedData = await notSyncedRes.json();
        setNotSyncedCount(notSyncedData.payload.notSyncedDeviceCount ?? 0);
      }
    } catch (error) {
      setNotSyncedCount(0);
    }
  };

  useEffect(() => {
    fetchDeviceStatus();
  }, []); 

  return (
    //<DashboardRefreshProvider>
      <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-2 md:p-4 overflow-y-auto">
            <DashboardFilters/>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            
              <StatusCard
                title="Total Sites"
                value={
                  typeof totalSites === 'number'
                    ? totalSites.toString()
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#028bd7"
                icon={<Building2 size={24} />}
              />
              <StatusCard
                title="Healthy Sites"
                value={
                  typeof workingCount === 'number' && typeof totalSites === 'number'
                    ? `${workingCount}/${totalSites}`
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#4caf50"
                icon={<CheckCircle size={24} />}
              />
              <StatusCard
                title="Partially Working"
                value={
                  typeof notWorkingCount === 'number' && typeof totalSites === 'number'
                    ? `${notWorkingCount}/${totalSites}`
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#FFD95F"
                icon={<AlertTriangle size={24} />}
              />

              <StatusCard
                title="Not Synced ( >12 hours)"
                value={
                  typeof notSyncedCount === 'number' && typeof totalSites === 'number'
                    ? `${notSyncedCount}/${totalSites}`
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#f44336"
                icon={<AlertTriangle size={24} />}
              />

              <SIAStatusCard 
                title="Total SIA Devices"
                value={
                  typeof siaTotalCount === 'number'
                    ? siaTotalCount.toString()
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25 " cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#9e9e9e"
                icon={<BarChart2 size={24} />}
                onClick={() => setIsSiaModalOpen(true)}
              />
              <StatusCard
                title="Healthy SIA Devices"
                value={
                  typeof siaWorkingCount === 'number' && typeof siaTotalCount === 'number'
                    ? `${siaWorkingCount}/${siaTotalCount}`
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#4caf50"
                icon={<CheckCircle size={24} />}
              />
              <StatusCard
                title="Partially Working"
                value={
                  typeof siaNotWorkingCount === 'number' && typeof siaTotalCount === 'number'
                    ? `${siaNotWorkingCount}/${siaTotalCount}`
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#FFD95F"
                icon={<AlertTriangle size={24} />}
              />

              <StatusCard
                title="Not Synced ( >12 hours)"
                value={
                  typeof siaNotWorkingCount === 'number' && typeof siaTotalCount === 'number'
                    ? `${siaNotWorkingCount}/${siaTotalCount}`
                    : (
                      <svg className="animate-spin h-5 w-5 text-blue-500 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )
                }
                color="#f44336"
                icon={<AlertTriangle size={24} />}
              />
            </div>

            <SiaDeviceModal isOpen={isSiaModalOpen} onClose={() => setIsSiaModalOpen(false)} />

            <div className="row">
              {layout.map(({ id, width }) => (
                <div className={`mb-4 ${width}`} key={id}>
                  {COMPONENTS[id]}
                </div>
              ))}
            </div>
            <ChatBot/> 
          </div>

          <Footer />
        </div>

        <LayoutEditorModal
          isOpen={layoutModalOpen}
          onClose={() => setLayoutModalOpen(false)}
          layout={layout}
          onSave={setLayout}
        />
      </div>
    //</DashboardRefreshProvider>
  );
};

export default Dashboard;