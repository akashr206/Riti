import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Loader2, AlertCircle, Sparkles, LayoutGrid, Users, MapPin, Database } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "./components/ui/dialog";
import { GanttSchedule } from "./components/dashboard/GanttSchedule";
import { FacultyDirectory } from "./components/dashboard/FacultyDirectory";
import { RoomsDirectory } from "./components/dashboard/RoomsDirectory";
import { ExamsDatabase } from "./components/dashboard/ExamsDatabase";
import { AIAuditor } from "./components/dashboard/AIAuditor";
import { ExportPDFModal } from "./components/dashboard/ExportPDFModal";
import { fetchExams, fetchRooms, fetchFaculty, fetchAllocations, generateSchedule } from "./api";

export default function Dashboard({ onLogout }) {
  const [data, setData] = useState({
    exams: [],
    rooms: [],
    faculty: [],
    allocations: []
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState("matrix");

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [examsRes, roomsRes, facultyRes, allocRes] = await Promise.all([
        fetchExams(),
        fetchRooms(),
        fetchFaculty(),
        fetchAllocations(),
      ]);
      
      setData({
        exams: examsRes,
        rooms: roomsRes,
        faculty: facultyRes,
        allocations: allocRes
      });
      if (showLoader) setError(null);
    } catch (err) {
      setError("Failed to fetch dashboard data. Make sure the backend is running.");
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
        setError("PARTIAL SCHEDULE GENERATED WITH CONFLICTS:\n\n" + res.errors.join('\n\n'));
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
  const richAllocations = data.allocations.map(a => {
    const exam = data.exams.find(e => e.id === a.examId);
    const room = data.rooms.find(r => r.id === a.roomId);
    const fac = data.faculty.find(f => f.id === a.facultyId);
    return { ...a, exam, room, fac };
  });

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground font-sans">
      
      {/* Left Sidebar: Controls & Resources */}
      <aside className="w-80 border-r border-border/50 bg-muted/10 flex flex-col h-full z-10 shrink-0">
        <div className="p-6 pb-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <img src="/logo.png" alt="Logo" className="w-8 h-auto" />
            <h1 className="text-xl font-bold tracking-tight">RITI Scheduler</h1>
          </div>
          <p className="text-xs text-muted-foreground">Command Center</p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <Button 
            onClick={handleGenerateSchedule} 
            disabled={generating}
            className="w-full shadow-md"
            size="lg"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Synthesizing...</>
            ) : (
              "Generate Schedule"
            )}
          </Button>

          {data.allocations.length > 0 && (
            <ExportPDFModal 
              data={data} 
              richAllocations={richAllocations} 
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}

          {error && (
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs whitespace-pre-wrap">{error}</AlertDescription>
            </Alert>
          )}

          <nav className="space-y-1 mt-4">
            <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Views</h3>
            
            <button 
              onClick={() => setCurrentPage("matrix")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'matrix' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Room Matrix
            </button>
            <button 
              onClick={() => setCurrentPage("faculty")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'faculty' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Users className="w-4 h-4" /> Faculty Directory
            </button>
            <button 
              onClick={() => setCurrentPage("rooms")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'rooms' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <MapPin className="w-4 h-4" /> Rooms & Capacities
            </button>
            <button 
              onClick={() => setCurrentPage("exams")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'exams' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Database className="w-4 h-4" /> Exam Database
            </button>
          </nav>

          <div className="pt-4 border-t border-border/50 space-y-4 mt-auto">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resources</h3>
            <div className="grid grid-cols-2 gap-2">
               <div className="bg-background rounded-md border p-3 text-center shadow-sm">
                 <p className="text-2xl font-bold text-primary">{data.exams.length}</p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Exams</p>
               </div>
               <div className="bg-background rounded-md border p-3 text-center shadow-sm">
                 <p className="text-2xl font-bold text-primary">{data.allocations.length}</p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Allocations</p>
               </div>
               <div className="bg-background rounded-md border p-3 text-center shadow-sm">
                 <p className="text-2xl font-bold text-primary">{data.rooms.length}</p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Rooms</p>
               </div>
               <div className="bg-background rounded-md border p-3 text-center shadow-sm">
                 <p className="text-2xl font-bold text-primary">{data.faculty.length}</p>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Faculty</p>
               </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Center Canvas: The Schedule Grid */}
      <main className="flex-1 overflow-y-auto bg-muted/5 relative scroll-smooth flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 p-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {currentPage === 'matrix' && 'Room Matrix'}
            {currentPage === 'faculty' && 'Faculty Workload'}
            {currentPage === 'rooms' && 'Rooms & Capacities'}
            {currentPage === 'exams' && 'Master Exam Database'}
          </h2>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border h-9 px-3 text-sm bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20 hover:text-indigo-600 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 mr-2" /> AI Co-Pilot
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <AIAuditor />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentPage === 'matrix' && <div className="flex-1 overflow-hidden p-6"><GanttSchedule allocations={richAllocations} refreshData={() => fetchData(false)} /></div>}
          {currentPage === 'faculty' && <FacultyDirectory faculty={data.faculty} allocations={richAllocations} refreshData={() => fetchData(false)} />}
          {currentPage === 'rooms' && <RoomsDirectory rooms={data.rooms} allocations={richAllocations} refreshData={() => fetchData(false)} />}
          {currentPage === 'exams' && <ExamsDatabase exams={data.exams} allocations={richAllocations} refreshData={() => fetchData(false)} />}
        </div>
      </main>
    </div>
  );
}
