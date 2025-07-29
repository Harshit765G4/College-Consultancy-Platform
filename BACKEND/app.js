// app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./models'); // Assuming this now correctly imports your Sequelize models and instance
const path = require('path');
const fs = require('fs');

dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(express.json()); // Parses JSON request bodies
app.use(cors());         // Enables CORS for all origins (consider restricting in production)

// Serve static files (e.g., uploaded documents)
// Ensure this path is correct relative to your app.js
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));


// Database synchronization
// This assumes 'db' object has a 'sequelize' property, which is your Sequelize instance.
// And that 'db.sequelize.sync' is the correct method to sync models.
db.sequelize.sync({ alter: true }) // 'alter: true' attempts to change existing tables to match the model
  .then(() => {
    console.log('Database synced successfully.');
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/colleges', require('./routes/collegeRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/profile', require('./routes/profileRoutes')); // <--- ADDED THIS LINE FOR PROFILE ROUTES


app.get('/', (req, res) => {
  res.send('Consultancy Platform Backend API is running!');
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the stack trace for debugging
  res.status(500).send('Something broke!'); // Generic error message for client
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});