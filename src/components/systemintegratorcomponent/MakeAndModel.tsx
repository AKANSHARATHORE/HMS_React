import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddEmployeeModal from "@/components/sidecomponent/AddEmployeeModal";
import { Pagination } from "../ui/pagination";
import AddDetail from "./AddDetail";
import swal from "sweetalert2";
import { API_BASE_URL } from "@/config/api";

type User = {
    ifsc?: string;
    branchDesc?: string;
    mobile?: string;
    vendorName?: string;
    role?: string;
    code?: string;            // maps to branchCode
    name?: string;            // maps to contractPerson
};

function SystemConfiguration() {
    const [selectedUser, setSelectedUser] = useState<User>({});
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const getData = async () => {
            try {
                const vendorId = "V-1";
                const url = `${API_BASE_URL}/getBranchDetailsByVendorId?vendorId=${vendorId}`;
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        Accept: "*/*",
                    },
                });
                const result = await response.json();
                const data = result.payload;

                if (Array.isArray(data)) {
                    const transformed: User[] = data.map((branch: any) => ({
                        ifsc: branch.ifsc || "",
                        branchDesc: branch.branchDesc || "",
                        mobile: branch.mobile || "",
                        vendorName: branch.vendorName || "",
                        code: branch.branchCode || "",
                        name: branch.contractPerson || "",
                    }));
                    setUsers(transformed);
                }
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Failed to fetch branch data");
            }
        };

        getData();
    }, []);

    const handleRowClick = (user: User) => {
        setSelectedUser(user);
    };

    const openModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
};

    const closeModal = () => setIsModalOpen(false);

    const filteredUsers = users.filter(user => {
        const term = searchTerm.toLowerCase();
        return (
            user.ifsc?.toLowerCase().includes(term) ||
            user.branchDesc?.toLowerCase().includes(term) ||
            user.code?.toLowerCase().includes(term) ||
            user.name?.toLowerCase().includes(term) ||
            user.mobile?.includes(term) ||
            user.vendorName?.toLowerCase().includes(term)
        );
    });

    return (
        <>
            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 mt-2 mb-2 font-sans text-sm font-medium">
                <div className="text-2xl font-bold text-gray-800 border-l-4 border-gray-800 pl-4 py-2 w-full md:w-auto">
                    Make & Model Details
                </div>

                <Input
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3"
                />
            </div>

            <div
                className="overflow-x-auto bg-white shadow mt-6"
                style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    maxHeight: "66vh",
                    overflowY: "auto",
                    margin: "10px",
                }}
            >
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200" style={{ position: "sticky", top: "0", fontSize: "13px" }}>
                        <tr>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-right">S.No</th>
                            {/* <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left">Site Code</th> */}
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left">Site Name</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left">Contact Person</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-left">Mobile</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-right">System Integrator</th>
                            <th className="px-3 py-2 text-sm font-medium text-gray-900 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "1rem" }}>
                                    No matching data found.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <tr
                                    key={user.code || index}
                                    className="cursor-pointer hover:bg-blue-100"
                                    onClick={() => handleRowClick(user)}
                                    style={{
                                        borderBottom: "1px solid #e5e7eb",
                                        backgroundColor: index % 2 !== 0 ? "#f9fafb" : "#ffffff",
                                        fontSize: "12px",
                                    }}
                                >
                                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{index + 1}</td>
                                    {/* <td className="px-3 py-2 text-sm text-gray-700 text-left">{user.code}</td> */}
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">{user.branchDesc}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">{user.name}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-left">{user.mobile}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{user.vendorName}</td>
                                    <td className="px-3 py-2 text-sm text-gray-700 text-center">
                                        <button
    className="px-2 py-1 inline-flex text-xs font-semibold bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors duration-200"
    onClick={(e) => {
        e.stopPropagation();
        openModal(user); // Pass the clicked row user
    }}
>
    Add Detail
</button>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-3 py-2 text-sm text-gray-700 text-right">
                Showing 1 to {filteredUsers.length} of {users.length} entries
            </div>
{isModalOpen && (
    <AddDetail
        isOpen={isModalOpen}
        onClose={closeModal}
        siteCode={selectedUser.code || ""}
        siteName={selectedUser.branchDesc || ""}
        mobile={selectedUser.mobile || ""}
        integrator={selectedUser.vendorName || ""}
    />
)}
        </>
    );
}

export default SystemConfiguration;
