const mongoose = require("mongoose");
const ProductReview = require("../models/ProductReview");
const User = require("../models/User");
const asyncHandler = require("../middleware/async.middleware");
const {
  getProducts,
  findProductById,
  filterProducts,
  getFilterOptions,
  getRelatedProducts
} = require("../data/products");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeProductId(value) {
  return String(value || "").trim();
}

function normalizeRating(value) {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw createError("Rating must be a whole number from 1 to 5.", 400);
  }

  return rating;
}

function serializeReview(review) {
  return {
    id: review._id,
    productId: review.productId,
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt
  };
}

async function getReviewSummary(productIds) {
  if (mongoose.connection.readyState !== 1) {
    return {};
  }

  const summaries = await ProductReview.aggregate([
    { $match: { productId: { $in: productIds } } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  return summaries.reduce((map, summary) => {
    map[summary._id] = {
      averageRating: Math.round(summary.averageRating * 10) / 10,
      reviewCount: summary.reviewCount
    };
    return map;
  }, {});
}

async function attachReviewSummaries(products) {
  const summaryByProduct = await getReviewSummary(products.map((product) => product.id));

  return products.map((product) => ({
    ...product,
    reviewSummary: summaryByProduct[product.id] || {
      averageRating: 0,
      reviewCount: 0
    }
  }));
}

const listProducts = asyncHandler(async (req, res) => {
  const products = filterProducts(req.query);
  const enrichedProducts = await attachReviewSummaries(products);

  res.json({
    success: true,
    count: enrichedProducts.length,
    products: enrichedProducts
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = findProductById(normalizeProductId(req.params.productId));

  if (!product) {
    throw createError("Product not found.", 404);
  }

  const [enrichedProduct] = await attachReviewSummaries([product]);

  res.json({
    success: true,
    product: enrichedProduct
  });
});

const getProductFilters = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    filters: getFilterOptions()
  });
});

const getSearchSuggestions = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query) {
    return res.json({
      success: true,
      suggestions: []
    });
  }

  const suggestions = filterProducts({ q: query })
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      name: product.displayName,
      price: product.price,
      image: product.image,
      category: product.category
    }));

  res.json({
    success: true,
    suggestions
  });
});

const getRelated = asyncHandler(async (req, res) => {
  const product = findProductById(normalizeProductId(req.params.productId));

  if (!product) {
    throw createError("Product not found.", 404);
  }

  const relatedProducts = await attachReviewSummaries(getRelatedProducts(product.id, 4));

  res.json({
    success: true,
    products: relatedProducts
  });
});

const getReviews = asyncHandler(async (req, res) => {
  const productId = normalizeProductId(req.params.productId);

  if (!findProductById(productId)) {
    throw createError("Product not found.", 404);
  }

  const reviews = await ProductReview.find({ productId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const [summary] = await attachReviewSummaries([findProductById(productId)]);

  res.json({
    success: true,
    summary: summary.reviewSummary,
    reviews: reviews.map(serializeReview)
  });
});

async function upsertUserReviewSnapshot(user, review) {
  const existingIndex = (user.reviews || []).findIndex((entry) => String(entry.productId) === review.productId);
  const snapshot = {
    productId: review.productId,
    rating: review.rating,
    comment: review.comment,
    userName: review.userName,
    createdAt: review.createdAt
  };

  if (existingIndex >= 0) {
    user.reviews[existingIndex] = snapshot;
  } else {
    user.reviews.push(snapshot);
  }

  user.markModified("reviews");
  await user.save();
}

const submitReview = asyncHandler(async (req, res) => {
  const productId = normalizeProductId(req.params.productId || req.body.productId);

  if (!productId || !findProductById(productId)) {
    throw createError("Product not found.", 404);
  }

  const rating = normalizeRating(req.body.rating);
  const comment = String(req.body.comment || "").trim();

  if (comment.length > 500) {
    throw createError("Review comment must be 500 characters or fewer.", 400);
  }

  const review = await ProductReview.findOneAndUpdate(
    {
      productId,
      user: req.user._id
    },
    {
      productId,
      user: req.user._id,
      userName: req.user.name,
      rating,
      comment
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  const user = await User.findById(req.user._id);

  if (user) {
    await upsertUserReviewSnapshot(user, review);
  }

  const [summary] = await attachReviewSummaries([findProductById(productId)]);

  res.status(201).json({
    success: true,
    message: "Review submitted successfully.",
    review: serializeReview(review),
    summary: summary.reviewSummary
  });
});

module.exports = {
  listProducts,
  getProduct,
  getProductFilters,
  getSearchSuggestions,
  getRelated,
  getReviews,
  submitReview,
  getReviewSummary,
  attachReviewSummaries
};
