import express from 'express';
import {
  getRooms,
  getFaculty,
  getExams,
  getAllocations,
  generateScheduleHandler,
  suggestRepair,
  applyRepair,
  generateInsights
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

export default router;
