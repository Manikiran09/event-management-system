import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User account not found" });
    }

    if (user.accountStatus && user.accountStatus !== "approved") {
      return res.status(403).json({
        message:
          user.accountStatus === "pending"
            ? "Your account is pending admin approval"
            : "Your account was rejected by admin",
      });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      accountStatus: user.accountStatus || "approved",
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

export { authRequired, allowRoles };
