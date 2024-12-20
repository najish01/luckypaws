const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const sequelize = require('./config/Database');
const Login = require('../server/model/Login');
const Appointment = require('../server/model/appointment');
const router = express.Router();
const authRoutes = require('./routes/auth');

const app = express();

// Middlewar
// Update your CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // Replace with your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });
// Authentication Middleware
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication token required' 
            });
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expired'
                    });
                }
                return res.status(403).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};
// Test Database Connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
        return sequelize.sync({ force: false }); // Set to true only if you want to recreate tables
    })
    .then(() => {
        console.log('Database synchronized');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

// Routes
// Verify session endpoint
app.get('/api/verify-session', authenticateToken, async (req, res) => {
    try {
        // Since authenticateToken middleware already verified the token,
        // we just need to fetch the user data
        const user = await Login.findByPk(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name
            }
        });
    } catch (error) {
        console.error('Session verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify session'
        });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});


// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const existingUser = await Login.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await Login.create({
            full_name: fullName,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user
        const user = await Login.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Send response
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Create appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);

        const { appointmentDetails } = req.body;

        // Create appointment in database
        const appointment = await Appointment.create({
            pet_name: appointmentDetails.petName,
            owner_name: appointmentDetails.ownerName,
            appointment_date: appointmentDetails.date,
            appointment_time: appointmentDetails.time,
            phone_number: appointmentDetails.phone,
            email: appointmentDetails.email,
            reason: appointmentDetails.message
        });

        // Send SMS notification
        const messageBody = `
            New Appointment Request
            -----------------
            Owner: ${appointmentDetails.ownerName}
            Pet: ${appointmentDetails.petName}
            Date: ${appointmentDetails.date}
            Time: ${appointmentDetails.time}
            Phone: ${appointmentDetails.phone}
            Email: ${appointmentDetails.email}
            Notes: ${appointmentDetails.message || 'None'}
        `.trim();

        const message = await client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.CLINIC_PHONE_NUMBER
        });

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            appointment,
            twilioMessageId: message.sid
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create appointment',
            error: error.message
        });
    }
});
app.get('/api/login', (req, res) => {
    res.status(200).json({ message: 'Login page accessed' });
});

// Get all appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const appointments = await Appointment.findAll({
            order: [
                ['appointment_date', 'ASC'],
                ['appointment_time', 'ASC']
            ]
        });
        
        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: error.message
        });
    }
});

// Update appointment status
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = status;
        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            appointment
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment',
            error: error.message
        });
    }
});

// Delete appointment
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        await appointment.destroy();

        res.json({
            success: true,
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete appointment',
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

