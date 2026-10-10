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
  
  const sortedExams = [...exams].sort((a, b) => {
    const aPwd = a.pwdStudents || 0;
    const bPwd = b.pwdStudents || 0;
    if (bPwd !== aPwd) return bPwd - aPwd;
    return b.totalStudents - a.totalStudents;
  });
  
  for (const exam of sortedExams) {
    let unallocatedStudents = exam.totalStudents;
    let unallocatedPwd = exam.pwdStudents || 0;
    const assignedRooms = [];
    
    const availableRooms = [];
    for (const room of rooms) {
      if (room.capacity <= 0) continue;

      let usedCapacity = 0;
      let usedPwd = 0;

      allocations.forEach(alloc => {
        if (alloc.roomId === room.id && isOverlap(
          exam.examDate, exam.startTime, exam.durationMinutes,
          alloc.examDate, alloc.startTime, alloc.durationMinutes
        )) {
          usedCapacity += alloc.assignedStudents || 0;
          usedPwd += alloc.assignedPwdStudents || 0;
        }
      });

      const remainingCapacity = room.capacity - usedCapacity;
      const remainingPwd = Math.max(0, (room.accessibleSeats || 0) - usedPwd);

      if (remainingCapacity > 0) {
        availableRooms.push({
          ...room,
          capacity: remainingCapacity,
          accessibleSeats: remainingPwd
        });
      }
    }

    availableRooms.sort((a, b) => {
      if (unallocatedPwd > 0) {
        return (b.accessibleSeats || 0) - (a.accessibleSeats || 0);
      }
      return b.capacity - a.capacity;
    });

    for (const room of availableRooms) {
      if (unallocatedStudents <= 0 && unallocatedPwd <= 0) break;
      const assignedCount = Math.min(unallocatedStudents, room.capacity);
      const assignedPwdCount = Math.min(unallocatedPwd, room.accessibleSeats || 0);
      assignedRooms.push({ room, assignedCount, assignedPwdCount });
      unallocatedStudents -= assignedCount;
      unallocatedPwd -= assignedPwdCount;
    }

    let isPartial = false;
    
    if (unallocatedStudents > 0) {
      errors.push(`[CAPACITY SHORTFALL] ${exam.courseCode} (${exam.courseName})\n- Total Students: ${exam.totalStudents}\n- Unallocated: ${unallocatedStudents}\n- Suggestion: Please add a new room with at least ${unallocatedStudents} capacity, or increase existing room capacities.`);
      isPartial = true;
    }
    if (unallocatedPwd > 0) {
      errors.push(`[ACCESSIBILITY SHORTFALL] ${exam.courseCode} (${exam.courseName})\n- Total PWD Needs: ${exam.pwdStudents}\n- Unallocated PWD: ${unallocatedPwd}\n- Suggestion: Ensure you have rooms with 'Accessible Seats' >= ${unallocatedPwd} available at ${exam.startTime}.`);
      isPartial = true;
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

    availableFaculty.sort((a, b) => {
      const aTeaches = a.taughtSubjects?.includes(exam.courseCode) ? 1 : 0;
      const bTeaches = b.taughtSubjects?.includes(exam.courseCode) ? 1 : 0;
      
      if (aTeaches !== bTeaches) {
        return aTeaches - bTeaches;
      }
      
      const aLoad = allocations.filter(alloc => alloc.facultyId === a.id).length;
      const bLoad = allocations.filter(alloc => alloc.facultyId === b.id).length;
      return aLoad - bLoad;
    });

    if (availableFaculty.length < requiredFacultyCount) {
      errors.push(`[FACULTY SHORTFALL] ${exam.courseCode} (${exam.courseName})\n- Required Invigilators: ${requiredFacultyCount}\n- Available: ${availableFaculty.length}\n- Suggestion: Add more faculty members or ensure existing ones aren't double-booked.`);
      isPartial = true;
    }

    for (let i = 0; i < assignedRooms.length; i++) {
      const { room: assignedRoom, assignedCount, assignedPwdCount } = assignedRooms[i];
      const assignedFaculty = availableFaculty[i];
      
      allocations.push({
        examId: exam.id,
        roomId: assignedRoom.id,
        facultyId: assignedFaculty ? assignedFaculty.id : null,
        assignedStudents: assignedCount,
        assignedPwdStudents: assignedPwdCount,
        status: isPartial ? 'partial' : 'scheduled',
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
    assignedStudents: a.assignedStudents,
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
        
        if (a1.facultyId && a1.facultyId === a2.facultyId) {
          issues.push(`Faculty ID ${a1.facultyId} is double-booked for exams ${a1.exam.courseCode} and ${a2.exam.courseCode}.`);
        }
      }
    }
  }

  for (const exam of exams) {
    const examAllocs = richAllocations.filter(a => a.examId === exam.id);
    if (examAllocs.length > 0) {
      const totalAssigned = examAllocs.reduce((sum, a) => sum + (a.assignedStudents || 0), 0);
      if (totalAssigned < exam.totalStudents) {
         issues.push(`Exam ${exam.courseCode} has ${exam.totalStudents} students but only ${totalAssigned} capacity successfully allocated.`);
      }
    }
  }

  for (const room of rooms) {
    const roomAllocs = richAllocations.filter(a => a.roomId === room.id);
    for (let i = 0; i < roomAllocs.length; i++) {
      let overlapSum = roomAllocs[i].assignedStudents || 0;
      for (let j = 0; j < roomAllocs.length; j++) {
        if (i !== j && roomAllocs[i].exam && roomAllocs[j].exam && isOverlap(roomAllocs[i].exam.examDate, roomAllocs[i].exam.startTime, roomAllocs[i].exam.durationMinutes, roomAllocs[j].exam.examDate, roomAllocs[j].exam.startTime, roomAllocs[j].exam.durationMinutes)) {
          overlapSum += roomAllocs[j].assignedStudents || 0;
        }
      }
      if (overlapSum > room.capacity && !issues.some(msg => msg.includes(`Room ${room.name} is over capacity`))) {
        issues.push(`Room ${room.name} is over capacity (${overlapSum}/${room.capacity}).`);
      }
    }
  }

  return issues;
}
