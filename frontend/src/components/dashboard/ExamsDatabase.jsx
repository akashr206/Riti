import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Plus, Edit2, Trash2, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EntityEditor, ConfirmDelete } from "./CrudModals";

export function ExamsDatabase({ exams, allocations, refreshData }) {
  const containerRef = useRef();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useGSAP(() => {
    gsap.from(".exam-row-anim", {
      y: 10,
      opacity: 0,
      duration: 0.3,
      stagger: 0.02,
      ease: "power1.out"
    });
  }, { scope: containerRef, dependencies: [exams] });

  return (
    <div className="p-6 h-full overflow-y-auto" ref={containerRef}>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Master Exam Database</h2>
          <p className="text-muted-foreground mt-1 text-sm">Comprehensive list of all required examinations.</p>
        </div>
        <Button onClick={() => { setSelectedExam(null); setEditorOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Exam
        </Button>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
            <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">No Exams Found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            You haven't added any examinations yet. Add exams manually or use the Smart Ingestor to extract them from documents.
          </p>
          <Button onClick={() => { setSelectedExam(null); setEditorOpen(true); }} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Exam
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Course Code</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Course Name</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Total Students</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">PWD</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Duration</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Date</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Time</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Status</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => {
                const isAllocated = allocations.some(a => a.examId === exam.id);
                return (
                  <TableRow key={exam.id} className="exam-row-anim hover:bg-muted/10 border-border/30 group">
                    <TableCell className="font-bold text-foreground py-4">{exam.courseCode}</TableCell>
                    <TableCell className="text-muted-foreground font-medium py-4">{exam.courseName}</TableCell>
                    <TableCell className="font-medium py-4">{exam.totalStudents}</TableCell>
                    <TableCell className="font-medium py-4">
                      {exam.pwdStudents > 0 ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{exam.pwdStudents}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium py-4 text-muted-foreground">{exam.durationMinutes}m</TableCell>
                    <TableCell className="font-mono text-sm py-4">{exam.examDate}</TableCell>
                    <TableCell className="font-mono text-sm py-4">{exam.startTime}</TableCell>
                    <TableCell className="py-4">
                      {isAllocated ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">Scheduled</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedExam(exam); setEditorOpen(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedExam(exam); setDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {editorOpen && <EntityEditor open={editorOpen} setOpen={setEditorOpen} entityType="exams" initialData={selectedExam} onSaved={refreshData} />}
      {deleteOpen && <ConfirmDelete open={deleteOpen} setOpen={setDeleteOpen} entityType="exams" entityId={selectedExam?.id} entityName={selectedExam?.courseCode} onDeleted={refreshData} />}
    </div>
  );
}
