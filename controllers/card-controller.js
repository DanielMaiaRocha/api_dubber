import Card from "../models/card-model.js";
import User from "../models/user-model.js";
import createError from "../utils/create-error.js";
import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

// Função para verificar se o usuário é um vendedor
const verifySeller = async (req) => {
  const acessToken = req.cookies.acessToken;
  if (!acessToken) {
    throw new Error("No access token provided");
  }

  try {
    const decoded = jwt.verify(acessToken, process.env.ACESS_TOKEN_SCT);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isSeller) {
      throw new Error("Only sellers can create a card");
    }

    req.userId = decoded.userId;
    return user;
  } catch (error) {
    throw new Error("Unauthorized: Invalid or expired token");
  }
};

// Função para atualizar o cache do Redis ao criar um novo card
async function updateCardsCache(newCard) {
  try {
    let cachedCards = await redis.get("cards_cache");

    if (cachedCards) {
      cachedCards = JSON.parse(cachedCards);
      cachedCards.unshift(newCard);

      // Limita o cache a um número máximo de cards, por exemplo, 50
      if (cachedCards.length > 50) {
        cachedCards.pop();
      }
    } else {
      cachedCards = [newCard];
    }

    await redis.set("cards_cache", JSON.stringify(cachedCards));
  } catch (error) {
    console.log("Erro ao atualizar cache do Redis:", error);
  }
}

// Criar um novo Card
export const createCard = async (req, res, next) => {
  try {
    const user = await verifySeller(req);

    let cloudinaryCoverResponse = null;
    let cloudinaryVideoResponses = [];

    if (req.body.cover) {
      try {
        cloudinaryCoverResponse = await cloudinary.uploader.upload(
          req.body.cover,
          {
            folder: "cards",
          }
        );
      } catch (error) {
        return next(
          createError(500, "Error uploading cover image to Cloudinary")
        );
      }
    }

    if (req.body.video && Array.isArray(req.body.video)) {
      try {
        for (const video of req.body.video) {
          const videoResponse = await cloudinary.uploader.upload(video.url, {
            resource_type: "video",
            folder: "cards/videos",
          });

          cloudinaryVideoResponses.push({
            url: videoResponse.secure_url,
            description: video.description || "",
          });
        }
      } catch (error) {
        return next(createError(500, "Error uploading videos to Cloudinary"));
      }
    }

    const coverImage = cloudinaryCoverResponse
      ? cloudinaryCoverResponse.secure_url
      : user.profilePic;

    const newCard = new Card({
      userId: req.userId,
      ...req.body,
      cover: coverImage,
      video: cloudinaryVideoResponses,
    });

    const savedCard = await newCard.save();

    // Atualiza o cache do Redis com o novo card
    await updateCardsCache(savedCard);

    res.status(201).json(savedCard);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

// Deletar um Card
export const deleteCard = async (req, res, next) => {
  try {
    const acessToken = req.cookies.acessToken;

    if (!acessToken) {
      throw new Error("No access token provided");
    }

    const decoded = jwt.verify(acessToken, process.env.ACESS_TOKEN_SCT);
    const card = await Card.findById(req.params.id);

    if (!card) {
      return next(createError(404, "Card not found"));
    }

    if (card.userId.toString() !== decoded.userId.toString()) {
      return next(createError(403, "You can delete only your card"));
    }

    if (card.cover) {
      const publicId = card.cover.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`cards/${publicId}`);
        console.log("Deleted image from Cloudinary");
      } catch (error) {
        console.log("Error deleting image from Cloudinary", error);
      }
    }

    await Card.findByIdAndDelete(req.params.id);
    await updateFeaturedCardsCache();
    res.status(200).send("Card has been deleted");
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

// Buscar um Card pelo ID
export const getCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return next(createError(404, "Card not found"));

    const cardWithCover = {
      ...card.toObject(),
      cover: card.cover || card.userId.profilePic,
    };

    res.status(200).json(cardWithCover);
  } catch (err) {
    next(err);
  }
};

// Buscar todos os Cards
export const getCards = async (req, res, next) => {
  const q = req.query;
  const filters = {
    ...(q.userId && { userId: q.userId }),
    ...(q.cat && { cat: q.cat }),
    ...((q.min || q.max) && {
      price: {
        ...(q.min && { $gt: q.min }),
        ...(q.max && { $lt: q.max }),
      },
    }),
    ...(q.search && { title: { $regex: q.search, $options: "i" } }),
  };

  try {
    let cards = await redis.get("cards_cache");
    if (cards) {
      return res.status(200).json(JSON.parse(cards));
    }

    cards = await Card.find(filters).sort({ [q.sort]: -1 });
    await redis.set("cards_cache", JSON.stringify(cards));
    res.status(200).send(cards);
  } catch (err) {
    next(err);
  }
};

// Buscar Cards por Categoria
export const getCardsByCategory = async (req, res, next) => {
  const { category } = req.params;

  try {
    let cards = await redis.get(`cards_category_${category}`);
    if (cards) {
      return res.status(200).json(JSON.parse(cards));
    }

    cards = await Card.find({ category }).sort({ createdAt: -1 });
    if (!cards) {
      return next(createError(404, "No cards found for this category"));
    }

    await redis.set(`cards_category_${category}`, JSON.stringify(cards));
    res.status(200).json(cards);
  } catch (error) {
    console.log("Error in getCardsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Atualiza o cache de Cards em destaque
async function updateFeaturedCardsCache() {
  try {
    const featuredCards = await Card.find({ isFeatured: true }).lean();
    await redis.set("featured_cards", JSON.stringify(featuredCards));
  } catch (error) {
    console.log("Error in updating featured cards cache", error);
  }
}

export const getUserCard = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return next(createError(401, "No access token provided"));
    }

    const decoded = jwt.verify(accessToken, process.env.ACESS_TOKEN_SCT);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const card = await Card.findOne({ userId: user._id });
    if (!card) {
      return next(createError(404, "Card not found"));
    }

    const cardData = {
      role: card.role || "",
      shortDesc: card.shortDesc || "",
      desc: card.desc || "",
      price: card.price || "",
      country: user.country,
      lang: user.lang,
      profileImage: user.profilePic || "",
      name: user.name,
    };

    res.status(200).json(cardData);
  } catch (error) {
    next(error);
  }
};
