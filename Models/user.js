// Define a User schema to store user details
const mongoose = require('mongoose'); // Make sure this is already imported
const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    gender: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    branch: { type: String, required: true },
    jee_rank: { type: Number, required: true },
    location: {
        type: {
            lat: { type: Number, required: true },
            lon: { type: Number, required: true },
        },
        required: true,
    },
}, { timestamps: true });

// Create a User model
const User = mongoose.model('User', UserSchema);
