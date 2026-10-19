import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { convertLatexToSpokenText, sanitizeTextForSpeech } from '../src/utils/voiceUtils.ts';

test('1. KaTeX renders all core mathematical notation into HTML', () => {
  const formulas = [
    // Summation & fractions
    String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`,
    // Integration & square roots
    String.raw`\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}`,
    // Derivatives
    String.raw`\frac{d}{dx}(x^2) = 2x`,
    String.raw`\frac{\partial f}{\partial x}`,
    // Powers & subscripts
    String.raw`x^2 + y_1 = z^3`,
    // Greek letters & trigonometry (Snell's Law)
    String.raw`n_1\sin\theta_1 = n_2\sin\theta_2`,
    String.raw`\alpha + \beta + \lambda + \pi + \Delta + \Sigma`,
    // Limits
    String.raw`\lim_{x\to 0} \frac{\sin x}{x} = 1`,
    // Matrices
    String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`,
    // Inequalities & special symbols
    String.raw`a \le b \text{ and } c \neq d \approx e \pm f`
  ];

  for (const f of formulas) {
    const html = katex.renderToString(f, { displayMode: true, throwOnError: false });
    assert.ok(html.includes('class="katex"'), `Failed to render: ${f}`);
    assert.ok(html.length > 50, `HTML output too short for: ${f}`);
  }
});

test('2. convertLatexToSpokenText converts LaTeX math to natural spoken phrases', () => {
  const sumSpoken = convertLatexToSpokenText(String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`);
  assert.ok(sumSpoken.includes('sum from') || sumSpoken.includes('sum of'));
  assert.ok(sumSpoken.includes('over 2'));

  const derivSpoken = convertLatexToSpokenText(String.raw`\frac{d}{dx}(x^2) = 2x`);
  assert.ok(derivSpoken.includes('derivative of x squared with respect to x'));

  const snellSpoken = convertLatexToSpokenText(String.raw`n_1\sin\theta_1 = n_2\sin\theta_2`);
  assert.ok(snellSpoken.includes('sine') && snellSpoken.includes('theta'));

  const sqrtSpoken = convertLatexToSpokenText(String.raw`\sqrt{x}`);
  assert.equal(sqrtSpoken, 'square root of x');
});

test('3. sanitizeTextForSpeech converts formulas while preserving regular currency', () => {
  const textWithMathAndCurrency = 'The textbook costs $50 or $100, but Snell\'s law states $$n_1\\sin\\theta_1=n_2\\sin\\theta_2$$.';
  const spoken = sanitizeTextForSpeech(textWithMathAndCurrency);

  // Currency preserved
  assert.ok(spoken.includes('$50') && spoken.includes('$100'));
  // Math converted to spoken words without backslashes
  assert.ok(!spoken.includes('\\sin'));
  assert.ok(!spoken.includes('\\theta'));
  assert.ok(spoken.includes('sine') && spoken.includes('theta'));
});
