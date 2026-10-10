import express from 'express';
import {
  getRooms,
  getFaculty,
  getExams,
  getAllocations,
  generateScheduleHandler,
  suggestRepair,
  applyRepair,
  generateInsights,
  createRecord,
  updateRecord,
  deleteRecord,
  loginHandler,
  authenticateToken
} from '../controllers/apiController.js';

const router = express.Router();

router.post('/login', loginHandler);

// Public route needed for login dropdown
router.get('/faculty', getFaculty);

// Protected routes
router.use(authenticateToken);

router.get('/rooms', getRooms);
router.get('/exams', getExams);
router.get('/allocations', getAllocations);
router.post('/schedule/generate', generateScheduleHandler);
router.post('/schedule/repair/suggest', suggestRepair);
router.post('/schedule/repair/apply', applyRepair);
router.post('/schedule/insights', generateInsights);

['exams', 'rooms', 'faculty'].forEach(table => {
  router.post(`/${table}`, createRecord(table));
  router.put(`/${table}/:id`, updateRecord(table));
  router.delete(`/${table}/:id`, deleteRecord(table));
});

export default router;
