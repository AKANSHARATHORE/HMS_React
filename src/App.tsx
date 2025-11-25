import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/sidecomponent/AppLayout";
import Dashboard from "./components/sidecomponent/Dashboard";

import Login from "./pages/Login";
import UserMaster from "./components/sidecomponent/UserMaster";
import BranchMaster from "./components/sidecomponent/BranchMaster";
import RoleMaster from "./components/sidecomponent/RoleMaster";
import { DeviceList } from "./components/sidecomponent/DeviceMaster";
import SiaDeviceModal from "./components/dashboard/SiaDeviceModal";
import DeviceModal from "./components/sidecomponent/deviceModal";
import { ZoneDetailsModal } from "./components/sidecomponent/ZoneModal";
import ZoneDetail from "./components/sidecomponent/ZoneDetail";
import GroupMaster from "./components/sidecomponent/GroupMaster";
import AlertsDashboard from "./components/sidecomponent/AllReport3";
import AlertReports from "./components/sidecomponent/sidebarAlert";
import EmailLogs from "./components/sidecomponent/EmailLog";
import SMSLogs from "./components/sidecomponent/SmsLog";
import EmailSchedular from "./components/sidecomponent/EmailScheduler";
import SocialMediaReport from "./components/sidecomponent/SocialMediaReport";
import HelpCenter from "./components/sidecomponent/HelpCenter";
import BranchReport from "./components/sidecomponent/BranchReport";
import UptimeReport from "./components/sidecomponent/UpTime";
import ManualSync from "./components/sidecomponent/ManualSync";
import SystemIntegratorInfo from "./pages/SystemIntegratorInfo";
import QualityCheckDetails from "./components/DeviceCheck/QualityCheckDetails";
import QualityCheckTable from "./components/DeviceCheck/QualityCheckTable";
import MakeAndModel from "./components/systemintegratorcomponent/MakeAndModel";
import WhatsAppLogs from "./components/sidecomponent/WhatsAppLog";
import CallLog from "./components/sidecomponent/CallLog";
import AllReports from "./components/sidecomponent/AllReports";
import GlobalChatBotWrapper from "./components/sidecomponent/GlobalChatBotWrapper";
import UpTimeReportForCMS from "./components/sidecomponent/UpTimeReportForCMS";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalChatBotWrapper />
      <Routes>
          <Route path="/" element={<Login />} />
        <Route path="/makeandmodel" element={<MakeAndModel />} />
        <Route path="/systemIntegrator" element={<SystemIntegratorInfo />} />
        <Route path="/qualitycheckdetails" element={<QualityCheckDetails />} />
        <Route path="/qualitychecktable" element={<QualityCheckTable />} />

        <Route path="dashboard" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="employeeMasterScreen" element={<UserMaster />} />
          <Route path="branchMaster" element={<BranchMaster />} />
          <Route path="menuAccessScreen" element={<RoleMaster />} />
          <Route path="deviceMaster" element={<DeviceList />} />
          <Route path="groupMasterScreen" element={<GroupMaster />} />
          <Route path="inputStatusDetails" element={<AlertsDashboard />} />
          <Route path="AllAlertsReport" element={<AlertReports />} />
          <Route path="emailLog" element={<EmailLogs />} />
          <Route path="smsLog" element={<SMSLogs />} />
          <Route path="EmailScheduler" element={<EmailSchedular />} />
          <Route path="SocialMediaReport" element={<SocialMediaReport />} />
          <Route path="helpCenter" element={<HelpCenter />} />
          <Route path="manualSync" element={<ManualSync />} />
          <Route path="upTimeReport" element={<UptimeReport />} />
          <Route path="SystemWiseBranchReport" element={<BranchReport />} />
          <Route path="WhatsAppLog" element={<WhatsAppLogs />} />
          <Route path="CallLog" element={<CallLog />} />
          <Route path="AllReports" element={<AllReports />} />
          <Route path ="UpTimeReportForCMS" element={<UpTimeReportForCMS/>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
