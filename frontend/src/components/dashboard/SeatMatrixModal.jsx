import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { UserMinus, AlertTriangle } from "lucide-react";

export function SeatMatrixModal({ open, onOpenChange, alloc, allAllocations, onSwapClick }) {
  if (!alloc || !alloc.room) return null;

  const { room, exam, fac } = alloc;
  const capacity = room.capacity;
  
  const parseTime = (str) => {
    if (!str) return 0;
    const [h, m] = str.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const currentStart = parseTime(exam.startTime);
  const currentEnd = currentStart + (exam.durationMinutes || 180);

  // Find all allocations for THIS room at THIS overlapping time block
  const sharedAllocs = (allAllocations || []).filter(a => {
    if (a.roomId !== room.id || a.exam?.examDate !== exam.examDate) return false;
    
    const aStart = parseTime(a.exam?.startTime);
    const aEnd = aStart + (a.exam?.durationMinutes || 180);
    
    return Math.max(aStart, currentStart) < Math.min(aEnd, currentEnd);
  });
  
  // Sort deterministically
  sharedAllocs.sort((a, b) => a.examId - b.examId);

  // Initialize seats
  const seats = Array.from({ length: capacity }, (_, i) => ({
    id: i + 1,
    isAccessible: i < (room.accessibleSeats || 0),
    occupant: null
  }));

  // Assign PWD seats first (Alternating)
  let nextAccIdx = 0;
  const remainingPwd = sharedAllocs.map(a => ({
    alloc: a,
    count: a.exam?.pwdStudents || 0,
    label: a.exam?.courseCode
  }));

  let currentPwdExamIdx = 0;
  while (nextAccIdx < (room.accessibleSeats || 0) && remainingPwd.some(r => r.count > 0)) {
    for (let i = 0; i < remainingPwd.length; i++) {
      const idx = (currentPwdExamIdx + i) % remainingPwd.length;
      if (remainingPwd[idx].count > 0) {
        seats[nextAccIdx].occupant = { type: 'pwd', alloc: remainingPwd[idx].alloc, label: remainingPwd[idx].label };
        remainingPwd[idx].count--;
        nextAccIdx++;
        currentPwdExamIdx = (idx + 1) % remainingPwd.length;
        break;
      }
    }
  }

  // Assign Standard seats (Alternating)
  const remainingStd = sharedAllocs.map(a => {
    const pwdAssignedHere = seats.filter(s => s.occupant?.alloc?.id === a.id && s.occupant?.type === 'pwd').length;
    return {
      alloc: a,
      count: (a.assignedStudents || 0) - pwdAssignedHere,
      label: a.exam?.courseCode
    };
  });

  let nextStdIdx = 0;
  let currentStdExamIdx = 0;
  
  while (remainingStd.some(r => r.count > 0)) {
    // Advance to the next available empty seat (fills unused PWD seats too!)
    while (nextStdIdx < capacity && seats[nextStdIdx].occupant) {
      nextStdIdx++;
    }
    
    if (nextStdIdx >= capacity) break;

    for (let i = 0; i < remainingStd.length; i++) {
      const idx = (currentStdExamIdx + i) % remainingStd.length;
      if (remainingStd[idx].count > 0) {
        seats[nextStdIdx].occupant = { type: 'standard', alloc: remainingStd[idx].alloc, label: remainingStd[idx].label };
        remainingStd[idx].count--;
        nextStdIdx++;
        currentStdExamIdx = (idx + 1) % remainingStd.length;
        break;
      }
    }
  }

  // Colors for multiple exams (up to 4, fallback to primary)
  const examColors = [
    { bg: 'bg-primary/20', border: 'border-primary/50', text: 'text-primary-foreground' },
    { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-700 dark:text-emerald-400' },
    { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-700 dark:text-amber-400' },
    { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-700 dark:text-purple-400' },
  ];

  const getOccupantStyle = (occupant) => {
    if (!occupant) return 'bg-muted/50 border-border/50 text-muted-foreground';
    const idx = sharedAllocs.findIndex(a => a.id === occupant.alloc.id);
    const color = examColors[idx % examColors.length];
    
    // Both PWD and standard students get the exam color so we can tell which subject they belong to
    return `${color.bg} ${color.border} ${color.text} font-bold shadow-sm`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seat Matrix: {room.name}</DialogTitle>
          <DialogDescription>
            {sharedAllocs.length > 1 ? "Shared Room Allocation" : `${exam.courseCode} (${exam.courseName})`}
          </DialogDescription>
        </DialogHeader>

        {alloc.status === 'partial' && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded-lg flex flex-col gap-1 mx-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">Partial Allocation</span>
            </div>
            <p className="text-xs font-medium whitespace-pre-wrap font-mono">
              {(() => {
                try {
                  const storedErrors = JSON.parse(localStorage.getItem('last_schedule_errors') || '[]');
                  const specificError = storedErrors.find(e => e.includes(exam.courseCode));
                  if (specificError) return specificError;
                } catch(e) {}
                
                return `The AI solver could not fully accommodate this exam. Check the dashboard errors for details.${!fac ? ' Missing Invigilator.' : ''}`;
              })()}
            </p>
          </div>
        )}
        
        {/* Invigilators & Swap Action */}
        <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border rounded-lg mb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Assigned Invigilators</p>
              <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onSwapClick('faculty'); }} className="h-8">
                <UserMinus className="w-3.5 h-3.5 mr-2" />
                Last-Minute Swap
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
                {sharedAllocs.map(a => (
                    <div key={a.id} className="space-y-1">
                        <p className="text-sm font-semibold">{a.fac?.name || "Unassigned"} <span className="text-xs font-normal text-muted-foreground">({a.exam?.courseCode})</span></p>
                        {a.fac?.taughtSubjects && (
                        <p className="text-[10px] text-muted-foreground bg-muted/50 inline-block px-1.5 py-0.5 rounded-sm">
                            Teaches: {a.fac.taughtSubjects}
                        </p>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4 rounded-sm bg-muted/50 border border-border">
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 border border-background"></div>
            </div>
            <span className="text-sm font-medium">PWD Seat</span>
          </div>
          {sharedAllocs.map((a, idx) => {
             const color = examColors[idx % examColors.length];
             return (
               <div key={a.id} className="flex items-center gap-2">
                 <div className={`w-4 h-4 rounded-sm border ${color.bg} ${color.border}`} />
                 <span className="text-sm font-medium">{a.exam?.courseCode}</span>
               </div>
             )
          })}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-muted border border-border" />
            <span className="text-sm font-medium">Empty</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-muted/10 rounded-lg border border-border">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(32px,1fr))] gap-2">
            {seats.map(seat => {
              const tooltip = seat.occupant 
                ? `Seat ${seat.id}${seat.isAccessible ? ' (Accessible)' : ''} - ${seat.occupant.label} (${seat.occupant.type})` 
                : `Seat ${seat.id}${seat.isAccessible ? ' (Accessible)' : ''} - Empty`;

              return (
                <div 
                  key={seat.id}
                  title={tooltip}
                  className={`
                    relative aspect-square rounded-md border flex items-center justify-center text-[10px] font-mono transition-colors
                    ${getOccupantStyle(seat.occupant)}
                  `}
                >
                  {seat.id}
                  {seat.occupant?.type === 'pwd' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 shadow-sm border border-background"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
