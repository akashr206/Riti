import express from 'express';
import multer from 'multer';
import {
  getRooms,
  getFaculty,
  getExams,
  getAllocations,
  generateScheduleHandler,
  suggestRepair,
  applyRepair,
  generateInsights,
  streamInsights,
  createRecord,
  updateRecord,
  deleteRecord,
  loginHandler,
  authenticateToken,
  ingestDocumentHandler,
  confirmIngestHandler
} from '../controllers/apiController.js';

const upload = multer({ storage: multer.memoryStorage() });

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
router.post('/schedule/insights/stream', streamInsights);

router.post('/ingest/document', upload.single('file'), ingestDocumentHandler);
router.post('/ingest/confirm', confirmIngestHandler);

['exams', 'rooms', 'faculty'].forEach(table => {
  router.post(`/${table}`, createRecord(table));
  router.put(`/${table}/:id`, updateRecord(table));
  router.delete(`/${table}/:id`, deleteRecord(table));
});

export default router;
