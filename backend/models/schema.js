import { pgTable, serial, text, integer, boolean, timestamp, time, date } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  capacity: integer('capacity').notNull(),
  accessibleSeats: integer('accessible_seats').default(0),
  isAccessible: boolean('is_accessible').default(false),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const faculty = pgTable('faculty', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  department: text('department'),
  taughtSubjects: text('taught_subjects'),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  courseCode: text('course_code').notNull(),
  courseName: text('course_name').notNull(),
  totalStudents: integer('total_students').notNull(),
  pwdStudents: integer('pwd_students').default(0),
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
  assignedStudents: integer('assigned_students').default(0),
  status: text('status').default('scheduled'),
  createdAt: timestamp('created_at').defaultNow()
});
