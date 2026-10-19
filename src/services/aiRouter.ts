import { CollegeDocument, QuestionCategory } from '../types/index.ts';

export type FollowUpIntent = 
  | 'simplify'
  | 'example'
  | 'formula'
  | 'practice_question'
  | 'quiz'
  | 'summarize'
  | 'none';

/**
 * Detects common follow-up learning actions from user requests
 */
export function detectFollowUpIntent(question: string): FollowUpIntent {
  const q = question.toLowerCase().trim();

  if (
    /explain(\s+it)?\s+(more\s+)?simpl(y|er)|in\s+simple\s+terms|eli5|dumb\s+it\s+down|make\s+it\s+simple|easier\s+to\s+understand/i.test(q)
  ) {
    return 'simplify';
  }

  if (
    /(show|give|provide)(\s+me)?\s+(another|one\s+more|a|different)\s+example|more\s+examples?|practical\s+example/i.test(q)
  ) {
    return 'example';
  }

  if (
    /explain(\s+the)?\s+formula|derive(\s+the)?\s+formula|what\s+do\s+the\s+variables\s+mean|mathematical\s+derivation/i.test(q)
  ) {
    return 'formula';
  }

  if (
    /(give|generate|create)(\s+me)?\s+(a\s+)?(numerical|practice)\s+(problem|question)|practice\s+problem|solve\s+one\s+more/i.test(q)
  ) {
    return 'practice_question';
  }

  if (
    /quiz\s+me|test\s+my\s+knowledge|ask\s+me\s+a\s+question|give\s+me\s+a\s+quiz/i.test(q)
  ) {
    return 'quiz';
  }

  if (
    /summarize(\s+this|\s+the\s+answer|\s+it)?|short\s+summary|tldr|key\s+takeaways|bullet\s+points\s+only/i.test(q)
  ) {
    return 'summarize';
  }

  return 'none';
}

/**
 * Intelligent question categorization for CampusMind AI
 */
export function detectQuestionCategory(
  question: string,
  history?: Array<{ role: 'user' | 'model'; text: string }>
): QuestionCategory {
  const q = question.toLowerCase().trim();

  // 1. Sathyabama University Specific keywords
  const sathyabamaKeywords = [
    'sathyabama', 'sist', 'jeppiaar', 'coe', 'controller of examinations',
    'chennai campus', 'sholinganallur', 'campus notice', 'official notice',
    'cae exam', 'cae timetable', 'cae 1', 'cae 2', 'end semester exam', 'ese exam',
    'attendance rule', '80% attendance', '75% attendance', 'arrear', 'reappear',
    'innovatex', 'academic calendar', 'dean', 'registrar', 'semester fee',
    'hostel mess', 'central library hours', 'night study', 'turnitin policy',
    'hall ticket', 'curriculum syllabus', 'placement cell', 'hackathon guidelines'
  ];

  if (sathyabamaKeywords.some((kw) => q.includes(kw))) {
    return 'sathyabama';
  }

  // Check if user is asking for "latest official notice" or "latest notice"
  if (
    /latest\s*(official\s*)?(academic\s*)?(college\s*|campus\s*)?notice/i.test(q) ||
    /recent\s*(campus\s*|college\s*|official\s*)?announcement/i.test(q) ||
    /university\s*circular/i.test(q)
  ) {
    return 'sathyabama';
  }

  // 2. Programming and Software Engineering
  const programmingPatterns = [
    /\b(pointer\s+(in\s+)?c|c\+\+|python|javascript|typescript|java\b|golang|rust\b|php\b|swift\b|kotlin\b)/i,
    /\b(linked\s+list|binary\s+tree|stack\b|queue\b|hash\s*map|heap\b|graph\s+algorithm|quicksort|mergesort|dijkstra|big\s*o)/i,
    /\b(async|await|promise|recursion|regex|sql\s+query|git\s+commit|memory\s+leak|segmentation\s+fault|null\s+pointer|debugging|code\s+snippet)/i,
    /\b(react\s+hook|component\s+lifecycle|api\s+endpoint|express\s+server|css\s+flexbox|html\s+tag)/i
  ];

  if (programmingPatterns.some((pattern) => pattern.test(q))) {
    return 'programming';
  }

  // 3. Academic & Scientific (Physics, Math, Chemistry, Biology, Hardware, Engineering)
  const academicPatterns = [
    /\b(refraction|reflection|snell'?s\s*law|diffraction|interference|optics|lens|prism|wavelength|light\s+speed)\b/i,
    /\b(quadratic\s+equation|calculus|derivative|integral|eigenvalue|matrix|determinant|differential\s+equation|trigonometry|pythagor)\b/i,
    /\b(ram\s+and\s+rom|rom\s+and\s+ram|cache\s+memory|cpu|alu|logic\s+gate|boolean\s+algebra|flip\s*flop|microprocessor)\b/i,
    /\b(thermodynamics|entropy|enthalpy|newton'?s\s*law|ohm'?s\s*law|kirchhoff|coulomb|faraday|semiconductor|diode|transistor)\b/i,
    /\b(photosynthesis|mitochondria|dna|rna|cellular|osmosis|periodic\s+table|chemical\s+reaction|molarity|atomic\s+structure)\b/i,
    /\b(step\s+by\s+step|solve|calculate|derive|formula\s+for|what\s+is\s+the\s+difference\s+between)\b/i
  ];

  if (academicPatterns.some((pattern) => pattern.test(q))) {
    return 'academic';
  }

  // 4. Current Time-Sensitive External queries
  const timeSensitivePatterns = [
    /\b(today'?s\s+weather|current\s+stock|live\s+score|who\s+won\s+yesterday|current\s+gold\s+rate|latest\s+news\s+today)\b/i
  ];

  if (timeSensitivePatterns.some((pattern) => pattern.test(q))) {
    return 'time_sensitive';
  }

  // 5. Follow-up intent checking from previous conversation
  if (Array.isArray(history) && history.length > 0) {
    const lastUserMsg = [...history].reverse().find((h) => h.role === 'user')?.text || '';
    const followUp = detectFollowUpIntent(q);

    // If this is a follow-up action ("explain more simply", "another example", "quiz me", etc.)
    if (followUp !== 'none' || q.length < 35) {
      const priorCategory = detectQuestionCategory(lastUserMsg, []);
      if (priorCategory !== 'general') {
        return priorCategory;
      }
    }

    if (sathyabamaKeywords.some((kw) => lastUserMsg.toLowerCase().includes(kw)) && 
        (q.length < 25 || q.includes('when') || q.includes('where') || q.includes('who') || q.includes('eligibility'))) {
      return 'sathyabama';
    }
  }

  return 'general';
}

/**
 * Builds context-aware system instruction and documents context based on question type
 */
export function buildChatSystemInstruction(
  category: QuestionCategory,
  relevantDocs: CollegeDocument[] = [],
  includeCampusContext = false,
  followUpIntent: FollowUpIntent = 'none'
): string {
  if (category === 'sathyabama' || includeCampusContext) {
    const docsContext = relevantDocs.map((d, index) => 
      `[OFFICIAL CAMPUS DOCUMENT ${index + 1}]\nTitle: ${d.title}\nCategory: ${d.category}\nDepartment: ${d.department}\nContent:\n${d.content}`
    ).join('\n\n---\n\n');

    return `You are CampusMind AI, the official university assistant for Sathyabama Institute of Science and Technology.
The user is asking a university-specific question. Below is the verified institutional repository of relevant official campus notices and documents:

${docsContext || '(No directly matching campus documents stored)'}

CRITICAL RULES FOR SATHYABAMA INQUIRIES:
1. Grounding & Verified Facts: Answer using ONLY information found in the official documents above.
2. Official Source Citation: When citing official notices, rules, exam dates, or policies, explicitly append:
   "Source: [Exact Document or Notice Title]"
3. Missing Campus Information: If the specific university inquiry is NOT mentioned in the provided documents above, state clearly:
   "Official information on this specific topic could not be found in the current Sathyabama campus notices repository. Please check with the Controller of Examinations (COE), Dean's Office, or Academic Registrar for official assistance."
   Do NOT invent, assume, or fabricate any college dates, fees, rules, or passing policies.
4. Distinguish Dates: Clearly differentiate publication dates from actual exam or event deadlines.
5. Conversation Continuity: Take prior conversation messages into account when answering follow-up questions.`;
  }

  if (category === 'academic') {
    let extraFollowUpGuidance = '';
    if (followUpIntent === 'simplify') {
      extraFollowUpGuidance = `\nFOLLOW-UP REQUEST DETECTED: The student wants this concept explained MORE SIMPLY.
- Use plain, friendly language suitable for a beginner.
- Use an intuitive everyday analogy (e.g. driving a car onto sand, baking a cake).
- Avoid unnecessary mathematical jargon. Focus on core intuition.`;
    } else if (followUpIntent === 'example') {
      extraFollowUpGuidance = `\nFOLLOW-UP REQUEST DETECTED: The student asked for ANOTHER WORKED EXAMPLE.
- Provide a fresh, distinct real-world or numerical example.
- Walk through the problem step-by-step with clear calculations.`;
    } else if (followUpIntent === 'formula') {
      extraFollowUpGuidance = `\nFOLLOW-UP REQUEST DETECTED: The student asked for the FORMULA EXPLANATION.
- State the formula prominently.
- Define each variable with its SI unit and physical meaning.
- Explain the physical intuition behind why each term appears in the equation.`;
    } else if (followUpIntent === 'practice_question' || followUpIntent === 'quiz') {
      extraFollowUpGuidance = `\nFOLLOW-UP REQUEST DETECTED: The student asked for a PRACTICE QUESTION OR QUIZ.
- Formulate a clean, concept-reinforcing question or numerical problem.
- Provide 4 multiple-choice options (A, B, C, D) or a short challenge.
- Include a spoiler/solution section explaining the correct answer step-by-step.`;
    } else if (followUpIntent === 'summarize') {
      extraFollowUpGuidance = `\nFOLLOW-UP REQUEST DETECTED: The student asked for a SUMMARY.
- Provide 3 to 4 concise bullet points summarizing the core takeaway and formula.`;
    }

    return `You are CampusMind AI, an expert academic and engineering learning mentor for university students.
The student is asking an academic or scientific concept question across physics, mathematics, chemistry, biology, or engineering.

PEDAGOGICAL TEACHING STRUCTURE:
1. Clear Definition: Define the core concept clearly and intuitively (tailored for undergraduate engineering students).
2. Underlying Principle: Explain WHY and HOW the phenomenon occurs (e.g., changes in wave speed across refractive boundaries, energy conservation, force vectors).
3. Mathematical Notation & Formulas:
   - For standalone or multi-line display equations, ALWAYS use standard display math delimiters:
     $$...$$ or \\[ ... \\]
   - For inline variables, short expressions, and symbols within sentences, use inline math delimiters:
     $x^2$, $\\theta_1$, or \\( ... \\).
   - Write standard LaTeX syntax:
     - Summation: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
     - Derivatives: $$\\frac{d}{dx}(x^2) = 2x$$, $$\\frac{\\partial f}{\\partial x}$$
     - Integrals: $$\\int_{a}^{b} f(x) dx$$
     - Optics/Physics: $$n_1\\sin\\theta_1 = n_2\\sin\\theta_2$$
     - Powers & Roots: $$x^2$$, $$\\sqrt{x}$$, $$\\sqrt[n]{x}$$
     - Fractions: $$\\frac{a}{b}$$
     - Greek letters: $$\\alpha, \\beta, \\theta, \\lambda, \\pi, \\Delta, \\Sigma$$
     - Limits: $$\\lim_{x\\to 0} \\frac{\\sin x}{x} = 1$$
     - Matrices & Systems: use \\begin{pmatrix} ... \\end{pmatrix} or \\begin{aligned} ... \\end{aligned} inside display math.
   - Never strip backslashes or omit braces. Preserve full LaTeX mathematical notation.
   - Always define every variable and specify standard SI units.
4. Step-by-Step Worked Example: Provide a practical worked calculation or realistic application showing step-by-step resolution with clear equations.
5. Practical Applications & Analogies: Connect the concept to modern technology or everyday life (e.g., fiber optic cables, eyeglasses, anti-reflective coatings).
6. Summary Takeaway: Provide a 1-sentence memorable takeaway of the core idea.
7. Anti-Slop: Do NOT mention "campus documents" or "not found in notices". This is a general academic question. Answer it fully, rigorously, and encouragingly.${extraFollowUpGuidance}`;
  }

  if (category === 'programming') {
    let extraFollowUpGuidance = '';
    if (followUpIntent === 'simplify') {
      extraFollowUpGuidance = `\nFOLLOW-UP: Simplify the code and explanation using an intuitive analogy (e.g. pointer as a house address, stack as a pile of plates).`;
    } else if (followUpIntent === 'example') {
      extraFollowUpGuidance = `\nFOLLOW-UP: Provide another clean code example demonstrating a different practical use case.`;
    } else if (followUpIntent === 'practice_question' || followUpIntent === 'quiz') {
      extraFollowUpGuidance = `\nFOLLOW-UP: Provide a short code output challenge or debugging exercise with answer and explanation.`;
    }

    return `You are CampusMind AI, an expert computer science and software engineering mentor for university students.
The student is asking a programming, algorithms, debugging, or computer science architecture question.

GUIDELINES FOR PROGRAMMING ANSWERS:
1. Core Concept & Mental Model: Clearly explain how the mechanism works (including memory layout, stack vs heap, pointer addresses, time/space complexity where applicable).
2. Clean Code Example: Provide clean, well-commented, idiomatic code in the target programming language.
3. Step-by-Step Execution: Walk through what each line or operator accomplishes.
4. Common Traps & Pitfalls: Point out typical beginner pitfalls (e.g., null pointers, dangling pointers, memory leaks, off-by-one errors) and how to avoid them.
5. Anti-Slop: Do NOT mention "not found in college notices". Answer programming inquiries comprehensively.${extraFollowUpGuidance}`;
  }

  if (category === 'time_sensitive') {
    return `You are CampusMind AI, an intelligent university assistant.
The user is asking a time-sensitive, live, or current events question.
1. State clearly what is known vs. what requires real-time live verification.
2. Clearly explain if real-time web browsing is not directly integrated and guide the student to official live sources.
3. Do not fabricate current stock prices, live scores, or unverified announcements.`;
  }

  // General Knowledge & Reasoning
  let extraFollowUpGuidance = '';
  if (followUpIntent === 'simplify') {
    extraFollowUpGuidance = `\nFOLLOW-UP: Explain this in simpler terms with a clear analogy.`;
  } else if (followUpIntent === 'summarize') {
    extraFollowUpGuidance = `\nFOLLOW-UP: Provide a concise executive summary in 3 bullet points.`;
  }

  return `You are CampusMind AI, an intelligent, general-purpose university learning and productivity assistant for students.
The student is asking a general knowledge, history, technology, reasoning, writing, or everyday question.

GUIDELINES:
1. Provide a comprehensive, accurate, well-structured, and helpful answer.
2. When comparing concepts (e.g., RAM vs ROM), provide clear points of distinction (volatility, speed, capacity, data retention, read/write operation, and use case).
3. Use markdown headings, tables, and bullet points for readability.
4. DO NOT say "Information could not be found in college documents". Answer general questions fully using your general intelligence.${extraFollowUpGuidance}`;
}
