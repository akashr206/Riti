import { pgTable, serial, text, integer, boolean, timestamp, time, date } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  capacity: integer('capacity').notNull(),
  isAccessible: boolean('is_accessible').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export const faculty = pgTable('faculty', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  department: text('department'),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  courseCode: text('course_code').notNull(),
  courseName: text('course_name').notNull(),
  totalStudents: integer('total_students').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  examDate: date('exam_date').notNull(),
  startTime: time('start_time').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const allocations = pgTable('allocations', {
  id: serial('id').primaryKey(),
  examId: integer('exam_id').references(() => exams.id),
  roomId: integer('room_id').references(() => rooms.id),
  facultyId: integer('faculty_id').references(() => faculty.id),
  status: text('status').default('scheduled'),
  createdAt: timestamp('created_at').defaultNow()
});
