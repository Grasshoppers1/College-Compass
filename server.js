const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],// Make sure this matches the frontend origin
    methods: ['GET', 'POST'],
    credentials: true, // Allow credentials (cookies) to be sent
}

));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aykg0517@gmail.com', // Your Gmail address
        pass: 'ahdd knry hpnw nrfq'    // Your Gmail app password (for security)
    }
});
app.post('/send-email', (req, res) => {
    const { name, email, subject, message } = req.body;

    const mailOptions = {
        from: email,
        to: 'aykg0517@gmail.com', // Your Gmail address
        subject: `Contact form submission: ${subject}`,
        text: `Message from: ${name}\nEmail: ${email}\n\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({message:'Error sending email'});
        }
        res.status(200).json({ message: 'Email sent successfully' });
    });
});

const sessionStore = MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/Website-Users',
    collectionName: 'sessions'
});

app.use(session({
    secret: 'myVeryStrongSecretKey123!',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { secure:false,maxAge: 15 * 60 * 1000 } // Set session timeout to 15 minutes
}));

// Middleware to reset session timeout after each request
app.use((req, res, next) => {
    if (req.session) {
        req.session._garbage = Date();
        req.session.touch();
        console.log('Session timeout reset. Session ID:', req.sessionID);
    }
    next();
});
console.log('Session middleware initialized');

// Database connections
const collegeDb = mongoose.createConnection('mongodb://localhost:27017/College_Data', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
collegeDb.on('connected', () => console.log('Connected to College_Data database'));
collegeDb.on('error', (error) => console.error('College_Data database connection error:', error));

const userDb = mongoose.createConnection('mongodb://localhost:27017/Website-Users', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
userDb.on('connected', () => console.log('Connected to Website-Users database'));
userDb.on('error', (error) => console.error('Website-Users database connection error:', error));

const CollegeSchema = new mongoose.Schema({
    'Institute Name ': { type: String, required: true },
    'CLOSE RANK': { type: Number, required: true },
    'Branch ': { type: String, required: true },
    'Quota ': { type: String },
    'SEAT TYPE': { type: String },
    'GENDER': { type: String },
    'OPEN RANK': { type: Number },
});
const College = collegeDb.model('College', CollegeSchema, 'Name');

const PredictorUserSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    gender: String,
    email: { type: String, unique: true },
    phone: String,
    branch: String,
    jee_rank: Number,
});
const PredictorUser = userDb.model('PredictorUser', PredictorUserSchema, 'Ourusers');

const AlreadyUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const AlreadyUser = userDb.model('AlreadyUser', AlreadyUserSchema, 'Already-Users');

// Prediction route with search count limit
app.post('/predict', async (req, res) => {
    if (!req.session.searchCount) {
        req.session.searchCount = 0;
    }
    req.session.searchCount += 1;
    console.log('Current search count:', req.session.searchCount);

    if (req.session.searchCount > 3) {
        console.log('Search limit exceeded. Ending session.');
        req.session.destroy(err => {
            if (err) console.error('Error destroying session:', err);
        });
        return res.status(403).json({ message: 'Please log in to continue searching.' });
    }

    const { first_name, last_name, gender, email, phone, branch, jee_rank } = req.body;
    try {
        let existingUser = await PredictorUser.findOne({ email });
        if (!existingUser) {
            const newUser = new PredictorUser({ first_name, last_name, gender, email, phone, branch, jee_rank });
            await newUser.save();
        }

        let query = {
            'CLOSE RANK': { $gt: parseInt(jee_rank) },
            'Branch ': { $regex: new RegExp(branch.trim(), 'i') }
        };
        if (branch && branch !== 'ALL') {
            query['Branch '] = { $regex: new RegExp(branch.trim(), 'i') };
        }
        const colleges = await College.find(query).sort({ 'CLOSE RANK': 1 });
        console.log('Colleges found:', colleges);

        if (colleges.length === 0) {
            return res.status(404).json({ message: 'No colleges found for your criteria.' });
        }

        res.json(colleges);
    } catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new AlreadyUser({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Email already exists' });
        } else {
            console.error('Error during signup:', error);
            res.status(500).json({ message: 'Server error during signup' });
        }
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await AlreadyUser.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        req.session.searchCount = 0;  // Reset search count on login
        console.log('Login successful. Session ID:', req.sessionID);

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
