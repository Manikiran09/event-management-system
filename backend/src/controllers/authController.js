import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const allowedRoles = ["admin", "organizer", "participant"];

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      accountStatus: user.accountStatus,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = "participant", adminKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const isAdminRegistration = role === "admin";

    if (isAdminRegistration && adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({ message: "Invalid admin registration key" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      accountStatus: isAdminRegistration ? "approved" : "pending",
    });

    const token = isAdminRegistration ? createToken(user) : null;

    return res.status(201).json({
      message: isAdminRegistration
        ? "Registration successful"
        : "Registration submitted. Awaiting admin approval.",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register", error: error.message });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      accountStatus: "approved",
      statusChangedBy: req.user.userId,
      statusChangedAt: new Date(),
    });

    return res.status(201).json({
      message: "User created successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create user", error: error.message });
  }
};

const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, password, role, accountStatus } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }
      user.email = email.toLowerCase();
    }
    if (role !== undefined) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }
    if (accountStatus !== undefined) {
      if (!["pending", "approved", "rejected"].includes(accountStatus)) {
        return res.status(400).json({ message: "Invalid account status" });
      }
      user.accountStatus = accountStatus;
      user.statusChangedBy = req.user.userId;
      user.statusChangedAt = new Date();
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.json({ message: "User updated successfully", user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId === userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin accounts do not require approval" });
    }

    user.accountStatus = "approved";
    user.statusChangedBy = req.user.userId;
    user.statusChangedAt = new Date();
    await user.save();

    return res.json({ message: "User approved successfully", user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve user", error: error.message });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin accounts do not require approval" });
    }

    user.accountStatus = "rejected";
    user.statusChangedBy = req.user.userId;
    user.statusChangedAt = new Date();
    await user.save();

    return res.json({ message: "User rejected successfully", user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject user", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.accountStatus === "pending") {
      return res.status(403).json({ message: "Your account is pending admin approval" });
    }

    if (user.accountStatus === "rejected") {
      return res.status(403).json({ message: "Your account was rejected by admin" });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login", error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.accountStatus === "pending") {
      return res.status(403).json({ message: "Your account is pending admin approval" });
    }

    if (user.accountStatus === "rejected") {
      return res.status(403).json({ message: "Your account was rejected by admin" });
    }

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role accountStatus createdAt updatedAt statusChangedAt")
      .sort({ createdAt: -1 });
    return res.json({ users: users.map(serializeUser) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const pendingSignups = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["organizer", "participant"] },
      accountStatus: "pending",
    })
      .select("name email role accountStatus createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.json({ users: users.map(serializeUser) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch pending signups", error: error.message });
  }
};

export {
  register,
  login,
  me,
  listUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  approveUser,
  rejectUser,
  pendingSignups,
};
