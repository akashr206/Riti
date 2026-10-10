function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isOverlap(date1, start1, duration1, date2, start2, duration2) {
  if (date1 !== date2) return false;
  
  const startMin1 = parseTime(start1);
  const endMin1 = startMin1 + duration1;
  
  const startMin2 = parseTime(start2);
  const endMin2 = startMin2 + duration2;
  
  return startMin1 < endMin2 && startMin2 < endMin1;
}

export async function generateSchedule(exams, rooms, faculty) {
  const allocations = [];
  const errors = [];
  
  const sortedExams = [...exams].sort((a, b) => b.totalStudents - a.totalStudents);
  
  for (const exam of sortedExams) {
    let unallocatedStudents = exam.totalStudents;
    const assignedRooms = [];
    
    const availableRooms = rooms.filter(room => {
      if (room.capacity <= 0) return false;
      
      const isUsed = allocations.some(alloc => 
        alloc.roomId === room.id && 
        isOverlap(
          exam.examDate, exam.startTime, exam.durationMinutes,
          alloc.examDate, alloc.startTime, alloc.durationMinutes
        )
      );
      return !isUsed;
    });

    availableRooms.sort((a, b) => b.capacity - a.capacity);

    for (const room of availableRooms) {
      if (unallocatedStudents <= 0) break;
      assignedRooms.push(room);
      unallocatedStudents -= room.capacity;
    }

    if (unallocatedStudents > 0) {
      errors.push(`Infeasible: Not enough room capacity for exam ${exam.courseCode} on ${exam.examDate}. Short by ${unallocatedStudents} seats.`);
      continue;
    }

    const requiredFacultyCount = assignedRooms.length;
    const availableFaculty = faculty.filter(f => {
      if (!f.isAvailable) return false;
      
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

    for (let i = 0; i < assignedRooms.length; i++) {
      const assignedRoom = assignedRooms[i];
      const assignedFaculty = availableFaculty[i];
      
      allocations.push({
        examId: exam.id,
        roomId: assignedRoom.id,
        facultyId: assignedFaculty.id,
        status: 'scheduled',
        examDate: exam.examDate,
        startTime: exam.startTime,
        durationMinutes: exam.durationMinutes
      });
    }
  }

  const cleanAllocations = allocations.map(a => ({
    examId: a.examId,
    roomId: a.roomId,
    facultyId: a.facultyId,
    status: a.status
  }));

  return { allocations: cleanAllocations, errors };
}

export function validateAllocations(allocations, exams, rooms, faculty) {
  const issues = [];
  
  const richAllocations = allocations.map(a => {
    const exam = exams.find(e => e.id === a.examId);
    const room = rooms.find(r => r.id === a.roomId);
    return { ...a, exam, room };
  });

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
