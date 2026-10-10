import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ExamCard } from "./ExamCard";

export function ScheduleGrid({ allocations }) {
  const containerRef = useRef();

  useGSAP(() => {
    if (allocations && allocations.length > 0) {
      gsap.from(".exam-card-anim", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power3.out",
        clearProps: "all"
      });
    }
  }, { dependencies: [allocations], scope: containerRef });

  if (!allocations || allocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📅</span>
        </div>
        <p className="text-lg font-medium text-foreground">No Schedule Generated</p>
        <p className="text-sm">Click "Generate Schedule" in the sidebar to populate the timeline.</p>
      </div>
    );
  }

  // Group allocations by Date and Time for a pseudo-timeline effect
  const grouped = allocations.reduce((acc, alloc) => {
    if (!alloc.exam) return acc;
    const key = `${alloc.exam.examDate} | ${alloc.exam.startTime}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(alloc);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort();

  return (
    <div className="space-y-12 pb-24 pt-4" ref={containerRef}>
      {sortedKeys.map((timeSlot) => (
        <div key={timeSlot} className="relative">
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mb-6 border-b border-border/40 flex items-baseline gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{timeSlot}</h2>
            <Badge variant="secondary" className="font-mono text-xs text-muted-foreground bg-muted/40 hover:bg-muted/40 px-2 py-0.5 rounded-md">
              {grouped[timeSlot].length} Exams
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-1">
            {grouped[timeSlot].map((alloc) => (
              <div key={alloc.id} className="exam-card-anim">
                <ExamCard alloc={alloc} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Inline badge for the grouping header
function Badge({ children, className, ...props }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>
      {children}
    </span>
  );
}
