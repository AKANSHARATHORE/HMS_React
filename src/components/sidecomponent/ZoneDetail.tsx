import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";

type ZoneDetailProps = {
    isOpen: boolean;
    onClose: () => void;
    onSaveZones: (zones: any[]) => void;
};

function ZoneDetail({ isOpen, onClose, onSaveZones }: ZoneDetailProps) { 
    const [zoneData, setZoneData] = useState([]);
    const [selectedZones, setSelectedZones] = useState([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ZoneDetails = async () => {
            try {
                const url = `${API_BASE_URL}/getAllSiaCodes`;
                const response = await fetch(url);
                const result = await response.json();
                const data = result.payload || [];
                setZoneData(data);
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Failed to fetch zone data");
            }
        };

        ZoneDetails();
    }, []);

    const handleZoneSelect = (zone) => {
        setSelectedZones(prev => {
            const isSelected = prev.find(z => z.id === zone.id);
            if (isSelected) {
                return prev.filter(z => z.id !== zone.id);
            } else {
                return [...prev, {
                    alertType: zone.alertType,
                    criticalAlertFlag: "N",
                    deviceId: "",  // This will be set by the parent component
                    id: zone.id.toString(),
                    inputType: "SIA",
                    primaryFlag: "Y",
                    vendors: "",
                    zoneDesiredName: zone.code,
                    zoneOriginalName: zone.code
                }];
            }
        });
    };

    const handleSave = () => {
        onSaveZones(selectedZones);
        onClose();
    };
  return (
    <>
        <Dialog open={isOpen} onOpenChange={onClose}>
              <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-y-auto p-0">
                  <DialogHeader className="overflow-hidden z-10 bg-gradient-to-r from-gray-800 to-blue-800 text-white sticky top-0 m-0 w-full" >
                      <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>
                      <div className="flex flex-col items-center py-2">
                          <DialogTitle className="text-2xl font-bold mb-2">
                              <h2>Zone Detail</h2>
                          </DialogTitle>
                          <p className="text-blue-100">
                              This component will display details about a specific zone.
                          </p>

                          <DialogClose className="absolute top-4 right-4">
                              <X className="h-4 w-4" />
                          </DialogClose>
                      </div>
                  </DialogHeader>






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
                          <thead className="bg-gray-200" style={{ position: "sticky", top: "0", fontSize: "13px" }}>
                              <tr>
                                  <th className="px-2 py-1 text-sm font-medium text-gray-900 fw-bold">SNO</th>
                                  <th className="px-6 py-1 text-sm font-medium text-gray-900 fw-bold">ZONE NAME</th>
                                  <th className="px-6 py-1 text-sm font-medium text-gray-900 fw-bold">DESCRIPTION</th>
                                  <th className="px-6 py-1 text-sm font-medium text-gray-900 text-center fw-bolder">REMARKS</th>
                              </tr>
                          </thead>
                          <tbody>
                              {
                                  zoneData.length === 0 ? (
                                      <tr>
                                          <td colSpan={5} style={{ textAlign: "center", padding: "1rem" }}>
                                              No matching data found.
                                          </td>
                                      </tr>
                                  ) : (
                                      zoneData.map((deviceData, index) => (
                                          <tr
                                              key={deviceData.code || index}
                                              className="cursor-pointer hover:bg-blue-100"
                                              // onClick={() => handleRowClick(bankData)}
                                              style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: index % 2 !== 0 ? "#f9fafb" : "#ffffff", fontSize: "12px" }}
                                          >
                                              <td className="px-3 py-2 fw-bold text-sm text-gray-700">{deviceData.id}</td>
                                              <td className="px-3 py-2 text-sm text-gray-700">{deviceData.code}</td>
                                              <td className="px-3 py-2 text-sm text-gray-700">
                                                  <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${deviceData.alertType === 'ZONE' ? 'bg-green-100 text-green-800' :
                                                      deviceData.alertType === 'HEAD OFFICE' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800'
                                                      }`}>
                                                      {deviceData.alertType}
                                                  </span>
                                              </td>
                                              <td className="px-3 py-2 text-sm text-gray-700 text-right">
                                                                <div className="flex items-center">
                                                    <Input
                                                        value={deviceData.alertDef || ''}
                                                        className="h-9 text-sm text-center font-medium text-gray-700 bg-gray-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                        readOnly
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <DialogFooter className="bg-gray-100 px-4 py-4">
                        <div className="flex justify-end gap-4">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                Save Zones
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
export default ZoneDetail;