import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const index = await readFile(
  new URL('../src/pages/case-studies/index.astro', import.meta.url),
  'utf8'
);
const detail = await readFile(
  new URL('../src/pages/case-studies/[slug].astro', import.meta.url),
  'utf8'
);

test('Case Study library records funnel entry with published count', () => {
  assert.match(index, /case_study_library_view/);
  assert.match(index, /published_count/);
});

test('Case Study detail records the research-to-preparation funnel', () => {
  assert.match(detail, /case_study_view/);
  assert.match(detail, /case_study_methodology_click/);
  assert.match(detail, /case_study_weekly_cta_click/);
  assert.match(detail, /case_study_radar_cta_click/);
  assert.match(detail, /Use the case study as research, not as a signal/);
});
