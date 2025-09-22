import { connectDB } from '@/lib/dbConnect';
import Product from '@/models/product';
import Category from '@/models/category';
import SubCategory from '@/models/subcategory';
import {
  SYNONYMS,
  STOP_WORDS,
  PRIMARY_PRODUCT_TYPES,
  SYNONYM_GROUPS,
  getSynonymGroup,
} from './synonyms';

const FIELD_WEIGHTS = {
  name: 20,
  brand: 12,
  tags: 8,
  description: 3,
  material: 10,
  colorOptions: 8,
  category: 15,
  subcategory: 12,
  attributes: 10,
};

const PRODUCT_HIERARCHY = {
  sofa: {
    primary: ['sofa', 'sectional', 'couch', 'settee', 'sofas', 'couches', 'sectionals', 'settees'],
    secondary: ['loveseat', 'recliner', 'loveseats', 'recliners'],
    category: ['living room', 'seating'],
    attributes: ['seater', 'material', 'color'],
    boost: 2.0,
    avoid: ['chair', 'table', 'bed', 'cabinet'],
  },
  chair: {
    primary: ['chair', 'chairs'],
    secondary: ['stool', 'bench', 'armchair', 'stools', 'benches', 'armchairs'],
    category: ['seating', 'office', 'dining'],
    attributes: ['material', 'color', 'style'],
    boost: 2.0,
    avoid: ['sofa', 'table', 'bed', 'wardrobe'],
  },
  table: {
    primary: ['table', 'tables'],
    secondary: ['desk', 'console', 'desks', 'consoles'],
    category: ['dining', 'office', 'living room'],
    attributes: ['material', 'size', 'style'],
    boost: 2.0,
    avoid: ['chair', 'sofa', 'bed', 'wardrobe'],
  },
  bed: {
    primary: ['bed', 'beds'],
    secondary: ['mattress', 'headboard', 'cot', 'mattresses', 'headboards', 'cots'],
    category: ['bedroom', 'sleeping'],
    attributes: ['size', 'material', 'style'],
    boost: 2.0,
    avoid: ['chair', 'sofa', 'table', 'cabinet'],
  },
  cabinet: {
    primary: ['cabinet', 'wardrobe', 'cupboard', 'cabinets', 'wardrobes', 'cupboards'],
    secondary: ['shelf', 'storage', 'dresser', 'shelves', 'dressers'],
    category: ['storage', 'bedroom', 'kitchen'],
    attributes: ['material', 'size', 'doors'],
    boost: 2.0,
    avoid: ['chair', 'sofa', 'table', 'bed'],
  },
  almirah: {
    primary: [
      'almirah',
      'wardrobe',
      'cupboard',
      'cabinet',
      'almirahs',
      'wardrobes',
      'cupboards',
      'cabinets',
    ],
    secondary: ['almari', 'storage', 'closet', 'almaris', 'closets'],
    category: ['storage', 'bedroom'],
    attributes: ['material', 'doors', 'size'],
    boost: 2.0,
    avoid: ['chair', 'sofa', 'table', 'bed'],
  },
};
class PureSearchService {
  /**
   * Enhanced tokenization with context awareness
   */
  static normalizePlurals(tokens) {
    const pluralMap = {
      beds: 'bed',
      sofas: 'sofa',
      chairs: 'chair',
      tables: 'table',
      cabinets: 'cabinet',
      wardrobes: 'wardrobe',
      cupboards: 'cupboard',
      almirahs: 'almirah',
      couches: 'couch',
      sectionals: 'sectional',
      settees: 'settee',
      loveseats: 'loveseat',
      recliners: 'recliner',
      stools: 'stool',
      benches: 'bench',
      armchairs: 'armchair',
      desks: 'desk',
      consoles: 'console',
      mattresses: 'mattress',
      headboards: 'headboard',
      cots: 'cot',
      shelves: 'shelf',
      dressers: 'dresser',
      almaris: 'almari',
      closets: 'closet',
    };

    return tokens.map((token) => pluralMap[token] || token);
  }

  /**
   * Enhanced tokenization with context awareness and plural normalization
   */
  static tokenizeQuery(query) {
    try {
      if (!query || typeof query !== 'string') return [];

      const tokens = query
        .toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(/[\s,\-]+/)
        .filter((token) => token.length > 0)
        .filter((token, index, arr) => arr.indexOf(token) === index);

      return this.normalizePlurals(tokens);
    } catch (error) {
      console.error('Error in tokenizeQuery:', error);
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
      console.error('Error in applySynonyms:', error);
      return tokens;
    }
  }

  /**
   * Classify tokens by importance and context
   */
  static classifyTokens(tokens) {
    try {
      const classified = {
        primary: [],
        modifiers: [],
        stopWords: [],
        regular: [],
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
      console.error('Error in classifyTokens:', error);
      return { primary: tokens, modifiers: [], stopWords: [], regular: [] };
    }
  }

  /**
   * Check if token is a modifier (color, material, size, etc.)
   */
  static isModifier(token) {
    const modifierPatterns = [/^\d+(seater|seat)$/, /^(small|medium|large|xl|xxl)$/];

    const synonymGroup = getSynonymGroup(token);
    if (
      synonymGroup &&
      ['material_wood', 'material_metal', 'material_fabric'].some((g) =>
        synonymGroup.group.includes(g),
      )
    ) {
      return true;
    }

    const colors = ['black', 'white', 'brown', 'gray', 'grey', 'blue', 'red', 'green', 'yellow'];
    if (colors.includes(token)) return true;

    const materials = ['wood', 'metal', 'fabric', 'leather', 'plastic', 'glass'];
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
        const seaterPatterns = [/(\d+)[-\s]*(seater|seat|person)/i, /(\d+)[-\s]*str/i];

        let seaterFound = false;
        for (const pattern of seaterPatterns) {
          const match = token.match(pattern);
          if (match) {
            numerics.seater = parseInt(match[1]);
            cleanTokens.push('seater');
            seaterFound = true;
            break;
          }
        }
        if (seaterFound) continue;

        const sizeMatch = token.match(/(\d+)\s*(inch|ft|feet|cm)/i);
        if (sizeMatch) {
          numerics.size = parseInt(sizeMatch[1]);
          continue;
        }

        if (/^\d+$/.test(token)) {
          const num = parseInt(token);
          if (num >= 1 && num <= 10) {
            numerics.seater = num;
            cleanTokens.push('seater');
            continue;
          }
        }

        cleanTokens.push(token);
      }

      return { tokens: cleanTokens, numerics };
    } catch (error) {
      console.error('Error in extractNumerics:', error);
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

      if (classified.primary.length > 0) {
        primaryType = classified.primary[0];
        confidence = 1.0;
      } else {
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

      if (numerics.seater && ['sofa', 'chair', 'table'].includes(primaryType)) {
        confidence = Math.min(1.0, confidence + 0.2);
      }

      return { primaryType, confidence };
    } catch (error) {
      console.error('Error in determineSearchIntent:', error);
      return { primaryType: null, confidence: 0 };
    }
  }

  static buildSearchPipeline(tokens, numerics, classified, intent) {
    try {
      const pipeline = [];

      pipeline.push({
        $match: { isPublished: true },
      });

      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      });

      pipeline.push({
        $lookup: {
          from: 'subcategories',
          localField: 'subCategoryId',
          foreignField: '_id',
          as: 'subcategory',
        },
      });

      if (tokens.length > 0 || Object.keys(numerics).length > 0) {
        pipeline.push({
          $addFields: {
            searchScore: this.buildContextAwareScore(classified, numerics, intent),
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
                      { relevanceCategory: { $in: ['exact', 'high'] } },
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
                  $multiply: [{ $ln: { $add: [{ $ifNull: ['$viewCount', 0] }, 1] } }, 0.3],
                },
                { $cond: [{ $eq: ['$isFeatured', true] }, 2.0, 0] },
                { $multiply: [{ $ifNull: ['$reviews.average', 0] }, 0.4] },
              ],
            },
            relevanceCategory: { $literal: 'general' },
            intentMatch: { $literal: 0 },
          },
        });
      }

      pipeline.push({
        $addFields: {
          sortPriority: {
            $add: [
              { $multiply: ['$intentMatch', 100] },
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$relevanceCategory', 'exact'] },
                      then: 50,
                    },
                    { case: { $eq: ['$relevanceCategory', 'high'] }, then: 30 },
                    {
                      case: { $eq: ['$relevanceCategory', 'medium'] },
                      then: 15,
                    },
                    { case: { $eq: ['$relevanceCategory', 'low'] }, then: 5 },
                  ],
                  default: 0,
                },
              },

              { $multiply: ['$searchScore', 2] },
            ],
          },
        },
      });

      pipeline.push({
        $sort: {
          sortPriority: -1,
          searchScore: -1,
          isFeatured: -1,
          'reviews.average': -1,
          createdAt: -1,
          _id: 1,
        },
      });

      return pipeline;
    } catch (error) {
      console.error('Error in buildSearchPipeline:', error);
      return [{ $match: { isPublished: true } }, { $sort: { createdAt: -1 } }, { $limit: 20 }];
    }
  }

  /**
   * Build context-aware scoring with token importance
   */
  static buildContextAwareScore(classified, numerics, intent) {
    try {
      const scoreComponents = [];

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
                        $ne: [{ $indexOfCP: [{ $toLower: '$name' }, token] }, -1],
                      },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: { $ifNull: ['$tags', []] },
                                cond: { $eq: [{ $toLower: '$$this' }, token] },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  5,
                  0,
                ],
              },
            ],
          });
        });
      }

      if (classified.regular.length > 0) {
        classified.regular.forEach((token) => {
          scoreComponents.push({
            $multiply: [
              FIELD_WEIGHTS.name * 0.7,
              {
                $cond: [{ $ne: [{ $indexOfCP: [{ $toLower: '$name' }, token] }, -1] }, 2, 0],
              },
            ],
          });

          scoreComponents.push({
            $multiply: [
              FIELD_WEIGHTS.brand,
              {
                $cond: [
                  {
                    $ne: [
                      {
                        $indexOfCP: [{ $toLower: { $ifNull: ['$brand', ''] } }, token],
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

      if (classified.modifiers.length > 0) {
        classified.modifiers.forEach((token) => {
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
                            $indexOfCP: [{ $toLower: { $ifNull: ['$material', ''] } }, token],
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
                                  $ifNull: ['$attributes.material', ''],
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
                                input: { $ifNull: ['$colorOptions', []] },
                                cond: { $eq: [{ $toLower: '$$this' }, token] },
                              },
                            },
                          },
                          0,
                        ],
                      },
                      {
                        $eq: [{ $toLower: { $ifNull: ['$attributes.color', ''] } }, token],
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

      if (classified.stopWords.length > 0) {
        classified.stopWords.forEach((token) => {
          if (token === 'set') {
            scoreComponents.push({
              $cond: [
                {
                  $and: [
                    {
                      $ne: [{ $indexOfCP: [{ $toLower: '$name' }, token] }, -1],
                    },
                    {
                      $or: classified.primary.concat(classified.regular).map((primaryToken) => ({
                        $ne: [
                          {
                            $indexOfCP: [{ $toLower: '$name' }, primaryToken],
                          },
                          -1,
                        ],
                      })),
                    },
                  ],
                },
                1.5,
                0,
              ],
            });
          }
        });
      }

      let baseScore = scoreComponents.length > 0 ? { $add: scoreComponents } : { $literal: 0.1 };

      if (numerics.seater) {
        baseScore = {
          $add: [
            baseScore,
            {
              $cond: [
                {
                  $eq: [{ $ifNull: ['$attributes.seater', 0] }, numerics.seater],
                },
                10,
                {
                  $cond: [
                    {
                      $and: [
                        {
                          $gte: [{ $ifNull: ['$attributes.seater', 0] }, numerics.seater - 1],
                        },
                        {
                          $lte: [{ $ifNull: ['$attributes.seater', 0] }, numerics.seater + 1],
                        },
                      ],
                    },
                    3,
                    0,
                  ],
                },
              ],
            },
          ],
        };
      }

      return {
        $multiply: [
          baseScore,

          {
            $cond: [{ $gt: [{ $ifNull: ['$inStockQuantity', 1] }, 0] }, 1.2, 0.3],
          },

          { $cond: [{ $eq: ['$isFeatured', true] }, 1.15, 1.0] },

          {
            $add: [1, { $multiply: [{ $ifNull: ['$reviews.average', 0] }, 0.1] }],
          },
        ],
      };
    } catch (error) {
      console.error('Error in buildContextAwareScore:', error);
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

    const primaryConditions = config.primary.map((term) => ({
      $ne: [{ $indexOfCP: [{ $toLower: '$name' }, term] }, -1],
    }));

    const avoidConditions = config.avoid.map((term) => ({
      $ne: [{ $indexOfCP: [{ $toLower: '$name' }, term] }, -1],
    }));

    return {
      $cond: [
        { $or: primaryConditions },
        intent.confidence * 3,
        {
          $cond: [{ $or: avoidConditions }, -2, 0.5],
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

      if (classified.primary.length > 0) {
        classified.primary.forEach((token) => {
          conditions.push({
            case: {
              $ne: [{ $indexOfCP: [{ $toLower: '$name' }, token] }, -1],
            },
            then: 'exact',
          });
        });
      }

      if (intent.primaryType && intent.confidence > 0.8) {
        const config = PRODUCT_HIERARCHY[intent.primaryType];
        if (config) {
          config.primary.forEach((term) => {
            conditions.push({
              case: {
                $ne: [{ $indexOfCP: [{ $toLower: '$name' }, term] }, -1],
              },
              then: 'high',
            });
          });
        }
      }

      if (classified.regular.length > 0) {
        classified.regular.forEach((token) => {
          conditions.push({
            case: {
              $or: [
                { $ne: [{ $indexOfCP: [{ $toLower: '$name' }, token] }, -1] },
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ['$tags', []] },
                          cond: { $eq: [{ $toLower: '$$this' }, token] },
                        },
                      },
                    },
                    0,
                  ],
                },
              ],
            },
            then: 'medium',
          });
        });
      }

      return {
        $switch: {
          branches: conditions,
          default: 'low',
        },
      };
    } catch (error) {
      console.error('Error in buildRelevanceCategory:', error);
      return { $literal: 'general' };
    }
  }

  /**
   * Safe fallback results with simple queries
   */
  static async getFallbackResults(classified, primaryType) {
    try {
      const fallbackPipeline = [];

      fallbackPipeline.push({
        $match: { isPublished: true },
      });

      fallbackPipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryId',
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      fallbackPipeline.push({
        $lookup: {
          from: 'subcategories',
          localField: 'subCategoryId',
          foreignField: '_id',
          as: 'subCategoryId',
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      fallbackPipeline.push({
        $unwind: { path: '$categoryId', preserveNullAndEmptyArrays: true },
      });

      fallbackPipeline.push({
        $unwind: { path: '$subCategoryId', preserveNullAndEmptyArrays: true },
      });

      if (classified.primary.length > 0) {
        const nameConditions = classified.primary.map((token) => ({
          name: { $regex: token, $options: 'i' },
        }));

        fallbackPipeline.push({
          $match: {
            $or: nameConditions,
          },
        });
      } else if (classified.regular.length > 0) {
        const nameConditions = classified.regular.slice(0, 2).map((token) => ({
          name: { $regex: token, $options: 'i' },
        }));

        fallbackPipeline.push({
          $match: {
            $or: nameConditions,
          },
        });
      }

      fallbackPipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              {
                $multiply: [{ $ln: { $add: [{ $ifNull: ['$viewCount', 0] }, 1] } }, 0.2],
              },
              { $cond: [{ $eq: ['$isFeatured', true] }, 1.0, 0] },
              {
                $cond: [{ $gt: [{ $ifNull: ['$inStockQuantity', 1] }, 0] }, 0.5, 0],
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
      console.error('Error in getFallbackResults:', error);

      try {
        return await Product.find({
          isPublished: true,
          $or: [{ isFeatured: true }, { inStockQuantity: { $gt: 0 } }],
        })
          .populate('categoryId', '_id name slug')
          .populate('subCategoryId', '_id name slug')
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
        `,
          )
          .lean();
      } catch (finalError) {
        console.error('Final fallback failed:', finalError);
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

      const tokens = this.tokenizeQuery(query);
      const synonymTokens = this.applySynonyms(tokens);
      const { tokens: numericTokens, numerics } = this.extractNumerics(synonymTokens);
      const classified = this.classifyTokens(numericTokens);

      const intent = this.determineSearchIntent(classified, numerics);

      let results = [];
      let total = 0;

      try {
        const pipeline = this.buildSearchPipeline(numericTokens, numerics, classified, intent);

        const skip = (page - 1) * pageSize;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: pageSize });

        pipeline.push({
          $project: {
            name: 1,
            slug: 1,
            description: 1,
            metaTitle: 1,
            metaDescription: 1,

            finalPrice: 1,
            originalPrice: 1,
            discountPercent: 1,
            emiPrice: 1,

            mainImage: 1,
            galleryImages: 1,

            categoryId: 1,
            subCategoryId: 1,
            category: 1,
            subcategory: 1,

            material: 1,
            dimensions: 1,
            weight: 1,
            colorOptions: 1,
            size: 1,
            variants: 1,
            attributes: 1,

            inStockQuantity: 1,
            isPublished: 1,
            isBestSeller: 1,
            isFeatured: 1,
            isNewArrival: 1,

            brand: 1,
            badge: 1,
            tags: 1,

            reviews: 1,
            ratings: 1,

            totalSold: 1,
            viewCount: 1,
            wishlistCount: 1,

            returnPolicy: 1,
            warranty: 1,
            shippingInfo: 1,

            createdAt: 1,
            updatedAt: 1,

            itemId: 1,
            __v: 1,

            searchScore: 1,
            relevanceCategory: 1,
            intentMatch: 1,
            sortPriority: 1,
          },
        });

        results = await Product.aggregate(pipeline);

        const countPipeline = this.buildSearchPipeline(numericTokens, numerics, classified, intent);
        countPipeline.push({ $count: 'total' });
        const countResult = await Product.aggregate(countPipeline);
        total = countResult[0]?.total || 0;

        if (
          results.length === 0 &&
          (classified.primary.length > 0 || classified.regular.length > 0)
        ) {
          const relaxedPipeline = this.buildRelaxedPipeline(classified, numerics, intent);
          relaxedPipeline.push({ $skip: skip });
          relaxedPipeline.push({ $limit: pageSize });
          relaxedPipeline.push({
            $project: {
              name: 1,
              slug: 1,
              description: 1,
              metaTitle: 1,
              metaDescription: 1,

              finalPrice: 1,
              originalPrice: 1,
              discountPercent: 1,
              emiPrice: 1,

              mainImage: 1,
              galleryImages: 1,

              categoryId: 1,
              subCategoryId: 1,
              category: 1,
              subcategory: 1,

              material: 1,
              dimensions: 1,
              weight: 1,
              colorOptions: 1,
              size: 1,
              variants: 1,
              attributes: 1,

              inStockQuantity: 1,
              isPublished: 1,
              isBestSeller: 1,
              isFeatured: 1,
              isNewArrival: 1,

              brand: 1,
              badge: 1,
              tags: 1,

              reviews: 1,
              ratings: 1,

              totalSold: 1,
              viewCount: 1,
              wishlistCount: 1,

              returnPolicy: 1,
              warranty: 1,
              shippingInfo: 1,

              createdAt: 1,
              updatedAt: 1,

              itemId: 1,
              __v: 1,

              searchScore: 1,
            },
          });

          results = await Product.aggregate(relaxedPipeline);

          const relaxedCountPipeline = this.buildRelaxedPipeline(classified, numerics, intent);
          relaxedCountPipeline.push({ $count: 'total' });
          const relaxedCountResult = await Product.aggregate(relaxedCountPipeline);
          total = relaxedCountResult[0]?.total || 0;
        }
      } catch (searchError) {
        console.error('Advanced search failed, trying fallback:', searchError);

        results = await this.getFallbackResults(classified, intent.primaryType);
        total = results.length;
      }

      if (results.length === 0) {
        try {
          results = await Product.find({
            isPublished: true,
            $or: [{ isFeatured: true }, { inStockQuantity: { $gt: 0 } }],
          })
            .populate('categoryId', '_id name slug')
            .populate('subCategoryId', '_id name slug')
            .sort({ isFeatured: -1, 'reviews.average': -1, createdAt: -1 })
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
          `,
            )
            .lean();
          total = Math.min(results.length, 50);
        } catch (defaultError) {
          console.error('Even default search failed:', defaultError);
          results = [];
          total = 0;
        }
      }

      return {
        ok: true,
        query,
        normalized: numericTokens.join(' '),
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
      console.error('Complete search failure:', error);

      return {
        ok: true,
        query: query || '',
        normalized: '',
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
        error: 'Search temporarily unavailable',
      };
    }
  }

  /**
   * Build relaxed pipeline for when strict search returns no results
   */
  static buildRelaxedPipeline(classified, numerics, intent) {
    try {
      const pipeline = [];

      pipeline.push({
        $match: { isPublished: true },
      });

      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryId',
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      pipeline.push({
        $lookup: {
          from: 'subcategories',
          localField: 'subCategoryId',
          foreignField: '_id',
          as: 'subCategoryId',
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
        },
      });

      pipeline.push({
        $unwind: { path: '$categoryId', preserveNullAndEmptyArrays: true },
      });

      pipeline.push({
        $unwind: { path: '$subCategoryId', preserveNullAndEmptyArrays: true },
      });

      const importantTokens = [...classified.primary, ...classified.regular];
      if (importantTokens.length > 0) {
        const relaxedConditions = [];

        importantTokens.forEach((token) => {
          relaxedConditions.push({
            name: { $regex: token, $options: 'i' },
          });
        });

        if (classified.regular.length > 0) {
          relaxedConditions.push({
            tags: { $in: classified.regular.map((t) => new RegExp(t, 'i')) },
          });
        }

        if (classified.regular.length > 0) {
          classified.regular.forEach((token) => {
            relaxedConditions.push({
              brand: { $regex: token, $options: 'i' },
            });
          });
        }

        pipeline.push({
          $match: {
            $or: relaxedConditions,
          },
        });
      }

      pipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              {
                $multiply: [{ $ln: { $add: [{ $ifNull: ['$totalSold', 0] }, 1] } }, 0.3],
              },
              { $cond: [{ $eq: ['$isFeatured', true] }, 2.0, 0] },
              {
                $cond: [{ $gt: [{ $ifNull: ['$inStockQuantity', 1] }, 0] }, 1.0, 0],
              },
              { $multiply: [{ $ifNull: ['$reviews.average', 0] }, 0.4] },
            ],
          },
        },
      });

      if (numerics.seater) {
        pipeline.push({
          $addFields: {
            searchScore: {
              $add: [
                '$searchScore',
                {
                  $cond: [
                    {
                      $eq: [{ $ifNull: ['$attributes.seater', 0] }, numerics.seater],
                    },
                    5.0,
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
      console.error('Error in buildRelaxedPipeline:', error);
      return [
        { $match: { isPublished: true } },
        { $sort: { isFeatured: -1, createdAt: -1 } },
        { $limit: 20 },
      ];
    }
  }
}

export default PureSearchService;
