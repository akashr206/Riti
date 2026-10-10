import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

export function AllocationsTable({ richAllocations }) {
  return (
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
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {alloc.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
