export type CaseStudyCategory =
  | 'ALIGNED_SUCCESS'
  | 'NO_CONFIRMATION'
  | 'INVALIDATED'
  | 'CORRECTLY_FILTERED'
  | 'FILTERED_BUT_MOVED'
  | 'RADAR_MISS'
  | 'INCONCLUSIVE';

export type CaseStudyDirection =
  | 'BULLISH'
  | 'BEARISH'
  | 'UNRESOLVED';

export interface PublicCaseStudy {
  schemaVersion: '1.0';
  slug: string;
  pair: string;
  weekStart: string;
  weekEnd: string;
  category: CaseStudyCategory;
  title: string;
  subtitle: string;
  summary: string;
  startingContext: string;
  selectionDecision: string;
  lifecycle: string;
  marketOutcome: string;
  whatRadarGotRight: string;
  limitationsAndMisses: string;
  lesson: string;
  limitations: string[];
  methodologyNote: string;
  disclaimer: string;
  metrics: {
    direction: CaseStudyDirection;
    anchorPrice: number | null;
    endingPrice: number | null;
    highestPrice: number | null;
    lowestPrice: number | null;
    favourableExcursion: number | null;
    adverseExcursion: number | null;
    confirmationAt: string | null;
    invalidationAt: string | null;
  };
  publishedAt: string | null;
}

/**
 * Public Case Studies are intentionally committed only after backend human
 * approval. Do not add synthetic examples here. The backend endpoint
 * /api/case-studies/:caseStudyId/public-export returns this exact contract.
 */
export const publishedCaseStudies: PublicCaseStudy[] = [];

export function caseStudyCategoryLabel(
  category: CaseStudyCategory
): string {
  const labels: Record<CaseStudyCategory, string> = {
    ALIGNED_SUCCESS: 'Aligned success',
    NO_CONFIRMATION: 'No confirmation',
    INVALIDATED: 'Invalidated',
    CORRECTLY_FILTERED: 'Correctly filtered',
    FILTERED_BUT_MOVED: 'Filtered, but moved',
    RADAR_MISS: 'Radar miss',
    INCONCLUSIVE: 'Inconclusive'
  };
  return labels[category];
}

export function pairLabel(pair: string): string {
  return /^[A-Z]{6}$/.test(pair)
    ? `${pair.slice(0, 3)}/${pair.slice(3)}`
    : pair;
}
