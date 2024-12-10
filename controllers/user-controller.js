import User from "../models/user-model.js";
import createError from "../utils/create-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const deleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (req.userId !== user._id.toString()) {
    return next(createError(403, "You can delete only your account!"));
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).send("deleted.");
};

export const register = async (req, res, next) => {
  try {
    const hash = bcrypt.hashSync(req.body.password, 5);
    const newUser = new User({
      ...req.body,
      password: hash,
    });

    await newUser.save();
    res.status(201).send("User has been created.");
  } catch (err) {
    next(err);
  }
};

export const handlePostRequest = (req, res) => {
  const userId = req.params.id; 
  const { email } = req.body; 

  if (!email) {
      return res.status(400).json({ error: "Email is required" });
  }

  res.status(200).json({
      message: "Requisição POST recebida com sucesso!",
      userId,
      email,
  });
}

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) return next(createError(404, "User not found!"));

    const isCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isCorrect)
      return next(createError(400, "Wrong password or username!"));

    const token = jwt.sign(
      {
        id: user._id,
        isSeller: user.isSeller,
      },
      process.env.JWT_KEY
    );

    const { password, ...info } = user._doc;
    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .send(info);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logged out.");
};

export const getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).send(user);
};

// Função para atualizar o usuário
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(createError(404, "User not found"));
    }

 
    if (req.userId !== user._id.toString()) {
      return next(createError(403, "You can only update your own account"));
    }

    const updatedUserData = { ...req.body };

    
    if (req.body.password) {
      const hash = bcrypt.hashSync(req.body.password, 5);
      updatedUserData.password = hash;
    }

   
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedUserData, {
      new: true,
    });

    res.status(200).send(updatedUser);
  } catch (err) {
    next(err);
  }
};
