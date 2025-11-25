import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

// NEW: format display date as 'DD/MM/YYYY'
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}

export const copyToClipboard = async (
  data: any[],
  deviceTypes: string[],
  getUptimeValue: (device: any) => string,
  startDate?: string,
  endDate?: string
) => {
  if (!data || data.length === 0) return;
  const headers = ["S.No", "Site Name", "Site Code", ...deviceTypes];
  const rows = data.map((branch: any, idx: number) => {
    const deviceUptimes = deviceTypes.map((type) => {
      const device = branch.devices?.[type];
      return getUptimeValue(device);
    });
    return [
      (idx + 1).toString(),
      branch.branchName,
      branch.ifsc,
      ...deviceUptimes,
    ].join("\t");
  });
  const tsv = [headers.join("\t"), ...rows].join("\n");
  // (no change required to include filtered date in clipboard unless desired)
  await navigator.clipboard.writeText(tsv);
  Swal.fire({
    toast: true,
    position: "top",
    icon: "success",
    title: "Table data copied to clipboard!",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const exportToExcel = (
  data: any[],
  deviceTypes: string[],
  getUptimeValue: (device: any) => string,
  startDate?: string,
  endDate?: string
) => {
  if (!data || data.length === 0) return;
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const title = `DI-HMS : Uptime Report - ${dateStr}, ${timeStr}`;

  // filtered display
  const filteredDisplay = startDate
    ? startDate === endDate
      ? formatDisplayDate(startDate)
      : `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate || "")}`
    : "";

  // place title, filtered info, then header row
  const excelHeader = [
    [title],
    [filteredDisplay],
    ["S.No", "Site Name", "Site Code", ...deviceTypes],
  ];
  const rows = data.map((branch: any, idx: number) => [
    idx + 1,
    branch.branchName,
    branch.ifsc,
    ...deviceTypes.map((type) => {
      const device = branch.devices?.[type];
      return getUptimeValue(device);
    }),
  ]);
  const sheetData = [...excelHeader, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Merge title and filtered rows
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 + deviceTypes.length } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 + deviceTypes.length } },
  ];

  // Set column widths
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 18 },
    ...deviceTypes.map(() => ({ wch: 12 })),
  ];

  // Style title row (blue background, white text)
  if (worksheet["A1"]) {
    worksheet["A1"].s = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "1976D2" } },
    };
  }

  // Style filtered row (A2)
  if (worksheet["A2"]) {
    worksheet["A2"].s = {
      font: { italic: true, sz: 11, color: { rgb: "333333" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "FFFFFF" } },
    };
  }

  // Style header row now at r = 2
  for (let col = 0; col < 3 + deviceTypes.length; col++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 2, c: col })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "1976D2" } },
        border: {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } },
        },
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Uptime Report");
  XLSX.writeFile(workbook, "Uptime_Report.xlsx");
};

export const exportToPDF = async (
  data: any[],
  deviceTypes: string[],
  getUptimeValue: (device: any) => string,
  startDate?: string,
  endDate?: string
) => {
  if (!data || data.length === 0) return;

  // Use absolute path for logo
  const logoUrl = `${window.location.origin}/Digitals45.jpg`;

  // Helper to load image as HTMLImageElement
  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  try {
    const logoImg = await loadImage(logoUrl);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    // Add logo
    doc.addImage(logoImg, "JPEG", 40, 20, 120, 60);

    // Horizontal rule
    doc.setDrawColor(180);
    doc.line(40, 90, 800, 90);

    // Heading + About
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Uptime Report", 700, 50, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      "ABOUT: Uptime Report provides an overview of the status of various systems across different branches. It includes information on CCTV, SAS, FAS, ETL, and BACS systems, helping to ensure that all security measures are functioning properly.",
      40,
      110,
      { maxWidth: 760 }
    );

    // Subtitle
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const filteredDisplay = startDate
      ? startDate === endDate
        ? formatDisplayDate(startDate)
        : `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate || "")}`
      : "";

    doc.setFontSize(13);
    doc.setFillColor(255, 255, 255);
    doc.rect(40, 140, 760, 40, "F");
    doc.setTextColor(128, 128, 128);
    doc.text(`DI-HMS : Uptime Report - ${dateStr}, ${timeStr}`, 420, 156, {
      align: "center",
    });

    if (filteredDisplay) {
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Data Range Covered: ${filteredDisplay}`, 420, 174, {
        align: "center",
      });
    }

    // Prepare Table
    const headers = [["S.No", "Site Name", "Site Code", ...deviceTypes]];
    const rows = data.map((branch: any, idx: number) => [
      idx + 1,
      branch.branchName,
      branch.ifsc,
      ...deviceTypes.map((type) => {
        const device = branch.devices?.[type];
        return getUptimeValue(device);
      }),
    ]);

    autoTable(doc, {
      startY: filteredDisplay ? 190 : 180,
      head: headers,
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [60, 60, 60],
      },
      styles: {
        cellPadding: 5,
        overflow: "linebreak",
        minCellHeight: 18,
        font: "helvetica",
      },
      columnStyles: {
        0: { halign: "right" }, // S.No right align
        1: { halign: "left" }, // Site Name left align
        2: { halign: "left" }, // Site Code left align
        // deviceTypes columns will be colored below
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      didParseCell: function (data) {
        // Color percentage columns
        if (
          data.section === "body" &&
          data.column.index >= 3 // deviceTypes columns
        ) {
          const val = data.cell.raw;
          // Try to extract percentage number
          let percent = null;
          if (typeof val === "string" && val.trim().endsWith("%")) {
            percent = parseFloat(val.replace("%", "").trim());
          }
          if (percent !== null && !isNaN(percent)) {
            if (percent >= 75) {
              data.cell.styles.textColor = [0, 128, 0]; // green
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [218, 165, 32]; // orange
              data.cell.styles.fontStyle = "bold";
            }
          }
          data.cell.styles.halign = "right"; // right align for percentage
        }
        // S.No column right align (redundant, but ensures alignment)
        if (data.section === "body" && data.column.index === 0) {
          data.cell.styles.halign = "right";
        }
      },
      didDrawPage: function () {
        // Watermark
        doc.saveGraphicsState();
        doc.setGState(doc.GState({ opacity: 0.08 }));
        doc.setFontSize(100);
        doc.setTextColor(128, 128, 128);
        doc.text("Digitals India", 200, 450, { angle: 25 });
        doc.restoreGraphicsState();

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `Generated on: ${dateStr}`,
          40,
          doc.internal.pageSize.height - 20
        );
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          doc.internal.pageSize.width - 80,
          doc.internal.pageSize.height - 20
        );
      },
    });

    doc.save("Uptime_Report.pdf");
  } catch (e) {
    alert("Error loading logo image or generating PDF.");
  }
};



