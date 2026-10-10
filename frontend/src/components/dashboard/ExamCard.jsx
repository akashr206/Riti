import React from "react";
import { Card, CardContent } from "../ui/card";
import { MapPin, User } from "lucide-react";
import { Badge } from "../ui/badge";

export function ExamCard({ alloc }) {
  const { exam, room, fac } = alloc;
  if (!exam) return null;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 border-0 rounded-none bg-transparent hover:bg-muted/30 h-full w-full">
      <CardContent className="p-3 flex flex-col h-full justify-between gap-4">
        
        {/* Top Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight leading-none text-foreground">
              {exam.courseCode}
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground line-clamp-1">
              {exam.courseName}
            </p>
          </div>
          {/* Status & Capacity */}
          <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
            {room && (
              <span className="text-[9px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-sm">
                {alloc.assignedStudents || 0}/{room.capacity}
              </span>
            )}
            {alloc.status === 'partial' ? (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" title="Partial Allocation" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
            )}
          </div>
        </div>

        {/* Bottom Details - Invigilator Full Name */}
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <User className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.5} />
            <span className="text-[11px] font-medium text-foreground leading-snug break-words">
              {fac?.name || "Unassigned"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
