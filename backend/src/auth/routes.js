import express from "express";
import { z } from "zod";
import { prisma } from "../prismaClient.js";
import { hashPassword, comparePassword, generateToken, authenticate } from "./utils.js";
import { logger } from "./logger.js";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up 3 levels from backend/src/auth to reach project root
const repoRoot = path.resolve(__dirname, "../../..");

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

const updateAvatarSchema = z.object({
  avatarConfig: z.string(),
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

    // Create user in database
    let user;
    try {
      user = await prisma.user.create({
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
      
      // Verify user was actually written to database by reading it back
      const verifiedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });

      if (!verifiedUser) {
        throw new Error("User creation failed: user not found in database after creation");
      }

      const createdDate = new Date(user.createdAt).toISOString().split("T")[0];
      console.log(`[Auth] 💾 User saved to database: ${user.username} (${user.email}) - ID: ${user.id} - Created: ${createdDate}`);
      console.log(`[Auth] ✅ Database write verified: User exists in database`);
    } catch (dbError) {
      logger.error("[Auth] Database write failed", { error: dbError.message, stack: dbError.stack });
      throw new Error(`Failed to save user to database: ${dbError.message}`);
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Log updated user list after registration
    try {
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const userCount = allUsers.length;
      console.log(`\n[Auth] ✅ New user registered!`);
      console.log(`[Auth] Registered Users: ${userCount}`);
      console.log(`[Auth] User List:`);
      allUsers.forEach((u, index) => {
        const createdDate = new Date(u.createdAt).toISOString().split("T")[0];
        console.log(`  ${index + 1}. ${u.username} (${u.email}) - Created: ${createdDate}`);
      });
      console.log(""); // Empty line for readability
    } catch (logError) {
      // Don't fail registration if logging fails
      logger.warn("[Auth] Failed to log user list after registration", logError);
    }

    // Git commit and push after successful registration
    try {
      const dbFilePath = path.join(repoRoot, "backend", "data", "rooms.db");
      console.log(`[Git] Repo root: ${repoRoot}`);
      console.log(`[Git] Database file path: ${dbFilePath}`);
      console.log(`[Git] Committing database changes...`);
      
      // Use absolute path to ensure we're adding the correct file
      await execAsync(`git add -f "${dbFilePath}"`, { cwd: repoRoot });
      await execAsync('git commit -m "Added new user to db"', { cwd: repoRoot });
      console.log(`[Git] ✅ Committed database changes`);
      
      console.log(`[Git] Pushing to origin...`);
      await execAsync("git push origin", { cwd: repoRoot });
      console.log(`[Git] ✅ Pushed to origin`);
    } catch (gitError) {
      // Don't fail registration if git fails
      logger.warn("[Git] Failed to commit/push database changes", { 
        error: gitError.message,
        stdout: gitError.stdout,
        stderr: gitError.stderr 
      });
      console.log(`[Git] ⚠️  Git operation failed (registration still succeeded): ${gitError.message}`);
    }

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
  res.json({ message: "Logged out successfully" });
});

/**
 * PUT /api/auth/avatar
 * Update user avatar configuration (protected route)
 */
router.put("/avatar", authenticate, async (req, res) => {
  try {
    // Validate input
    const validated = updateAvatarSchema.parse(req.body);
    const { avatarConfig } = validated;

    // Update user avatar config
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        avatarConfig: avatarConfig,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarConfig: true,
        createdAt: true,
        updatedAt: true,
      },
    });


    res.json({
      message: "Avatar updated successfully",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    logger.error("[Auth] Update avatar error", { error: error.message, stack: error.stack });
    res.status(500).json({
      error: "Failed to update avatar",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
