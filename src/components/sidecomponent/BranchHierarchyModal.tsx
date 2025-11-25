import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { BranchHierarchyTree } from "./bm";
import { API_BASE_URL } from "@/config/api";

interface BranchData {
  branchCode: string;
  bank: string;
  parentCode: string;
  branchType: string;
  branchDesc: string;
  contractPerson: string;
  address: string;
  mobile: string;
  email: string;
  ifsc: string;
  latitude: string;
  longitude: string;
  status: string;
  children?: BranchData[];
}

export function BranchHierarchyModal() {
  const [data, setData] = useState<BranchData[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const flattenBranchData = (branchData: BranchData[], result: any[] = []) => {
    branchData.forEach((branch) => {
      const flatBranch = {
        branchCode: branch.branchCode,
        bank: branch.bank,
        parentCode: branch.parentCode,
        branchType: branch.branchType,
        branchDesc: branch.branchDesc,
        contractPerson: branch.contractPerson,
        address: branch.address,
        mobile: branch.mobile,
        email: branch.email,
        ifsc: branch.ifsc,
        latitude: branch.latitude,
        longitude: branch.longitude,
        status: branch.status,
        children: branch.children || []
      };
      result.push(flatBranch);

      if (branch.children && branch.children.length > 0) {
        flattenBranchData(branch.children, result);
      }
    });

    return result;
  };

  useEffect(() => {
    const getData = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const branchCode = sessionStorage.getItem("branch"); 
        const url = `${API_BASE_URL}/getAllBranchForHierarchy?loggedInBranch`;
        const response = await fetch(url + "=" + branchCode);
        const result = await response.json();
        const payload = result.payload || [];
        
        // Keep the hierarchical structure instead of flattening
        setData(payload);
      } catch (err) {
        console.error("Error fetching data", err);
        setError("Failed to fetch Site data");
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
              <Button className="bg-blue-200 hover:bg-blue-300 text-blue-800 px-2 py-0 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                  style={{ width: "135px", height: "25px", fontSize: "12px" }}
              >
                  <Building2 className="mr-1 h-2 w-2" />
                  Site Hierarchy
              </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader className="mb-4 flex jastify-between r">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Site Hierarchy
          </DialogTitle>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading Site data...</span>
          </div>
        )}
        
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}
        
        {!isLoading && !error && data.length > 0 && (
          <div className="space-y-4">
            {data.map((branch) => (
              <BranchHierarchyTree key={branch.branchCode} data={branch} />
            ))}
          </div>
        )}
        
        {!isLoading && !error && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No Site data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}