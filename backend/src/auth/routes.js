import express from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { hashPassword, comparePassword, generateToken, authenticate } from "./utils.js";
import { logger } from "./logger.js";

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  avatarConfig: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req, res) => {
  try {
    // Validate input
    const validated = registerSchema.parse(req.body);
    const { email, username, password, avatarConfig } = validated;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email.toLowerCase()
          ? "Email already registered"
          : "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        avatarConfig: avatarConfig || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarConfig: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    logger.info("[Auth] User registered", { userId: user.id, email: user.email, username: user.username });

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    logger.error("[Auth] Registration error", { error: error.message, stack: error.stack });
    res.status(500).json({
      error: "Failed to register user",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    logger.info("[Auth] User logged in", { userId: user.id, email: user.email });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarConfig: user.avatarConfig,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    logger.error("[Auth] Login error", { error: error.message, stack: error.stack });
    res.status(500).json({
      error: "Failed to login",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (protected route)
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarConfig: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({ user });
  } catch (error) {
    logger.error("[Auth] Get user error", { error: error.message, stack: error.stack });
    res.status(500).json({
      error: "Failed to get user info",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, but we can log it)
 */
router.post("/logout", authenticate, async (req, res) => {
  logger.info("[Auth] User logged out", { userId: req.user.userId });
  res.json({ message: "Logged out successfully" });
});

export default router;
