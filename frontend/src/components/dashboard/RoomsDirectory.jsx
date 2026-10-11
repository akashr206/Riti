import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MapPin, Users, Settings2, Plus, Edit2, Trash2, Accessibility } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EntityEditor, ConfirmDelete } from "./CrudModals";

export function RoomsDirectory({ rooms, allocations, refreshData }) {
  const containerRef = useRef();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useGSAP(() => {
    gsap.from(".room-card-anim", {
      y: 20,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.out"
    });
  }, { scope: containerRef, dependencies: [rooms] });

  // Calculate usage
  const roomsWithUsage = rooms.map(room => {
    const hostedExams = allocations.filter(a => a.roomId === room.id);
    return { ...room, hostedExams };
  });

  return (
    <div className="p-6 h-full overflow-y-auto" ref={containerRef}>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Rooms & Capacities</h2>
          <p className="text-muted-foreground mt-1 text-sm">Visual directory of all exam venues and their utilization.</p>
        </div>
        <Button onClick={() => { setSelectedRoom(null); setEditorOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Room
        </Button>
      </div>

      {roomsWithUsage.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
            <MapPin className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">No Rooms Found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            You haven't added any exam venues yet. Add rooms manually or use the Smart Ingestor to extract them from documents.
          </p>
          <Button onClick={() => { setSelectedRoom(null); setEditorOpen(true); }} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {roomsWithUsage.map(room => (
          <Card key={room.id} className="room-card-anim border-border/50 bg-card hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
              <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur" onClick={() => { setSelectedRoom(room); setEditorOpen(true); }}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="destructive" size="icon" className="h-7 w-7 opacity-80 hover:opacity-100" onClick={() => { setSelectedRoom(room); setDeleteOpen(true); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <MapPin className="w-24 h-24" />
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="mb-6">
                <Badge variant="outline" className="mb-3 font-mono text-[10px] tracking-wider text-muted-foreground">{String(room.id).substring(0, 8)}</Badge>
                <h3 className="text-xl font-bold text-foreground tracking-tight">{room.name}</h3>
                <div className="mt-2">
                  <Badge variant={room.isAvailable !== false ? "outline" : "destructive"} className={`text-[10px] uppercase tracking-wider ${room.isAvailable !== false ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : ''}`}>
                    {room.isAvailable !== false ? "Available" : "Maintenance"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5" /> Capacity
                  </div>
                  <span className="font-mono font-semibold text-foreground">{room.capacity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    <Accessibility className="w-3.5 h-3.5" /> Accessible
                  </div>
                  <span className="font-mono font-semibold text-foreground">{room.accessibleSeats || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                    <Settings2 className="w-3.5 h-3.5" /> Scheduled
                  </div>
                  <span className="font-medium text-foreground">{room.hostedExams.length} Exams</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {editorOpen && <EntityEditor open={editorOpen} setOpen={setEditorOpen} entityType="rooms" initialData={selectedRoom} onSaved={refreshData} />}
      {deleteOpen && <ConfirmDelete open={deleteOpen} setOpen={setDeleteOpen} entityType="rooms" entityId={selectedRoom?.id} entityName={selectedRoom?.name} onDeleted={refreshData} />}
    </div>
  );
}
