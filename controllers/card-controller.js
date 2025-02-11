import Gig from "../models/card-model.js";
import createError from "../utils/create-error.js";
import cloudinary from "../lib/cloudinary.js"; // Importando o Cloudinary
import { redis } from "../lib/redis.js"; // Importando o Redis
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
      throw new Error("Only sellers can create a gig!");
    }

    req.userId = decoded.userId; // Adiciona o userId ao objeto da requisição
    return user; // Retorna o usuário para acessar outras informações, se necessário
  } catch (error) {
    throw new Error("Unauthorized: Invalid or expired token");
  }
};

export const createGig = async (req, res, next) => {
  try {
    // Verifica se o usuário é um seller
    const user = await verifySeller(req);

    let cloudinaryResponse = null;

    if (req.body.cover) {
      try {
        cloudinaryResponse = await cloudinary.uploader.upload(req.body.cover, {
          folder: "gigs", // Pasta onde a imagem será armazenada
        });
      } catch (error) {
        return next(createError(500, "Error uploading image to Cloudinary"));
      }
    }

    const newGig = new Gig({
      userId: req.userId,
      ...req.body,
      cover: cloudinaryResponse ? cloudinaryResponse.secure_url : "", // Salvando a URL da imagem
    });

    try {
      const savedGig = await newGig.save();
      res.status(201).json(savedGig);
    } catch (err) {
      next(err);
    }
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const deleteGig = async (req, res, next) => {
  try {
    const acessToken = req.cookies.acessToken;

    if (!acessToken) {
      throw new Error("No access token provided");
    }

    const decoded = jwt.verify(acessToken, process.env.ACESS_TOKEN_SCT);
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return next(createError(404, "Gig not found"));
    }

    if (gig.userId.toString() !== decoded.userId.toString()) {
      return next(createError(403, "You can delete only your gig!"));
    }

    if (gig.cover) {
      const publicId = gig.cover.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`gigs/${publicId}`);
        console.log("Deleted image from Cloudinary");
      } catch (error) {
        console.log("Error deleting image from Cloudinary", error);
      }
    }

    await Gig.findByIdAndDelete(req.params.id);
    await updateFeaturedGigsCache(); // Atualiza o cache do Redis
    res.status(200).send("Gig has been deleted!");
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const getGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));
    res.status(200).send(gig);
  } catch (err) {
    next(err);
  }
};

export const getGigs = async (req, res, next) => {
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
    let gigs = await redis.get("gigs_cache"); // Tenta pegar do Redis
    if (gigs) {
      return res.status(200).json(JSON.parse(gigs)); // Se existir no cache, retorna diretamente
    }

    gigs = await Gig.find(filters).sort({ [q.sort]: -1 });
    await redis.set("gigs_cache", JSON.stringify(gigs)); // Armazena no Redis
    res.status(200).send(gigs);
  } catch (err) {
    next(err);
  }
};

export const getGigsByCategory = async (req, res, next) => {
  const { category } = req.params;

  try {
    let gigs = await redis.get(`gigs_category_${category}`); // Tenta pegar do Redis
    if (gigs) {
      return res.status(200).json(JSON.parse(gigs)); // Se existir no cache, retorna diretamente
    }

    gigs = await Gig.find({ category }).sort({ createdAt: -1 });
    if (!gigs) {
      return next(createError(404, "No gigs found for this category"));
    }

    await redis.set(`gigs_category_${category}`, JSON.stringify(gigs)); // Armazena no Redis
    res.status(200).json(gigs);
  } catch (error) {
    console.log("Error in getGigsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Função para atualizar o cache de Gigs em destaque
async function updateFeaturedGigsCache() {
  try {
    const featuredGigs = await Gig.find({ isFeatured: true }).lean();
    await redis.set("featured_gigs", JSON.stringify(featuredGigs)); // Atualiza o cache no Redis
  } catch (error) {
    console.log("Error in updating featured gigs cache", error);
  }
}
