import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { set } from "date-fns";
import RoleModal from "./RoleModal2";
import Alert from "../dashboard/DashboardAlert";
import { API_BASE_URL } from "@/config/api";


type Role = {
    id?: string;
    code:string
    roleName?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
};
function RoleMaster() {

    
    const [RoleMaster, setRoleMaster] = useState<Role[]>([]);
    const [roleNames, setRoleNames] = useState<string[]>([]);
     const [error, setError] = useState(null);


    
    

   useEffect(() => {
    const getRole = async () => {
        const url = `${API_BASE_URL}/getAllRoles`;
        const response = await fetch(url);
        const result = await response.json();
        if (result.statusCode === 200) {
            const data = result.payload;
            const rolesList: Role[] = data.map((role: any) => ({
                code: role.code,
                roleName: role.serial,
                description: role.descp1,
            }));

            
            const roleNames: string[] = data.map((role: any) => role.serial);
            setRoleNames(roleNames);
            setRoleMaster(rolesList); 
        }
    };
    getRole();
   }, []);


  

   const[isModalOpen, setIsModalOpen] = useState(false);
   const[roleCode, setRoleCode] = useState("");

   const handleClick = (roleCode: string) => {
    setIsModalOpen(true);
    setRoleCode(roleCode);
  };



    return(
        <>
             <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 mt-2 font-sans text-sm font-medium
             space-x-3" style={{marginRight: "30px" }}>
                <div className="text-2xl font-bold text-gray-800 border-l-4 border-gray-800 ml-3 pl-4 py-2 md:w-auto w-full ">ROLE MASTER
                </div>

             </div>

             <div className="overflow-x-auto bg-white shadow mt-6"
                style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    maxHeight: '65vh',
                    overflowY: 'auto',
                    margin: "10px"
                }}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200" style={{ position: "sticky", top: "0",fontSize:"13px" }}>
                        <tr>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-right">S.No</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-left">ROLE</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 fw-bold text-center">VIEW ACCESS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                        RoleMaster.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                                    No Data Available.
                                </td>
                            </tr>
                        ) :(
                        RoleMaster.map((role, index) => (
                           <tr key={role.id || index} className={`my-2 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>               
                                <td className=" px-3 py-2  text-sm text-gray-900 text-right w-1/12">
                                  { index + 1}
                                </td>
                                <td className="px-3 py-2  text-sm text-gray-900 text-left">
                                  {role.roleName.toLocaleUpperCase()}
                                </td>
                                <td className="px-3 py-2 text-sm text-center">
                                <button className="bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-md mt-2 mb-2 px-3 py-2 text-sm shadow-sm transition duration-200 ease-in-out"  onClick={()=>handleClick(role.roleName)} style={{fontSize:"12px"}}>
                                View</button>
                                </td>
                            </tr>
                            
                            
                        )))}
                        
                     
                                
                    </tbody>
                </table>
            </div>
            <Alert/>

            {
                isModalOpen &&(
                    <RoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} roleNames={roleCode} />
                )
            }

            

           
                    
        </>
    )

}
export default RoleMaster;