import { db } from '../models/index.js';
import * as schema from '../models/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { generateSchedule, validateAllocations, isOverlap } from '../services/solver.js';
import { PDFParse } from 'pdf-parse';

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

    const getOverlappingAllocs = (bufferMinutes) => {
      return allAllocations.filter(a => {
        const e = allExams.find(ex => ex.id === a.examId);
        if (!e) return false;
        return isOverlap(
          targetExam.examDate, targetExam.startTime, targetExam.durationMinutes,
          e.examDate, e.startTime, e.durationMinutes,
          bufferMinutes
        );
      });
    };

    if (disruptionType === 'faculty') {
      const overlappingAllocs = getOverlappingAllocs(60);
      const busyFacultyIds = new Set(overlappingAllocs.map(a => a.facultyId));
      const substitute = allFaculty.find(f => f.isAvailable && !busyFacultyIds.has(f.id));

      if (substitute) {
        return res.json({ success: true, suggestion: { type: 'faculty', replaceWithId: substitute.id, replaceWithName: substitute.name } });
      } else {
        return res.json({ success: false, message: "No available faculty found for this time slot. Manual intervention required." });
      }
    }

    if (disruptionType === 'room') {
      const overlappingAllocs = getOverlappingAllocs(0);
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
You are the Allocation Reasoning Engine.
Analyze the following exam schedule data.
For each unique date in the schedule, provide a brief 2-3 sentence reasoning on why the allocation choices for that day are sound (e.g., noting optimal room utilization, faculty assignments matching subjects, or highlighting any tight schedules).

Schedule Data:
${JSON.stringify(compressedSchedule, null, 2)}

Output ONLY valid JSON in the following format. Do not include markdown code blocks or any other text.
{
  "YYYY-MM-DD": [
    "Reasoning string 1",
    "Reasoning string 2"
  ]
}
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
    const rawContent = result.choices[0].message.content;
    let jsonReport = {};
    try {
      jsonReport = JSON.parse(rawContent.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error("Failed to parse reasoning JSON:", rawContent);
    }

    res.json({ success: true, report: jsonReport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const streamInsights = async (req, res) => {
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
      
      let utilization = 'Unknown';
      if (exam && room && room.capacity > 0) {
        utilization = ((exam.totalStudents / room.capacity) * 100).toFixed(0) + "%";
      }

      return {
        exam: exam ? `${exam.courseCode} (${exam.totalStudents} pax)` : 'Unknown',
        time: exam ? `${exam.examDate} ${exam.startTime} (${exam.durationMinutes}m)` : 'Unknown',
        room: room ? `${room.name} (cap: ${room.capacity})` : 'Unknown',
        utilization: utilization,
        faculty: fac ? `${fac.name} (Dept: ${fac.department})` : 'Unknown'
      };
    });

    const promptText = `
You are the Riti Allocation Reasoning Engine. 
Your objective is to provide a strategic analysis of WHY this exam schedule makes sense. 
Do NOT just summarize who is where. Analyze the logistics and intelligence behind the pairings.

For each unique date, provide bullet points that highlight:
1. Resource Utilization: Comment on how well room capacities match the student pax.
2. Faculty Alignment: Comment on if faculty are assigned to exams within their departments.
3. Logical Flow: Comment on how tight or smooth the timeline is for that day.

CRITICAL INSTRUCTIONS:
- You MUST output the reasoning strictly as bullet points.
- You MUST group the bullet points under strict date headers formatted exactly as: ### YYYY-MM-DD
- Do NOT output any other markdown or conversational text. Just the headers and bullet points.

Schedule Data:
${JSON.stringify(compressedSchedule, null, 2)}
`;

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked'
    });

    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mimo-v2.6-flash',
        stream: true,
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
      res.write(`Error: ${response.status} - ${errorText}`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices[0].delta.content) {
              res.write(data.choices[0].delta.content);
            }
          } catch(e) {}
        }
      }
    }
    res.end();
  } catch (error) {
    res.write(`\nError: ${error.message}`);
    res.end();
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

export const ingestDocumentHandler = async (req, res) => {
  try {
    const apiKey = process.env.MIMO_API_KEY;
    if (!apiKey) return res.status(400).json({ error: "MIMO_API_KEY is not set." });

    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No file or text provided." });
    }

    let rawText = req.body.text || "";

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: req.file.buffer });
        try {
          const result = await parser.getText();
          rawText = result.text;
        } finally {
          await parser.destroy();
        }
      } else {
        rawText = req.file.buffer.toString('utf8');
      }
    }

    const promptText = `
You are an expert data extraction AI.
Extract the following unstructured text into a strict JSON format matching this schema:
{
  "rooms": [{ "name": "String", "capacity": Number, "accessibleSeats": Number, "isAccessible": Boolean }],
  "faculty": [{ "name": "String", "department": "String", "taughtSubjects": "String (comma separated)" }],
  "exams": [{ "courseCode": "String", "courseName": "String", "totalStudents": Number, "pwdStudents": Number, "durationMinutes": Number, "examDate": "YYYY-MM-DD", "startTime": "HH:MM" }]
}
Extract ALL possible rooms, faculties, and exams you can find in the text.
If any field is missing, infer a reasonable default or leave it empty string, but keep the types correct.
For dates use YYYY-MM-DD, for times use HH:MM (24-hour).
Respond ONLY with the JSON object. Do not include markdown formatting or backticks around the json.

Raw Text:
${rawText}
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
          { role: 'system', content: 'You are an AI assistant that only outputs valid JSON.' },
          { role: 'user', content: promptText }
        ],
        max_completion_tokens: 4096,
        temperature: 0.1,
        "thinking": { "type": "disabled" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'MIMO API Error: ' + errorText });
    }

    const data = await response.json();
    let jsonString = data.choices[0].message.content.trim();
    if (jsonString.startsWith('\`\`\`json')) {
      jsonString = jsonString.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (jsonString.startsWith('\`\`\`')) {
      jsonString = jsonString.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    const parsedData = JSON.parse(jsonString);

    parsedData.rooms = parsedData.rooms || [];
    parsedData.faculty = parsedData.faculty || [];
    parsedData.exams = parsedData.exams || [];

    res.json({ success: true, data: parsedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmIngestHandler = async (req, res) => {
  try {
    const { rooms, faculty, exams } = req.body;

    if (rooms && rooms.length > 0) {
      await db.insert(schema.rooms).values(rooms.map(r => ({ ...r, isAvailable: true })));
    }
    
    if (faculty && faculty.length > 0) {
      await db.insert(schema.faculty).values(faculty.map(f => ({ ...f, isAvailable: true })));
    }

    if (exams && exams.length > 0) {
      await db.insert(schema.exams).values(exams);
    }

    res.json({ success: true, message: "Data successfully ingested." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
