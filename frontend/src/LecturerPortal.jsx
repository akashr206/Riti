import React, { useState, useEffect } from "react";
import { Loader2, LogOut, Calendar, MapPin, Clock, BookOpen, Building2, Users } from "lucide-react";
import { fetchExams, fetchRooms, fetchFaculty, fetchAllocations } from "./api";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";

export default function LecturerPortal({ facultyId, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState(null);
  const [myAllocations, setMyAllocations] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [examsRes, roomsRes, facultyRes, allocRes] = await Promise.all([
          fetchExams(),
          fetchRooms(),
          fetchFaculty(),
          fetchAllocations(),
        ]);

        const me = facultyRes.find((f) => f.id === facultyId);
        setFaculty(me);

        const mySchedule = allocRes
          .filter((a) => a.facultyId === facultyId)
          .map((a) => {
            const exam = examsRes.find((e) => e.id === a.examId);
            const room = roomsRes.find((r) => r.id === a.roomId);
            return { ...a, exam, room };
          });

        mySchedule.sort((a, b) => {
          if (a.exam.examDate !== b.exam.examDate) {
            return a.exam.examDate.localeCompare(b.exam.examDate);
          }
          return a.exam.startTime.localeCompare(b.exam.startTime);
        });

        setMyAllocations(mySchedule);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [facultyId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!faculty) return null;

  const groupedSchedule = {};
  myAllocations.forEach((alloc) => {
    const date = alloc.exam?.examDate;
    if (!date) return;
    if (!groupedSchedule[date]) groupedSchedule[date] = [];
    groupedSchedule[date].push(alloc);
  });

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    return `${h}:${m}`;
  };

  const getEndTime = (timeStr, durationMins) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    let totalMins = h * 60 + m + durationMins;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-10 bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-auto" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">{faculty.name}</h1>
              <p className="text-xs font-medium text-muted-foreground mt-1">{faculty.department}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-end justify-between border-b border-border pb-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Your Schedule</h2>
            <p className="text-muted-foreground mt-1">Overview of all assigned invigilation duties</p>
          </div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm bg-primary/10 px-3 py-1.5 border border-primary/20">
            <Calendar className="w-4 h-4" />
            <span>{myAllocations.length} Duties</span>
          </div>
        </div>

        {myAllocations.length === 0 ? (
          <div className="border border-dashed border-border p-12 flex flex-col items-center text-center bg-muted/20">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Clear Schedule</h3>
            <p className="text-sm text-muted-foreground">You currently have no invigilation duties assigned.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {Object.keys(groupedSchedule).map((date) => {
              const d = new Date(date);
              const dayStr = d.getDate().toString();
              const monthStr = d.toLocaleDateString(undefined, { month: 'short' });
              const weekdayStr = d.toLocaleDateString(undefined, { weekday: 'long' });

              return (
                <div key={date} className="flex flex-col md:flex-row gap-6 md:gap-12">
                  {/* Date Column */}
                  <div className="md:w-32 shrink-0">
                    <div className="sticky top-24 border-l-4 border-primary pl-4">
                      <div className="text-4xl font-bold tracking-tight text-foreground">{dayStr}</div>
                      <div className="text-xl font-semibold text-primary">{monthStr}</div>
                      <div className="text-sm font-medium text-muted-foreground mt-1">{weekdayStr}</div>
                    </div>
                  </div>
                  
                  {/* Exams List */}
                  <div className="flex-1 flex flex-col border border-border bg-card shadow-sm">
                    {groupedSchedule[date].map((alloc, idx) => (
                      <div key={alloc.id} className={`group relative flex flex-col sm:flex-row gap-6 p-6 hover:bg-muted/30 transition-colors ${idx !== groupedSchedule[date].length - 1 ? 'border-b border-border' : ''}`}>
                        
                        {alloc.status === 'partial' && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                        )}

                        {/* Time & Room */}
                        <div className="sm:w-48 shrink-0 flex flex-col gap-3">
                          <div className="inline-flex items-center gap-2 text-sm font-semibold bg-muted text-foreground px-3 py-2 border border-border">
                            <Clock className="w-4 h-4 text-primary" />
                            {formatTime(alloc.exam?.startTime)} - {getEndTime(alloc.exam?.startTime, alloc.exam?.durationMinutes)}
                          </div>
                          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground px-3 py-1">
                            <MapPin className="w-4 h-4 text-primary" />
                            {alloc.room?.name || "TBA"}
                          </div>
                        </div>

                        {/* Exam Details */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-bold tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors">{alloc.exam?.courseCode}</h4>
                            <p className="text-sm font-medium text-muted-foreground line-clamp-1">{alloc.exam?.courseName}</p>
                          </div>
                          
                          <div className="flex flex-col items-start sm:items-end gap-2">
                            <div className="text-sm font-medium flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5">
                              <Users className="w-4 h-4" />
                              <span>{alloc.assignedStudents} Students</span>
                            </div>
                            {alloc.status === 'partial' && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Overbooked</Badge>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
