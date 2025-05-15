import express from "express"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../prismaClient.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { name , email, role , password } = req.body;

    const HashPassword = bcrypt.hashSync(password, 10);

    try {
        const find = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (find) {
            return res.send("Invalid Username or Password !!");
        }

        const user = await prisma.user.create({
            data: {
                name : name,
                email : email,
                password: HashPassword,
                role : role
            }
        });
        const token = jwt.sign({id:user.id ,email : user.email , name : user.name , role : user.role} , process.env.JWT_SECRET , {
            expiresIn : '24h'
    })
        return res.json({ token });
    } catch (error) {
        console.error(error);
        return res.status(500).json(error.message);
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;