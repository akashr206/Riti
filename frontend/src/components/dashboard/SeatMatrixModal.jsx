import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { UserMinus, AlertTriangle } from "lucide-react";

export function SeatMatrixModal({ open, onOpenChange, alloc, allAllocations, onSwapClick }) {
  if (!alloc || !alloc.room) return null;

  const { room, exam, fac, assignedStudents } = alloc;
  const capacity = room.capacity;
  const occupied = assignedStudents || 0;
  
  // Calculate PWD occupied by simulating the greedy solver assignment
  const examAllocs = (allAllocations || []).filter(a => a.examId === exam.id);
  // Sort overlapping rooms by accessible seats descending, just like the solver
  examAllocs.sort((a, b) => (b.room?.accessibleSeats || 0) - (a.room?.accessibleSeats || 0));
  
  let remainingPwd = exam.pwdStudents || 0;
  let thisRoomPwdOccupied = 0;
  
  for (const a of examAllocs) {
    if (remainingPwd <= 0) break;
    const roomAcc = a.room?.accessibleSeats || 0;
    const pwdHere = Math.min(remainingPwd, roomAcc);
    if (a.roomId === room.id) {
      thisRoomPwdOccupied = pwdHere;
      break;
    }
    remainingPwd -= pwdHere;
  }
  
  // Create an array representing all seats
  const seats = Array.from({ length: capacity }, (_, i) => ({
    id: i + 1,
    isOccupied: i < occupied,
    isPwd: i < thisRoomPwdOccupied
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seat Matrix: {room.name}</DialogTitle>
          <DialogDescription>
            {exam.courseCode} ({exam.courseName})
          </DialogDescription>
        </DialogHeader>

        {alloc.status === 'partial' && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded-lg flex flex-col gap-1 mx-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">Partial Allocation</span>
            </div>
            <p className="text-xs font-medium">
              The AI solver could not fully accommodate this exam. Check the dashboard errors for details on capacity or accessibility shortfalls.
              {!fac && " Missing Invigilator."}
            </p>
          </div>
        )}
        
        {/* Invigilator & Swap Action */}
        <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg mb-2">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Assigned Invigilator</p>
            <p className="text-sm font-semibold">{fac?.name || "Unassigned"}</p>
            {fac?.taughtSubjects && (
              <p className="text-[10px] text-muted-foreground bg-muted/50 inline-block px-1.5 py-0.5 rounded-sm">
                Teaches: {fac.taughtSubjects}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onSwapClick('faculty'); }} className="h-8">
            <UserMinus className="w-3.5 h-3.5 mr-2" />
            Last-Minute Swap
          </Button>
        </div>

        <div className="flex gap-4 justify-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-blue-500/20 border border-blue-500/50" />
            <span className="text-sm font-medium">PWD ({thisRoomPwdOccupied})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-primary/20 border border-primary/50" />
            <span className="text-sm font-medium">Standard ({occupied - thisRoomPwdOccupied})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-muted border border-border" />
            <span className="text-sm font-medium">Empty ({capacity - occupied})</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-muted/10 rounded-lg border border-border">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(32px,1fr))] gap-2">
            {seats.map(seat => (
              <div 
                key={seat.id}
                title={`Seat ${seat.id}${seat.isPwd ? ' (PWD)' : ''}`}
                className={`
                  aspect-square rounded-md border flex items-center justify-center text-[10px] font-mono transition-colors
                  ${seat.isPwd
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-400 font-bold shadow-sm'
                    : seat.isOccupied 
                      ? 'bg-primary/20 border-primary/50 text-primary-foreground font-bold shadow-sm' 
                      : 'bg-muted/50 border-border/50 text-muted-foreground'}
                `}
              >
                {seat.id}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
