import { redis } from "../lib/redis.js";
import User from "../models/user-model.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
  const acessToken = jwt.sign({ userId }, process.env.ACESS_TOKEN_SCT, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SCT, {
    expiresIn: "7d",
  });

  return { acessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  ); // 7 days
};

const setCookies = (res, acessToken, refreshToken) => {
  res.cookie("acessToken", acessToken, {
    httpOnly: true, // prevencao contra XSS
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // prevencao contra CSRF
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevencao contra XSS
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // prevencao contra CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 15 min
  });
};

export const signup = async (req, res) => {
  const { email, password, name, isSeller, country, lang } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password, isSeller, country, lang });

    const { acessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookies(res, acessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
        country: user.country,
        lang: user.lang
      },
    
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: error.message });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const { acessToken, refreshToken } = generateTokens(user._id);

      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, acessToken, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
        country: user.country,
        lang: user.lang
      });
    }
    else {
        res.status(401).json({message:"Invalid email or password"})
    }
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: error.message });
  }
};
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SCT);
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie("acessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({message: "No refresh token provided"})
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SCT)
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`)
        
        if(storedToken !== refreshToken) {
            return res.status(401).json({message:"Invalid refresh Token"})
        }

        const acessToken = jwt.sign({userId: decoded.userId}, process.env.ACESS_TOKEN_SCT, {expiresIn: "15m"});

        res.cookie("acesstoken", acessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        })

        res.json({message: "Token refreshed successfully" })
    } catch (error) {
        console.log("Error in refreshToken controller", error.message)
        res.status(500).json({message: "Server error", error: error.message })
    }
}

export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProfile = async (req, res) => {
  const { name, country, lang, profilePic } = req.body;

  try {
    // Verifica se o usuário está autenticado
    const userId = req.user._id;

   
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, country, lang, profilePic },
      { new: true, runValidators: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isSeller: updatedUser.isSeller,
        country: updatedUser.country,
        lang: updatedUser.lang,
        profilePic: updatedUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Error in updateProfile controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
