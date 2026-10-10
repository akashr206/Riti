import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ExamCard } from "./ExamCard";

export function CalendarSchedule({ allocations }) {
  const containerRef = useRef();

  useGSAP(() => {
    if (allocations && allocations.length > 0) {
      gsap.from(".cal-anim", {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.03,
        ease: "power2.out"
      });
    }
  }, { dependencies: [allocations], scope: containerRef });

  if (!allocations?.length) return null;

  const dates = [...new Set(allocations.map(a => a.exam.examDate))].sort();
  const times = [...new Set(allocations.map(a => a.exam.startTime))].sort();

  return (
    <div className="overflow-x-auto pb-12" ref={containerRef}>
      <div className="inline-block min-w-full bg-card rounded-xl border shadow-sm p-4">
        
        {/* X-Axis Header (Dates) */}
        <div className="flex border-b border-border pb-3 mb-4">
          <div className="w-20 shrink-0"></div>
          {dates.map(date => (
            <div key={date} className="flex-1 min-w-[220px] text-center border-l-2 border-primary/20 pl-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">Date</span>
              <span className="text-lg font-bold text-foreground">{date}</span>
            </div>
          ))}
        </div>
        
        {/* Y-Axis Rows (Time Slots) */}
        <div className="space-y-6">
          {times.map((time, i) => (
            <div key={time} className={`flex cal-anim pb-6 ${i !== times.length - 1 ? 'border-b border-border/40' : ''}`}>
              <div className="w-20 shrink-0 font-semibold text-muted-foreground text-xs pt-1.5 text-right pr-3">
                {time}
              </div>
              {dates.map(date => {
                const allocs = allocations.filter(a => a.exam.examDate === date && a.exam.startTime === time);
                return (
                  <div key={date} className="flex-1 min-w-[220px] border-l border-border/20 pl-3 space-y-3">
                    {allocs.length > 0 ? (
                      allocs.map(alloc => <ExamCard key={alloc.id} alloc={alloc} />)
                    ) : (
                      <div className="h-[90px] border-2 border-dashed border-border/30 rounded-lg flex items-center justify-center text-[10px] font-medium text-muted-foreground/40 bg-muted/10">
                        No Exams
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
