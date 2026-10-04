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
  },
  {
    "schemaVersion": "1.0",
    "slug": "audusd-2026-09-28",
    "pair": "AUDUSD",
    "weekStart": "2026-09-28",
    "weekEnd": "2026-10-02",
    "category": "NO_CONFIRMATION",
    "title": "AUDUSD: Bearish Context, No Confirmed Execution Condition",
    "subtitle": "A retrospective of confirmation discipline through incomplete coverage and overlapping event-risk windows.",
    "summary": "AUDUSD later recorded a meaningful bearish move, supporting the scenario context. PairPilotFX did not produce a confirmed execution condition at any point, so this is a NO_CONFIRMATION case—not a missed trade or failed signal.",
    "startingContext": "At the 2026-09-28 decision cutoff, AUDUSD was UNMAPPED and execution was BLOCKED because major-event coverage for AUD and USD was incomplete. Historical relative strength, using the selected LEGACY source, showed STRONG_SEPARATION with USD stronger than AUD. D1 and H4 structure were bearish while H1 was bullish, leaving structure PARTIALLY_ALIGNED. Liquidity was NEAR_DECISION_AREA.",
    "selectionDecision": "AUDUSD was included in the weekly universe. The initial decision was to withhold execution evaluation until complete major-event coverage was available; no execution condition was confirmed.",
    "lifecycle": "The persisted record moved from UNMAPPED to EVENT_RISK, then MIXED, then POST_EVENT observation, returned to EVENT_RISK, and ended in POST_EVENT observation. Strength remained STRONG_SEPARATION. Structure was PARTIALLY_ALIGNED in most snapshots, with one TRANSITIONAL snapshot. Execution was BLOCKED or OBSERVE throughout; confirmation never occurred.",
    "marketOutcome": "Evaluated afterward on H1 data, AUDUSD moved from 0.70189 to 0.69574. The observed low was 0.69040 and the high was 0.70394. The bearish scenario recorded meaningful movement and scenarioSupport=SUPPORTED. The starting 0.70040 support was touched, crossed, and observed to close beyond; the starting 0.70451 resistance was not touched.",
    "whatRadarGotRight": "The persisted historical strength record consistently maintained USD-over-AUD separation, and the prevailing structure context was mostly bearish. More importantly, Radar preserved the event-risk and post-event observation constraints instead of converting directional context into a confirmed execution condition.",
    "limitationsAndMisses": "A real limitation at the decision cutoff was incomplete major-event coverage, which made the macro state UNMAPPED. Once coverage was available, overlapping high-impact event and post-event windows continued to constrain evaluation. This was not a deterministic Radar miss: the evaluation is NO_CONFIRMATION, confirmationOccurred=false, and no invalidation was recorded.",
    "lesson": "Confirmation discipline matters under event risk. A later scenario-supported move does not retrospectively establish that execution should have occurred when coverage was incomplete, event windows were active, and confirmation never formed.",
    "limitations": [
      "The decision-cutoff macro record had incomplete major-event coverage for AUD and USD.",
      "High-impact event-risk and post-event observation windows persisted through the lifecycle.",
      "The outcome describes scenario-relative price movement only; no trade, entry, stop, target, P&L, or R-multiple was recorded.",
      "Later Currency Strength shadow evidence does not replace the historical LEGACY relative-strength source used by the persisted Radar record."
    ],
    "methodologyNote": "Starting evidence is assessed point-in-time at the original decision cutoff. Market outcome is evaluated afterward from the observed H1 window and is not treated as information available to PairPilotFX at the cutoff.",
    "disclaimer": "This retrospective is for educational and review purposes only and is not financial advice. PairPilotFX provides decision support, not trade execution or a recommendation to buy or sell.",
    "metrics": {
      "direction": "BEARISH",
      "anchorPrice": 0.70189,
      "endingPrice": 0.69574,
      "highestPrice": 0.70394,
      "lowestPrice": 0.6904,
      "favourableExcursion": 0.01149,
      "adverseExcursion": 0.0020499999999999963,
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
