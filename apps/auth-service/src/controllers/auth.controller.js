import { prisma } from "../config/db.config.js";
import bcrypt from "bcryptjs";

const registerController = async (req, res, next) => {
    const { email, password } = req.body ?? {};

    try {
        if (!email || !password) {
            return res.status(400).json({
                status: "failed",
                message: "email and password are required"
            });
        }

        // findFirst avoids schema/client drift issues with findUnique during early setup.
        const userExists = await prisma.authUser.findFirst({
            where: {
                email
            }
        });

        if (userExists) {
            return res.status(400).json({
                status: "failed",
                message: "User already exists"
            });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.authUser.create({
            data: {
                email,
                passwordHash
            }
        });
        res.status(201).json({
            status: "success",
            message: "User registered successfully",
            user:{
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        return next(error);
    }

};

const loginController = async (req, res, next) => {
    const { email, password } = req.body ?? {};

    try {
        if (!email || !password) {
            return res.status(400).json({
                status: "failed",
                message: "email and password are required"
            });
        }

        const user = await prisma.authUser.findFirst({
            where: {
                email,
                deletedAt: null,
                isActive: true
            }
        });

        if (!user?.passwordHash) {
            return res.status(401).json({
                status: "failed",
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({
                status: "failed",
                message: "Invalid email or password."
            });
        }

        res.status(200).json({
            status: "success",
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        return next(error);
    }
};

export {
    registerController,
    loginController
};