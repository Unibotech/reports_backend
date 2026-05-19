import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const registerManager = async (req, res) => {
  try {
    const { name, email, password, departmentId } = req.body;

    // Check if department already has manager
    const existingManager = await prisma.manager.findUnique({
      where: { departmentId }
    });

    if (existingManager) {
      return res.status(400).json({
        message: "This department already has a manager"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = await prisma.manager.create({
      data: {
        name,
        email,
        password: hashedPassword,
        departmentId
      }
    });

    res.status(201).json(manager);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginManager = async (req, res) => {
  try {
    const { email, password } = req.body;

    const manager = await prisma.manager.findUnique({ where: { email } });

    if (!manager) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, manager.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: manager.id, departmentId: manager.departmentId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, email: manager.email, departmentId: manager.departmentId });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};