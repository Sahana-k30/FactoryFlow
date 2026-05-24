const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Vehicle.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const createdUsers = await User.insertMany([
      { username: 'Admin', email: 'admin@factoryflow.ai', password: hashedPassword, role: 'Admin' },
      { username: 'Dispatcher', email: 'dispatch@factoryflow.ai', password: hashedPassword, role: 'Dispatch Manager' },
      { username: 'Warehouse', email: 'warehouse@factoryflow.ai', password: hashedPassword, role: 'Warehouse Staff' },
      { username: 'Driver 1', email: 'driver@factoryflow.ai', password: hashedPassword, role: 'Driver' },
      { username: 'Driver 2', email: 'driver2@factoryflow.ai', password: hashedPassword, role: 'Driver' }
    ]);

    const adminUser = createdUsers[0]._id;
    const driverUser = createdUsers[3]._id;
    const driverUser2 = createdUsers[4]._id;

    await Vehicle.insertMany([
      {
        registration: 'TRK-1001',
        type: 'Truck',
        capacity: 10000,
        fuelEfficiency: 4.5,
        status: 'Available',
        driverId: driverUser,
        currentLocation: { lat: 34.0522, lng: -118.2437 }
      },
      {
        registration: 'VAN-2001',
        type: 'Van',
        capacity: 2500,
        fuelEfficiency: 8.0,
        status: 'Available',
        driverId: driverUser2,
        currentLocation: { lat: 34.0622, lng: -118.2537 }
      }
    ]);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  // destroy data function could be here
  process.exit();
} else {
  importData();
}
