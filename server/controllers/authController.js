import jwt from "jsonwebtoken";
import User from "../models/user.js";

const generateToken = (userId) => jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: "7d"});

// POST /api/auth/register
export const register = async (req,res) => {
    try {
        const {name, email, password} = req.body;
        if(!name || !email || !password)
            return res.status(400).json({message: "all fields are required"});
        const existingUser = await User.findOne({email});
        if(existingUser)
            return res.status(400).json({message: "email already registered"});
        const user = await User.create({name, email, password });
        const token = generateToken(user._id);
        res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
        })
    } catch (error) {
        res.status(500).json({message:"Server error", error: error.message});
    }
};

// POST /api/auth/login
export const login = async(req, res) => {
    try {
        const {email, password} = req.body;
    } catch (error) {
        res.status(500).json({message: "server error", error: error.message})
    }
}

export const 