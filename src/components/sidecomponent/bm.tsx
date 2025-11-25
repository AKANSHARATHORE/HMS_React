import { useState } from "react";
import { ChevronDown, ChevronRight, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchNode {
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
  children?: BranchNode[];
}

interface BranchHierarchyTreeProps {
  data: BranchNode;
  level?: number;
}

interface BranchTreeNodeProps {
  node: BranchNode;
  level: number;
  isLast?: boolean;
  parentLines?: boolean[];
}

function BranchTreeNode({ node, level, isLast = false, parentLines = [] }: BranchTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  const currentLines = [...parentLines, !isLast];
  
  return (
    <div className="relative">
      
      <div className="flex items-center gap-2 py-2">
        
        {parentLines.map((showLine, index) => (
          <div key={index} className="w-6 flex justify-center">
            {showLine && (
              <div className="w-px bg-gray-300 h-full"></div>
            )}
          </div>
        ))}
        
        
        {level > 0 && (
          <div className="w-6 h-6 relative">
            
            <div className={cn(
              "absolute left-3 w-px bg-gray-300",
              isLast ? "h-3" : "h-full",
              level === 1 ? "top-0" : "-top-2"
            )}></div>
            
            <div className="absolute top-3 left-3 w-3 h-px bg-gray-300"></div>
          </div>
        )}
        
        
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors duration-200"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-blue-600" />
            )}
          </button>
        )}
        
        
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          level === 0 ? "bg-blue-600 text-white" : 
          level === 1 ? "bg-blue-100 text-blue-600" : 
          "bg-gray-100 text-gray-600"
        )}>
          {level === 0 ? (
            <Building2 className="h-5 w-5" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </div>
        
        {/* Branch Info */}
        <div className={cn(
          "px-4 py-3 rounded-lg flex-1 border transition-all duration-200 hover:shadow-md",
          level === 0 ? "bg-blue-50 border-blue-200 text-blue-900" :
          level === 1 ? "bg-purple-50 border-purple-200 text-purple-900" :
          "bg-gray-50 border-gray-200 text-gray-800"
        )}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">
                {node.branchDesc || node.branchCode}
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                node.status === "ACTIVE" ? "bg-red-200 text-red-800":"bg-green-200 text-green-800" 
              )}>
                {node.status}
              </span>
            </div>
            
            <div className="text-xs space-y-1">
              <div><span className="font-medium">Code:</span> {node.branchCode}</div>
              <div><span className="font-medium">Type:</span> {node.branchType}</div>
              {node.ifsc && <div><span className="font-medium">IFSC:</span> {node.ifsc}</div>}
              {node.address && <div><span className="font-medium">Address:</span> {node.address}</div>}
              {node.contractPerson && <div><span className="font-medium">Contact:</span> {node.contractPerson}</div>}
              {node.mobile && <div><span className="font-medium">Mobile:</span> {node.mobile}</div>}
              {node.email && <div><span className="font-medium">Email:</span> {node.email}</div>}
            </div>
          </div>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {node.children!.map((child, index) => (
            <BranchTreeNode
              key={child.branchCode}
              node={child}
              level={level + 1}
              isLast={index === node.children!.length - 1}
              parentLines={currentLines}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BranchHierarchyTree({ data, level = 0 }: BranchHierarchyTreeProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <BranchTreeNode node={data} level={level} isLast={true} />
    </div>
  );
}