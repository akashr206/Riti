import express from 'express';
import {
  getRooms,
  getFaculty,
  getExams,
  getAllocations,
  generateScheduleHandler
} from '../controllers/apiController.js';

const router = express.Router();

router.get('/rooms', getRooms);
router.get('/faculty', getFaculty);
router.get('/exams', getExams);
router.get('/allocations', getAllocations);
router.post('/schedule/generate', generateScheduleHandler);

export default router;
