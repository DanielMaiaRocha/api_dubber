import jwt from 'jsonwebtoken';
import { createUser, getUsers } from '../models/user-model.js';

const JWT_SECRET = process.env.JWT_SECRET; 

export const register = async (req, res) => {
    const { username, email, password, user_img, vid, country, phone, description, is_seller } = req.body;
    try {
        const newUser = await createUser({
            username,
            email,
            password,
            user_img,
            vid,
            country,
            phone,
            description,
            isSeller: is_seller
        });
        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
       
        const user = await getUserByEmail(email); 
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }


        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
};

export const logout = (req, res) => {

    res.json({ message: 'Logout successful' });
};
