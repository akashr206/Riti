import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Seeding complex real-world data...');
  try {
    // Clear existing data (optional but recommended for clean slate)
    await db.delete(schema.allocations);
    await db.delete(schema.exams);
    await db.delete(schema.faculty);
    await db.delete(schema.rooms);

    // 1. Insert 15 Diverse Rooms
    await db.insert(schema.rooms).values([
      // Massive Halls
      { name: 'Grand Auditorium', capacity: 400, isAccessible: true },
      { name: 'Main Hall B', capacity: 250, isAccessible: true },
      // Large Lecture Theaters
      { name: 'LT-1', capacity: 150, isAccessible: true },
      { name: 'LT-2', capacity: 150, isAccessible: false },
      { name: 'LT-3', capacity: 120, isAccessible: true },
      // Medium Classrooms
      { name: 'Room 301', capacity: 60, isAccessible: true },
      { name: 'Room 302', capacity: 60, isAccessible: false },
      { name: 'Room 303', capacity: 60, isAccessible: false },
      { name: 'Room 304', capacity: 50, isAccessible: true },
      { name: 'Room 305', capacity: 50, isAccessible: true },
      // Small Seminar/Lab Rooms
      { name: 'Lab A', capacity: 30, isAccessible: true },
      { name: 'Lab B', capacity: 30, isAccessible: false },
      { name: 'Seminar 1', capacity: 40, isAccessible: true },
      { name: 'Seminar 2', capacity: 40, isAccessible: true },
      { name: 'Isolation Room', capacity: 10, isAccessible: true }
    ]);

    // 2. Insert 25 Faculty Members
    await db.insert(schema.faculty).values([
      { name: 'Dr. Alan Turing', department: 'Computer Science', isAvailable: true },
      { name: 'Prof. Grace Hopper', department: 'Computer Science', isAvailable: true },
      { name: 'Dr. Ada Lovelace', department: 'Computer Science', isAvailable: false }, // Unavailable!
      { name: 'Dr. Linus Torvalds', department: 'Computer Science', isAvailable: true },
      { name: 'Prof. John von Neumann', department: 'Mathematics', isAvailable: true },
      { name: 'Dr. Katherine Johnson', department: 'Mathematics', isAvailable: true },
      { name: 'Dr. Carl Gauss', department: 'Mathematics', isAvailable: true },
      { name: 'Prof. Leonhard Euler', department: 'Mathematics', isAvailable: true },
      { name: 'Dr. Albert Einstein', department: 'Physics', isAvailable: true },
      { name: 'Dr. Marie Curie', department: 'Physics', isAvailable: true },
      { name: 'Prof. Richard Feynman', department: 'Physics', isAvailable: true },
      { name: 'Dr. Niels Bohr', department: 'Physics', isAvailable: false },
      { name: 'Dr. Rosalind Franklin', department: 'Biology', isAvailable: true },
      { name: 'Prof. Charles Darwin', department: 'Biology', isAvailable: true },
      { name: 'Dr. Gregor Mendel', department: 'Biology', isAvailable: true },
      { name: 'Dr. Louis Pasteur', department: 'Biology', isAvailable: true },
      { name: 'Prof. Dmitri Mendeleev', department: 'Chemistry', isAvailable: true },
      { name: 'Dr. Antoine Lavoisier', department: 'Chemistry', isAvailable: true },
      { name: 'Dr. Linus Pauling', department: 'Chemistry', isAvailable: true },
      { name: 'Prof. Adam Smith', department: 'Economics', isAvailable: true },
      { name: 'Dr. John Maynard Keynes', department: 'Economics', isAvailable: true },
      { name: 'Dr. Karl Marx', department: 'Economics', isAvailable: true },
      { name: 'Prof. Milton Friedman', department: 'Economics', isAvailable: true },
      { name: 'Dr. Sigmund Freud', department: 'Psychology', isAvailable: true },
      { name: 'Dr. Carl Jung', department: 'Psychology', isAvailable: true }
    ]);

    // 3. Insert 15 Complex Exams with Overlaps
    await db.insert(schema.exams).values([
      // --- Day 1 Morning Block (High Concurrency) ---
      // A massive CS exam needing 450 seats (will require Grand Auditorium + Room 301)
      { courseCode: 'CS101', courseName: 'Data Structures', totalStudents: 450, durationMinutes: 180, examDate: '2026-11-10', startTime: '09:00:00' },
      // Simultaneous Math exam needing 200 seats
      { courseCode: 'MATH201', courseName: 'Linear Algebra', totalStudents: 200, durationMinutes: 120, examDate: '2026-11-10', startTime: '09:00:00' },
      // Simultaneous Physics exam needing 150 seats
      { courseCode: 'PHYS101', courseName: 'Classical Mechanics', totalStudents: 150, durationMinutes: 180, examDate: '2026-11-10', startTime: '09:30:00' }, // Overlaps!

      // --- Day 1 Afternoon Block ---
      { courseCode: 'BIO201', courseName: 'Genetics', totalStudents: 300, durationMinutes: 120, examDate: '2026-11-10', startTime: '14:00:00' },
      { courseCode: 'CHEM101', courseName: 'Organic Chemistry', totalStudents: 100, durationMinutes: 180, examDate: '2026-11-10', startTime: '14:30:00' },
      { courseCode: 'ECO101', courseName: 'Microeconomics', totalStudents: 350, durationMinutes: 120, examDate: '2026-11-10', startTime: '15:00:00' },

      // --- Day 2 Morning Block ---
      { courseCode: 'CS301', courseName: 'Operating Systems', totalStudents: 180, durationMinutes: 180, examDate: '2026-11-11', startTime: '09:00:00' },
      { courseCode: 'MATH301', courseName: 'Real Analysis', totalStudents: 40, durationMinutes: 180, examDate: '2026-11-11', startTime: '09:00:00' },
      { courseCode: 'PSY101', courseName: 'Intro to Psychology', totalStudents: 500, durationMinutes: 120, examDate: '2026-11-11', startTime: '10:00:00' }, // Massive!

      // --- Day 2 Afternoon Block (Tiny exams testing fragmentation) ---
      { courseCode: 'CS401', courseName: 'Machine Learning', totalStudents: 25, durationMinutes: 120, examDate: '2026-11-11', startTime: '14:00:00' },
      { courseCode: 'CS402', courseName: 'Cryptography', totalStudents: 30, durationMinutes: 120, examDate: '2026-11-11', startTime: '14:00:00' },
      { courseCode: 'MATH401', courseName: 'Topology', totalStudents: 15, durationMinutes: 180, examDate: '2026-11-11', startTime: '14:00:00' },
      { courseCode: 'PHYS401', courseName: 'Quantum Field Theory', totalStudents: 10, durationMinutes: 180, examDate: '2026-11-11', startTime: '14:00:00' },

      // --- Day 3 Nightmare Block (Insane Concurrency) ---
      { courseCode: 'ENG101', courseName: 'Literature', totalStudents: 400, durationMinutes: 180, examDate: '2026-11-12', startTime: '09:00:00' },
      { courseCode: 'HIS101', courseName: 'World History', totalStudents: 400, durationMinutes: 180, examDate: '2026-11-12', startTime: '09:00:00' }
    ]);

    console.log('Complex Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
