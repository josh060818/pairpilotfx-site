import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const data = await readFile(
  new URL('../src/data/case-studies.ts', import.meta.url),
  'utf8'
);
const index = await readFile(
  new URL('../src/pages/case-studies/index.astro', import.meta.url),
  'utf8'
);
const detail = await readFile(
  new URL('../src/pages/case-studies/[slug].astro', import.meta.url),
  'utf8'
);

test('case study library uses reviewed static data rather than synthetic examples', () => {
  assert.match(data, /publishedCaseStudies: PublicCaseStudy\[\] = \[\]/);
  assert.match(data, /Do not add synthetic examples here/);
});

test('case study index and detail pages expose accountability language', () => {
  assert.match(index, /Evidence over hindsight/);
  assert.match(index, /without cherry-picking/);
  assert.match(detail, /What PairPilotFX knew at the time/);
  assert.match(detail, /not trade P&amp;L/);
});

test('case study pages include analytics hooks', () => {
  assert.match(index, /case_study_open/);
  assert.match(detail, /case_study_view/);
  assert.match(detail, /case_study_methodology_click/);
});
