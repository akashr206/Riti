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
  deleteRecord
} from '../controllers/apiController.js';

const router = express.Router();

router.get('/rooms', getRooms);
router.get('/faculty', getFaculty);
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
