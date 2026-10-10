import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

export function AllocationsTable({ richAllocations, onRefresh }) {
  const [disruptedAlloc, setDisruptedAlloc] = useState(null);
  const [disruptionType, setDisruptionType] = useState(null); // 'faculty' or 'room'
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReportDisruption = async (alloc, type) => {
    setDisruptedAlloc(alloc);
    setDisruptionType(type);
    setSuggestion(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/schedule/repair/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationId: alloc.id, disruptionType: type })
      });
      const data = await res.json();
      if (data.success) {
        setSuggestion(data.suggestion);
      } else {
        setError(data.message || data.error || "An unknown error occurred.");
      }
    } catch (err) {
      setError("Failed to communicate with the disruption engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRepair = async () => {
    if (!suggestion) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/schedule/repair/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocationId: disruptedAlloc.id,
          disruptionType: suggestion.type,
          replaceWithId: suggestion.replaceWithId
        })
      });
      const data = await res.json();
      if (data.success) {
        setDisruptedAlloc(null);
        if (onRefresh) onRefresh();
      } else {
        setError(data.error || "Failed to apply repair.");
      }
    } catch (err) {
      setError("Failed to apply repair.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Current Allocations</CardTitle>
          <CardDescription>Generated mapping of exams to rooms and invigilators.</CardDescription>
        </CardHeader>
        <CardContent>
          {richAllocations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No allocations found. Run the scheduler to generate them.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Exam</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Invigilator</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {richAllocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell className="font-medium text-foreground">
                        {alloc.exam?.courseCode} - {alloc.exam?.courseName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alloc.exam?.examDate} at {alloc.exam?.startTime}
                      </TableCell>
                      <TableCell>{alloc.room?.name}</TableCell>
                      <TableCell>{alloc.fac?.name}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleReportDisruption(alloc, 'faculty')} className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
                          Faculty Sick
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleReportDisruption(alloc, 'room')} className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
                          Room Issue
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!disruptedAlloc} onOpenChange={(open) => !open && setDisruptedAlloc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emergency Disruption Repair</DialogTitle>
            <DialogDescription>
              {disruptedAlloc && `Resolving ${disruptionType} issue for ${disruptedAlloc.exam?.courseCode} at ${disruptedAlloc.exam?.startTime}.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Calculating minimal-change repair...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded bg-destructive/10 border border-destructive text-destructive text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">Repair Failed</p>
                  <p>{error}</p>
                </div>
              </div>
            ) : suggestion ? (
              <div className="p-4 rounded bg-primary/10 border border-primary/20 text-foreground text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-primary">Zero-Friction Substitute Found</p>
                  <p className="mt-1">
                    Replace {disruptionType === 'faculty' ? disruptedAlloc?.fac?.name : disruptedAlloc?.room?.name} with <strong>{suggestion.replaceWithName}</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">This change causes 0 collateral disruptions.</p>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisruptedAlloc(null)}>Cancel</Button>
            <Button disabled={!suggestion || loading} onClick={handleApplyRepair}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve & Repair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
