import { API_BASE_URL } from "@/config/api";
import {
  ArrowLeft,
  ArrowRight,
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  ShieldCheck,
  CreditCard,
  Menu,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface HeaderProps {
  toggleSidebar: () => void;
  onOpenLayoutEditor: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
}



export default function Header({ toggleSidebar, onOpenLayoutEditor, setMobileSidebarOpen }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userObj, setUserObj] = useState<Record<string, any>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [branchLogo, setBranchLogo] = useState<string | null>(null);


useEffect(() => {
  const data = sessionStorage.getItem("user");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      setUserObj(parsed);
    } catch {
      console.error("Invalid user data");
    }
  }

  const handleOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowDropdown(false);
    }
  };
  document.addEventListener("mousedown", handleOutside);
  return () => document.removeEventListener("mousedown", handleOutside);
}, []);


useEffect(() => {
  if (userObj.branch) {
    fetch(`${API_BASE_URL}/logos/logo/${userObj.branch}`, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    })
      .then(res => res.json())
      .then(data => {
        const base64Image = `data:image/png;base64,${data.imageBase64}`;
        setBranchLogo(base64Image);
        // alert(data.imageBase64);
      })
      .catch(err => {
        console.error("Failed to fetch branch logo:", err);
      });
  }
}, [userObj.branch]);


  const handleToggle = () => {
    setIsSidebarOpen(p => !p);
    toggleSidebar();
  };

  const handleLogout = () => {
      sessionStorage.clear();
  window.location.href = "/";
  };

  const fieldConfig: Record<string, { icon: any; label: string; color?: string }> = {
    empName: { icon: User, label: "Name", color: "text-blue-600" },
    empRole: { icon: ShieldCheck, label: "Role", color: "text-blue-600" },
    email: { icon: Mail, label: "Email", color: "text-purple-600" },
    mobile: { icon: Phone, label: "Mobile", color: "text-green-600" },
    city: { icon: MapPin, label: "City", color: "text-yellow-600" },
    //status: { icon: ShieldCheck, label: "Status", color: userObj.status === "Active" ? "text-green-700" : "text-red-600" },
  };

  return (
    <div className="flex justify-between items-center bg-white p-3 border-b shadow relative">
      {/* Mobile Menu Button (only on small screens) */}
      <button
        className="lg:hidden text-gray-600 mr-2"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu size={22} />
      </button>


      {/* Desktop Sidebar Toggle */}
      <button
        className="hidden lg:block text-gray-600 transition-transform duration-300"
        onClick={handleToggle}
      >
        {isSidebarOpen ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
      </button>

      <div className="flex items-center gap-4">
        
          
            {branchLogo && (
  <img
    src={branchLogo}
    alt="Logo"
    className="h-25 w-20 mr-5 rounded-md object-contain"
  />
)}

            <div className="relative" ref={dropdownRef}>
            <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {userObj.empName?.charAt(0) || "?"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-gray-800">{userObj.empName || "User"}</div>
              <div className="text-xs text-gray-500">{userObj.empRole ? userObj.empRole.toUpperCase() : "ROLE"}</div>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 animate-fade-in-up max-h-[4000px] overflow-y-auto">
              {/* Header part */}
              <div className="px-4 py-3 border-b">
                <div className="text-xs font-semibold text-gray-800">{userObj.empName}</div>
                <div className="text-xs text-gray-500">{userObj.email}</div>
              </div>

              {/* Detailed info */}
              <div className="px-4 py-3 space-y-1">
                {Object.entries(userObj).filter(([k]) => fieldConfig[k]).map(([key, value]) => {
                  const cfg = fieldConfig[key];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={cfg.color || "text-gray-500"} />
                        <span className="text-xs text-gray-600">{cfg.label.toUpperCase()}</span>
                      </div>
                      <span className={`text-xs font-medium "text-gray-800"} truncate max-w-[140px]`}>
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Controls */}
              <ul className="py-2 border-t">
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} className="mr-2" /> Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
