import { db } from '../models/index.js';
import * as schema from '../models/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { generateSchedule, validateAllocations, isOverlap } from '../services/solver.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_super_secret_key_2026';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

export const getRooms = async (req, res) => {
  try {
    const allRooms = await db.select().from(schema.rooms);
    res.json(allRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginHandler = async (req, res) => {
  const { role, password, facultyId } = req.body;
  if (role === 'admin') {
    const adminPassword = process.env.ADMIN_PASSWORD || 'riti2026';
    if (password === adminPassword) {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ success: true, role: 'admin', token });
    }
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  } else if (role === 'lecturer') {
    if (!facultyId || !password) return res.status(400).json({ error: 'Faculty ID and password required.' });
    
    // Check lecturer password (for hackathon, all lecturers share a default password or match a pattern)
    const lecturerPassword = process.env.LECTURER_PASSWORD || 'lecturer123';
    if (password !== lecturerPassword) {
      return res.status(401).json({ error: 'Invalid lecturer password.' });
    }

    const token = jwt.sign({ role: 'lecturer', facultyId }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ success: true, role: 'lecturer', facultyId, token });
  }
  return res.status(400).json({ error: 'Invalid role' });
};

export const getFaculty = async (req, res) => {
  try {
    const allFaculty = await db.select().from(schema.faculty);
    res.json(allFaculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExams = async (req, res) => {
  try {
    const allExams = await db.select().from(schema.exams);
    res.json(allExams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllocations = async (req, res) => {
  try {
    const allAllocations = await db.select().from(schema.allocations);
    res.json(allAllocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateScheduleHandler = async (req, res) => {
  try {
    const allExams = await db.select().from(schema.exams);
    const allRooms = await db.select().from(schema.rooms);
    const allFaculty = await db.select().from(schema.faculty);

    const result = await generateSchedule(allExams, allRooms, allFaculty);

    await db.delete(schema.allocations);
    if (result.allocations.length > 0) {
      await db.insert(schema.allocations).values(result.allocations);
    }

    if (result.errors.length > 0) {
      return res.json({ 
        success: true, 
        partialSuccess: true, 
        message: 'Partial schedule generated with conflicts', 
        errors: result.errors,
        allocations: result.allocations 
      });
    }

    const validationIssues = validateAllocations(result.allocations, allExams, allRooms, allFaculty);
    if (validationIssues.length > 0) {
      return res.json({ 
        success: true, 
        partialSuccess: true, 
        message: 'Schedule generated but validation failed', 
        errors: validationIssues,
        allocations: result.allocations 
      });
    }

    res.json({ success: true, message: 'Schedule generated successfully', allocations: result.allocations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const suggestRepair = async (req, res) => {
  try {
    const { allocationId, disruptionType } = req.body;

    const allExams = await db.select().from(schema.exams);
    const allAllocations = await db.select().from(schema.allocations);
    const allFaculty = await db.select().from(schema.faculty);
    const allRooms = await db.select().from(schema.rooms);

    const targetAlloc = allAllocations.find(a => a.id === allocationId);
    if (!targetAlloc) return res.status(404).json({ error: "Allocation not found" });

    const targetExam = allExams.find(e => e.id === targetAlloc.examId);

    const overlappingAllocs = allAllocations.filter(a => {
      const e = allExams.find(ex => ex.id === a.examId);
      if (!e) return false;
      return isOverlap(
        targetExam.examDate, targetExam.startTime, targetExam.durationMinutes,
        e.examDate, e.startTime, e.durationMinutes
      );
    });

    if (disruptionType === 'faculty') {
      const busyFacultyIds = new Set(overlappingAllocs.map(a => a.facultyId));
      const substitute = allFaculty.find(f => f.isAvailable && !busyFacultyIds.has(f.id));

      if (substitute) {
        return res.json({ success: true, suggestion: { type: 'faculty', replaceWithId: substitute.id, replaceWithName: substitute.name } });
      } else {
        return res.json({ success: false, message: "No available faculty found for this time slot. Manual intervention required." });
      }
    }

    if (disruptionType === 'room') {
      const currentRoom = allRooms.find(r => r.id === targetAlloc.roomId);
      const busyRoomIds = new Set(overlappingAllocs.map(a => a.roomId));
      const substitute = allRooms.find(r => r.capacity >= currentRoom.capacity && !busyRoomIds.has(r.id));

      if (substitute) {
        return res.json({ success: true, suggestion: { type: 'room', replaceWithId: substitute.id, replaceWithName: substitute.name } });
      } else {
        return res.json({ success: false, message: "No suitable room found for this capacity and time slot." });
      }
    }

    res.status(400).json({ error: "Invalid disruption type" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const applyRepair = async (req, res) => {
  try {
    const { allocationId, disruptionType, replaceWithId } = req.body;

    const updateData = {};
    if (disruptionType === 'faculty') updateData.facultyId = replaceWithId;
    if (disruptionType === 'room') updateData.roomId = replaceWithId;

    const { eq } = await import('drizzle-orm');
    await db.update(schema.allocations)
      .set(updateData)
      .where(eq(schema.allocations.id, allocationId));

    res.json({ success: true, message: "Schedule repaired successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const generateInsights = async (req, res) => {
  try {
    const apiKey = process.env.MIMO_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "MIMO_API_KEY is not set in backend .env file." });
    }

    const allAllocations = await db.select().from(schema.allocations);
    if (allAllocations.length === 0) {
      return res.status(400).json({ error: "Schedule is empty. Please generate a schedule first." });
    }

    const allExams = await db.select().from(schema.exams);
    const allRooms = await db.select().from(schema.rooms);
    const allFaculty = await db.select().from(schema.faculty);

    const compressedSchedule = allAllocations.map(a => {
      const exam = allExams.find(e => e.id === a.examId);
      const room = allRooms.find(r => r.id === a.roomId);
      const fac = allFaculty.find(f => f.id === a.facultyId);
      return {
        exam: exam ? `${exam.courseCode} (${exam.totalStudents} pax)` : 'Unknown',
        time: exam ? `${exam.examDate} ${exam.startTime} (${exam.durationMinutes}m)` : 'Unknown',
        room: room ? `${room.name} (cap: ${room.capacity})` : 'Unknown',
        faculty: fac ? fac.name : 'Unknown'
      };
    });

    const promptText = `
You are the Chief Academic Officer AI Auditor.
Analyze the following exam schedule data. Look for human-factor issues such as:
1. Faculty Burnout: Are any faculty members assigned to too many back-to-back exams?
2. Room Underutilization: Are tiny exams placed in massive halls?
3. Scheduling Anomalies: Anything else that seems unfair or risky.

Schedule Data:
${JSON.stringify(compressedSchedule, null, 2)}

Provide a concise, professional, and highly readable Markdown report. Use headers, bullet points, and bold text. Do not provide a JSON response.
`;

    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mimo-v2.6-flash',
        messages: [
          { role: 'system', content: 'You are an AI assistant.' },
          { role: 'user', content: promptText }
        ],
        max_completion_tokens: 1024,
        temperature: 0.7,
        "thinking": {
          "type": "disabled"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const markdownReport = result.choices[0].message.content;

    res.json({ success: true, report: markdownReport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRecord = (tableName) => async (req, res) => {
  try {
    const result = await db.insert(schema[tableName]).values(req.body).returning();
    res.json(result[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateRecord = (tableName) => async (req, res) => {
  try {
    const result = await db.update(schema[tableName]).set(req.body).where(eq(schema[tableName].id, parseInt(req.params.id))).returning();
    res.json(result[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteRecord = (tableName) => async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (tableName === 'exams') {
      await db.delete(schema.allocations).where(eq(schema.allocations.examId, id));
    } else if (tableName === 'rooms') {
      await db.delete(schema.allocations).where(eq(schema.allocations.roomId, id));
    } else if (tableName === 'faculty') {
      await db.delete(schema.allocations).where(eq(schema.allocations.facultyId, id));
    }

    const result = await db.delete(schema[tableName]).where(eq(schema[tableName].id, id)).returning();
    res.json(result[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
