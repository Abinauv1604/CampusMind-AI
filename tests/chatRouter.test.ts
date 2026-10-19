import test from 'node:test';
import assert from 'node:assert/strict';
import { detectQuestionCategory, detectFollowUpIntent } from '../src/services/aiRouter.ts';
import { getRelevantCollegeDocuments } from '../src/utils/localRag.ts';
import { SAMPLE_DOCUMENTS } from '../src/data/sampleData.ts';

test('1. detectQuestionCategory correctly categorizes academic queries', () => {
  assert.equal(detectQuestionCategory('What is refraction?'), 'academic');
  assert.equal(detectQuestionCategory("Explain Snell's law with an example."), 'academic');
  assert.equal(detectQuestionCategory('Solve a quadratic equation step by step.'), 'academic');
  assert.equal(detectQuestionCategory('Explain the difference between RAM and ROM.'), 'academic');
});

test('2. detectQuestionCategory correctly categorizes programming queries', () => {
  assert.equal(detectQuestionCategory('What is a pointer in C?'), 'programming');
  assert.equal(detectQuestionCategory('How do I reverse a linked list in Python?'), 'programming');
});

test('3. detectQuestionCategory correctly categorizes Sathyabama queries', () => {
  assert.equal(detectQuestionCategory('What is the latest official Sathyabama academic notice?'), 'sathyabama');
  assert.equal(detectQuestionCategory('What is the minimum attendance requirement at Sathyabama?'), 'sathyabama');
  assert.equal(detectQuestionCategory('When are the CAE 1 exams?'), 'sathyabama');
});

test('4. detectQuestionCategory defaults to general for open questions', () => {
  assert.equal(detectQuestionCategory('Why is the sky blue?'), 'general');
  assert.equal(detectQuestionCategory('Write a short essay on renewable energy.'), 'general');
});

test('5. detectFollowUpIntent correctly identifies user follow-up requests', () => {
  assert.equal(detectFollowUpIntent('Explain it more simply.'), 'simplify');
  assert.equal(detectFollowUpIntent('Show another example.'), 'example');
  assert.equal(detectFollowUpIntent('Explain the formula.'), 'formula');
  assert.equal(detectFollowUpIntent('Give me a numerical problem.'), 'practice_question');
  assert.equal(detectFollowUpIntent('Quiz me on this topic.'), 'quiz');
  assert.equal(detectFollowUpIntent('Summarize the key takeaways.'), 'summarize');
  assert.equal(detectFollowUpIntent('What is refraction?'), 'none');
});

test('6. Conversation context inheritance maintains category for follow-up actions', () => {
  const history = [
    { role: 'user' as const, text: 'What is refraction?' },
    { role: 'model' as const, text: 'Refraction is the bending of waves...' }
  ];
  assert.equal(detectQuestionCategory('Explain it more simply', history), 'academic');
  assert.equal(detectQuestionCategory('Give me another example', history), 'academic');
  assert.equal(detectQuestionCategory('Quiz me', history), 'academic');
});

test('7. getRelevantCollegeDocuments returns top scored documents without dumping entire repository', () => {
  const relevant = getRelevantCollegeDocuments('attendance requirement 80%', SAMPLE_DOCUMENTS, 3);
  assert.ok(relevant.length <= 3);
  assert.ok(relevant.some(d => d.title.toLowerCase().includes('attendance') || d.content.includes('80%')));
});
