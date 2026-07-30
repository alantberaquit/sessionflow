import bcrypt from "bcrypt";

import User from "../models/User.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;

export const registerUser = async (request, response) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = request.body ?? {};

    const normalizedName =
      typeof name === "string" ? name.trim() : "";

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    const errors = {};

    if (!normalizedName) {
      errors.name = "Name is required";
    } else if (normalizedName.length < 2) {
      errors.name = "Name must contain at least 2 characters";
    } else if (normalizedName.length > 100) {
      errors.name = "Name cannot exceed 100 characters";
    }

    if (!normalizedEmail) {
      errors.email = "Email is required";
    } else if (normalizedEmail.length > 254) {
      errors.email = "Email cannot exceed 254 characters";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      errors.email = "Please provide a valid email address";
    }

    if (typeof password !== "string" || !password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must contain at least 8 characters";
    } else if (password.length > 72) {
      errors.password = "Password cannot exceed 72 characters";
    }

    if (
      typeof confirmPassword !== "string" ||
      !confirmPassword
    ) {
      errors.confirmPassword =
        "Password confirmation is required";
    } else if (
      typeof password === "string" &&
      password !== confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      return response.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return response.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      SALT_ROUNDS,
    );

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: "participant",
    });

    return response.status(201).json({
      message: "Participant account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error("Unable to create participant account:");
    console.error(error.message);

    return response.status(500).json({
      message: "Unable to create participant account",
    });
  }
};