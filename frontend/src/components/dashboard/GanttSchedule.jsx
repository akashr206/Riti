import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Sparkles, BrainCircuit, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import ReactMarkdown from "react-markdown";
import { ExamCard } from "./ExamCard";
import { SeatMatrixModal } from "./SeatMatrixModal";
import { EmergencySwapModal } from "./EmergencySwapModal";

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

export function GanttSchedule({ allocations, refreshData }) {
    const containerRef = useRef();
    const [selectedAlloc, setSelectedAlloc] = useState(null);
    const [swapConfig, setSwapConfig] = useState(null);
    const [reasoningData, setReasoningData] = useState({});
    const [isStreaming, setIsStreaming] = useState(false);
    const [activeReasoningDate, setActiveReasoningDate] = useState(null);

    const handleGenerateReasoning = async () => {
        if (isStreaming) return;
        setIsStreaming(true);
        setReasoningData({});
        setActiveReasoningDate(null); // Reset open panels
        
        try {
            const token = localStorage.getItem("riti_token");
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
            const response = await fetch(`${API_URL}/schedule/insights/stream`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (!response.body) throw new Error("No readable stream");
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = "";
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                
                const parts = fullText.split(/###\s+/);
                const newData = {};
                for (const part of parts) {
                    if (!part.trim()) continue;
                    const lines = part.split("\n");
                    const dateHeader = lines[0].trim();
                    const content = lines.slice(1).join("\n").trim();
                    if (dateHeader.length >= 10) {
                        const dateKey = dateHeader.substring(0, 10);
                        newData[dateKey] = content;
                    }
                }
                setReasoningData(newData);
            }
        } catch (e) {
            console.error("Stream failed:", e);
        } finally {
            setIsStreaming(false);
        }
    };

    useGSAP(
        () => {
            if (allocations && allocations.length > 0) {
                const tl = gsap.timeline({
                    defaults: { ease: "power3.out" },
                });

                tl.from(".date-header", {
                    y: -10,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    clearProps: "all",
                }).from(
                    ".gantt-anim",
                    {
                        x: -15,
                        opacity: 0,
                        duration: 0.5,
                        stagger: 0.04,
                        clearProps: "all",
                    },
                    "-=0.3",
                );
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
        <div
            id="gantt-schedule-container"
            className="overflow-x-auto pb-12 h-full flex-1"
            ref={containerRef}
        >
            <div
                id="gantt-inner-wrapper"
                className="flex flex-col gap-6 bg-background p-4 min-w-max relative"
            >
                <div className="flex items-center justify-between sticky left-0 z-40 bg-background/95 backdrop-blur-md py-4 px-2 border-b w-full border-border/40 min-w-max -mt-4 mb-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="font-medium text-foreground tracking-tight">{allocations.length} Total Allocations</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>{sortedDates.length} Active Days</span>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleGenerateReasoning} disabled={isStreaming} className="shadow-sm font-medium transition-all hover:bg-muted">
                        {isStreaming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-primary" />}
                        {isStreaming ? "Analyzing..." : "Generate Daily Reasoning"}
                    </Button>
                </div>
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
                        const durationMins = a.exam.durationMinutes || 180;
                        const end = start + durationMins;
                        if (start < minStart) minStart = start;
                        if (end > maxEnd) maxEnd = end;
                    });

                    minStart = Math.min(Math.floor(minStart / 60) * 60, 9 * 60);
                    maxEnd = Math.max(Math.ceil(maxEnd / 60) * 60, 17 * 60);

                    const timeSlots = [];
                    for (let t = minStart; t < maxEnd; t += 60) {
                        timeSlots.push({
                            timeMins: t,
                            timeStr: formatTime(t),
                            shortStr: formatTimeShort(t),
                        });
                    }

                    const slotWidthPerHour = 120;

                    const roomChunks = [];
                    for (let i = 0; i < rooms.length; i += 5) {
                        roomChunks.push(rooms.slice(i, i + 5));
                    }

                    return roomChunks.map((chunkRooms, chunkIdx) => (
                        <div
                            key={`${date}-${chunkIdx}`}
                            className="flex flex-col gantt-page-chunk print:break-inside-avoid print:break-after-page print:mb-0 mb-12 bg-background p-4 min-w-max"
                        >
                            <h3 className="text-xl font-bold text-foreground mb-4 sticky left-0 px-2 date-header flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span>
                                        {new Date(date).toLocaleDateString(
                                            undefined,
                                            {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            },
                                        )}
                                    </span>
                                    {(reasoningData[date] || isStreaming) && (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={() => setActiveReasoningDate(activeReasoningDate === date ? null : date)}
                                            className={`h-7 text-xs px-3 shadow-sm rounded-md transition-all ${activeReasoningDate === date ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                                        >
                                            <BrainCircuit className="w-3 h-3 mr-1.5" />
                                            {activeReasoningDate === date ? "Hide Reasoning" : "Show Reasoning"}
                                        </Button>
                                    )}
                                </div>
                                {roomChunks.length > 1 && (
                                    <span className="text-sm font-normal text-muted-foreground ml-4">
                                        (Part {chunkIdx + 1} of{" "}
                                        {roomChunks.length})
                                    </span>
                                )}
                            </h3>
                            
                            {activeReasoningDate === date && (
                                <div className="sticky left-6 top-16 mb-6 mt-[-10px] w-full max-w-[500px] bg-card/95 backdrop-blur-2xl shadow-xl border border-primary/20 rounded-xl p-5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 z-50 font-normal">
                                    <div className="flex items-center justify-between mb-4 border-b pb-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2 tracking-tight text-foreground">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            AI Auditor Insights
                                        </h4>
                                        <button onClick={() => setActiveReasoningDate(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none 
                                        prose-p:leading-relaxed prose-p:mb-4 prose-p:text-muted-foreground
                                        prose-strong:text-foreground prose-strong:block prose-strong:mb-1.5 prose-strong:text-xs prose-strong:uppercase prose-strong:tracking-wider prose-strong:font-bold
                                        prose-ul:list-none prose-ul:p-0 prose-ul:m-0 prose-ul:space-y-3
                                        prose-ol:list-none prose-ol:p-0 prose-ol:m-0 prose-ol:space-y-3
                                        prose-li:bg-muted/40 prose-li:p-4 prose-li:rounded-xl prose-li:m-0 prose-li:border prose-li:border-border/50 prose-li:text-muted-foreground prose-li:shadow-sm
                                        text-[13px]">
                                        {reasoningData[date] ? (
                                            <ReactMarkdown>{reasoningData[date]}</ReactMarkdown>
                                        ) : (
                                            <div className="flex items-center text-muted-foreground/70 italic gap-3 py-4 px-2 bg-muted/20 rounded-xl">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                Processing optimal layout...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <div className="inline-block min-w-max bg-card print:bg-transparent rounded-none border border-border relative">
                                <div className="flex border-b border-border bg-muted/20 print:bg-transparent sticky top-0 z-20">
                                    <div className="w-40 min-w-[160px] max-w-[160px] flex-none font-bold text-muted-foreground text-xs uppercase tracking-wider flex items-center p-3 border-r border-border sticky left-0 bg-muted/95 print:bg-transparent backdrop-blur z-30 overflow-hidden">
                                        Rooms
                                    </div>
                                    <div className="flex">
                                        {timeSlots.map((ts) => (
                                            <div
                                                key={ts.timeMins}
                                                style={{
                                                    width: slotWidthPerHour,
                                                }}
                                                className="shrink-0 font-semibold text-foreground text-sm p-3 border-r border-border relative bg-background print:bg-transparent"
                                            >
                                                {ts.shortStr}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {chunkRooms.map((room, i) => {
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
                                                alloc.exam.durationMinutes ||
                                                180;

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

                                        let maxOverlapCount = 1;
                                        blocks.forEach((block) => {
                                            if (block.type === "exam") {
                                                const overlappingExams =
                                                    blocks.filter(
                                                        (b) =>
                                                            b.type === "exam" &&
                                                            Math.max(
                                                                b.startMins,
                                                                block.startMins,
                                                            ) <
                                                                Math.min(
                                                                    b.startMins +
                                                                        b.durationMins,
                                                                    block.startMins +
                                                                        block.durationMins,
                                                                ),
                                                    );
                                                if (
                                                    overlappingExams.length >
                                                    maxOverlapCount
                                                ) {
                                                    maxOverlapCount =
                                                        overlappingExams.length;
                                                }
                                            }
                                        });

                                        const TRACK_HEIGHT = 120;
                                        const rowMinHeight = Math.max(
                                            TRACK_HEIGHT,
                                            maxOverlapCount * TRACK_HEIGHT,
                                        );

                                        return (
                                            <div
                                                key={room}
                                                className={`flex gantt-anim print:break-inside-avoid ${i !== chunkRooms.length - 1 ? "border-b border-border" : ""}`}
                                            >
                                                <div className="w-40 min-w-[160px] max-w-[160px] flex-none font-semibold text-foreground text-sm p-3 border-r border-border flex items-center justify-center bg-muted/10 print:bg-transparent sticky left-0 z-10 overflow-hidden text-center">
                                                    <span className="truncate">
                                                        {room}
                                                    </span>
                                                </div>
                                                <div
                                                    className="flex relative"
                                                    style={{
                                                        minHeight: `${rowMinHeight}px`,
                                                    }}
                                                >
                                                    <div className="flex">
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
                                                                            className="absolute top-0 bottom-0 z-0 flex items-center justify-center pointer-events-auto bg-background/95 print:bg-transparent backdrop-blur-sm"
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
                                                                    const overlappingExams =
                                                                        blocks.filter(
                                                                            (
                                                                                b,
                                                                            ) =>
                                                                                b.type ===
                                                                                    "exam" &&
                                                                                Math.max(
                                                                                    b.startMins,
                                                                                    block.startMins,
                                                                                ) <
                                                                                    Math.min(
                                                                                        b.startMins +
                                                                                            b.durationMins,
                                                                                        block.startMins +
                                                                                            block.durationMins,
                                                                                    ),
                                                                        );
                                                                    const overlapCount =
                                                                        overlappingExams.length;
                                                                    const overlapIndex =
                                                                        overlappingExams.indexOf(
                                                                            block,
                                                                        );
                                                                    const topOffset = `${(100 / overlapCount) * overlapIndex}%`;
                                                                    const height = `${100 / overlapCount}%`;

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                block
                                                                                    .alloc
                                                                                    .id
                                                                            }
                                                                            className="absolute z-10 border-r border-l border-border bg-card print:bg-transparent hover:z-20 transition-all pointer-events-auto cursor-pointer"
                                                                            style={{
                                                                                left: leftOffset,
                                                                                width: cardWidth,
                                                                                top: topOffset,
                                                                                height: height,
                                                                            }}
                                                                            onClick={() =>
                                                                                setSelectedAlloc(
                                                                                    block.alloc,
                                                                                )
                                                                            }
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
                    ));
                })}
            </div>
            <SeatMatrixModal
                open={!!selectedAlloc}
                onOpenChange={(val) => !val && setSelectedAlloc(null)}
                alloc={selectedAlloc}
                allAllocations={allocations}
                onSwapClick={(type) =>
                    setSwapConfig({ alloc: selectedAlloc, type })
                }
            />
            <EmergencySwapModal
                open={!!swapConfig}
                onOpenChange={(val) => !val && setSwapConfig(null)}
                alloc={swapConfig?.alloc}
                disruptionType={swapConfig?.type}
                onSuccess={() => {
                    setSwapConfig(null);
                    setSelectedAlloc(null);
                    refreshData && refreshData();
                }}
            />
        </div>
    );
}
