import React, { useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Download, FileText, CheckCircle2, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toJpeg } from "html-to-image";

export function ExportPDFModal({
    data,
    richAllocations,
    currentPage,
    setCurrentPage,
}) {
    const [exportMaster, setExportMaster] = useState(true);
    const [exportLecturers, setExportLecturers] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [open, setOpen] = useState(false);

    const generatePDFs = async () => {
        setIsExporting(true);

        try {
            if (exportMaster) {
                if (currentPage !== "matrix") {
                    setCurrentPage("matrix");
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }

                const chunks = document.querySelectorAll(".gantt-page-chunk");
                if (!chunks || chunks.length === 0) {
                    alert(
                        "The Master Schedule could not be loaded for printing.",
                    );
                    setIsExporting(false);
                    return;
                }

                try {
                    const pdf = new jsPDF("l", "mm", "a3");
                    const pdfWidth = pdf.internal.pageSize.getWidth();

                    document.body.classList.add("exporting-pdf");
                    await new Promise((resolve) => setTimeout(resolve, 50)); // let CSS apply

                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        const imgData = await toJpeg(chunk, {
                            backgroundColor: "#ffffff",
                            pixelRatio: 1.2,
                            quality: 0.8,
                            skipAutoScale: true,
                        });

                        const imgProps = pdf.getImageProperties(imgData);
                        const pdfImgWidth = pdfWidth - 20;
                        const pdfImgHeight =
                            (imgProps.height * pdfImgWidth) / imgProps.width;

                        if (i > 0) {
                            pdf.addPage();
                        }

                        pdf.addImage(
                            imgData,
                            "JPEG",
                            10,
                            15,
                            pdfImgWidth,
                            pdfImgHeight,
                        );
                    }

                    document.body.classList.remove("exporting-pdf");
                    pdf.save("Master_Allocation_Schedule.pdf");
                } catch (err) {
                    console.error("html-to-image error:", err);
                    alert("Failed to render master schedule image.");
                }
            }

            if (exportLecturers) {
                const lecturerAllocations = {};
                richAllocations.forEach((alloc) => {
                    if (alloc.facultyId) {
                        if (!lecturerAllocations[alloc.facultyId]) {
                            lecturerAllocations[alloc.facultyId] = [];
                        }
                        lecturerAllocations[alloc.facultyId].push(alloc);
                    }
                });

                const doc = new jsPDF("portrait");
                let isFirstPage = true;

                data.faculty.forEach((fac) => {
                    const allocs = lecturerAllocations[fac.id];
                    if (!allocs || allocs.length === 0) return;

                    if (!isFirstPage) {
                        doc.addPage();
                    }
                    isFirstPage = false;

                    doc.setFontSize(18);
                    doc.text(`Invigilation Schedule: ${fac.name}`, 14, 22);

                    doc.setFontSize(11);
                    doc.text(`Department: ${fac.department}`, 14, 30);
                    doc.text(
                        `Generated on: ${new Date().toLocaleString()}`,
                        14,
                        36,
                    );

                    const tableColumn = [
                        "Date",
                        "Time",
                        "Course",
                        "Room",
                        "Students",
                    ];
                    const tableRows = [];

                    allocs.sort((a, b) => {
                        if (a.exam?.examDate !== b.exam?.examDate)
                            return a.exam?.examDate.localeCompare(
                                b.exam?.examDate,
                            );
                        return a.exam?.startTime.localeCompare(
                            b.exam?.startTime,
                        );
                    });

                    allocs.forEach((alloc) => {
                        tableRows.push([
                            alloc.exam?.examDate || "N/A",
                            `${alloc.exam?.startTime} - ${getEndTime(alloc.exam?.startTime, alloc.exam?.durationMinutes)}`,
                            alloc.exam?.courseCode || "N/A",
                            alloc.room?.name || "TBA",
                            alloc.assignedStudents.toString(),
                        ]);
                    });

                    autoTable(doc, {
                        head: [tableColumn],
                        body: tableRows,
                        startY: 46,
                        styles: { fontSize: 10, cellPadding: 4 },
                        headStyles: { fillColor: [55, 65, 81] },
                    });
                });

                if (!isFirstPage) {
                    doc.save("Lecturer_Individual_Schedules.pdf");
                }
            }

            setTimeout(() => setOpen(false), 500);
        } catch (err) {
            console.error(err);
            alert("Failed to generate PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const getEndTime = (timeStr, durationMins) => {
        if (!timeStr) return "";
        const [h, m] = timeStr.split(":").map(Number);
        let totalMins = h * 60 + m + durationMins;
        const endH = Math.floor(totalMins / 60);
        const endM = totalMins % 60;
        return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 w-full mt-2 cursor-pointer">
                <Download className="w-4 h-4 mr-2 text-muted-foreground" />
                Export to PDF
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Schedules to PDF</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <label className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={exportMaster}
                            onChange={(e) => setExportMaster(e.target.checked)}
                        />
                        <div>
                            <div className="font-medium text-sm text-foreground">
                                Master Allotment Schedule
                            </div>
                            <div className="text-xs text-muted-foreground">
                                A complete grid of all exams, rooms, and
                                assigned faculty.
                            </div>
                        </div>
                    </label>

                    <label className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={exportLecturers}
                            onChange={(e) =>
                                setExportLecturers(e.target.checked)
                            }
                        />
                        <div>
                            <div className="font-medium text-sm text-foreground">
                                Lecturer-Specific Allotments
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Individual schedules grouped by lecturer (one
                                page per lecturer).
                            </div>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={generatePDFs}
                        disabled={
                            (!exportMaster && !exportLecturers) || isExporting
                        }
                    >
                        {isExporting ? (
                            <span className="flex items-center">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                Generating...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <FileText className="w-4 h-4 mr-2" /> Download
                                PDFs
                            </span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
