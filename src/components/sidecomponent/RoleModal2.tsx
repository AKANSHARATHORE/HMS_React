import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import Swal from 'sweetalert2';
import { API_BASE_URL } from "@/config/api";
import './sweetalert.css';
const RoleModal = ({ isOpen, onClose, roleNames }) => {
  const [menu, setMenu] = useState([]);
  const [assignedMenus, setAssignedMenus] = useState([]);
  const [error, setError] = useState(null);
  const [reopenAfterAlert, setReopenAfterAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url1 = `${API_BASE_URL}/getAllMenuDetails`;
        const url2 = `${API_BASE_URL}/getMenuDetailsByRole?empRole=${roleNames}`;

        const AllMenuResponse = await fetch(url1);
        const AssignedMenuResponse = await fetch(url2);

        const AllMenuResult = await AllMenuResponse.json();
        const AssignedMenuResult = await AssignedMenuResponse.json();

        setMenu(AllMenuResult.payload || []);
        setAssignedMenus(AssignedMenuResult.payload || []);
      } catch (err) {
        console.error("Error fetching data", err);
        setError("Failed to fetch branch data");
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [roleNames, isOpen]);

  const isAssigned = (menuId) => {
    return assignedMenus.some((m) => m.id === menuId);
  };

  const confirmAction = async (actionType, callback) => {
    onClose(); // close dialog temporarily
    setReopenAfterAlert(true);

    setTimeout(async () => {
      const result = await Swal.fire({
        title: `Confirm ${actionType}`,
        text: `Do you really want to ${actionType.toLowerCase()} this menu?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${actionType.toLowerCase()} it!`,
        backdrop: true,
        allowOutsideClick: true,
        focusConfirm: false,
        heightAuto: false,
        didOpen: () => {
          (document.querySelector('.swal2-confirm') as HTMLElement | null)?.focus();
        }
      });

      if (result.isConfirmed) {
        await callback();
      }

      // Reopen modal after alert
      setTimeout(() => {
        setReopenAfterAlert(false);
      }, 100);
    }, 100);
  };

  useEffect(() => {
    // reopen dialog if it was closed for alert
    if (reopenAfterAlert) {
      const timer = setTimeout(() => {
        setReopenAfterAlert(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reopenAfterAlert]);

  const assignMenu = async (menuId) => {

    // alert(roleNames)
    try {
      const result = await fetch(`${API_BASE_URL}/assignMenuDetailsToRole`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ empRole: roleNames, menuId }),
      });

      if (result.ok) {
        setAssignedMenus((prev) => [...prev, { id: menuId }]);
      } else {
        throw new Error('Failed to assign');
      }
    } catch (error) {
      console.error('Error assigning menu:', error);
      Swal.fire('Error', 'An error occurred while assigning the menu.', 'error');
    }
  };

  const revokeMenu = async (menuId) => {
    try {
      const result = await fetch(`${API_BASE_URL}/revokeMenuDetailsFromTheRole`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ empRole: roleNames, menuId }),
      });

      if (result.ok) {
        setAssignedMenus((prev) => prev.filter((m) => m.id !== menuId));
      } else {
        throw new Error('Failed to revoke');
      }
    } catch (error) {
      console.error('Error revoking menu:', error);
      Swal.fire('Error', 'An error occurred while revoking the menu.', 'error');
    }
  };

  return (
    <>
      <Dialog open={isOpen && !reopenAfterAlert} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="overflow-hidden z-10 bg-gradient-to-r from-gray-800 to-blue-800 text-white sticky top-0 m-0 w-full">
           
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>

            <div className="flex flex-col items-center py-2">
              <DialogTitle className="text-2xl font-bold text-white">DI-HMS</DialogTitle>
              <h2 className="text-xl font-semibold text-white py-2 rounded">
                Menu Master for {roleNames}
              </h2>
            </div>
            <DialogClose className="absolute top-4 right-4 text-white hover:text-gray-400">
            <X className="h-5 w-5" />
           </DialogClose>
          </DialogHeader>

          <div className=" bg-gradient-to-br from-blue-50 to-blue-100 ">
            <div className="max-w-5xl mx-auto ">
              <div className="bg-white rounded-lg shadow-lg  ">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-b-lg ">
                  <table className="w-full">
                    <thead >
                      <tr className="sticky top-0 z-10 bg-gradient-to-r from-gray-800 to-blue-800 text-white">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Menu Id</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Menu Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Handler</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Icon</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {menu.map((item, index) => (
                        <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                          <td className="px-6 py-4 text-sm">{item.id}</td>
                          <td className="px-6 py-4 text-sm">{item.menuName}</td>
                          <td className="px-6 py-4 text-sm font-mono">{item.menuHandlerName}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2 text-blue-600">
                              {item.iconComponent}
                              <span className="text-xs text-gray-500">{item.menuIcon}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {isAssigned(item.id) ? (
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded"
                                onClick={() => confirmAction('Revoke', () => revokeMenu(item.id))}
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                                onClick={() => confirmAction('Assign', () => assignMenu(item.id))}
                              >
                                Assign
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="m-4 text-center text-sm text-gray-600">
                <p>Total Menu Items: {menu.length}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoleModal;
