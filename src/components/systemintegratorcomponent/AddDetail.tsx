import React, { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { API_BASE_URL } from "@/config/api";

interface BaseDetails {
  make: string;
  model: string;
  installationDate: string;
  inputName: string;
}

interface CCTVDetails extends BaseDetails {
  systemImage?: File[];
  relayOutputCount?: string;
  relayWorkingStatus?: string;
  relayConnectorImage?: File[];
  dcOutputAvailable?: string;
  dvrAge?: string;
}

interface SecurityAlarmDetails extends BaseDetails {
  alarmPanelImage?: File[];
  ethernetPortAvailable?: string;
  alarmOutputType?: string;
  noOfRelays?: string;
  dcOutputStatus?: string;
}

interface FireAlarmDetails extends BaseDetails {
  fireAlarmPanelImage?: File[];
  ethernetPortAvailable?: string;
  alarmOutputType?: string;
  noOfRelays?: string;
  auxPowerStatus?: string;
  faultRelayOutputAvailable?: string;
}

interface ETLDetails extends BaseDetails {
  productImage?: File[];
  etlType?: "Mechanical" | "Electronic";
  alarmRelayStatus?: string;
  noOfRelays?: string;
}

interface BACSDetails extends BaseDetails {
  productImage?: File[];
}

type DeviceType =
  | "CCTV MAIN"
  | "CCTV - LOCKER"
  | "SECURITY ALARM"
  | "FIRE ALARM"
  | "ETL"
  | "BACS";

interface ZoneRow {
  id: string;
  productType?: DeviceType;
  make?: string;
  model: string;
  installationDate: string;
  inputName: string;
  details?:
    | CCTVDetails
    | SecurityAlarmDetails
    | FireAlarmDetails
    | ETLDetails
    | BACSDetails;
}

interface ZoneDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteCode: string;
  siteName: string;
  mobile: string;
  integrator: string;
}

const deviceTypes: DeviceType[] = [
  "CCTV MAIN",
  "CCTV - LOCKER",
  "SECURITY ALARM",
  "FIRE ALARM",
  "ETL",
  "BACS",
];

// Map to populate makes for each productType
const makeOptionsMap: Record<DeviceType, string[]> = {
  "CCTV MAIN": [
    "CCTV - Dahua",
    "CCTV - Hikvision",
    "CCTV - Disvu",
    "CCTV - CP Plus",
    "CCTV - Prama",
    "Others",
  ],
  "CCTV - LOCKER": [
    "CCTV - Dahua",
    "CCTV - Hikvision",
    "CCTV - Disvu",
    "CCTV - CP Plus",
    "CCTV - Prama",
    "Others",
  ],
  "SECURITY ALARM": [
    "Int. Alarm - Digitals (Di-CQUR)",
    "Int. Alarm - Amc",
    "Int. Alarm - Dsc",
    "Int. Alarm - Hikvision",
    "Int. Alarm - Dahua",
    "Others",
  ],
  "FIRE ALARM": [
    "Fire Alarm - Digitals (Di-Fire)",
    "Fire Alarm - Agni",
    "Fire Alarm - Ravel",
    "Others",
  ],
  "ETL": ["Others"],
  "BACS": ["Bio. - Hikvision", "Others"],
};

// Reusable Select Component for values
const SimpleSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// Reusable File Input (now supports multiple)
const FileInput = ({
  label,
  onChange,
  multiple = false,
  value
}: {
  label: string;
  onChange: (files: File[] | null) => void;
  multiple?: boolean;
  value?: File[];
}) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    <Input
      type="file"
      accept="image/*"
      multiple={multiple}
      onChange={(e) => {
        const files = e.target.files ? Array.from(e.target.files) : null;
        onChange(files);
      }}
    />
    {value && value.length > 0 && (
      <div className="mt-1 text-xs text-gray-500">
        {value.map((file, idx) => (
          <div key={idx}>{file.name}</div>
        ))}
      </div>
    )}
  </div>
);

// Reusable Text Input
const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const AddDetail: React.FC<ZoneDetailsModalProps> = ({
  isOpen,
  onClose,
  siteCode,
  siteName,
  mobile,
  integrator,
}) => {
  // Add customMake to each row for handling 'Others'
  const [rows, setRows] = useState<(ZoneRow & { customMake?: string })[]>([
    {
      id: "1",
      productType: undefined,
      make: undefined,
      model: "",
      installationDate: "",
      inputName: "",
      details: undefined,
      customMake: "",
    },
  ]);

  const addNewRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        productType: undefined,
        make: undefined,
        model: "",
        installationDate: "",
        inputName: "",
        details: undefined,
        customMake: "",
      },
    ]);
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Update base row fields
  const updateRowField = (
    id: string,
    field: keyof Omit<ZoneRow, "id" | "details">,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        let newDetails = row.details;
        let customMake = row.customMake;
        // Reset details if product type changes
        if (field === "productType" && value !== row.productType) {
          switch (value as DeviceType) {
            case "CCTV MAIN":
            case "CCTV - LOCKER":
              newDetails = {} as CCTVDetails;
              break;
            case "SECURITY ALARM":
              newDetails = {} as SecurityAlarmDetails;
              break;
            case "FIRE ALARM":
              newDetails = {} as FireAlarmDetails;
              break;
            case "ETL":
              newDetails = {} as ETLDetails;
              break;
            case "BACS":
              newDetails = {} as BACSDetails;
              break;
            default:
              newDetails = undefined;
          }
          customMake = ""; // Reset customMake if productType changes
        }
        if (field === "make" && value !== "Others") {
          customMake = ""; // Reset customMake if not Others
        }
        return { ...row, [field]: value, details: newDetails, customMake };
      })
    );
  };

  // For custom make input
  const updateCustomMake = (id: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, customMake: value } : row
      )
    );
  };

  // Update nested details (device specific)
  const updateDetailsField = (
    id: string,
    field: string,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        return {
          ...row,
          details: {
            ...row.details,
            [field]: value,
          },
        };
      })
    );
  };

  // Render device-specific details forms
  const renderDetailsForm = (row: ZoneRow) => {
    switch (row.productType) {
      case "CCTV MAIN":
      case "CCTV - LOCKER":
        const cctv = row.details as CCTVDetails;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-gray-50 p-4 rounded-lg border">
            <FileInput
              label="A. System Info Image"
              multiple
              value={cctv?.systemImage || []}
              onChange={(files) => updateDetailsField(row.id, "systemImage", files)}
            />
            <SimpleSelect
              label="B. No. of Relay Output"
              value={cctv?.relayOutputCount || ""}
              options={["1", "2", "3", "4", "5", "6"]}
              onChange={(val) => updateDetailsField(row.id, "relayOutputCount", val)}
              placeholder="Select"
            />
            <SimpleSelect
              label="C. Relay Working Status"
              value={cctv?.relayWorkingStatus || ""}
              options={["1", "2", "3", "4", "5", "6"]}
              onChange={(val) => updateDetailsField(row.id, "relayWorkingStatus", val)}
              placeholder="Select"
            />
            <FileInput
              label="D. CCTV Relay Connector Image"
              multiple
              value={cctv?.relayConnectorImage || []}
              onChange={(files) =>
                updateDetailsField(row.id, "relayConnectorImage", files)
              }
            />
            <SimpleSelect
              label="E. 12V DC Output Available?"
              value={cctv?.dcOutputAvailable || ""}
              options={["YES", "NO"]}
              onChange={(val) => updateDetailsField(row.id, "dcOutputAvailable", val)}
            />
            <SimpleSelect
              label="F. DVR/NVR Age (Years)"
              value={cctv?.dvrAge || ""}
              options={["1", "2", "3", "4", "5", "6", "7", "MORE THAN 7 YRS"]}
              onChange={(val) => updateDetailsField(row.id, "dvrAge", val)}
            />
          </div>
        );

      case "SECURITY ALARM":
        const sa = row.details as SecurityAlarmDetails;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-gray-50 p-4 rounded-lg border">
            <FileInput
              label="A. Security Alarm Panel Image"
              multiple
              value={sa?.alarmPanelImage || []}
              onChange={(files) => updateDetailsField(row.id, "alarmPanelImage", files)}
            />
            <SimpleSelect
              label="B. Ethernet Port Status"
              value={sa?.ethernetPortAvailable || ""}
              options={["YES", "NO"]}
              onChange={(val) => updateDetailsField(row.id, "ethernetPortAvailable", val)}
            />
            <SimpleSelect
              label="C. Alarm Output Type"
              value={sa?.alarmOutputType || ""}
              options={["RELAY O/P", "HOOTER O/P"]}
              onChange={(val) => updateDetailsField(row.id, "alarmOutputType", val)}
            />
            <SimpleSelect
              label="D. Number of Relays"
              value={sa?.noOfRelays || ""}
              options={["1", "2", "3", "4", "5", "6"]}
              onChange={(val) => updateDetailsField(row.id, "noOfRelays", val)}
            />
            <SimpleSelect
              label="E. 12V DC Output Status"
              value={sa?.dcOutputStatus || ""}
              options={["YES", "NO"]}
              onChange={(val) => updateDetailsField(row.id, "dcOutputStatus", val)}
            />
          </div>
        );

      case "FIRE ALARM":
        const fa = row.details as FireAlarmDetails;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-gray-50 p-4 rounded-lg border">
            <FileInput
              label="A. Fire Alarm Panel Image"
              multiple
              value={fa?.fireAlarmPanelImage || []}
              onChange={(files) => updateDetailsField(row.id, "fireAlarmPanelImage", files)}
            />
            <SimpleSelect
              label="B. Ethernet Port Status"
              value={fa?.ethernetPortAvailable || ""}
              options={["YES", "NO"]}
              onChange={(val) => updateDetailsField(row.id, "ethernetPortAvailable", val)}
            />
            <SimpleSelect
              label="C. Alarm Output Type"
              value={fa?.alarmOutputType || ""}
              options={["RELAY O/P", "HOOTER O/P"]}
              onChange={(val) => updateDetailsField(row.id, "alarmOutputType", val)}
            />
            <SimpleSelect
              label="D. Number of Relays"
              value={fa?.noOfRelays || ""}
              options={["1", "2", "3", "4", "5", "6"]}
              onChange={(val) => updateDetailsField(row.id, "noOfRelays", val)}
            />
            <SimpleSelect
              label="G. AUX Power (24V DC output) Status"
              value={fa?.auxPowerStatus || ""}
              options={["YES", "NO"]}
              onChange={(val) => updateDetailsField(row.id, "auxPowerStatus", val)}
            />
            <SimpleSelect
              label="H. Fault Relay Output Available"
              value={fa?.faultRelayOutputAvailable || ""}
              options={["YES", "NO"]}
              onChange={(val) => updateDetailsField(row.id, "faultRelayOutputAvailable", val)}
            />
          </div>
        );

      case "ETL":
        const etl = row.details as ETLDetails;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-gray-50 p-4 rounded-lg border">
            <FileInput
              label="Image of the Product"
              multiple
              value={etl?.productImage || []}
              onChange={(files) => updateDetailsField(row.id, "productImage", files)}
            />
            <SimpleSelect
              label="Type of ETL"
              value={etl?.etlType || ""}
              options={["Mechanical", "Electronic"]}
              onChange={(val) => updateDetailsField(row.id, "etlType", val as "Mechanical" | "Electronic")}
            />
            <SimpleSelect
              label="Alarm Output Relay Status"
              value={etl?.alarmRelayStatus || ""}
              options={["YES", "NO"]}
              onChange={(val) => updateDetailsField(row.id, "alarmRelayStatus", val)}
            />
            <SimpleSelect
              label="Number of Relays"
              value={etl?.noOfRelays || ""}
              options={["1", "2", "3", "4", "5", "6"]}
              onChange={(val) => updateDetailsField(row.id, "noOfRelays", val)}
            />
          </div>
        );

      case "BACS":
        const bacs = row.details as BACSDetails;
        return (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4 bg-gray-50 p-4 rounded-lg border">
            <FileInput
              label="Image of the Product"
              multiple
              value={bacs?.productImage || []}
              onChange={(files) => updateDetailsField(row.id, "productImage", files)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleSave = async () => {
    // Helper to map device-specific details to products array
    const mapDetailsToProducts = (row: ZoneRow) => {
      const products: any[] = [];
      const details = row.details || {};
      // Helper for file fields: use file name as imagePath (for demo)
      const fileToImagePath = (fileArr?: File[]) =>
        fileArr && fileArr.length > 0 ? fileArr.map(f => f.name).join(", ") : "";

      switch (row.productType) {
        case "CCTV MAIN":
        case "CCTV - LOCKER":
          products.push(
            {
              question: "System Info Image",
              answer: "",
              questionType: "file",
              imagePath: fileToImagePath((details as CCTVDetails).systemImage),
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "No. of Relay Output",
              answer: (details as CCTVDetails).relayOutputCount || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Relay Working Status",
              answer: (details as CCTVDetails).relayWorkingStatus || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "CCTV Relay Connector Image",
              answer: "",
              questionType: "file",
              imagePath: fileToImagePath((details as CCTVDetails).relayConnectorImage),
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "12V DC Output Available?",
              answer: (details as CCTVDetails).dcOutputAvailable || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "DVR/NVR Age (Years)",
              answer: (details as CCTVDetails).dvrAge || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            }
          );
          break;
        case "SECURITY ALARM":
          products.push(
            {
              question: "Security Alarm Panel Image",
              answer: "",
              questionType: "file",
              imagePath: fileToImagePath((details as SecurityAlarmDetails).alarmPanelImage),
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Ethernet Port Status",
              answer: (details as SecurityAlarmDetails).ethernetPortAvailable || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Alarm Output Type",
              answer: (details as SecurityAlarmDetails).alarmOutputType || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Number of Relays",
              answer: (details as SecurityAlarmDetails).noOfRelays || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "12V DC Output Status",
              answer: (details as SecurityAlarmDetails).dcOutputStatus || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            }
          );
          break;
        case "FIRE ALARM":
          products.push(
            {
              question: "Fire Alarm Panel Image",
              answer: "",
              questionType: "file",
              imagePath: fileToImagePath((details as FireAlarmDetails).fireAlarmPanelImage),
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Ethernet Port Status",
              answer: (details as FireAlarmDetails).ethernetPortAvailable || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Alarm Output Type",
              answer: (details as FireAlarmDetails).alarmOutputType || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Number of Relays",
              answer: (details as FireAlarmDetails).noOfRelays || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "AUX Power (24V DC output) Status",
              answer: (details as FireAlarmDetails).auxPowerStatus || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Fault Relay Output Available",
              answer: (details as FireAlarmDetails).faultRelayOutputAvailable || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            }
          );
          break;
        case "ETL":
          products.push(
            {
              question: "Image of the Product",
              answer: "",
              questionType: "file",
              imagePath: fileToImagePath((details as ETLDetails).productImage),
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Type of ETL",
              answer: (details as ETLDetails).etlType || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Alarm Output Relay Status",
              answer: (details as ETLDetails).alarmRelayStatus || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            },
            {
              question: "Number of Relays",
              answer: (details as ETLDetails).noOfRelays || "",
              questionType: "dropdown",
              imagePath: "",
              vendorBranchId: 0,
              id: 0,
            }
          );
          break;
        case "BACS":
          products.push(
            {
              question: "Image of the Product",
              answer: "",
              questionType: "file",
              imagePath: fileToImagePath((details as BACSDetails).productImage),
              vendorBranchId: 0,
              id: 0,
            }
          );
          break;
        default:
          break;
      }
      // Add base fields as products too
      products.unshift(
        {
          question: "Model",
          answer: row.model || "",
          questionType: "text",
          imagePath: "",
          vendorBranchId: 0,
          id: 0,
        },
        {
          question: "Years",
          answer: row.installationDate || "",
          questionType: "text",
          imagePath: "",
          vendorBranchId: 0,
          id: 0,
        },
        {
          question: "Input Name",
          answer: row.inputName || "",
          questionType: "text",
          imagePath: "",
          vendorBranchId: 0,
          id: 0,
        },
        {
          question: "Make",
          answer: row.make === "Others" && (row as ZoneRow & { customMake?: string }).customMake ? (row as ZoneRow & { customMake?: string }).customMake : (row.make || ""),
          questionType: "dropdown",
          imagePath: "",
          vendorBranchId: 0,
          id: 0,
        }
      );
      return products;
    };

    // Prepare payload as per new API (single object, not array)
    const payload =
      rows.length > 0
        ? {
            branchCode: siteCode,
            branchContact: mobile,
            branchName: siteName,
            id: 0,
            productType: rows[0].productType ? rows[0].productType : "",
            products: mapDetailsToProducts(rows[0]),
            systemIntegrator: integrator,
          }
        : {};

    console.log("Payload to save:", JSON.stringify(payload));

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor-branch/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Save failed");
      await response.json();
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data saved successfully!",
        confirmButtonColor: "#2563eb"
      });
      onClose();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save. Please try again.",
        confirmButtonColor: "#dc2626"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-7xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="relative bg-gradient-to-r from-slate-700 to-blue-700 text-white px-6 py-4 rounded-t-lg z-10 overflow-hidden">
          <DialogTitle className="text-xl font-semibold text-center relative z-10">
            System Integrator Details
          </DialogTitle>
          <DialogClose className="absolute top-4 right-4">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        {/* <div className="px-4 sm:px-6 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input value={siteCode} disabled />
          <Input value={siteName} disabled />
          <Input value={mobile} disabled />
          <Input value={integrator} disabled />
        </div> */}

        <div className="flex justify-end px-4">
          <Button
            variant="outline"
            onClick={addNewRow}
            className="h-8 min-w-0 px-2 py-0 text-xs rounded bg-blue-700 hover:bg-blue-900 text-white flex items-center gap-1 shadow-none"
            style={{ boxShadow: 'none', minWidth: 0 }}
          >
            <Plus className="w-4 h-4" />
            Add Row
          </Button>
        </div>


        <div className="flex-1 overflow-y-auto px-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="border rounded-lg p-3 bg-white shadow-sm md:grid md:grid-cols-5 md:gap-4"
            >
              <div className="md:col-span-1">
                <label className="text-sm font-medium block mb-1">Product</label>
                <Select
                  value={row.productType || undefined}
                  onValueChange={(value) => {
                    updateRowField(row.id, "productType", value as DeviceType);
                    updateRowField(row.id, "make", "");
                    updateRowField(row.id, "model", "");
                    updateRowField(row.id, "installationDate", "");
                    updateRowField(row.id, "inputName", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((dt) => (
                      <SelectItem key={dt} value={dt}>
                        {dt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <SimpleSelect
                  label="Make"
                  value={row.make || ""}
                  options={row.productType ? makeOptionsMap[row.productType] : []}
                  onChange={(val) => updateRowField(row.id, "make", val)}
                  placeholder="Select Make"
                />
                {/* Show input if Others is selected */}
                {row.make === "Others" && (
                  <div className="mt-2">
                    <Input
                      value={row.customMake || ""}
                      onChange={e => updateCustomMake(row.id, e.target.value)}
                      placeholder="Enter Make"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <TextInput
                  label="Model"
                  value={row.model}
                  onChange={(val) => updateRowField(row.id, "model", val)}
                  placeholder="Enter Model"
                />
              </div>

              <div className="md:col-span-1">
                <TextInput
                  label="Year of Installation"
                  value={row.installationDate}
                  onChange={(val) => updateRowField(row.id, "installationDate", val)}
                  placeholder="Enter Year"
                />
              </div>

              {/* <div className="md:col-span-1">
                <TextInput
                  label="Input Name"
                  value={row.inputName}
                  onChange={(val) => updateRowField(row.id, "inputName", val)}
                  placeholder="Enter Input Name"
                />
              </div> */}

              <div className="md:col-span-1 flex justify-end items-start">
                <Button
                  variant="destructive"
                  onClick={() => deleteRow(row.id)}
                  className="h-8 w-8 p-0"
                  aria-label="Delete row"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              {/* Render product specific details */}
              <div className="md:col-span-6">{renderDetailsForm(row)}</div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex justify-between px-4 py-3 bg-gray-50 border-t rounded-b-lg">
          <Button className="h-8 min-w-0 px-4 py-1 text-xs rounded bg-blue-700 hover:bg-blue-900 text-white flex items-center gap-1 shadow-none" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDetail;
