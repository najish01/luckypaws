// models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/Database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user.model')(sequelize, Sequelize);
db.Appointment = require('./appointment.model')(sequelize, Sequelize);
db.Pet = require('./pet.model')(sequelize, Sequelize);

// Define relationships
db.User.hasMany(db.Appointment);
db.Appointment.belongsTo(db.User);

db.Pet.hasMany(db.Appointment);
db.Appointment.belongsTo(db.Pet);

db.User.hasMany(db.Pet);
db.Pet.belongsTo(db.User);

module.exports = db;
