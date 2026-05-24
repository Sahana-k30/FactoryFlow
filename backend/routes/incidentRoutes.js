const express = require('express');
const router = express.Router();
const { getIncidents, reportIncident, updateIncidentStatus } = require('../controllers/incidentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getIncidents)
  .post(protect, authorize('Driver', 'Warehouse Staff'), reportIncident);

router.route('/:id/status')
  .put(protect, authorize('Admin', 'Dispatch Manager'), updateIncidentStatus);

module.exports = router;
