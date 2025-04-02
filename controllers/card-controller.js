import Card from "../models/card-model.js";
import User from "../models/user-model.js";
import createError from "../utils/create-error.js";
import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Constantes para configuração
const CACHE_TTL = 3600; // 1 hora em segundos
const MAX_CACHE_SIZE = 50;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (reduzido para maior segurança)

// --- Funções Auxiliares ---

const verifySeller = async (req) => {
  const accessToken = req.cookies.acessToken;
  if (!accessToken) {
    throw new Error("Token de acesso não fornecido");
  }

  const decoded = jwt.verify(accessToken, process.env.ACESS_TOKEN_SCT);
  const user = await User.findById(decoded.userId);

  if (!user || !user.isSeller) {
    throw new Error("Apenas vendedores podem realizar esta ação");
  }

  req.userId = decoded.userId;
  return user;
};

const updateCardsCache = async (newCard) => {
  try {
    const cacheKey = "cards_cache";
    let cachedCards = await redis.get(cacheKey);

    cachedCards = cachedCards ? JSON.parse(cachedCards) : [];
    cachedCards.unshift(newCard);
    
    if (cachedCards.length > MAX_CACHE_SIZE) {
      cachedCards = cachedCards.slice(0, MAX_CACHE_SIZE);
    }

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cachedCards));
  } catch (error) {
    console.error("Erro ao atualizar cache:", error);
  }
};

const removeFromCardsCache = async (cardId) => {
  try {
    const cacheKey = "cards_cache";
    const cachedCards = await redis.get(cacheKey);

    if (cachedCards) {
      const filteredCards = JSON.parse(cachedCards).filter(
        (card) => card._id !== cardId
      );
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(filteredCards));
    }
  } catch (error) {
    console.error("Erro ao remover do cache:", error);
  }
};

// --- Controladores Principais ---

export const createCard = async (req, res, next) => {
  try {
    const user = await verifySeller(req);
    
    // Validação dos campos obrigatórios
    const requiredFields = ['title', 'role', 'shortDesc', 'desc', 'price', 'country', 'lang'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      throw createError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Processar a imagem de capa
    let coverUrl = user.profilePic;
    if (req.body.cover && req.body.cover.startsWith('data:image')) {
      try {
        const coverResponse = await cloudinary.uploader.upload(req.body.cover, {
          folder: "cards"
        });
        coverUrl = coverResponse.secure_url;
      } catch (error) {
        console.error('Error uploading cover image:', error);
        throw createError(500, 'Error processing cover image');
      }
    }

    // Processar vídeo (como string única)
    let videoUrl = '';
    if (req.body.video && req.body.video.startsWith('data:video')) {
      try {
        // Verificar tamanho do vídeo
        if (Buffer.byteLength(req.body.video) > MAX_VIDEO_SIZE) {
          throw createError(400, `Video exceeds maximum size of ${MAX_VIDEO_SIZE/1024/1024}MB`);
        }
        
        const videoResponse = await cloudinary.uploader.upload(req.body.video, {
          resource_type: "video",
          folder: "cards/videos"
        });
        videoUrl = videoResponse.secure_url;
      } catch (error) {
        console.error('Error uploading video:', error);
        throw createError(500, 'Error processing video');
      }
    }

    // Criar o novo card
    const newCard = new Card({
      userId: user._id,
      title: req.body.title,
      role: req.body.role,
      shortDesc: req.body.shortDesc,
      desc: req.body.desc,
      price: parseFloat(req.body.price),
      country: req.body.country,
      lang: req.body.lang,
      revisionNumber: parseInt(req.body.revisionNumber) || 0,
      features: req.body.features || [],
      cover: coverUrl,
      video: videoUrl  // Agora é uma string única
    });

    const savedCard = await newCard.save();
    await updateCardsCache(savedCard);

    res.status(201).json({
      success: true,
      data: savedCard,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await verifySeller(req);
    const card = await Card.findById(req.params.id).session(session);

    if (!card) throw createError(404, "Card não encontrado");
    if (card.userId.toString() !== user._id.toString()) {
      throw createError(403, "Não autorizado");
    }

    // Remove mídia do Cloudinary
    const deletePromises = [];

    if (card.cover && !card.cover.includes(user.profilePic)) {
      const publicId = card.cover.split("/").slice(-2).join("/").split(".")[0];
      deletePromises.push(cloudinary.uploader.destroy(publicId));
    }

    if (card.video) {
      const publicId = card.video.split("/").slice(-2).join("/").split(".")[0];
      deletePromises.push(
        cloudinary.uploader.destroy(publicId, { resource_type: "video" })
      );
    }

    await Promise.all(deletePromises);
    await Card.findByIdAndDelete(req.params.id).session(session);
    await removeFromCardsCache(req.params.id);

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Card removido" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const updateCard = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await verifySeller(req);
    const cardId = req.params.id;

    // Busca o card existente
    const existingCard = await Card.findById(cardId).session(session);
    if (!existingCard) {
      throw createError(404, "Card não encontrado");
    }

    // Verifica se o usuário é o dono do card
    if (existingCard.userId.toString() !== user._id.toString()) {
      throw createError(403, "Não autorizado - você só pode editar seus próprios cards");
    }

    const updateData = { ...req.body };
    const uploadPromises = [];
    const filesToDelete = [];

    // Processamento da imagem de capa
    if (req.body.cover && req.body.cover !== existingCard.cover) {
      // Remove a imagem antiga se for diferente
      if (existingCard.cover && !existingCard.cover.includes(user.profilePic)) {
        const publicId = existingCard.cover
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        filesToDelete.push(cloudinary.uploader.destroy(publicId));
      }

      // Faz upload da nova imagem
      uploadPromises.push(
        cloudinary.uploader
          .upload(req.body.cover, {
            folder: "cards",
          })
          .then((response) => {
            updateData.cover = response.secure_url;
          })
      );
    } else if (!req.body.cover) {
      // Mantém a capa existente ou usa a foto do perfil como padrão
      updateData.cover = existingCard.cover || user.profilePic;
    }

    // Processamento do vídeo (agora como string única)
    if (req.body.video !== undefined) {
      if (req.body.video === 'remove') {
        // Remove o vídeo existente
        if (existingCard.video) {
          const publicId = existingCard.video
            .split("/")
            .slice(-2)
            .join("/")
            .split(".")[0];
          filesToDelete.push(
            cloudinary.uploader.destroy(publicId, { resource_type: "video" })
          );
        }
        updateData.video = '';
      } else if (req.body.video.startsWith('data:video')) {
        // Novo vídeo - faz upload
        uploadPromises.push(
          cloudinary.uploader
            .upload(req.body.video, {
              resource_type: "video",
              folder: "cards/videos",
            })
            .then((response) => {
              updateData.video = response.secure_url;
            })
        );

        // Remove o vídeo antigo se existir
        if (existingCard.video) {
          const publicId = existingCard.video
            .split("/")
            .slice(-2)
            .join("/")
            .split(".")[0];
          filesToDelete.push(
            cloudinary.uploader.destroy(publicId, { resource_type: "video" })
          );
        }
      } else if (req.body.video.startsWith('http')) {
        // Mantém o vídeo existente
        updateData.video = req.body.video;
      } else {
        // Se for null ou vazio, mantém o atual
        updateData.video = existingCard.video;
      }
    }

    // Executa todos os uploads em paralelo
    await Promise.all(uploadPromises);

    // Atualiza o card no banco de dados
    const updatedCard = await Card.findByIdAndUpdate(cardId, updateData, {
      new: true,
      session,
    }).populate("userId", "profilePic name");

    // Remove arquivos antigos não mais necessários
    await Promise.all(
      filesToDelete.map((p) =>
        p.catch((e) => console.error("Erro ao remover arquivo:", e))
      )
    );

    // Atualiza o cache
    await updateCardsCache(updatedCard);
    await redis.del(`card_${cardId}`); // Invalida cache individual

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: updatedCard,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Os outros métodos permanecem os mesmos
export const getCard = async (req, res, next) => {
  try {
    const cacheKey = `card_${req.params.id}`;
    const cachedCard = await redis.get(cacheKey);

    if (cachedCard) {
      return res.status(200).json(JSON.parse(cachedCard));
    }

    const card = await Card.findById(req.params.id)
      .populate("userId", "profilePic name")
      .lean();

    if (!card) throw createError(404, "Card não encontrado");

    // Preenche a capa padrão se necessário
    if (!card.cover && card.userId?.profilePic) {
      card.cover = card.userId.profilePic;
    }

    // Cache por 15 minutos
    await redis.setex(cacheKey, 900, JSON.stringify(card));

    res.status(200).json(card);
  } catch (error) {
    next(error);
  }
};

export const getCards = async (req, res, next) => {
  try {
    const { userId, cat, min, max, search, sort = "-createdAt" } = req.query;

    const filters = {
      ...(userId && { userId: new mongoose.Types.ObjectId(userId) }),
      ...(cat && { category: cat }),
      ...(search && { title: { $regex: search, $options: "i" } }),
      ...((min || max) && {
        price: {
          ...(min && { $gte: Number(min) }),
          ...(max && { $lte: Number(max) }),
        },
      }),
    };

    const cacheKey = `cards_${JSON.stringify(filters)}_${sort}`;
    const cachedCards = await redis.get(cacheKey);

    if (cachedCards) {
      return res.status(200).json(JSON.parse(cachedCards));
    }

    const cards = await Card.find(filters)
      .sort(sort)
      .populate("userId", "profilePic name")
      .lean();

    // Preenche capas padrão
    cards.forEach((card) => {
      if (!card.cover && card.userId?.profilePic) {
        card.cover = card.userId.profilePic;
      }
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cards));

    res.status(200).json(cards);
  } catch (error) {
    next(error);
  }
};

export const getCardsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const cacheKey = `cards_category_${category}`;

    const cachedCards = await redis.get(cacheKey);
    if (cachedCards) {
      return res.status(200).json(JSON.parse(cachedCards));
    }

    const cards = await Card.find({ category })
      .sort("-createdAt")
      .populate("userId", "profilePic name")
      .lean();

    if (!cards.length) {
      return res.status(200).json([]);
    }

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cards));
    res.status(200).json(cards);
  } catch (error) {
    next(error);
  }
};

export const getUserCard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cacheKey = `user_card_${userId}`;

    const cachedCard = await redis.get(cacheKey);
    if (cachedCard) {
      return res.status(200).json(JSON.parse(cachedCard));
    }

    const [user, card] = await Promise.all([
      User.findById(userId, "profilePic name country lang"),
      Card.findOne({ userId }, "role shortDesc desc price"),
    ]);

    if (!user) throw createError(404, "Usuário não encontrado");
    if (!card) throw createError(404, "Card não encontrado");

    const cardData = {
      ...card.toObject(),
      profileImage: user.profilePic,
      name: user.name,
      country: user.country,
      lang: user.lang,
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cardData));
    res.status(200).json(cardData);
  } catch (error) {
    next(error);
  }
};

export const updateFeaturedCache = async () => {
  try {
    const featuredCards = await Card.find({ isFeatured: true })
      .sort("-createdAt")
      .limit(10)
      .lean();

    await redis.setex(
      "featured_cards",
      CACHE_TTL,
      JSON.stringify(featuredCards)
    );
  } catch (error) {
    console.error("Erro ao atualizar cache de destaques:", error);
  }
};