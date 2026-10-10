import { db } from '../models/index.js';
import * as schema from '../models/schema.js';
import { generateSchedule, validateAllocations } from '../services/solver.js';

export const getRooms = async (req, res) => {
  try {
    const allRooms = await db.select().from(schema.rooms);
    res.json(allRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

    if (result.errors.length > 0) {
      return res.status(400).json({ success: false, errors: result.errors, partialAllocations: result.allocations });
    }

    const validationIssues = validateAllocations(result.allocations, allExams, allRooms, allFaculty);
    if (validationIssues.length > 0) {
      return res.status(400).json({ success: false, errors: validationIssues });
    }

    await db.delete(schema.allocations);
    if (result.allocations.length > 0) {
      await db.insert(schema.allocations).values(result.allocations);
    }

    res.json({ success: true, message: 'Schedule generated successfully', allocations: result.allocations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
