const { Op } = require('sequelize');
const Appointment = require('../model/appointment');

const appointmentController = {
  // Create new appointment
  async create(req, res) {
    try {
      const appointment = await Appointment.create(req.body);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get all appointments with optional date range filter
  async getAll(req, res) {
    try {
      const { startDate, endDate } = req.query;
      let whereClause = {};
      
      if (startDate && endDate) {
        whereClause.appointment_date = {
          [Op.between]: [startDate, endDate]
        };
      }

      const appointments = await Appointment.findAll({
        where: whereClause,
        order: [
          ['appointment_date', 'ASC'],
          ['appointment_time', 'ASC']
        ]
      });
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get appointment by ID
  async getById(req, res) {
    try {
      const appointment = await Appointment.findByPk(req.params.id);
      if (appointment) {
        res.status(200).json(appointment);
      } else {
        res.status(404).json({ message: 'Appointment not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update appointment
  async update(req, res) {
    try {
      const result = await sequelize.transaction(async (t) => {
        const [updated] = await Appointment.update(req.body, {
          where: { id: req.params.id },
          returning: true,  // PostgreSQL specific: returns updated record
          transaction: t
        });

        if (!updated) {
          throw new Error('Appointment not found');
        }

        return await Appointment.findByPk(req.params.id, { transaction: t });
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(error.message === 'Appointment not found' ? 404 : 400)
        .json({ error: error.message });
    }
  },

  // Delete appointment
  async delete(req, res) {
    try {
      const deleted = await Appointment.destroy({
        where: { id: req.params.id }
      });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Appointment not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = appointmentController;
