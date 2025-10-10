import { SYNONYMS, getSynonymGroup } from './synonyms';

export class SuggestionsHandler {
  static SUGGESTION_CATEGORIES = {
    trending: [
      '3 seater sofa',
      'dining table',
      'office chair',
      'king size bed',
      'wooden cabinet',
      'leather sofa',
      'study table',
      'wardrobe',
      'coffee table',
      'recliner chair',
    ],

    popular_searches: [
      'sofa set',
      'dining table 6 seater',
      'office chair ergonomic',
      'wooden bed',
      'glass table',
      'fabric sofa',
      'steel almirah',
      'corner sofa',
      'folding table',
      'computer chair',
    ],

    furniture_types: [
      'sofa',
      'chair',
      'table',
      'bed',
      'cabinet',
      'wardrobe',
      'dining set',
      'office furniture',
      'bedroom furniture',
      'living room furniture',
    ],

    by_room: [
      'living room furniture',
      'bedroom furniture',
      'office furniture',
      'dining room furniture',
      'kitchen furniture',
      'study room furniture',
    ],

    by_material: [
      'wooden furniture',
      'metal furniture',
      'glass furniture',
      'leather furniture',
      'fabric furniture',
      'plastic furniture',
    ],
  };

  /**
   * Check if we should call API for suggestions or use client-side
   */
  static shouldCallAPI(query) {
    if (!query || query.length < 3) return false;
    if (query.length > 15) return true;

    const tokens = query.toLowerCase().split(/\s+/);
    return tokens.length > 3;
  }

  /**
   * Get instant suggestions for quick queries
   */
  static getInstantSuggestions(query) {
    try {
      const normalizedQuery = query.toLowerCase().trim();

      if (normalizedQuery.length === 0) {
        return {
          type: 'trending',
          suggestions: this.SUGGESTION_CATEGORIES.trending.slice(0, 8),
        };
      }

      if (normalizedQuery.length < 2) {
        return {
          type: 'popular',
          suggestions: this.SUGGESTION_CATEGORIES.popular_searches
            .filter((s) => s.toLowerCase().startsWith(normalizedQuery))
            .slice(0, 6),
        };
      }

      const matches = [];

      Object.values(this.SUGGESTION_CATEGORIES)
        .flat()
        .forEach((suggestion) => {
          if (suggestion.toLowerCase().startsWith(normalizedQuery)) {
            matches.push({ suggestion, score: 10, type: 'prefix' });
          }
        });

      if (matches.length < 6) {
        Object.values(this.SUGGESTION_CATEGORIES)
          .flat()
          .forEach((suggestion) => {
            if (
              suggestion.toLowerCase().includes(normalizedQuery) &&
              !matches.some((m) => m.suggestion === suggestion)
            ) {
              matches.push({ suggestion, score: 5, type: 'partial' });
            }
          });
      }

      const sortedSuggestions = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((m) => m.suggestion);

      return {
        type: 'instant',
        suggestions: sortedSuggestions,
      };
    } catch (error) {
      console.error('Error in getInstantSuggestions:', error);
      return {
        type: 'trending',
        suggestions: this.SUGGESTION_CATEGORIES.trending.slice(0, 5),
      };
    }
  }

  /**
   * Get smart suggestions with context awareness
   */
  static getSmartSuggestions(query) {
    try {
      const normalizedQuery = query.toLowerCase().trim();

      if (normalizedQuery.length === 0) {
        return {
          type: 'trending',
          suggestions: this.SUGGESTION_CATEGORIES.trending,
        };
      }

      const tokens = normalizedQuery.split(/\s+/);
      const suggestions = new Set();

      const intent = this.detectSuggestionIntent(tokens);

      switch (intent.type) {
        case 'furniture_with_seater':
          this.addSeaterSuggestions(suggestions, intent.furniture, intent.seater);
          break;

        case 'furniture_with_material':
          this.addMaterialSuggestions(suggestions, intent.furniture, intent.material);
          break;

        case 'furniture_with_color':
          this.addColorSuggestions(suggestions, intent.furniture, intent.color);
          break;

        case 'room_furniture':
          this.addRoomSuggestions(suggestions, intent.room);
          break;

        case 'general_furniture':
          this.addGeneralSuggestions(suggestions, intent.furniture);
          break;

        default:
          return this.getInstantSuggestions(query);
      }

      if (suggestions.size < 6) {
        this.SUGGESTION_CATEGORIES.trending.forEach((trend) => {
          if (suggestions.size < 8) {
            suggestions.add(trend);
          }
        });
      }

      return {
        type: intent.type,
        suggestions: Array.from(suggestions).slice(0, 8),
      };
    } catch (error) {
      console.error('Error in getSmartSuggestions:', error);
      return this.getInstantSuggestions(query);
    }
  }

  /**
   * Detect suggestion intent from tokens
   */
  static detectSuggestionIntent(tokens) {
    let furniture = null;
    let seater = null;
    let material = null;
    let color = null;
    let room = null;

    tokens.forEach((token) => {
      if (['sofa', 'chair', 'table', 'bed', 'cabinet', 'wardrobe'].includes(token)) {
        furniture = token;
      }

      const seaterMatch =
        token.match(/(\d+)seater?/) ||
        (token.match(/^\d+$/) && parseInt(token) <= 10 ? [null, token] : null);
      if (seaterMatch) {
        seater = parseInt(seaterMatch[1]);
      }

      if (['wood', 'wooden', 'metal', 'glass', 'leather', 'fabric'].includes(token)) {
        material = token === 'wooden' ? 'wood' : token;
      }

      if (['black', 'white', 'brown', 'gray', 'grey', 'blue', 'red'].includes(token)) {
        color = token;
      }

      if (['living', 'dining', 'bedroom', 'office', 'kitchen'].includes(token)) {
        room = token;
      }
    });

    if (furniture && seater) {
      return { type: 'furniture_with_seater', furniture, seater };
    } else if (furniture && material) {
      return { type: 'furniture_with_material', furniture, material };
    } else if (furniture && color) {
      return { type: 'furniture_with_color', furniture, color };
    } else if (room) {
      return { type: 'room_furniture', room };
    } else if (furniture) {
      return { type: 'general_furniture', furniture };
    }

    return { type: 'general' };
  }

  /**
   * Add seater-specific suggestions
   */
  static addSeaterSuggestions(suggestions, furniture, seater) {
    const seaterVariations = [seater - 1, seater, seater + 1].filter((s) => s > 0 && s <= 8);

    seaterVariations.forEach((s) => {
      suggestions.add(`${s} seater ${furniture}`);
      suggestions.add(`${furniture} ${s} seater`);
      if (furniture === 'sofa') {
        suggestions.add(`${s} seater sofa set`);
        suggestions.add(`${s} seater sectional`);
      }
    });

    ['leather', 'fabric', 'wooden'].forEach((material) => {
      suggestions.add(`${seater} seater ${material} ${furniture}`);
    });
  }

  /**
   * Add material-specific suggestions
   */
  static addMaterialSuggestions(suggestions, furniture, material) {
    suggestions.add(`${material} ${furniture}`);
    suggestions.add(`${furniture} ${material}`);

    if (furniture === 'sofa') {
      suggestions.add(`${material} sofa set`);
      ['2', '3', '4'].forEach((s) => {
        suggestions.add(`${s} seater ${material} sofa`);
      });
    }

    if (furniture === 'table') {
      suggestions.add(`${material} dining table`);
      suggestions.add(`${material} coffee table`);
    }
  }

  /**
   * Add color-specific suggestions
   */
  static addColorSuggestions(suggestions, furniture, color) {
    suggestions.add(`${color} ${furniture}`);
    suggestions.add(`${furniture} ${color}`);

    if (furniture === 'sofa') {
      suggestions.add(`${color} sofa set`);
      suggestions.add(`${color} leather sofa`);
    }
  }

  /**
   * Add room-specific suggestions
   */
  static addRoomSuggestions(suggestions, room) {
    const roomFurniture = {
      living: ['sofa', 'coffee table', 'tv unit', 'recliner'],
      dining: ['dining table', 'dining chair', 'dining set'],
      bedroom: ['bed', 'wardrobe', 'dresser', 'nightstand'],
      office: ['office chair', 'desk', 'filing cabinet'],
      kitchen: ['kitchen cabinet', 'dining table', 'bar stool'],
    };

    (roomFurniture[room] || []).forEach((item) => {
      suggestions.add(item);
      suggestions.add(`${room} room ${item}`);
    });
  }

  /**
   * Add general furniture suggestions
   */
  static addGeneralSuggestions(suggestions, furniture) {
    suggestions.add(furniture);
    suggestions.add(`${furniture} set`);

    if (furniture === 'sofa') {
      ['2', '3', '4', '5'].forEach((s) => {
        suggestions.add(`${s} seater sofa`);
      });
      suggestions.add('sofa cum bed');
      suggestions.add('corner sofa');
      suggestions.add('leather sofa');
      suggestions.add('fabric sofa');
    }

    if (furniture === 'table') {
      suggestions.add('dining table');
      suggestions.add('coffee table');
      suggestions.add('study table');
      suggestions.add('center table');
    }

    if (furniture === 'chair') {
      suggestions.add('dining chair');
      suggestions.add('office chair');
      suggestions.add('accent chair');
      suggestions.add('recliner chair');
      suggestions.add('rocking chair');
      suggestions.add('folding chair');
    }

    if (furniture === 'bed') {
      suggestions.add('king size bed');
      suggestions.add('queen size bed');
      suggestions.add('single bed');
      suggestions.add('double bed');
      suggestions.add('wooden bed');
      suggestions.add('storage bed');
      suggestions.add('bunk bed');
      suggestions.add('sofa cum bed');
    }
  }
}
