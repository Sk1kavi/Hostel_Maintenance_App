const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require("dotenv").config();


const app = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;


// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostel-complaints',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  },
});

const upload = multer({ storage: storage });

// Database Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'warden', 'admin'] },
  hostel: String,
  roomNumber: String,
  department: String,
  yearOfStudy: String,
  rollNumber: { type: String, unique: true, sparse: true },
}, { timestamps: true });

const hostelSchema = new mongoose.Schema({
  name: String,
  type: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const complaintSchema = new mongoose.Schema({
  title: String,
  category: { 
    type: String, 
    enum: ['Electrical', 'Plumbing', 'Carpentry', 'Civil (Wall/Ceiling)', 'Network/Internet', 'Furniture', 'Sanitation', 'Water Cooler', 'Other'] 
  },
  description: String,
  hostel: String,
  roomNumber: String,
  status: { 
    type: String, 
    enum: ['Submitted', 'In Progress', 'Resolved', 'Rejected'], 
    default: 'Submitted' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [String],
  updates: [{
    status: String,
    comment: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Hostel = mongoose.model('Hostel', hostelSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role, hostel, roomNumber, department, yearOfStudy, rollNumber } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      name,
      email,
      password: hashedPassword,
      role
    };

    if (role === 'student') {
      userData.hostel = hostel;
      userData.roomNumber = roomNumber;
      userData.department = department;
      userData.yearOfStudy = yearOfStudy;
      userData.rollNumber = rollNumber;
    } else if (role === 'warden') {
      userData.hostel = hostel;
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { ...user.toObject(), password: undefined }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { ...user.toObject(), password: undefined }
    });
    console.log("User logged in successfully");
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    console.log("Error in login");
  }
});

// Hostel Routes
app.get('/api/hostels', async (req, res) => {
  try {
    const hostels = await Hostel.find({ isActive: true });
    res.json(hostels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/hostels', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hostel = new Hostel(req.body);
    await hostel.save();
    res.status(201).json(hostel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Complaint Routes
app.get('/api/complaints', authenticateToken, async (req, res) => {
  try {
    let query = {};
    const user = await User.findById(req.user.userId);

    if (user.role === 'student') {
      query.createdBy = req.user.userId;
    } else if (user.role === 'warden') {
      query.hostel = user.hostel;
    }
    // Admin can see all complaints (no filter)

    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name email')
      .populate('handledBy', 'name email')
      .populate('updates.updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/complaints', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create complaints' });
    }

    const user = await User.findById(req.user.userId);
    const images = req.files ? req.files.map(file => file.path) : [];

    const complaint = new Complaint({
      ...req.body,
      createdBy: req.user.userId,
      hostel: user.hostel,
      roomNumber: req.body.roomNumber || user.roomNumber,
      images
    });

    await complaint.save();
    await complaint.populate('createdBy', 'name email');

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/complaints/:id', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('handledBy', 'name email')
      .populate('updates.updatedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const user = await User.findById(req.user.userId);

    // Check access permissions
    if (user.role === 'student' && complaint.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (user.role === 'warden' && complaint.hostel !== user.hostel) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/complaints/:id', authenticateToken, async (req, res) => {
  try {
    const { status, comment } = req.body;
    const user = await User.findById(req.user.userId);

    if (user.role === 'student') {
      return res.status(403).json({ message: 'Students cannot update complaint status' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if warden can access this complaint
    if (user.role === 'warden' && complaint.hostel !== user.hostel) {
      return res.status(403).json({ message: 'Access denied' });
    }

    complaint.status = status;
    complaint.handledBy = req.user.userId;
    complaint.updates.push({
      status,
      comment,
      updatedBy: req.user.userId,
      timestamp: new Date()
    });

    await complaint.save();
    await complaint.populate('createdBy', 'name email');
    await complaint.populate('handledBy', 'name email');
    await complaint.populate('updates.updatedBy', 'name email');

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Profile Routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, roomNumber, department, yearOfStudy } = req.body;
    const user = await User.findById(req.user.userId);

    user.name = name || user.name;
    if (user.role === 'student') {
      user.roomNumber = roomNumber || user.roomNumber;
      user.department = department || user.department;
      user.yearOfStudy = yearOfStudy || user.yearOfStudy;
    }

    await user.save();
    res.json({ ...user.toObject(), password: undefined });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});