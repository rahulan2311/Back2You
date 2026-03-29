const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["student", "staff", "admin"],
      default: "student"
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

async function findById(id) {
  return UserModel.findById(id).select("-password").lean();
}

async function findByEmailOrRollNumber(email, rollNumber) {
  return UserModel.findOne({
    $or: [{ email: email.toLowerCase() }, { rollNumber: rollNumber.toUpperCase() }]
  }).lean();
}

async function findByLogin(value) {
  return UserModel.findOne({
    $or: [{ email: value.toLowerCase() }, { rollNumber: value.toUpperCase() }]
  }).lean();
}

async function createUser({ name, email, rollNumber, password, role = "student" }) {
  const user = await UserModel.create({
    name,
    email,
    rollNumber,
    password,
    role
  });

  return findById(user._id);
}

function matchPassword(enteredPassword, hashedPassword) {
  return bcrypt.compare(enteredPassword, hashedPassword);
}

module.exports = {
  findById,
  findByEmailOrRollNumber,
  findByLogin,
  createUser,
  matchPassword,
  UserModel
};
