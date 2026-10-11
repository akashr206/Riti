import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { User, Briefcase, Plus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EntityEditor, ConfirmDelete } from "./CrudModals";

export function FacultyDirectory({ faculty, allocations, refreshData }) {
  const containerRef = useRef();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFac, setSelectedFac] = useState(null);

  useGSAP(() => {
    gsap.from(".faculty-card-anim", {
      y: 20,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.out"
    });
  }, { scope: containerRef, dependencies: [faculty] });

  // Calculate workload
  const facultyWithWorkload = faculty.map(fac => {
    const assignedExams = allocations.filter(a => a.facultyId === fac.id);
    return { ...fac, assignedExams };
  });

  return (
    <div className="p-6 h-full overflow-y-auto" ref={containerRef}>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Faculty Workload</h2>
          <p className="text-muted-foreground mt-1 text-sm">Monitor invigilator assignments and availability.</p>
        </div>
        <Button onClick={() => { setSelectedFac(null); setEditorOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Faculty
        </Button>
      </div>

      {facultyWithWorkload.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
            <User className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">No Faculty Found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            You haven't added any faculty members yet. Add them manually or use the Smart Ingestor to extract them from documents.
          </p>
          <Button onClick={() => { setSelectedFac(null); setEditorOpen(true); }} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Faculty
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {facultyWithWorkload.map(fac => (
          <Card key={fac.id} className="faculty-card-anim border-border/50 bg-card hover:shadow-md transition-shadow group relative">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
              <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur" onClick={() => { setSelectedFac(fac); setEditorOpen(true); }}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="destructive" size="icon" className="h-7 w-7 opacity-80 hover:opacity-100" onClick={() => { setSelectedFac(fac); setDeleteOpen(true); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{fac.name}</h3>
                    <p className="text-xs text-muted-foreground">{fac.department}</p>
                  </div>
                </div>
                {fac.isAvailable === false ? (
                  <Badge variant="destructive" className="text-[10px] uppercase tracking-wider bg-red-500/10 text-red-500 border-red-500/20">Unavailable</Badge>
                ) : fac.assignedExams.length > 3 ? (
                  <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">High Load</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600">Available</Badge>
                )}
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Briefcase className="w-4 h-4" /> Assignments
                </div>
                <span className="font-bold text-foreground text-sm">{fac.assignedExams.length} Exams</span>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {editorOpen && <EntityEditor open={editorOpen} setOpen={setEditorOpen} entityType="faculty" initialData={selectedFac} onSaved={refreshData} />}
      {deleteOpen && <ConfirmDelete open={deleteOpen} setOpen={setDeleteOpen} entityType="faculty" entityId={selectedFac?.id} entityName={selectedFac?.name} onDeleted={refreshData} />}
    </div>
  );
}
