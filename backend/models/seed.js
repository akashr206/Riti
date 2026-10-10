import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Seeding data...');
  try {
    // Clear existing data (optional but recommended for clean slate)
    await db.delete(schema.allocations);
    await db.delete(schema.exams);
    await db.delete(schema.faculty);
    await db.delete(schema.rooms);

    // Insert Rooms
    await db.insert(schema.rooms).values([
      { name: 'Room 101', capacity: 30, isAccessible: true },
      { name: 'Room 102', capacity: 50, isAccessible: false },
      { name: 'Auditorium A', capacity: 200, isAccessible: true }
    ]);

    // Insert Faculty
    await db.insert(schema.faculty).values([
      { name: 'Dr. Smith', department: 'Computer Science' },
      { name: 'Prof. Johnson', department: 'Mathematics' },
      { name: 'Dr. Lee', department: 'Physics' }
    ]);

    // Insert Exams
    await db.insert(schema.exams).values([
      { courseCode: 'CS101', courseName: 'Intro to CS', totalStudents: 45, durationMinutes: 120, examDate: '2026-11-01', startTime: '09:00:00' },
      { courseCode: 'MATH201', courseName: 'Calculus II', totalStudents: 80, durationMinutes: 180, examDate: '2026-11-02', startTime: '14:00:00' }
    ]);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
  }
}

seed();
