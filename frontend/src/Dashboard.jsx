import React, { useState, useEffect } from "react";
import { Button, buttonVariants } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import {
    Loader2,
    AlertCircle,
    Sparkles,
    LayoutGrid,
    Users,
    MapPin,
    Database,
    BarChart2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "./components/ui/dialog";
import { GanttSchedule } from "./components/dashboard/GanttSchedule";
import { FacultyDirectory } from "./components/dashboard/FacultyDirectory";
import { RoomsDirectory } from "./components/dashboard/RoomsDirectory";
import { ExamsDatabase } from "./components/dashboard/ExamsDatabase";

import { ExportPDFModal } from "./components/dashboard/ExportPDFModal";
import { SmartIngestionHub } from "./components/dashboard/SmartIngestionHub";
import {
    fetchExams,
    fetchRooms,
    fetchFaculty,
    fetchAllocations,
    generateSchedule,
} from "./api";

export default function Dashboard({ onLogout }) {
    const [data, setData] = useState({
        exams: [],
        rooms: [],
        faculty: [],
        allocations: [],
    });
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(() => {
        const hash = window.location.hash.replace("#", "");
        return ["matrix", "faculty", "rooms", "exams", "ingestion"].includes(hash)
            ? hash
            : "matrix";
    });

    useEffect(() => {
        window.location.hash = currentPage;
    }, [currentPage]);

    const fetchData = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const [examsRes, roomsRes, facultyRes, allocRes] =
                await Promise.all([
                    fetchExams(),
                    fetchRooms(),
                    fetchFaculty(),
                    fetchAllocations(),
                ]);

            setData({
                exams: examsRes,
                rooms: roomsRes,
                faculty: facultyRes,
                allocations: allocRes,
            });
            if (showLoader) setError(null);
        } catch (err) {
            setError(
                "Failed to fetch dashboard data. Make sure the backend is running.",
            );
            console.error(err);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerateSchedule = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await generateSchedule();
            await fetchData(false); // fetchData without loader so it's seamless

            if (res.partialSuccess && res.errors) {
                setError(
                    "PARTIAL SCHEDULE GENERATED WITH CONFLICTS:\n\n" +
                        res.errors.join("\n\n"),
                );
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Pre-process allocations to attach relations
    const richAllocations = data.allocations.map((a) => {
        const exam = data.exams.find((e) => e.id === a.examId);
        const room = data.rooms.find((r) => r.id === a.roomId);
        const fac = data.faculty.find((f) => f.id === a.facultyId);
        return { ...a, exam, room, fac };
    });

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground font-sans">
            {/* Left Sidebar: Controls & Resources */}
            <aside className="w-80 border-r border-border/50 bg-muted/10 flex flex-col h-full z-10 shrink-0">
                <div className="p-6 pb-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-8 h-auto"
                        />
                        <h1 className="text-xl font-bold tracking-tight">
                            RITI Scheduler
                        </h1>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Command Center
                    </p>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {error && (
                        <Alert
                            variant="destructive"
                            className="bg-destructive/10"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs whitespace-pre-wrap">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <nav className="space-y-1 mt-4">
                        <button
                            onClick={() => setCurrentPage("matrix")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "matrix" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Allocation Visualizer
                        </button>
                        <button
                            onClick={() => setCurrentPage("faculty")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "faculty" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                            <Users className="w-4 h-4" /> Faculty Directory
                        </button>
                        <button
                            onClick={() => setCurrentPage("rooms")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "rooms" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                            <MapPin className="w-4 h-4" /> Rooms & Capacities
                        </button>
                        <button
                            onClick={() => setCurrentPage("exams")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "exams" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                        >
                            <Database className="w-4 h-4" /> Exam Database
                        </button>
                    </nav>

                    <div className="mt-8">
                        <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Operations
                        </h3>
                        <button
                            onClick={() => setCurrentPage("ingestion")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "ingestion" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground group"}`}
                        >
                            <Sparkles
                                className={`w-4 h-4 ${currentPage === "ingestion" ? "" : "text-muted-foreground"}`}
                            />
                            Smart Import Hub
                        </button>
                    </div>
                </div>
            </aside>

            {/* Center Canvas: The Schedule Grid */}
            <main className="flex-1 overflow-y-auto bg-muted/5 relative scroll-smooth flex flex-col">
                {/* Top bar */}
                <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 p-4 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {currentPage === "matrix" && "Allocation Visualizer"}
                        {currentPage === "faculty" && "Faculty Workload"}
                        {currentPage === "rooms" && "Rooms & Capacities"}
                        {currentPage === "exams" && "Master Exam Database"}
                        {currentPage === "ingestion" && "AI Data Ingestion"}
                    </h2>
                    <div className="flex items-center gap-3">
                        {data.allocations.length > 0 &&
                            currentPage === "matrix" && (
                                <>
                                    <Button
                                        onClick={handleGenerateSchedule}
                                        disabled={generating}
                                        size="lg"
                                        className="font-medium"
                                    >
                                        {generating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Regenerate
                                    </Button>
                                    <ExportPDFModal
                                        data={data}
                                        richAllocations={richAllocations}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                    />
                                    <div className="w-px h-6 bg-border mx-1"></div>
                                </>
                            )}
                        <Dialog>
                            <DialogTrigger
                                className={buttonVariants({
                                    variant: "outline",
                                    size: "lg",
                                    className: "font-medium cursor-pointer",
                                })}
                            >
                                <BarChart2 className="w-4 h-4 text-muted-foreground" />{" "}
                                Resources
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>System Resources</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="bg-background rounded-xl border p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-4xl font-bold text-primary mb-2">
                                            {data.exams.length}
                                        </p>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Exams
                                        </p>
                                    </div>
                                    <div className="bg-background rounded-xl border p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-4xl font-bold text-primary mb-2">
                                            {data.allocations.length}
                                        </p>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Allocations
                                        </p>
                                    </div>
                                    <div className="bg-background rounded-xl border p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-4xl font-bold text-primary mb-2">
                                            {data.rooms.length}
                                        </p>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Rooms
                                        </p>
                                    </div>
                                    <div className="bg-background rounded-xl border p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-4xl font-bold text-primary mb-2">
                                            {data.faculty.length}
                                        </p>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Faculty
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>


                        <Button
                            variant="outline"
                            size="lg"
                            className="font-medium"
                            onClick={onLogout}
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {generating ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-background/50 backdrop-blur-sm z-50 animate-in fade-in duration-300">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                            <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Synthesizing Optimal Layout...</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Running heuristic checks across all constraints, capacities, and faculty workloads.
                            </p>
                        </div>
                    ) : data.allocations.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <Sparkles className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                                Ready to Orchestrate?
                            </h2>
                            <p className="text-muted-foreground max-w-md mb-8">
                                Your database has {data.exams.length} exams,{" "}
                                {data.rooms.length} rooms, and{" "}
                                {data.faculty.length} faculty members. Let our
                                AI copilot instantly synthesize the perfect
                                conflict-free master schedule.
                            </p>
                            <Button
                                onClick={handleGenerateSchedule}
                                disabled={generating}
                                size="lg"
                                className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />{" "}
                                        Synthesizing Master Schedule...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-3 h-5 w-5" />{" "}
                                        Generate First Schedule
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {currentPage === "matrix" && (
                                <div className="flex-1 overflow-hidden p-6">
                                    <GanttSchedule
                                        allocations={richAllocations}
                                        refreshData={() => fetchData(false)}
                                    />
                                </div>
                            )}
                            {currentPage === "faculty" && (
                                <FacultyDirectory
                                    faculty={data.faculty}
                                    allocations={richAllocations}
                                    refreshData={() => fetchData(false)}
                                />
                            )}
                            {currentPage === "rooms" && (
                                <RoomsDirectory
                                    rooms={data.rooms}
                                    allocations={richAllocations}
                                    refreshData={() => fetchData(false)}
                                />
                            )}
                            {currentPage === "exams" && (
                                <ExamsDatabase
                                    exams={data.exams}
                                    allocations={richAllocations}
                                    refreshData={() => fetchData(false)}
                                />
                            )}
                            {currentPage === "ingestion" && (
                                <SmartIngestionHub
                                    refreshData={fetchData}
                                    setPage={setCurrentPage}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
