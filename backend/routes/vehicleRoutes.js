const express = require('express');
const router = express.Router();
const { getVehicles, updateLocation, updateMetrics, createVehicle } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getVehicles)
  .post(protect, createVehicle);

router.route('/:id/location')
  .put(protect, authorize('Admin', 'Dispatch Manager', 'Driver'), updateLocation);

router.route('/:id/metrics')
  .put(protect, authorize('Admin', 'Dispatch Manager'), updateMetrics);

module.exports = router;
