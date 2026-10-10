import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Badge } from "../ui/badge";

export function SeatMatrixModal({ open, onOpenChange, alloc }) {
  if (!alloc || !alloc.room) return null;

  const { room, exam, assignedStudents } = alloc;
  const capacity = room.capacity;
  const occupied = assignedStudents || 0;
  
  // Create an array representing all seats
  const seats = Array.from({ length: capacity }, (_, i) => ({
    id: i + 1,
    isOccupied: i < occupied
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
        
        <div className="flex gap-4 justify-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-primary/20 border border-primary/50" />
            <span className="text-sm font-medium">Occupied ({occupied})</span>
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
                title={`Seat ${seat.id}`}
                className={`
                  aspect-square rounded-md border flex items-center justify-center text-[10px] font-mono transition-colors
                  ${seat.isOccupied 
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
