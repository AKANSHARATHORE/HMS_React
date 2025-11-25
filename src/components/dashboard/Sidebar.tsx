import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from "@/config/api";

interface MenuItem {
  id: number;
  parentId: number;
  childId: number;
  menuName: string;
  menuHandlerName: string;
  menuIcon: string;
}

const Sidebar: React.FC<{ collapsed: boolean; onLinkClick?: () => void }> = ({ collapsed, onLinkClick }) => {
  const [menus, setMenus] = useState<MenuItem[]>(() => {
    const cached = sessionStorage.getItem('sidebarMenus');
    return cached ? JSON.parse(cached) : [];
  });
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>(() => {
    // Try to load from sessionStorage
    const saved = sessionStorage.getItem('sidebarOpenMenus');
    return saved ? JSON.parse(saved) : {};
  });
  const role = sessionStorage.getItem('employeeRole');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (menus.length === 0) {
      const url= `${API_BASE_URL}/getMenuDetailsByRole?empRole=` + role
      axios
        .get(url)
        .then((res) => {
          setMenus(res.data.payload || []);
          sessionStorage.setItem('sidebarMenus', JSON.stringify(res.data.payload || []));
        })
        .catch((err) => {
          console.error('Error fetching menus:', err);
        });
    }
  }, []);

  // Save openMenus to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('sidebarOpenMenus', JSON.stringify(openMenus));
  }, [openMenus]);

  const parentMenus = menus.filter(menu => menu.parentId === 0 && menu.childId !== 0);
  const getChildren = (childId: number) => menus.filter(menu => menu.parentId === childId);

  const toggleMenu = (id: number) => {
    setOpenMenus(prev => (prev[id] ? {} : { [id]: true }));
  };

  const menuItemClass = "flex items-center gap-2 p-3 text-sm cursor-pointer transition-colors hoverBgCustom text-white";

  // Helper to handle menu click and reload if already on the same route
  const handleMenuClick = (path: string) => (e: React.MouseEvent) => {
    if (location.pathname === path) {
      e.preventDefault();
      window.location.reload();
    }
    if (onLinkClick) onLinkClick();
  };

  return (
    <div className={`sideBarBg border-r border-gray-200 h-full overflow-hidden ${collapsed ? 'w-0' : 'w-64'} transition-all duration-300`}>
      <Link to="/dashboard" onClick={handleMenuClick('/dashboard')}>
        <div className="p-1 logoBg text-white flex flex-col items-center justify-center gap-2">
          <img src="/hmsLogo.png" alt="HMS" width={85} height={85} />
        </div>
      </Link>

      <div className="p-2 h-full overflow-y-auto text-white">
        {parentMenus.map(parent => {
          const children = getChildren(parent.childId);
          const isOpen = openMenus[parent.id];
          const parentPath = "/dashboard" + parent.menuHandlerName;

          return (
            <div key={parent.id}>
              <div onClick={() => toggleMenu(parent.id)} className={cn(menuItemClass, isOpen && "logoBg")}>
                <i className={cn("w-6 sideBarIcon", parent.menuIcon)}></i>
                <span className="flex-grow sideBarMenu">{parent.menuName}</span>
                {children.length > 0 && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </div>

              {children.length > 0 && (
                <div className={cn("pl-4 overflow-hidden transition-all duration-300 ease-in-out sideBarMenu", isOpen ? "max-h-96 py-2" : "max-h-0")}>
                  {children.map(child => {
                    const childPath = "/dashboard" + child.menuHandlerName;

                    return (
                      <Link to={childPath} onClick={handleMenuClick(childPath)} key={child.id}>
                        <div className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:transition-colors group">
                          <i className={cn("w-5 transform transition-transform duration-300 group-hover:translate-x-1", child.menuIcon)}></i>
                          <span className="transition-colors duration-300 group-hover:text-custom">{child.menuName}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {menus.filter(menu => menu.parentId === 0 && menu.childId === 0).map(item => {
          const itemPath = "/dashboard" + item.menuHandlerName;

          return (
            <div key={item.id}>
              <Link to={itemPath} onClick={handleMenuClick(itemPath)}>
                <div className={menuItemClass}>
                  <i className={cn("w-6 sideBarIcon", item.menuIcon)}></i>
                  <span className="flex-grow sideBarMenu">{item.menuName}</span>
                </div>
              </Link>
            </div>
          );
        })}
       
      </div>
    </div>
  );
};

export default Sidebar;
