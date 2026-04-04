const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, rollNumber, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const existingUser = await User.findByEmailOrRollNumber(email, rollNumber);

  if (existingUser) {
    res.status(409);
    throw new Error("User already exists with this email or roll number");
  }

  const user = await User.createUser({
    name,
    email,
    rollNumber,
    password,
    role: "student"
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      role: user.role,
      token: generateToken(user._id)
    }
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { emailOrRollNumber, password } = req.body;

  if (!emailOrRollNumber || !password) {
    res.status(400);
    throw new Error("Email or roll number and password are required");
  }

  const normalizedValue = emailOrRollNumber.trim();
  const user = await User.findByLogin(normalizedValue);

  if (!user || !(await User.matchPassword(password, user.password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      role: user.role,
      token: generateToken(user._id)
    }
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};
