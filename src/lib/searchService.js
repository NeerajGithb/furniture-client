// lib/searchService.js
import { connectDB } from "@/lib/dbConnect";
import Product from "@/models/product";
import Category from "@/models/category";
import SubCategory from "@/models/subcategory";
import {
  SYNONYMS,
  STOP_WORDS,
  PRIMARY_PRODUCT_TYPES,
  SYNONYM_GROUPS,
  getSynonymGroup,
} from "./synonyms";

// Enhanced field weights for relevance scoring
const FIELD_WEIGHTS = {
  name: 20, // Increased for exact name matches
  brand: 12, // Important for brand searches
  tags: 8, // Tags are curated, so higher weight
  description: 3, // Lower weight for descriptions
  material: 10, // Material is important for furniture
  colorOptions: 8, // Color is important for visual products
  category: 15, // Category matching is crucial
  subcategory: 12, // Subcategory also important
  attributes: 10, // Structured attributes are valuable
};

// Product type hierarchy with enhanced context
// Replace the existing PRODUCT_HIERARCHY object with this updated version:

const PRODUCT_HIERARCHY = {
  sofa: {
    primary: [
      "sofa",
      "sectional",
      "couch",
      "settee",
      "sofas",
      "couches",
      "sectionals",
      "settees",
    ],
    secondary: ["loveseat", "recliner", "loveseats", "recliners"],
    category: ["living room", "seating"],
    attributes: ["seater", "material", "color"],
    boost: 2.0,
    avoid: ["chair", "table", "bed", "cabinet"],
  },
  chair: {
    primary: ["chair", "chairs"],
    secondary: ["stool", "bench", "armchair", "stools", "benches", "armchairs"],
    category: ["seating", "office", "dining"],
    attributes: ["material", "color", "style"],
    boost: 2.0,
    avoid: ["sofa", "table", "bed", "wardrobe"],
  },
  table: {
    primary: ["table", "tables"],
    secondary: ["desk", "console", "desks", "consoles"],
    category: ["dining", "office", "living room"],
    attributes: ["material", "size", "style"],
    boost: 2.0,
    avoid: ["chair", "sofa", "bed", "wardrobe"],
  },
  bed: {
    primary: ["bed", "beds"],
    secondary: [
      "mattress",
      "headboard",
      "cot",
      "mattresses",
      "headboards",
      "cots",
    ],
    category: ["bedroom", "sleeping"],
    attributes: ["size", "material", "style"],
    boost: 2.0,
    avoid: ["chair", "sofa", "table", "cabinet"],
  },
  cabinet: {
    primary: [
      "cabinet",
      "wardrobe",
      "cupboard",
      "cabinets",
      "wardrobes",
      "cupboards",
    ],
    secondary: ["shelf", "storage", "dresser", "shelves", "dressers"],
    category: ["storage", "bedroom", "kitchen"],
    attributes: ["material", "size", "doors"],
    boost: 2.0,
    avoid: ["chair", "sofa", "table", "bed"],
  },
  almirah: {
    primary: [
      "almirah",
      "wardrobe",
      "cupboard",
      "cabinet",
      "almirahs",
      "wardrobes",
      "cupboards",
      "cabinets",
    ],
    secondary: ["almari", "storage", "closet", "almaris", "closets"],
    category: ["storage", "bedroom"],
    attributes: ["material", "doors", "size"],
    boost: 2.0,
    avoid: ["chair", "sofa", "table", "bed"],
  },
};
class PureSearchService {
  /**
   * Enhanced tokenization with context awareness
   */
  static normalizePlurals(tokens) {
    const pluralMap = {
      beds: "bed",
      sofas: "sofa",
      chairs: "chair",
      tables: "table",
      cabinets: "cabinet",
      wardrobes: "wardrobe",
      cupboards: "cupboard",
      almirahs: "almirah",
      couches: "couch",
      sectionals: "sectional",
      settees: "settee",
      loveseats: "loveseat",
      recliners: "recliner",
      stools: "stool",
      benches: "bench",
      armchairs: "armchair",
      desks: "desk",
      consoles: "console",
      mattresses: "mattress",
      headboards: "headboard",
      cots: "cot",
      shelves: "shelf",
      dressers: "dresser",
      almaris: "almari",
      closets: "closet",
    };

    return tokens.map((token) => pluralMap[token] || token);
  }

  // Then update the tokenizeQuery function to use this normalization:

  /**
   * Enhanced tokenization with context awareness and plural normalization
   */
  static tokenizeQuery(query) {
    try {
      if (!query || typeof query !== "string") return [];

      const tokens = query
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(/[\s,\-]+/)
        .filter((token) => token.length > 0)
        .filter((token, index, arr) => arr.indexOf(token) === index);

      // Apply plural normalization
      return this.normalizePlurals(tokens);
    } catch (error) {
      console.error("Error in tokenizeQuery:", error);
      return [];
    }
  }

  /**
   * Apply synonyms with error handling
   */
  static applySynonyms(tokens) {
    try {
      return tokens.map((token) => SYNONYMS[token] || token);
    } catch (error) {
      console.error("Error in applySynonyms:", error);
      return tokens;
    }
  }

  /**
   * Classify tokens by importance and context
   */
  static classifyTokens(tokens) {
    try {
      const classified = {
        primary: [], // Main product types
        modifiers: [], // Seater, color, material, size
        stopWords: [], // Low-impact words
        regular: [], // Regular descriptive terms
      };

      tokens.forEach((token) => {
        if (STOP_WORDS.has(token)) {
          classified.stopWords.push(token);
        } else if (PRIMARY_PRODUCT_TYPES.has(token)) {
          classified.primary.push(token);
        } else if (this.isModifier(token)) {
          classified.modifiers.push(token);
        } else {
          classified.regular.push(token);
        }
      });

      return classified;
    } catch (error) {
      console.error("Error in classifyTokens:", error);
      return { primary: tokens, modifiers: [], stopWords: [], regular: [] };
    }
  }

  /**
   * Check if token is a modifier (color, material, size, etc.)
   */
  static isModifier(token) {
    const modifierPatterns = [
      /^\d+(seater|seat)$/, // seater patterns
      /^(small|medium|large|xl|xxl)$/, // size patterns
    ];

    // Check if token is in any synonym group (colors, materials, etc.)
    const synonymGroup = getSynonymGroup(token);
    if (
      synonymGroup &&
      ["material_wood", "material_metal", "material_fabric"].some((g) =>
        synonymGroup.group.includes(g)
      )
    ) {
      return true;
    }

    // Check common colors
    const colors = [
      "black",
      "white",
      "brown",
      "gray",
      "grey",
      "blue",
      "red",
      "green",
      "yellow",
    ];
    if (colors.includes(token)) return true;

    // Check materials
    const materials = [
      "wood",
      "metal",
      "fabric",
      "leather",
      "plastic",
      "glass",
    ];
    if (materials.includes(token)) return true;

    return modifierPatterns.some((pattern) => pattern.test(token));
  }

  /**
   * Extract numeric patterns with enhanced seater detection
   */
  static extractNumerics(tokens) {
    try {
      const numerics = {};
      const cleanTokens = [];

      for (const token of tokens) {
        // Enhanced seater patterns
        const seaterPatterns = [
          /(\d+)[-\s]*(seater|seat|person)/i,
          /(\d+)[-\s]*str/i, // Common abbreviation
        ];

        let seaterFound = false;
        for (const pattern of seaterPatterns) {
          const match = token.match(pattern);
          if (match) {
            numerics.seater = parseInt(match[1]);
            cleanTokens.push("seater"); // Keep the concept
            seaterFound = true;
            break;
          }
        }
        if (seaterFound) continue;

        // Size patterns
        const sizeMatch = token.match(/(\d+)\s*(inch|ft|feet|cm)/i);
        if (sizeMatch) {
          numerics.size = parseInt(sizeMatch[1]);
          continue;
        }

        // Standalone numbers (likely seater count) - only if reasonable
        if (/^\d+$/.test(token)) {
          const num = parseInt(token);
          if (num >= 1 && num <= 10) {
            numerics.seater = num;
            cleanTokens.push("seater"); // Add seater concept
            continue;
          }
        }

        cleanTokens.push(token);
      }

      return { tokens: cleanTokens, numerics };
    } catch (error) {
      console.error("Error in extractNumerics:", error);
      return { tokens, numerics: {} };
    }
  }

  /**
   * Determine primary search intent with confidence scoring
   */
  static determineSearchIntent(classified, numerics) {
    try {
      let primaryType = null;
      let confidence = 0;

      // Check primary tokens first (highest confidence)
      if (classified.primary.length > 0) {
        primaryType = classified.primary[0];
        confidence = 1.0;
      } else {
        // Check modifiers and regular terms
        const allTokens = [...classified.modifiers, ...classified.regular];

        for (const token of allTokens) {
          for (const [type, config] of Object.entries(PRODUCT_HIERARCHY)) {
            if (config.primary.includes(token)) {
              primaryType = type;
              confidence = 0.8;
              break;
            } else if (config.secondary.includes(token)) {
              primaryType = type;
              confidence = 0.6;
            }
          }
          if (confidence >= 0.8) break;
        }
      }

      // Boost confidence if seater info suggests furniture type
      if (numerics.seater && ["sofa", "chair", "table"].includes(primaryType)) {
        confidence = Math.min(1.0, confidence + 0.2);
      }

      return { primaryType, confidence };
    } catch (error) {
      console.error("Error in determineSearchIntent:", error);
      return { primaryType: null, confidence: 0 };
    }
  }

  static buildSearchPipeline(tokens, numerics, classified, intent) {
    try {
      const pipeline = [];

      // Base match - only published products
      pipeline.push({
        $match: { isPublished: true },
      });

      pipeline.push({
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      });

      pipeline.push({
        $lookup: {
          from: "subcategories",
          localField: "subCategoryId",
          foreignField: "_id",
          as: "subcategory",
        },
      });

      if (tokens.length > 0 || Object.keys(numerics).length > 0) {
        pipeline.push({
          $addFields: {
            searchScore: this.buildContextAwareScore(
              classified,
              numerics,
              intent
            ),
            relevanceCategory: this.buildRelevanceCategory(classified, intent),
            intentMatch: this.buildIntentMatch(intent),
          },
        });

        const minScore = intent.confidence > 0.8 ? 3.0 : 1.5;
        pipeline.push({
          $match: {
            $and: [
              { searchScore: { $gt: minScore } },
              {
                $or: [
                  { intentMatch: { $gte: 1 } },
                  {
                    $and: [
                      { searchScore: { $gt: 8.0 } },
                      { relevanceCategory: { $in: ["exact", "high"] } },
                    ],
                  },
                ],
              },
            ],
          },
        });
      } else {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                {
                  $multiply: [
                    { $ln: { $add: [{ $ifNull: ["$viewCount", 0] }, 1] } },
                    0.3,
                  ],
                },
                { $cond: [{ $eq: ["$isFeatured", true] }, 2.0, 0] },
                { $multiply: [{ $ifNull: ["$reviews.average", 0] }, 0.4] },
              ],
            },
            relevanceCategory: { $literal: "general" },
            intentMatch: { $literal: 0 },
          },
        });
      }

      pipeline.push({
        $addFields: {
          sortPriority: {
            $add: [
              { $multiply: ["$intentMatch", 100] },
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$relevanceCategory", "exact"] },
                      then: 50,
                    },
                    { case: { $eq: ["$relevanceCategory", "high"] }, then: 30 },
                    {
                      case: { $eq: ["$relevanceCategory", "medium"] },
                      then: 15,
                    },
                    { case: { $eq: ["$relevanceCategory", "low"] }, then: 5 },
                  ],
                  default: 0,
                },
              },

              { $multiply: ["$searchScore", 2] },
            ],
          },
        },
      });

      pipeline.push({
        $sort: {
          sortPriority: -1,
          searchScore: -1,
          isFeatured: -1,
          "reviews.average": -1,
          createdAt: -1,
          _id: 1,
        },
      });

      return pipeline;
    } catch (error) {
      console.error("Error in buildSearchPipeline:", error);
      return [
        { $match: { isPublished: true } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
      ];
    }
  }

  /**
   * Build context-aware scoring with token importance
   */
  static buildContextAwareScore(classified, numerics, intent) {
    try {
      const scoreComponents = [];

      // Primary tokens get highest weight
      if (classified.primary.length > 0) {
        classified.primary.forEach((token) => {
          scoreComponents.push({
            $multiply: [
              FIELD_WEIGHTS.name,
              {
                $cond: [
                  {
                    $or: [
                      {
                        $ne: [
                          { $indexOfCP: [{ $toLower: "$name" }, token] },
                          -1,
                        ],
                      },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: { $ifNull: ["$tags", []] },
                                cond: { $eq: [{ $toLower: "$$this" }, token] },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  5, // High score for primary matches
                  0,
                ],
              },
            ],
          });
        });
      }

      // Regular tokens get medium weight
      if (classified.regular.length > 0) {
        classified.regular.forEach((token) => {
          scoreComponents.push({
            $multiply: [
              FIELD_WEIGHTS.name * 0.7, // Reduced weight for regular tokens
              {
                $cond: [
                  { $ne: [{ $indexOfCP: [{ $toLower: "$name" }, token] }, -1] },
                  2,
                  0,
                ],
              },
            ],
          });

          // Brand matching for regular tokens
          scoreComponents.push({
            $multiply: [
              FIELD_WEIGHTS.brand,
              {
                $cond: [
                  {
                    $ne: [
                      {
                        $indexOfCP: [
                          { $toLower: { $ifNull: ["$brand", ""] } },
                          token,
                        ],
                      },
                      -1,
                    ],
                  },
                  2,
                  0,
                ],
              },
            ],
          });
        });
      }

      // Modifier tokens (color, material, etc.)
      if (classified.modifiers.length > 0) {
        classified.modifiers.forEach((token) => {
          // Material matching
          scoreComponents.push({
            $multiply: [
              FIELD_WEIGHTS.material,
              {
                $cond: [
                  {
                    $or: [
                      {
                        $ne: [
                          {
                            $indexOfCP: [
                              { $toLower: { $ifNull: ["$material", ""] } },
                              token,
                            ],
                          },
                          -1,
                        ],
                      },
                      {
                        $ne: [
                          {
                            $indexOfCP: [
                              {
                                $toLower: {
                                  $ifNull: ["$attributes.material", ""],
                                },
                              },
                              token,
                            ],
                          },
                          -1,
                        ],
                      },
                    ],
                  },
                  3,
                  0,
                ],
              },
            ],
          });

          // Color matching
          scoreComponents.push({
            $multiply: [
              FIELD_WEIGHTS.colorOptions,
              {
                $cond: [
                  {
                    $or: [
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: { $ifNull: ["$colorOptions", []] },
                                cond: { $eq: [{ $toLower: "$$this" }, token] },
                              },
                            },
                          },
                          0,
                        ],
                      },
                      {
                        $eq: [
                          { $toLower: { $ifNull: ["$attributes.color", ""] } },
                          token,
                        ],
                      },
                    ],
                  },
                  3,
                  0,
                ],
              },
            ],
          });
        });
      }

      // Stop words get minimal weight only if they appear in exact context
      if (classified.stopWords.length > 0) {
        classified.stopWords.forEach((token) => {
          if (token === "set") {
            // Only boost "set" if it's part of a product name context
            scoreComponents.push({
              $cond: [
                {
                  $and: [
                    {
                      $ne: [{ $indexOfCP: [{ $toLower: "$name" }, token] }, -1],
                    },
                    {
                      $or: classified.primary
                        .concat(classified.regular)
                        .map((primaryToken) => ({
                          $ne: [
                            {
                              $indexOfCP: [{ $toLower: "$name" }, primaryToken],
                            },
                            -1,
                          ],
                        })),
                    },
                  ],
                },
                1.5, // Small boost only when in context
                0,
              ],
            });
          }
        });
      }

      let baseScore =
        scoreComponents.length > 0
          ? { $add: scoreComponents }
          : { $literal: 0.1 };

      // Seater exact matching gets significant boost
      if (numerics.seater) {
        baseScore = {
          $add: [
            baseScore,
            {
              $cond: [
                {
                  $eq: [
                    { $ifNull: ["$attributes.seater", 0] },
                    numerics.seater,
                  ],
                },
                10, // High boost for exact seater match
                {
                  $cond: [
                    {
                      $and: [
                        {
                          $gte: [
                            { $ifNull: ["$attributes.seater", 0] },
                            numerics.seater - 1,
                          ],
                        },
                        {
                          $lte: [
                            { $ifNull: ["$attributes.seater", 0] },
                            numerics.seater + 1,
                          ],
                        },
                      ],
                    },
                    3, // Small boost for close seater match
                    0,
                  ],
                },
              ],
            },
          ],
        };
      }

      // Apply popularity and availability boosts
      return {
        $multiply: [
          baseScore,
          // Stock availability (critical factor)
          {
            $cond: [
              { $gt: [{ $ifNull: ["$inStockQuantity", 1] }, 0] },
              1.2,
              0.3,
            ],
          },
          // Featured products
          { $cond: [{ $eq: ["$isFeatured", true] }, 1.15, 1.0] },
          // Review quality
          {
            $add: [
              1,
              { $multiply: [{ $ifNull: ["$reviews.average", 0] }, 0.1] },
            ],
          },
        ],
      };
    } catch (error) {
      console.error("Error in buildContextAwareScore:", error);
      return { $literal: 1 };
    }
  }

  /**
   * Build intent matching score
   */
  static buildIntentMatch(intent) {
    if (!intent.primaryType || intent.confidence < 0.5) {
      return { $literal: 0 };
    }

    const config = PRODUCT_HIERARCHY[intent.primaryType];
    if (!config) return { $literal: 0 };

    // Create conditions for primary type matching
    const primaryConditions = config.primary.map((term) => ({
      $ne: [{ $indexOfCP: [{ $toLower: "$name" }, term] }, -1],
    }));

    // Create conditions for avoided types (negative signal)
    const avoidConditions = config.avoid.map((term) => ({
      $ne: [{ $indexOfCP: [{ $toLower: "$name" }, term] }, -1],
    }));

    return {
      $cond: [
        { $or: primaryConditions },
        intent.confidence * 3, // High score for matching primary intent
        {
          $cond: [
            { $or: avoidConditions },
            -2, // Penalty for matching avoided types
            0.5, // Neutral score for other products
          ],
        },
      ],
    };
  }

  /**
   * Build enhanced relevance categories
   */
  static buildRelevanceCategory(classified, intent) {
    try {
      const conditions = [];

      // Exact matches for primary tokens
      if (classified.primary.length > 0) {
        classified.primary.forEach((token) => {
          conditions.push({
            case: {
              $ne: [{ $indexOfCP: [{ $toLower: "$name" }, token] }, -1],
            },
            then: "exact",
          });
        });
      }

      // High relevance for intent matches
      if (intent.primaryType && intent.confidence > 0.8) {
        const config = PRODUCT_HIERARCHY[intent.primaryType];
        if (config) {
          config.primary.forEach((term) => {
            conditions.push({
              case: {
                $ne: [{ $indexOfCP: [{ $toLower: "$name" }, term] }, -1],
              },
              then: "high",
            });
          });
        }
      }

      // Medium relevance for regular tokens
      if (classified.regular.length > 0) {
        classified.regular.forEach((token) => {
          conditions.push({
            case: {
              $or: [
                { $ne: [{ $indexOfCP: [{ $toLower: "$name" }, token] }, -1] },
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ["$tags", []] },
                          cond: { $eq: [{ $toLower: "$$this" }, token] },
                        },
                      },
                    },
                    0,
                  ],
                },
              ],
            },
            then: "medium",
          });
        });
      }

      return {
        $switch: {
          branches: conditions,
          default: "low",
        },
      };
    } catch (error) {
      console.error("Error in buildRelevanceCategory:", error);
      return { $literal: "general" };
    }
  }

  /**
   * Safe fallback results with simple queries
   */
  static async getFallbackResults(classified, primaryType) {
    try {
      const fallbackPipeline = [];

      // Base match
      fallbackPipeline.push({
        $match: { isPublished: true },
      });

      // Lookup categories and subcategories for fallback results too
      fallbackPipeline.push({
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryId",
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      fallbackPipeline.push({
        $lookup: {
          from: "subcategories",
          localField: "subCategoryId",
          foreignField: "_id",
          as: "subCategoryId",
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      fallbackPipeline.push({
        $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true },
      });

      fallbackPipeline.push({
        $unwind: { path: "$subCategoryId", preserveNullAndEmptyArrays: true },
      });

      // Simple matching for primary tokens only
      if (classified.primary.length > 0) {
        const nameConditions = classified.primary.map((token) => ({
          name: { $regex: token, $options: "i" },
        }));

        fallbackPipeline.push({
          $match: {
            $or: nameConditions,
          },
        });
      } else if (classified.regular.length > 0) {
        // Use regular tokens if no primary tokens
        const nameConditions = classified.regular.slice(0, 2).map((token) => ({
          name: { $regex: token, $options: "i" },
        }));

        fallbackPipeline.push({
          $match: {
            $or: nameConditions,
          },
        });
      }

      // Add basic scoring
      fallbackPipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              {
                $multiply: [
                  { $ln: { $add: [{ $ifNull: ["$viewCount", 0] }, 1] } },
                  0.2,
                ],
              },
              { $cond: [{ $eq: ["$isFeatured", true] }, 1.0, 0] },
              {
                $cond: [
                  { $gt: [{ $ifNull: ["$inStockQuantity", 1] }, 0] },
                  0.5,
                  0,
                ],
              },
            ],
          },
        },
      });

      fallbackPipeline.push({
        $sort: { searchScore: -1, createdAt: -1 },
      });

      fallbackPipeline.push({ $limit: 12 });

      return await Product.aggregate(fallbackPipeline);
    } catch (error) {
      console.error("Error in getFallbackResults:", error);

      // Ultimate fallback - just get featured or recent products
      try {
        return await Product.find({
          isPublished: true,
          $or: [{ isFeatured: true }, { inStockQuantity: { $gt: 0 } }],
        })
          .populate("categoryId", "_id name slug")
          .populate("subCategoryId", "_id name slug")
          .sort({ isFeatured: -1, createdAt: -1 })
          .limit(12)
          .select(
            `
          name slug description metaTitle metaDescription
          finalPrice originalPrice discountPercent emiPrice
          mainImage galleryImages
          categoryId subCategoryId
          material dimensions weight colorOptions size variants
          inStockQuantity isPublished isBestSeller isFeatured isNewArrival
          brand badge tags attributes
          reviews ratings
          totalSold viewCount wishlistCount
          returnPolicy warranty shippingInfo
          createdAt updatedAt
          itemId __v
        `
          )
          .lean();
      } catch (finalError) {
        console.error("Final fallback failed:", finalError);
        return [];
      }
    }
  }

  /**
   * Main search function with comprehensive error handling and context awareness
   */
  static async search(query, options = {}) {
    try {
      await connectDB();

      const { page = 1, pageSize = 24 } = options;

      // Process query with enhanced token classification
      const tokens = this.tokenizeQuery(query);
      const synonymTokens = this.applySynonyms(tokens);
      const { tokens: numericTokens, numerics } =
        this.extractNumerics(synonymTokens);
      const classified = this.classifyTokens(numericTokens);

      // Determine search intent with confidence
      const intent = this.determineSearchIntent(classified, numerics);

      let results = [];
      let total = 0;

      // Debug logging for development
      console.log("Search Debug:", {
        originalQuery: query,
        tokens,
        classified,
        intent,
        numerics,
      });

      try {
        // Build and execute context-aware search pipeline
        const pipeline = this.buildSearchPipeline(
          numericTokens,
          numerics,
          classified,
          intent
        );

        // Add pagination
        const skip = (page - 1) * pageSize;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: pageSize });

        // Project all fields like product routes
        pipeline.push({
          $project: {
            // Basic product info
            name: 1,
            slug: 1,
            description: 1,
            metaTitle: 1,
            metaDescription: 1,

            // Pricing
            finalPrice: 1,
            originalPrice: 1,
            discountPercent: 1,
            emiPrice: 1,

            // Images
            mainImage: 1,
            galleryImages: 1,

            // Categories & Classification (both formats)
            categoryId: 1,
            subCategoryId: 1,
            category: 1,
            subcategory: 1,

            // Product attributes
            material: 1,
            dimensions: 1,
            weight: 1,
            colorOptions: 1,
            size: 1,
            variants: 1,
            attributes: 1,

            // Stock & Status
            inStockQuantity: 1,
            isPublished: 1,
            isBestSeller: 1,
            isFeatured: 1,
            isNewArrival: 1,

            // Branding & Tags
            brand: 1,
            badge: 1,
            tags: 1,

            // Reviews & Ratings
            reviews: 1,
            ratings: 1,

            // Sales & Analytics
            totalSold: 1,
            viewCount: 1,
            wishlistCount: 1,

            // Policies & Info
            returnPolicy: 1,
            warranty: 1,
            shippingInfo: 1,

            // Timestamps
            createdAt: 1,
            updatedAt: 1,

            // Internal
            itemId: 1,
            __v: 1,

            // Search specific fields
            searchScore: 1,
            relevanceCategory: 1,
            intentMatch: 1,
            sortPriority: 1,
          },
        });

        results = await Product.aggregate(pipeline);

        // Get total count with same filtering
        const countPipeline = this.buildSearchPipeline(
          numericTokens,
          numerics,
          classified,
          intent
        );
        countPipeline.push({ $count: "total" });
        const countResult = await Product.aggregate(countPipeline);
        total = countResult[0]?.total || 0;

        // If no results with strict filtering, try relaxed search
        if (
          results.length === 0 &&
          (classified.primary.length > 0 || classified.regular.length > 0)
        ) {
          console.log("No strict results, trying relaxed search...");

          const relaxedPipeline = this.buildRelaxedPipeline(
            classified,
            numerics,
            intent
          );
          relaxedPipeline.push({ $skip: skip });
          relaxedPipeline.push({ $limit: pageSize });
          relaxedPipeline.push({
            $project: {
              // Basic product info
              name: 1,
              slug: 1,
              description: 1,
              metaTitle: 1,
              metaDescription: 1,
              // Pricing
              finalPrice: 1,
              originalPrice: 1,
              discountPercent: 1,
              emiPrice: 1,
              // Images
              mainImage: 1,
              galleryImages: 1,
              // Categories & Classification
              categoryId: 1,
              subCategoryId: 1,
              category: 1,
              subcategory: 1,
              // Product attributes
              material: 1,
              dimensions: 1,
              weight: 1,
              colorOptions: 1,
              size: 1,
              variants: 1,
              attributes: 1,
              // Stock & Status
              inStockQuantity: 1,
              isPublished: 1,
              isBestSeller: 1,
              isFeatured: 1,
              isNewArrival: 1,
              // Branding & Tags
              brand: 1,
              badge: 1,
              tags: 1,
              // Reviews & Ratings
              reviews: 1,
              ratings: 1,
              // Sales & Analytics
              totalSold: 1,
              viewCount: 1,
              wishlistCount: 1,
              // Policies & Info
              returnPolicy: 1,
              warranty: 1,
              shippingInfo: 1,
              // Timestamps
              createdAt: 1,
              updatedAt: 1,
              // Internal
              itemId: 1,
              __v: 1,
              // Search fields
              searchScore: 1,
            },
          });

          results = await Product.aggregate(relaxedPipeline);

          // Update total count for relaxed search
          const relaxedCountPipeline = this.buildRelaxedPipeline(
            classified,
            numerics,
            intent
          );
          relaxedCountPipeline.push({ $count: "total" });
          const relaxedCountResult = await Product.aggregate(
            relaxedCountPipeline
          );
          total = relaxedCountResult[0]?.total || 0;
        }
      } catch (searchError) {
        console.error("Advanced search failed, trying fallback:", searchError);

        // Try simple fallback search
        results = await this.getFallbackResults(classified, intent.primaryType);
        total = results.length;
      }

      // If still no results, provide featured products
      if (results.length === 0) {
        try {
          results = await Product.find({
            isPublished: true,
            $or: [{ isFeatured: true }, { inStockQuantity: { $gt: 0 } }],
          })
            .populate("categoryId", "_id name slug")
            .populate("subCategoryId", "_id name slug")
            .sort({ isFeatured: -1, "reviews.average": -1, createdAt: -1 })
            .limit(pageSize)
            .select(
              `
            name slug description metaTitle metaDescription
            finalPrice originalPrice discountPercent emiPrice
            mainImage galleryImages
            categoryId subCategoryId
            material dimensions weight colorOptions size variants
            inStockQuantity isPublished isBestSeller isFeatured isNewArrival
            brand badge tags attributes
            reviews ratings
            totalSold viewCount wishlistCount
            returnPolicy warranty shippingInfo
            createdAt updatedAt
            itemId __v
          `
            )
            .lean();
          total = Math.min(results.length, 50); // Cap total for featured fallback
        } catch (defaultError) {
          console.error("Even default search failed:", defaultError);
          results = [];
          total = 0;
        }
      }

      return {
        ok: true,
        query,
        normalized: numericTokens.join(" "),
        classified,
        intent,
        numerics,
        primaryType: intent.primaryType,
        products: results,
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
        totalPages: Math.ceil(total / pageSize),
        fallback:
          total > 0 &&
          numericTokens.length > 0 &&
          results.some((r) => !r.searchScore || r.searchScore < 3),
      };
    } catch (error) {
      console.error("Complete search failure:", error);

      // Return safe fallback response
      return {
        ok: true,
        query: query || "",
        normalized: "",
        classified: { primary: [], modifiers: [], stopWords: [], regular: [] },
        intent: { primaryType: null, confidence: 0 },
        numerics: {},
        primaryType: null,
        products: [],
        page: page || 1,
        pageSize: pageSize || 24,
        total: 0,
        hasMore: false,
        totalPages: 0,
        error: "Search temporarily unavailable",
      };
    }
  }

  /**
   * Build relaxed pipeline for when strict search returns no results
   */
  static buildRelaxedPipeline(classified, numerics, intent) {
    try {
      const pipeline = [];

      // Base match
      pipeline.push({
        $match: { isPublished: true },
      });

      // Lookup categories and subcategories
      pipeline.push({
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryId",
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      pipeline.push({
        $lookup: {
          from: "subcategories",
          localField: "subCategoryId",
          foreignField: "_id",
          as: "subCategoryId",
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      pipeline.push({
        $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true },
      });

      pipeline.push({
        $unwind: { path: "$subCategoryId", preserveNullAndEmptyArrays: true },
      });

      // Only match if we have primary or regular tokens
      const importantTokens = [...classified.primary, ...classified.regular];
      if (importantTokens.length > 0) {
        const relaxedConditions = [];

        // Name matching
        importantTokens.forEach((token) => {
          relaxedConditions.push({
            name: { $regex: token, $options: "i" },
          });
        });

        // Tag matching
        if (classified.regular.length > 0) {
          relaxedConditions.push({
            tags: { $in: classified.regular.map((t) => new RegExp(t, "i")) },
          });
        }

        // Brand matching
        if (classified.regular.length > 0) {
          classified.regular.forEach((token) => {
            relaxedConditions.push({
              brand: { $regex: token, $options: "i" },
            });
          });
        }

        pipeline.push({
          $match: {
            $or: relaxedConditions,
          },
        });
      }

      // Add simple scoring
      pipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              {
                $multiply: [
                  { $ln: { $add: [{ $ifNull: ["$totalSold", 0] }, 1] } },
                  0.3,
                ],
              },
              { $cond: [{ $eq: ["$isFeatured", true] }, 2.0, 0] },
              {
                $cond: [
                  { $gt: [{ $ifNull: ["$inStockQuantity", 1] }, 0] },
                  1.0,
                  0,
                ],
              },
              { $multiply: [{ $ifNull: ["$reviews.average", 0] }, 0.4] },
            ],
          },
        },
      });

      // Seater matching if specified
      if (numerics.seater) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                "$searchScore",
                {
                  $cond: [
                    {
                      $eq: [
                        { $ifNull: ["$attributes.seater", 0] },
                        numerics.seater,
                      ],
                    },
                    5.0, // Boost for seater match
                    0,
                  ],
                },
              ],
            },
          },
        });
      }

      pipeline.push({
        $sort: { searchScore: -1, createdAt: -1 },
      });

      return pipeline;
    } catch (error) {
      console.error("Error in buildRelaxedPipeline:", error);
      return [
        { $match: { isPublished: true } },
        { $sort: { isFeatured: -1, createdAt: -1 } },
        { $limit: 20 },
      ];
    }
  }
}

export default PureSearchService;
