const express = require('express');
const router = express.Router();
const {
  getShipments,
  createShipment,
  updateShipmentStatus,
  recommendVehicle,
  assignVehicle
} = require('../controllers/shipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getShipments)
  .post(protect, authorize('Admin', 'Warehouse Staff'), createShipment);

router.route('/:id/status')
  .put(protect, updateShipmentStatus);

router.route('/:id/recommend-vehicle')
  .get(protect, authorize('Admin', 'Dispatch Manager'), recommendVehicle);

router.route('/:id/assign')
  .put(protect, authorize('Admin', 'Dispatch Manager'), assignVehicle);

module.exports = router;
