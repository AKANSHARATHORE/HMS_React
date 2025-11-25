import { useEffect, useState } from 'react';
import { X, Gauge, User, Upload, Bell, Users, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import Swal from 'sweetalert2';
import { API_BASE_URL } from "@/config/api";
import exp from 'constants';
const RoleModal=({
  isOpen,
  onClose,
  roleNames
})=>{ 

  const [menu, setMenu] = useState([]);
  const[assignedMenus, setAssignedMenus] = useState([]);
  const [error, setError] = useState(null);


  useEffect(()=>{
  
          const fetchData=async()=>{
              try{
                
                  const url1 = `${API_BASE_URL}/getAllMenuDetails`;
                  const url2= `${API_BASE_URL}/getMenuDetailsByRole?empRole=${roleNames}`;

                  const AllMenuResponse = await fetch(url1);
                  const AssignedMenuResponse = await fetch(url2);

                  const AllMenuResult = await AllMenuResponse.json();
                  const AssignedMenuResult = await AssignedMenuResponse.json();

                  const AllMenuData = AllMenuResult.payload || [];
                  const AssignedMenuData = AssignedMenuResult.payload || [];

                 
                  setMenu(AllMenuData);
                  setAssignedMenus(AssignedMenuData);

                  
              } catch (err) {
              console.error("Error fetching data", err);
              setError("Failed to fetch branch data");
              }
              
          }
          fetchData();
  
      },[roleNames,isOpen]);

      const isAssigned = (menuId) => {
      return assignedMenus.some((m) => m.id === menuId);
      };

   const confirmAction = async (actionType, callback) => {
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
      });
  
      if (result.isConfirmed) {
        callback();
      }
    };

 const assignMenu = async (menuId) => {
     try {
       const result = await fetch(`${API_BASE_URL}/assignMenuDetailsToRole`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         body: new URLSearchParams({ roleNames, menuId }),
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
         body: new URLSearchParams({ roleNames, menuId }),
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





  const handleAction = (id, action) => {
    console.log(`${action} action for menu item ${id}`);
  };

  return (
    <>

     <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
    <DialogHeader
      className=" bg-gradient-to-r from-gray-800 to-blue-800 text-white sticky top-0 m-0 w-full"
    >
      
      <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>

      <div className="flex flex-col items-center py-2">
        <DialogTitle className="text-2xl font-bold text-white">DI-HMS</DialogTitle>
        <h2 className="text-xl font-semibold text-white py-2 rounded">
          Menu Master for {roleNames}
        </h2>
      </div>
    </DialogHeader>

    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="max-w-7xl mx-auto">

                          {/* Table */}
                          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                              <div className="overflow-x-auto">
                                  <table className="w-full">
                                      <thead>
                                          <tr className="bg-gradient-to-r from-gray-800 to-blue-800 text-white">
                                              <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                                                  Menu Id
                                              </th>
                                              <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                                                  Menu Name
                                              </th>
                                              <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                                                  Menu Handler Name
                                              </th>
                                              <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                                                  Menu Icon
                                              </th>
                                              <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                                                  Action
                                              </th>
                                          </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                          {menu.map((item, index) => (
                                              <tr
                                                  key={item.id}
                                                  className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-150`}
                                              >
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                      {item.id}
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                      {item.menuName}
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                                                      {item.menuHandlerName}
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                      <div className="flex items-center gap-3">
                                                          <div className="text-blue-600">
                                                              {item.iconComponent}
                                                          </div>
                                                          <span className="font-mono text-xs text-gray-500">
                                                              {item.menuIcon}
                                                          </span>
                                                      </div>
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm">

                                                    {isAssigned(item.id) ? (
                                                      <button className="bg-red-600 text-white px-3 py-1 rounded"
                                                     onClick={() =>
                                                     confirmAction('Revoke', () => revokeMenu(item.id))}>
                                                      Revoke
                                                      </button>
                                                      ) : (
                                                      <button
                                                      className="bg-blue-600 text-white px-3 py-1 rounded"
                                                      onClick={() =>confirmAction('Assign', () => assignMenu(item.id))}>
                                                      Assign
                                                      </button>
                                                      )}
                                                      {/* {item.status === 'REVOKE' ? (
                                                          <button
                                                              onClick={() => handleAction(item.id, 'REVOKE')}
                                                              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                          >
                                                              REVOKE
                                                          </button>
                                                      ) : (
                                                          <button
                                                              onClick={() => handleAction(item.id, 'ASSIGN')}
                                                              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                          >
                                                              ASSIGN
                                                          </button>
                                                      )} */}
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>

                          {/* Footer Info */}
                          <div className="mt-6 text-center text-sm text-gray-600">
                              <p>Total Menu Items: {menu.length}</p>
                          </div>
                      </div>
                  </div>
 

   
  </DialogContent>
</Dialog>

    
    
    
    
    </>
  );
   
    
}

export default RoleModal;