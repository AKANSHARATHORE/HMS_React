import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import { BranchHierarchyTree} from "./bm";
import { DialogHeader } from "../ui/dialog";
import { Building2 } from "lucide-react";
import { Button } from "../ui/button";

const hierarchyData = {
  id: "mumbai-head",
  name: "BOI Mumbai Head Office",
  count: "[1]",
  children: [
    {
      id: "zonal-sec62",
      name: "BOI Zonal Office Sec 62",
      count: "[7]",
      children: [
        { id: "mumbai-site", name: "BOI H.O MUMBAI SITE", count: "", children: [] },
        { id: "hyderabad", name: "Hyderabad branch", count: "", children: [] },
        { id: "vaishali", name: "BOI Branch Vaishali", count: "", children: [] },
        { id: "indrapuram", name: "BOI Branch Indrapuram", count: "", children: [] },
        { id: "pantwari", name: "BOI Branch Pantwari", count: "", children: [] },
        { id: "haibatpur", name: "BOI Branch Haibatpur", count: "", children: [] },
        { id: "office-sec62", name: "BOI Branch Office Sec 62", count: "", children: [] }
      ]
    }
  ]
};

export function BranchHierarchyModal({data,isOpen, onClose}: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
     
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sticky top-0 z-50 bg-white p-4 text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Branch Hierarchy
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <BranchHierarchyTree data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
