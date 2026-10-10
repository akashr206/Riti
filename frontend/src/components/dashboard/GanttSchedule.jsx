import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ExamCard } from "./ExamCard";
import { SeatMatrixModal } from "./SeatMatrixModal";

const parseTime = (str) => {
    if (!str) return 0;
    const [h, m] = str.split(":").map(Number);
    return h * 60 + (m || 0);
};

const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
};

const formatTimeShort = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export function GanttSchedule({ allocations }) {
    const containerRef = useRef();
    const [selectedAlloc, setSelectedAlloc] = useState(null);

    useGSAP(
        () => {
            if (allocations && allocations.length > 0) {
                gsap.from(".gantt-anim", {
                    x: -20,
                    opacity: 0,
                    duration: 0.4,
                    stagger: 0.03,
                    ease: "power2.out",
                });
            }
        },
        { dependencies: [allocations], scope: containerRef },
    );

    if (!allocations?.length) return null;

    const groupedByDate = {};
    allocations.forEach((a) => {
        if (!groupedByDate[a.exam.examDate]) {
            groupedByDate[a.exam.examDate] = [];
        }
        groupedByDate[a.exam.examDate].push(a);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    return (
        <div className="overflow-x-auto pb-12 h-full flex-1" ref={containerRef}>
            <div className="flex flex-col gap-12">
                {sortedDates.map((date) => {
                    const dateAllocations = groupedByDate[date];
                    const rooms = [
                        ...new Set(
                            dateAllocations
                                .map((a) => a.room?.name)
                                .filter(Boolean),
                        ),
                    ].sort();

                    let minStart = 24 * 60;
                    let maxEnd = 0;

                    dateAllocations.forEach((a) => {
                        const start = parseTime(a.exam.startTime);
                        const durationMins = (a.exam.duration || 3) * 60;
                        const end = start + durationMins;
                        if (start < minStart) minStart = start;
                        if (end > maxEnd) maxEnd = end;
                    });

                    minStart = Math.floor(minStart / 60) * 60;
                    maxEnd = Math.ceil(maxEnd / 60) * 60;

                    if (minStart >= maxEnd) {
                        minStart = 9 * 60;
                        maxEnd = 17 * 60;
                    }

                    const timeSlots = [];
                    for (let t = minStart; t < maxEnd; t += 60) {
                        timeSlots.push({
                            timeMins: t,
                            timeStr: formatTime(t),
                            shortStr: formatTimeShort(t),
                        });
                    }

                    const slotWidthPerHour = 120;

                    return (
                        <div key={date} className="flex flex-col">
                            <h3 className="text-xl font-bold text-foreground mb-4 sticky left-0 px-2">
                                {new Date(date).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </h3>
                            <div className="inline-block min-w-max bg-card rounded-none border border-border relative">
                                <div className="flex border-b border-border bg-muted/20 sticky top-0 z-20">
                                    <div className="w-40 shrink-0 font-bold text-muted-foreground text-xs uppercase tracking-wider flex items-center p-3 border-r border-border sticky left-0 bg-muted/95 backdrop-blur z-30">
                                        Rooms
                                    </div>
                                    <div className="flex">
                                        {timeSlots.map((ts) => (
                                            <div
                                                key={ts.timeMins}
                                                style={{
                                                    width: slotWidthPerHour,
                                                }}
                                                className="shrink-0 font-semibold text-foreground text-sm p-3 border-r border-border relative bg-background"
                                            >
                                                {ts.shortStr}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {rooms.map((room, i) => {
                                        const roomAllocations =
                                            dateAllocations.filter(
                                                (a) => a.room?.name === room,
                                            );
                                        roomAllocations.sort(
                                            (a, b) =>
                                                parseTime(a.exam.startTime) -
                                                parseTime(b.exam.startTime),
                                        );

                                        const blocks = [];
                                        let currentMins = minStart;

                                        for (const alloc of roomAllocations) {
                                            const startMins = parseTime(
                                                alloc.exam.startTime,
                                            );
                                            const durationMins =
                                                (alloc.exam.duration || 3) * 60;

                                            if (startMins > currentMins) {
                                                blocks.push({
                                                    type: "empty",
                                                    startMins: currentMins,
                                                    durationMins:
                                                        startMins - currentMins,
                                                });
                                            }

                                            blocks.push({
                                                type: "exam",
                                                alloc,
                                                startMins: startMins,
                                                durationMins: durationMins,
                                            });

                                            currentMins =
                                                startMins + durationMins;
                                        }

                                        if (currentMins < maxEnd) {
                                            blocks.push({
                                                type: "empty",
                                                startMins: currentMins,
                                                durationMins:
                                                    maxEnd - currentMins,
                                            });
                                        }

                                        return (
                                            <div
                                                key={room}
                                                className={`flex gantt-anim ${i !== rooms.length - 1 ? "border-b border-border" : ""}`}
                                            >
                                                <div className="w-40 shrink-0 font-semibold text-foreground text-sm p-3 border-r border-border flex items-center justify-center bg-muted/10 sticky left-0 z-10">
                                                    {room}
                                                </div>
                                                <div className="flex-1 flex relative min-h-[120px]">
                                                    <div className="flex w-full">
                                                        {timeSlots.map((ts) => (
                                                            <div
                                                                key={
                                                                    ts.timeMins
                                                                }
                                                                style={{
                                                                    width: slotWidthPerHour,
                                                                }}
                                                                className="shrink-0 border-r border-border h-full"
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {blocks.map(
                                                            (block, idx) => {
                                                                const leftOffset =
                                                                    ((block.startMins -
                                                                        minStart) /
                                                                        60) *
                                                                    slotWidthPerHour;
                                                                const cardWidth =
                                                                    (block.durationMins /
                                                                        60) *
                                                                    slotWidthPerHour;

                                                                if (
                                                                    block.type ===
                                                                    "empty"
                                                                ) {
                                                                    return (
                                                                        <div
                                                                            key={`empty-${idx}`}
                                                                            className="absolute top-0 bottom-0 z-0 flex items-center justify-center pointer-events-auto bg-background/95 backdrop-blur-sm"
                                                                            style={{
                                                                                left: leftOffset,
                                                                                width: cardWidth,
                                                                            }}
                                                                        >
                                                                            <span className="text-[11px] text-muted-foreground/50 font-medium tracking-wider uppercase">
                                                                                Available
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                block
                                                                                    .alloc
                                                                                    .id
                                                                            }
                                                                            className="absolute top-0 bottom-0 z-10 border-r border-l border-border bg-card hover:z-20 transition-all pointer-events-auto cursor-pointer"
                                                                            style={{
                                                                                left: leftOffset,
                                                                                width: cardWidth,
                                                                            }}
                                                                            onClick={() => setSelectedAlloc(block.alloc)}
                                                                        >
                                                                            <ExamCard
                                                                                alloc={
                                                                                    block.alloc
                                                                                }
                                                                            />
                                                                        </div>
                                                                    );
                                                                }
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <SeatMatrixModal 
                open={!!selectedAlloc} 
                onOpenChange={(val) => !val && setSelectedAlloc(null)} 
                alloc={selectedAlloc} 
            />
        </div>
    );
}
