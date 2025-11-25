import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { set } from "date-fns";
import RoleModal from "./RoleModal2";
import GroupDetailsModal from "./GroupModal";
import { API_BASE_URL } from "@/config/api";


type group = {
    id?: string;
    groupId:string
    groupName?: string;
    groupDescription?: string;
    empId: string;
    empName?: string;
};
function GroupMaster() {

    
    const [GroupMaster, setGroupMaster] = useState<group[]>([]);
    const [roleNames, setRoleNames] = useState<string[]>([]);
     const [error, setError] = useState(null);


    
    

   useEffect(() => {
    const getGroup = async () => {
        const url = `${API_BASE_URL}/getAllGroupMaster`;
        const response = await fetch(url);
        const result = await response.json();
        if (result.statusCode == "OK") {
            const data = result.payload;
            const groupList: group[] = data.map((groups: any) => ({
                groupId: groups.groupId,
                groupName: groups.groupName,
                groupDescription: groups.groupDescription,
                empId: groups.empId,
                empName: groups.empName
            }
        
        ));



            setGroupMaster(groupList); 
        }
    };
    getGroup();
   }, []);


  

   const[isModalOpen, setIsModalOpen] = useState(false);
const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
const [selectedGroup, setSelectedGroup] = useState<{
    groupName: string;
    groupDescription: string;
    dateOfCreation: string;
    selectedEmployee: string;
} | null>(null);
const handleClick = (groupdata: group) => {
    setIsModalOpen(true);
    setSelectedGroupId(groupdata.groupId);
    
};



    return(
        <>
             <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 mt-2 font-sans text-sm font-medium
             space-x-3" style={{marginRight: "30px" }}>
                <div className="text-2xl font-bold text-gray-800 border-l-4 border-gray-800 ml-3 pl-4 py-2 md:w-auto w-full ">GROUP MASTER
                </div>

             </div>

             <div className="overflow-x-hidden bg-white shadow mt-6"
    style={{
        fontFamily: "'Open Sans', sans-serif",
        fontSize: "0.875rem",
        fontWeight: "500",
        maxHeight: '65vh',
        overflowY: 'auto',
        margin: "10px"
    }}>
    <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-200 sticky top-0 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            <tr>
                <th className="px-3 py-2 text-right">S.No</th>
                <th className="px-3 py-2 ">Group ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-center">View Access</th>
            </tr>
        </thead>
        <tbody>
            {GroupMaster.length === 0 ? (
                <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                        No data found.
                    </td>
                </tr>
            ) : (
                GroupMaster.map((group, index) => (
                    <tr key={group.id || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition`}>
                        <td className="px-3 py-2 text-right w-1/12">{index + 1}</td>
                        <td className="px-3 py-2 text-left ">{group.groupId}</td>
                        <td className="px-3 py-2 text-left">{group.groupName}</td>
                        <td className="px-3 py-2 text-center">
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded-md px-3 py-1 text-xs shadow-sm transition"
                                onClick={() => handleClick(group)}
                            >
                                View
                            </button>
                        </td>
                    </tr>
                ))
            )}
        </tbody>
    </table>
</div>


            {
                isModalOpen &&(
                    <GroupDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedGroupId={selectedGroupId}/>
                )
            }

            

           
                    
        </>
    )

}
export default GroupMaster;