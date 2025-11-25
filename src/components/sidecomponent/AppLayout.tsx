import React, { useState } from 'react';
import Headers from '../dashboard/Header';
import Sidebar from '../dashboard/Sidebar';
import MobileSidebar from '../dashboard/MobileSidebar';
import { Outlet } from 'react-router-dom';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      <MobileSidebar isOpen={mobileSidebarOpen} setIsOpen={setMobileSidebarOpen} />

      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-64'}`}>
        <div className="h-screen sticky top-0">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="sticky top-0 z-40 bg-white shadow">
          <Headers
            toggleSidebar={toggleSidebar}
            onOpenLayoutEditor={() => setLayoutModalOpen(true)}
            setMobileSidebarOpen={setMobileSidebarOpen}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
