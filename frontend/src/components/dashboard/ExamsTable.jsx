import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export function ExamsTable({ exams }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exams Registry</CardTitle>
        <CardDescription>List of all examinations requiring scheduling.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Course Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-foreground">{e.courseCode}</TableCell>
                  <TableCell>{e.courseName}</TableCell>
                  <TableCell>{e.totalStudents}</TableCell>
                  <TableCell>{e.durationMinutes} mins</TableCell>
                  <TableCell className="text-muted-foreground">{e.examDate} {e.startTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
