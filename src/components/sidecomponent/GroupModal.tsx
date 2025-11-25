import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';
import { API_BASE_URL } from "@/config/api";

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroupId?: string | null;
}

interface Branch {
  branchId: string;
  branchDesc: string;
}

const GroupDetailsModal = ({ isOpen, onClose, selectedGroupId }: GroupDetailsModalProps) => {
  const [formData, setFormData] = useState({
    groupName: '',
    groupDescription: '',
    dateOfCreation: '',
    selectedBranch: ''
  });

  const [branchData, setBranchData] = useState<Branch[]>([]);

  // Fetch group details by ID
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!selectedGroupId) return;
      try {
        const url = `${API_BASE_URL}/getGroupById?groupId=${selectedGroupId}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.statusCode === 200 && result.payload) {
          setFormData({
            groupName: result.payload.groupName || '',
            groupDescription: result.payload.groupDescription || '',
            dateOfCreation: result.payload.createdDate ? result.payload.createdDate.split('T')[0] : '',
            selectedBranch: result.payload.empId && result.payload.empName
              ? `${result.payload.empId} -> ${result.payload.empName}`
              : ''
          });
        }
      } catch (error) {
        console.error("Error fetching group details:", error);
      }
    };

    fetchGroupDetails();
  }, [selectedGroupId]);

  // Fetch all branches
  useEffect(() => {
    const getBranchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/getAllBranch`);
        const result = await response.json();

        if (String(result.statusCode) === "200" && Array.isArray(result.payload)) {
          setBranchData(result.payload); // raw list of {branchId, branchDesc}
        } else {
          console.error("Invalid branch API response:", result);
        }
      } catch (error) {
        console.error("Error fetching branch data:", error);
      }
    };

    getBranchData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const [empId, empName] = formData.selectedBranch.split("->").map(s => s.trim());

      const payload = {
        createdDate: formData.dateOfCreation,
        empId,
        empName,
        groupDescription: formData.groupDescription,
        groupId: selectedGroupId || "",
        groupName: formData.groupName
      };

      const response = await fetch(`${API_BASE_URL}/saveOrUpdateGroupMaster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.statusCode === 200) {
        alert("Group details saved successfully!");
        onClose();
      } else {
        alert("Failed to save group details.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Something went wrong while saving.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-white shadow-xl">
        <DialogHeader
          className="p-2 bg-gradient-to-r from-gray-800 to-blue-800 text-white relative overflow-hidden"
          style={{ position: "sticky", top: "0", zIndex: "1" }}
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16" />
          <div className="relative z-10 text-center">
            <DialogTitle className="text-2xl font-bold mb-2">
              Group Details
            </DialogTitle>
            <DialogClose className="absolute top-4 right-4">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="Group Name"
                    value={formData.groupName}
                    onChange={(e) => handleInputChange('groupName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfCreation">Date of Creation</Label>
                  <Input
                    id="dateOfCreation"
                    type="date"
                    value={formData.dateOfCreation}
                    onChange={(e) => handleInputChange('dateOfCreation', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selectBranch">Select Branch</Label>
                  <Select
                    value={formData.selectedBranch}
                    onValueChange={(value) => handleInputChange('selectedBranch', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchData.length === 0 ? (
                        <div className="p-2 text-gray-500">No branches available</div>
                      ) : (
                        branchData.map((branch) => (
                          <SelectItem
                            key={branch.branchId}
                            value={`${branch.branchId} -> ${branch.branchDesc}`}
                          >
                            {branch.branchId} → {branch.branchDesc}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="groupDescription">Group Description</Label>
                <Textarea
                  id="groupDescription"
                  placeholder="Group Description"
                  value={formData.groupDescription}
                  onChange={(e) => handleInputChange('groupDescription', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button
                  type="button"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={onClose}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupDetailsModal;
