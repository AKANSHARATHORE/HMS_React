// import React, { useState, useEffect } from 'react';
// import Sidebar from '@/components/dashboard/Sidebar';
// import MobileSidebar from '@/components/dashboard/MobileSidebar';
// import Header from '@/components/dashboard/Header';
// import StatusCard from '@/components/dashboard/StatusCard';
// import MapSection from '@/components/dashboard/MapSection';
// import DeviceStatus from '@/components/dashboard/DeviceStatus';
// import BranchTable from '@/components/dashboard/BranchTable';
// import RecentActivities from '@/components/dashboard/RecentActivities';
// import AlertReports from '@/components/dashboard/AlertReports';
// import SiaDeviceModal from '@/components/dashboard/SiaDeviceModal';
// import Footer from '@/components/dashboard/Footer';
// import LayoutEditorModal from '@/components/dashboard/LayoutEditorModal';
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import { BarChart2, Building2, CheckCircle, AlertTriangle } from 'lucide-react';
// import 'bootstrap/dist/css/bootstrap.min.css';

// const COMPONENTS: { [key: string]: JSX.Element } = {
//   MapSection: <MapSection />,
//   DeviceStatus: <DeviceStatus />,
//   BranchTable: <BranchTable />,
//   RecentActivities: <RecentActivities />,
//   AlertReports: <AlertReports />,
// };

// interface LayoutItem {
//   id: string;
//   width: string;
// }

// const Index = () => {
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
//   const [layoutModalOpen, setLayoutModalOpen] = useState(false);
//   const [layout, setLayout] = useState<LayoutItem[]>([
//     { id: 'MapSection', width: 'col-md-12' },
//     { id: 'DeviceStatus', width: 'col-md-12' },
//     { id: 'BranchTable', width: 'col-md-12' },
//     { id: 'RecentActivities', width: 'col-md-12' },
//     { id: 'AlertReports', width: 'col-md-12' },
//   ]);

//   const [workingCount, setWorkingCount] = useState<number | null>(null);
//   const [notWorkingCount, setNotWorkingCount] = useState<number | null>(null);
//   const [totalSites, setTotalSites] = useState<number | null>(null);
//   const [siaDeviceCount, setSiaDeviceCount] = useState<number | null>(null);
//   const [isSiaModalOpen, setIsSiaModalOpen] = useState(false);

//   const branchCode = localStorage.getItem('branch');

//   const toggleSidebar = () => {
//     setSidebarCollapsed(!sidebarCollapsed);
//   };

//   useEffect(() => {
//     const fetchDeviceStatus = async () => {
//       try {
//         const statusRes = await fetch(`http://localhost:9090/getCountOfWorkingDevices?branchCode=${branchCode}`);
//         const statusData = await statusRes.json();
//         setWorkingCount(statusData.payload.workingDeviceCount);
//         setNotWorkingCount(statusData.payload.notWorkingCount);
//       } catch (error) {
//         console.error('Error fetching working status:', error);
//       }

//       try {
//         const sitesRes = await fetch(`http://localhost:9090/getDeviceMaster?branchCode=${branchCode}`);
//         const sitesData = await sitesRes.json();
//         if (Array.isArray(sitesData.payload)) {
//           setTotalSites(sitesData.payload[0]);
//         }
//       } catch (error) {
//         console.error('Error fetching total sites:', error);
//       }

//       try {
//         const siaRes = await fetch(`http://localhost:9090/getDeviceCountOfSiaByBranchCode?branchCode=${branchCode}`);
//         const siaData = await siaRes.json();
//         setSiaDeviceCount(siaData.payload.siaDeviceCount);
//       } catch (error) {
//         console.error('Error fetching SIA device count:', error);
//       }
//     };

//     fetchDeviceStatus();
//   }, []);

//   return (
//     <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
//       <MobileSidebar isOpen={mobileSidebarOpen} setIsOpen={setMobileSidebarOpen} />
//       <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-64'}`}>
//         <div className="h-screen sticky top-0">
//           <Sidebar collapsed={sidebarCollapsed} />
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col min-h-screen">
//         <Header toggleSidebar={toggleSidebar} onOpenLayoutEditor={() => setLayoutModalOpen(true)} />

//         <div className="flex-1 p-2 md:p-4 overflow-y-auto">
//           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
//             <StatusCard title="Total Sites" value={totalSites !== null ? totalSites.toString() : 'Loading...'} color="#028bd7" icon={<Building2 size={24} />} />
//             <StatusCard title="Working" value={workingCount !== null && totalSites !== null ? `${workingCount}/${totalSites}` : 'Loading...'} color="#4caf50" icon={<CheckCircle size={24} />} />
//             <StatusCard title="Not Working" value={notWorkingCount !== null && totalSites !== null ? `${notWorkingCount}/${totalSites}` : 'Loading...'} color="#f44336" icon={<AlertTriangle size={24} />} />
//             <StatusCard title="Total SIA Devices" value={siaDeviceCount !== null ? siaDeviceCount.toString() : 'Loading...'} color="#9e9e9e" icon={<BarChart2 size={24} />} onClick={() => setIsSiaModalOpen(true)} />
//           </div>

//           <SiaDeviceModal isOpen={isSiaModalOpen} onClose={() => setIsSiaModalOpen(false)} />

//           <div className="row">
//             {layout.map(({ id, width }) => (
//               <div className={`mb-4 ${width}`} key={id}>
//                 {COMPONENTS[id]}
//               </div>
//             ))}
//           </div>
//         </div>

//         <Footer />
//       </div>

//       <LayoutEditorModal
//         isOpen={layoutModalOpen}
//         onClose={() => setLayoutModalOpen(false)}
//         layout={layout}
//         onSave={setLayout}
//       />
//     </div>
//   );
// };

// export default Index;
