import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

// Modular sub-components
import { MetricsCards } from "./components/dashboard/MetricsCards";
import { AllocationsTable } from "./components/dashboard/AllocationsTable";
import { ExamsTable } from "./components/dashboard/ExamsTable";
import { RoomsTable } from "./components/dashboard/RoomsTable";
import { FacultyTable } from "./components/dashboard/FacultyTable";
import { AIAuditor } from "./components/dashboard/AIAuditor";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [data, setData] = useState({
    exams: [],
    rooms: [],
    faculty: [],
    allocations: []
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = "http://localhost:5000/api";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, roomsRes, facultyRes, allocRes] = await Promise.all([
        fetch(`${API_BASE}/exams`),
        fetch(`${API_BASE}/rooms`),
        fetch(`${API_BASE}/faculty`),
        fetch(`${API_BASE}/allocations`),
      ]);
      
      setData({
        exams: await examsRes.json(),
        rooms: await roomsRes.json(),
        faculty: await facultyRes.json(),
        allocations: await allocRes.json()
      });
      setError(null);
    } catch (err) {
      setError("Failed to fetch dashboard data. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/schedule/generate`, {
        method: "POST"
      });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.errors ? result.errors.join(", ") : result.error);
      }
      
      await fetchData();
      setActiveTab("schedule");
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
    <div className="min-h-[100dvh] bg-background p-4 md:p-8 text-foreground font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">RITI Scheduler</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage exam allocations, rooms, and faculty.</p>
          </div>
          <Button 
            onClick={handleGenerateSchedule} 
            disabled={generating}
            className="w-full md:w-auto"
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Schedule
          </Button>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scheduling Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Metrics Overview */}
        <MetricsCards 
          examsCount={data.exams.length}
          roomsCount={data.rooms.length}
          facultyCount={data.faculty.length}
          allocationsCount={data.allocations.length}
        />

        {/* Modular Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted text-muted-foreground">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="ai-insights" className="font-medium gap-1"><Sparkles className="w-3 h-3" />AI Auditor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="space-y-4">
            <AllocationsTable richAllocations={richAllocations} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="exams" className="space-y-4">
            <ExamsTable exams={data.exams} />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <RoomsTable rooms={data.rooms} />
          </TabsContent>

          <TabsContent value="faculty" className="space-y-4">
            <FacultyTable faculty={data.faculty} />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-4">
            <AIAuditor />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
