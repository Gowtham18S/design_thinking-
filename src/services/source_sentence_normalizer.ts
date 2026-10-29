/**
 * Source Sentence Normalizer & Pre-Conditioner
 * Normalizes punctuation, casing, proper nouns, and informal colloquial patterns
 * so the sequence-to-sequence neural network translates the entire semantic unit.
 */

export interface NormalizedSource {
  normalizedText: string;
  isModified: boolean;
  hasClauses: boolean;
  clauses: string[];
  conjunction?: string;
  extractedEntities: { name: string; type: 'person' | 'brand' | 'place' }[];
}

export class SourceSentenceNormalizer {
  // Known proper nouns to capitalize and preserve
  private static readonly PROPER_NAMES: Record<string, string> = {
    'gowtham': 'Gowtham',
    'gautam': 'Gautam',
    'goutham': 'Goutham',
    'sundar': 'Sundar',
    'priya': 'Priya',
    'rahul': 'Rahul',
    'anand': 'Anand',
    'kavitha': 'Kavitha',
    'karthik': 'Karthik',
    'chennai': 'Chennai',
    'delhi': 'Delhi',
    'mumbai': 'Mumbai',
    'bangalore': 'Bangalore',
    'bengaluru': 'Bengaluru',
    'kolkata': 'Kolkata',
    'hyderabad': 'Hyderabad',
    'madurai': 'Madurai',
    'coimbatore': 'Coimbatore'
  };

  // Known brand names to format consistently
  private static readonly BRAND_NAMES: Record<string, string> = {
    'free fire': 'Free Fire',
    'freefire': 'Free Fire',
    'pubg': 'PUBG',
    'google': 'Google',
    'youtube': 'YouTube',
    'whatsapp': 'WhatsApp',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'netflix': 'Netflix'
  };

  /**
   * Normalize an input sentence for optimal neural NMT generation
   */
  public static normalize(rawText: string): NormalizedSource {
    let text = rawText.trim();
    if (!text) {
      return {
        normalizedText: '',
        isModified: false,
        hasClauses: false,
        clauses: [],
        extractedEntities: []
      };
    }

    const entities: { name: string; type: 'person' | 'brand' | 'place' }[] = [];

    // 1. Normalize brand names
    for (const [lowerBrand, properBrand] of Object.entries(this.BRAND_NAMES)) {
      const regex = new RegExp(`\\b${lowerBrand}\\b`, 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, properBrand);
        entities.push({ name: properBrand, type: 'brand' });
      }
    }

    // 2. Normalize proper names
    for (const [lowerName, properName] of Object.entries(this.PROPER_NAMES)) {
      const regex = new RegExp(`\\b${lowerName}\\b`, 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, properName);
        entities.push({ name: properName, type: 'person' });
      }
    }

    // 3. Clean multiple spaces
    text = text.replace(/\s{2,}/g, ' ');

    return {
      normalizedText: text,
      isModified: text !== rawText.trim(),
      hasClauses: false,
      clauses: [text],
      extractedEntities: entities
    };
  }
}
