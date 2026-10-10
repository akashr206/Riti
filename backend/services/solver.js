import { db } from '../models/index.js';
import * as schema from '../models/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Helper to parse time strings like "09:00:00" into minutes from midnight
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time slots overlap
 */
function isOverlap(date1, start1, duration1, date2, start2, duration2) {
  if (date1 !== date2) return false;
  
  const startMin1 = parseTime(start1);
  const endMin1 = startMin1 + duration1;
  
  const startMin2 = parseTime(start2);
  const endMin2 = startMin2 + duration2;
  
  return startMin1 < endMin2 && startMin2 < endMin1;
}

/**
 * Core Scheduling Engine
 * Generates allocations for given exams using available rooms and faculty.
 */
export async function generateSchedule(exams, rooms, faculty) {
  const allocations = [];
  const errors = [];
  
  // Sort exams by total students descending (hardest to place first)
  const sortedExams = [...exams].sort((a, b) => b.totalStudents - a.totalStudents);
  
  for (const exam of sortedExams) {
    let unallocatedStudents = exam.totalStudents;
    const assignedRooms = [];
    
    // Find available rooms for this exam's time slot
    const availableRooms = rooms.filter(room => {
      // Must be available in the system
      if (room.capacity <= 0) return false;
      
      // Check if room is already allocated during this time
      const isUsed = allocations.some(alloc => 
        alloc.roomId === room.id && 
        isOverlap(
          exam.examDate, exam.startTime, exam.durationMinutes,
          alloc.examDate, alloc.startTime, alloc.durationMinutes
        )
      );
      return !isUsed;
    });

    // Sort rooms by capacity descending to minimize number of rooms and faculty needed
    availableRooms.sort((a, b) => b.capacity - a.capacity);

    // Pick rooms until we satisfy totalStudents
    for (const room of availableRooms) {
      if (unallocatedStudents <= 0) break;
      assignedRooms.push(room);
      unallocatedStudents -= room.capacity;
    }

    if (unallocatedStudents > 0) {
      errors.push(`Infeasible: Not enough room capacity for exam ${exam.courseCode} on ${exam.examDate}. Short by ${unallocatedStudents} seats.`);
      continue; // Skip faculty assignment if we can't even fit the students
    }

    // Now find faculty for each assigned room
    const requiredFacultyCount = assignedRooms.length;
    const availableFaculty = faculty.filter(f => {
      if (!f.isAvailable) return false;
      
      // Check if faculty is already allocated during this time
      const isBusy = allocations.some(alloc => 
        alloc.facultyId === f.id && 
        isOverlap(
          exam.examDate, exam.startTime, exam.durationMinutes,
          alloc.examDate, alloc.startTime, alloc.durationMinutes
        )
      );
      return !isBusy;
    });

    if (availableFaculty.length < requiredFacultyCount) {
      errors.push(`Infeasible: Not enough available faculty for exam ${exam.courseCode} on ${exam.examDate}. Needed ${requiredFacultyCount}, got ${availableFaculty.length}.`);
      continue;
    }

    // Create the allocations
    for (let i = 0; i < assignedRooms.length; i++) {
      const assignedRoom = assignedRooms[i];
      const assignedFaculty = availableFaculty[i];
      
      allocations.push({
        examId: exam.id,
        roomId: assignedRoom.id,
        facultyId: assignedFaculty.id,
        status: 'scheduled',
        // We attach these to make overlap checking easier for subsequent iterations
        examDate: exam.examDate,
        startTime: exam.startTime,
        durationMinutes: exam.durationMinutes
      });
      
      // Remove the faculty from available pool for THIS exam's loop
      // (They might be available for other exams at different times, handled by isBusy check)
      availableFaculty.splice(i, 1);
      i--; // Adjust index since we mutated the array
    }
  }

  // Strip temporary fields before returning
  const cleanAllocations = allocations.map(a => ({
    examId: a.examId,
    roomId: a.roomId,
    facultyId: a.facultyId,
    status: a.status
  }));

  return { allocations: cleanAllocations, errors };
}

/**
 * Validates an existing set of allocations against hard constraints
 */
export function validateAllocations(allocations, exams, rooms, faculty) {
  const issues = [];
  
  // Attach exam details to allocations for overlap checks
  const richAllocations = allocations.map(a => {
    const exam = exams.find(e => e.id === a.examId);
    const room = rooms.find(r => r.id === a.roomId);
    return { ...a, exam, room };
  });

  // 1. Check Room Overlaps & Faculty Overlaps
  for (let i = 0; i < richAllocations.length; i++) {
    for (let j = i + 1; j < richAllocations.length; j++) {
      const a1 = richAllocations[i];
      const a2 = richAllocations[j];
      
      if (!a1.exam || !a2.exam) continue;

      if (isOverlap(a1.exam.examDate, a1.exam.startTime, a1.exam.durationMinutes,
                    a2.exam.examDate, a2.exam.startTime, a2.exam.durationMinutes)) {
        
        if (a1.roomId === a2.roomId) {
          issues.push(`Room ${a1.room?.name} is double-booked for exams ${a1.exam.courseCode} and ${a2.exam.courseCode}.`);
        }
        if (a1.facultyId === a2.facultyId) {
          issues.push(`Faculty ID ${a1.facultyId} is double-booked for exams ${a1.exam.courseCode} and ${a2.exam.courseCode}.`);
        }
      }
    }
  }

  // 2. Check Capacity per exam
  for (const exam of exams) {
    const examAllocs = richAllocations.filter(a => a.examId === exam.id);
    if (examAllocs.length > 0) {
      const totalCapacity = examAllocs.reduce((sum, a) => sum + (a.room?.capacity || 0), 0);
      if (totalCapacity < exam.totalStudents) {
         issues.push(`Exam ${exam.courseCode} has ${exam.totalStudents} students but only ${totalCapacity} capacity assigned.`);
      }
    }
  }

  return issues;
}
