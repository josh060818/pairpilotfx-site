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
export const publishedCaseStudies: PublicCaseStudy[] = [
  {
    "schemaVersion": "1.0",
    "slug": "audcad-2026-09-28",
    "pair": "AUDCAD",
    "weekStart": "2026-09-28",
    "weekEnd": "2026-10-02",
    "category": "NO_CONFIRMATION",
    "title": "AUDCAD: Conditions Never Reached Confirmation",
    "subtitle": "A retrospective review of an included pair that remained in observation.",
    "summary": "AUDCAD entered the weekly universe, but its starting record was UNMAPPED because major-event coverage was incomplete. Subsequent event-risk phases passed into observation, yet higher-timeframe structure remained TRANSITIONAL and confirmation never occurred.",
    "startingContext": "At the 2026-09-28 decision cutoff, AUDCAD showed moderate relative-strength separation with CAD stronger than AUD, while D1 and H1 structure were in transition and H4 was bullish. Price was bracketed between untested H4 support at 0.99079 and H1 resistance at 0.99578. Macro coverage was incomplete, so execution was BLOCKED; this was not a trade signal.",
    "selectionDecision": "AUDCAD was included in the weekly universe. The deterministic execution gate remained blocked because complete major-event coverage was required before execution conditions could be evaluated.",
    "lifecycle": "The persisted sequence was UNMAPPED at the starting snapshot; BLOCKED during EVENT_RISK; BLOCKED during MIXED event risk; then MONITOR during the POST_EVENT observation phase; and MONITOR after macro state became CLEAR. The monitor state during POST_EVENT still required the post-event risk window to clear. After macro became CLEAR, the outstanding condition was higher-timeframe structure resolving out of transition. Confirmation never occurred.",
    "marketOutcome": "This outcome was observed after the decision cutoff. Across 115 H1 bars, price ranged from 0.98394 to 0.99696 and ended at 0.99144 versus a 0.99321 anchor. Direction was UNRESOLVED, so no favourable or adverse scenario excursion was evaluated. Starting resistance at 0.99578 was touched and crossed beyond without a close beyond; starting support at 0.99079 was touched, crossed beyond, and had a close beyond. The observed endpoint displacement was small relative to the observed range, and no meaningful move was recorded.",
    "whatRadarGotRight": "Radar preserved the distinction between screening context and confirmation. It blocked evaluation while macro coverage was incomplete and through event-risk windows, then retained an observation posture when macro conditions improved because higher-timeframe structure remained TRANSITIONAL. The final evaluation supports this: the pair was included, but the required condition was not observed.",
    "limitationsAndMisses": "The real limitation was unresolved higher-timeframe structure, alongside changing relative-strength states and event-risk conditions; these prevented a confirmed scenario. This is not a deterministic Radar miss: the supplied evaluation is NO_CONFIRMATION and assesses Radar as supported. No invalidation was observed, but neither was confirmation.",
    "lesson": "In an unresolved market, strength separation and nearby liquidity are context rather than sufficient confirmation. A disciplined process should preserve observation status until macro conditions and higher-timeframe structure jointly permit confirmation.",
    "limitations": [
      "The starting macro record was UNMAPPED because major-event coverage was incomplete.",
      "Direction remained UNRESOLVED, so scenario-relative excursion and support could not be evaluated.",
      "The review records observed market behaviour, not an executed trade or performance result."
    ],
    "methodologyNote": "Starting evidence is point-in-time information available at the decision cutoff. Lifecycle snapshots document later state changes, while market outcome was evaluated afterward from observed H1 data; it was not available to the original decision.",
    "disclaimer": "This retrospective material is for educational and review purposes only and is not financial advice. PairPilotFX provides decision support, not trade execution or a guarantee of market outcomes.",
    "metrics": {
      "direction": "UNRESOLVED",
      "anchorPrice": 0.99321,
      "endingPrice": 0.99144,
      "highestPrice": 0.99696,
      "lowestPrice": 0.98394,
      "favourableExcursion": null,
      "adverseExcursion": null,
      "confirmationAt": null,
      "invalidationAt": null
    },
    "publishedAt": null
  }
];

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
