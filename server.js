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
const router = express.Router();
const { ObjectId } = require('mongodb');
const crypto = require("crypto");
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500','http://localhost:3000'],// Make sure this matches the frontend origin
    methods: ['GET', 'POST'],
    credentials: true, // Allow credentials (cookies) to be sent
}

));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

const OTP_STORE = {}; // Temporary store for OTPs
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Gmail SMTP server
    port: 587, // Port for STARTTLS
    secure: false, // Use STARTTLS
    auth: {
        user: "aykg0517@gmail.com", // Your Gmail address
        pass: "ukfv ryoz ndqm efjk", // Your Gmail app password
    },
});

app.post('/send-email', async (req, res) => {
    const { name, email, subject, message } = req.body;
    // Nodemailer configuration
    const mailOptions = {
        from: email,
        to: 'aykg0517@gmail.com', // replace with your Gmail address
        subject: `Contact Form Submission: ${subject}`,
        text: `You have received a new message from ${name} (${email}):\n\n${message}`
    };

    try {
        // Send email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Your message has been sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send your message. Please try again later.' });
    }
});
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// POST: Send OTP

// POST: Verify OTP

// Database connections
const collegeDb = mongoose.createConnection('mongodb://localhost:27017/College_Data', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,  // Set timeout for server selection
    socketTimeoutMS: 30000,     
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
    'NIRF_RANK':{type:Number},
    latitude: { type: Number }, // Add latitude if missing
    longitude: { type: Number }, // Add longitude if missing5
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
    location: {
        latitude: { type: Number, required: false },
        longitude: { type: Number, required: false },
    },
});
const PredictorUser = userDb.model('PredictorUser', PredictorUserSchema, 'Ourusers');

const AlreadyUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verificationStatus: { type: Boolean, default: false },
    collegeId: { type: mongoose.Schema.Types.ObjectId}, // Optional link to college
});
const AlreadyUser = userDb.model('AlreadyUser', AlreadyUserSchema, 'Already-Users');

const collegedetailsSchema = new mongoose.Schema({
    _id:  mongoose.Schema.Types.ObjectId,
    "Institute Name ": String,
    NIRF_RANK:Number,
    Established: Number,
    Exam: String,
    Courses: String,
    "Institute Type And Approvals": String,
    Gender: String,
    "Student Count": Number,
    "Faculty Count": Number,
    "Campus Size": String,
    Domain: String, // e.g., "college.ac.in"
    Reviews: [
        {
          reviewId: mongoose.Schema.Types.ObjectId,
          userId: mongoose.Schema.Types.ObjectId,
          questions: { type: [String], required: true }, // Array of question responses
          suggestions: { type: String, required: true },  // Text for suggestions
          rating: Number,
          date: { type: Date, default: Date.now },
        },
      ],
    "Gender Percentage": String,
    "Percentage Of Students from Outside the States": String,
    VerifiedUsers: [{ 
        userId: mongoose.Schema.Types.ObjectId,  // ID of the verified user
        email: String,                          // Email of the verified user
        verificationDate: Date,                 // Date when the user was verified
    }],
},{ collection: 'college_details' });

const CollegeDetail = collegeDb.model('CollegeDetail', collegedetailsSchema, 'college_details');

















// const verifyUser = (req, res, next) => {
//     const { userId } = req.body;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized user" });
//     }
//     next();
//   };

//   router.post("/add-comment", verifyUser, async (req, res) => {
//     const { collegeId, userId, comment, rating } = req.body;
  
//     try {
//       const college = await CollegeDetail.findById(collegeId);
//       if (!college) {
//         return res.status(404).json({ success: false, message: "College not found" });
//       }
  
//       const newComment = {
//         reviewId: new mongoose.Types.ObjectId(),
//         userId,
//         comment,
//         rating,
//       };
  
//       college.Reviews.push(newComment);
//       await college.save();
  
//       res.status(200).json({ success: true, message: "Comment added successfully" });
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Error adding comment", error });
//     }
//   });
  
//   // Edit an existing comment
//   router.put("/edit-comment", verifyUser, async (req, res) => {
//     const { collegeId, reviewId, userId, comment, rating } = req.body;
  
//     try {
//       const college = await CollegeDetail.findById(collegeId);
//       if (!college) {
//         return res.status(404).json({ success: false, message: "College not found" });
//       }
  
//       const review = college.Reviews.find(
//         (r) => r.reviewId.toString() === reviewId && r.userId.toString() === userId
//       );
  
//       if (!review) {
//         return res.status(404).json({ success: false, message: "Review not found or unauthorized" });
//       }
  
//       review.comment = comment;
//       review.rating = rating;
//       await college.save();
  
//       res.status(200).json({ success: true, message: "Comment updated successfully" });
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Error updating comment", error });
//     }
//   });
  
//   module.exports = router;








// API Endpoint to Fetch College Details by ID
app.get('/college-details', async (req, res) => {

    const instituteName = req.query.name;
    if (!instituteName) {
        return res.status(400).send({ error: 'Institute name is required.' });
    }

    try {
        const collegeDetails = await CollegeDetail.findOne({ 'Institute Name ': instituteName });
        if (!collegeDetails) {
            return res.status(404).send({ error: 'College not found.' });
        }
        console.log("GOOD");
        const rank = collegeDetails.NIRF_RANK;
        if (rank === undefined || rank === null || isNaN(rank)) {
            return res.status(400).send({ error: 'Invalid NIRF rank for the college.' });
        }
        console.log("Rank fetched: ", rank);
        const nearbyColleges = await CollegeDetail.find({
            NIRF_RANK: { $gte: rank - 2, $lte: rank + 2 },
        }).limit(5);

        console.log("Institute Name: ", collegeDetails);
        console.log("Fetched nearby colleges successfully.",rank-2,rank+2);

        res.json({collegeDetails,nearbyColleges
        });
        console.log("GOOD1");

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Server error.' });
    }
});
app.get('/user-info', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }

    res.json({ user: req.session.user });
});
app.get('/user-session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Prediction route with search count limit
app.post('/predict', async (req, res) => {
    if (!req.session.user) {
    if (!req.session.searchCount)  req.session.searchCount = 0;
    req.session.searchCount = (req.session.searchCount || 0) + 1;
    console.log(`Current search count for unlogged user: ${req.session.searchCount}`);

    if (req.session.searchCount > 3) {
        console.log('Search limit exceeded. Ending session.');
        req.session.destroy(err => {
            if (err) console.error('Error destroying session:', err);
        });
        return res.status(403).json({ message: 'Please log in to continue searching.' });
    }
}

    const { first_name, last_name, gender, email, phone,category, branch, jee_rank,latitude, longitude,locationPermissionGranted } = req.body;
    try {
        let existingUser = await PredictorUser.findOne({ email });
        if (!existingUser) {
            const newUser = new PredictorUser({ first_name, last_name, gender, email, phone,category, branch, jee_rank,location: { latitude, longitude }, });
            await newUser.save();
        }
        else{
            existingUser.location = {latitude,longitude};
            await existingUser.save();
        }
        const genderMap = {
            Male: 'Gender-Neutral',
            Female: 'Female-only (including Supernumerary)'
        };
        const schemaGender = genderMap[gender]||gender;

        const haversineDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Earth radius in kilometers
            const toRad = (deg) => deg * (Math.PI / 180); // Convert degrees to radians
            
            const dLat = toRad(lat2 - lat1); // Difference in latitude
            const dLon = toRad(lon2 - lon1); // Difference in longitude
            
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            
            return R * c; // Returns the distance in kilometers
        };
      

        let query = {
            'CLOSE RANK': { $gt: parseInt(jee_rank) },
            'Branch ': { $regex: new RegExp(branch.trim(), 'i') }
        };
        if (branch && branch !== 'ALL') {
            query['Branch '] = { $regex: new RegExp(branch.trim(), 'i') };
        }
        if (category && category !== 'ALL') {
            query['SEAT TYPE'] = category.trim();
        }
        if (schemaGender) {
            query['GENDER'] = schemaGender;
        }
        console.log('Query:', query);
        const colleges = await College.find(query).sort({ 'CLOSE RANK': 1 });
        console.log('Colleges found:', colleges);
        console.log('Gender used in query:', schemaGender);
        if (!locationPermissionGranted) {
            return res.json({ colleges });
        }

        if (colleges.length === 0) {
            return res.status(404).json({ message: 'No colleges found for your criteria.' });
        }
        const collegesWithDistance = colleges.map(college => {
            console.log('College Data:', college);  // Log the college data
            if ( !college.latitude || !college.longitude) {
                console.warn(`Skipping college due to missing location: ${college['Institute Name ']}`);
                return null;
            }
            const collegeLat = college.latitude; // Latitude of the college
            const collegeLon = college.longitude; // Longitude of the college
            
            // Calculate distance from user to college
            const distance = haversineDistance(latitude, longitude, collegeLat, collegeLon);
            console.log(`Distance from user to ${college['Institute Name ']}: ${distance} km`);
    
            return {
                ...college.toObject(),distance // Add the calculated distance
            };
        }).filter(Boolean);
    
        // Sort colleges by distance in ascending order (nearest first)
        collegesWithDistance.sort((a, b) => a.distance - b.distance);
        console.log('Colleges with calculated distance:', collegesWithDistance);

    
        // Send the sorted result
        res.json(collegesWithDistance);
        
    
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


app.post("/send-otp", async(req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }
   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
     }
     const Domain = email.split("@")[1];
     const normalizedDomain = Domain.toLowerCase();
     console.log("email found",Domain);
    try {
        // Query database to check for a college with the given domain
       const college = await CollegeDetail.findOne({Domain :normalizedDomain});
         if (!college) {
            
            return res.status(404).json({ success: false, message: "College not found for this email domain." });
        }
    console.log("college found",college);
    const otp = generateOTP();
    OTP_STORE[email] = { otp, expiresAt: Date.now() + 300000 }; // Valid for 5 minutes

    const mailOptions = {
        from: "aykg0517@gmail.com",
        to: email,
        subject: "Your OTP for College Verification",
        text: `Your OTP for  is ${otp}. It is valid for 5 minutes.`,
    };
    console.log("Request body:", req.body);
   
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Error sending OTP:", err);
            return res.status(500).json({ success: false, message: "Failed to send OTP." });
        }
        res.status(200).json({ success: true, message: "OTP sent successfully." });
    });
}catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({ success: false, message: "Failed to send OTP." });
    }
});

    app.post("/verify-otp", async(req, res) => {
        console.log("Received request:", req.body);

        const { email, otp } = req.body;
        if (!email || !otp) {
            console.error("Missing email or OTP");
            return res.status(400).json({ success: false, message: "Email and OTP are required." });
        }

        const record = OTP_STORE[email];
        if (!record) {
            return res.status(400).json({ success: false, message: "No OTP found for this email." });
        }
        console.log("Stored OTP:", record.otp, "Received OTP:", otp);
        console.log("Expires At:", record.expiresAt, "Current Time:", Date.now());
        if (Date.now() > record.expiresAt) {
            delete OTP_STORE[email]; // Clean expired OTP
            return res.status(400).json({ success: false, message: "OTP has expired." });
        }

        if (record.otp.toString() === otp.toString()) {
            try{
                const Domain = email.split("@")[1];
                const normalizedDomain = Domain.toLowerCase();
             //console.log("email found",normalizedDomain);
                 const college = await CollegeDetail.findOne({ Domain:normalizedDomain });
                 console.log("email found",normalizedDomain);
                    //  if (!college) {
                    //      return res.status(404).json({ success: false, message: "College not found for this email domain." });
                    //  }
        
                    
        
                  


            const user = await AlreadyUser.findOneAndUpdate(
                { email },
                { $set: { 
                    verificationStatus: true,
                    collegeId: college._id, // Set the college_id in the user's schema
                 } 
                },
                { new: true } // Return the updated user document
            );
            console.log("Database user found and updated:", user);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found for this email." });
            }

            const updatedCollege = await CollegeDetail.findByIdAndUpdate(
                college._id,
                {
                  $addToSet: { VerifiedUsers: { userId: user._id, email, verificationDate: new Date() } },
                },
                { new: true }
              );

                    console.log("Database updated for the college",updatedCollege);


        
            if(user){
                
            delete OTP_STORE[email]; // Clean used OTP
            return res.status(200).json({
                success: true,
                verified: true,
                user:
                {email:user.email,
                    name:user.name,
                    verificationStatus:user.verificationStatus,
                    college_id: user.collegeId, // Return the updated college_id
                },
                college: { name: updatedCollege["Institute Name "], id: updatedCollege._id },
                message: "User verified successfully.",
                });
        } else {
            console.error("No user found with this email for OTP verification.");
        return res.status(400).json({ success: false, message: "Invalid OTP." });
    
        }
    }catch (error) {
        console.error("Error updating verification status:", error);
    return res.status(500).json({ success: false, message: "Database error." });
    }   
    }else {
        return res.status(400).json({ success: false, verified: false, message: "Invalid OTP." });
    }
    });

    app.get('/review/:collegeId', (req, res) => {
        const collegeId = req.params.collegeId; // Extract the college ID from the URL
        res.render('review.html', { collegeId }); // Pass the ID to the frontend
    });
    






    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
    
        try {
            const user = await AlreadyUser.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }
            console.log('Fetched user from DB:', user);

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }
            
            req.session.user = { id: user._id,
                 name: user.name,
                 email:user.email,
                 verificationStatus: user.verificationStatus,
                 collegeId:user.collegeId,
                 
             }; // For sessions
             
            req.session.searchCount = 0;  // Reset search count on login
            console.log('Login successful. Session ID:', req.sessionID);
            console.log('College ID',user.collegeId);
            res.json(
                {
                     success: true, user: { id:user._id,name: user.name,email:user.email,
                        verificationStatus: user.verificationStatus,collegeId:user.collegeId } 
                    });
           
        } catch (error) {
            console.error('Error during login:', error);
            res.status(500).json({ message: 'Server error during login' });
        }
    });



















    app.post("/add-comment", async (req, res) => {
        console.log("Request Body:", req.body); // Add this line for debugging
        const { collegeId, userId, questions,suggestions, rating } = req.body;
    
        console.log("Request Body:", req.body); // Debugging
    
        // Validate the input data
        if (!collegeId || !userId || !rating) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required." });
        }
    
        try {
            // Create a unique ID for the review
            // const reviewId = new mongoose.Types.ObjectId();
    
            // // Add the review to the college's Reviews array
            // const updatedCollege = await CollegeDetail.findByIdAndUpdate(
            //     collegeId,
            //     {
            //         $push: {
            //             Reviews: {
            //                 reviewId,
            //                 userId,
            //                 comment,
            //                 rating: parseInt(rating, 10), // Ensure rating is a number
            //                 date: new Date()
            //             }
            //         }
            //     },
            //     { new: true } // Return the updated document
            // );
            const newReview = {
                reviewId: new mongoose.Types.ObjectId(), // Generate unique ID
                userId,
                questions,
                suggestions,
                rating,
                date: new Date(),
            };
    
            const result = await CollegeDetail.updateOne(
                { _id: collegeId },
                { $push: { Reviews: newReview } }
            );
    
            console.log("Database Update Result:", result);
            res.status(200).json({ success: true, message: "Review added successfully!" });
            if (!result) {
                return res
                    .status(404)
                    .json({ success: false, message: "College not found." });
            }
    
        } catch (error) {
            console.error("Error adding review:", error);
            res.status(500).json({
                success: false,
                message: "Server error while adding review."
            });
        }
    });














//placement-details
const placementdetailsSchema = new mongoose.Schema({
    _id:  mongoose.Schema.Types.ObjectId,
    "Institute Name": String,
    "First year total students intake": Number,
    "Total students admitted": Number,
    "Total Graduated Students": Number,
    "Total Placed Students": Number,
    "Placement Percentage": String,
    "Total student gone for higher studies": Number,
    "Median Salary": String
},{ collection: 'placement_details' });

const placementDetail = collegeDb.model('placementDetail', placementdetailsSchema, 'placement_details');

// API Endpoint to Fetch College Details by ID
app.get('/placement-details', async (req, res) => {

    const instituteName = req.query.name;
    if (!instituteName) {
        return res.status(400).send({ error: 'Institute name is required.' });
    }

    try {
        const placementDetails = await placementDetail.findOne({ 'Institute Name': instituteName });
        if (!placementDetails) {
            return res.status(404).send({ error: 'College not found.' });
        }

        res.json(placementDetails);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Server error.' });
    }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
