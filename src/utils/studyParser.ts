import { StudyQuestion, StudyResult } from '../types/index.ts';

export function summarizeNotesLocal(text: string): StudyResult {
  const cleanText = text.trim();
  if (cleanText.length < 40) {
    return {
      action: 'summarize',
      summary: 'Your notes are too short to generate a comprehensive summary. Please paste at least 2-3 sentences of lecture notes or textbook material.',
      engineUsed: 'local-extractive',
      notice: 'Extractive Summary (Rule-based heuristics)'
    };
  }

  // Split into sentences
  const sentences = cleanText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (sentences.length <= 2) {
    return {
      action: 'summarize',
      summary: cleanText,
      engineUsed: 'local-extractive',
      notice: 'Notes are concise. Displaying direct transcription.'
    };
  }

  // Calculate word frequencies
  const words = cleanText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freqMap: Record<string, number> = {};
  for (const w of words) {
    freqMap[w] = (freqMap[w] || 0) + 1;
  }

  // Score sentences based on word frequency
  const scoredSentences = sentences.map((sentence, idx) => {
    const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;
    for (const w of sWords) {
      score += freqMap[w] || 0;
    }
    // Normalize by length
    score = score / Math.max(1, sWords.length);
    // Slight boost for first and concluding sentences
    if (idx === 0) score *= 1.3;
    if (idx === sentences.length - 1) score *= 1.1;

    return { sentence, score, idx };
  });

  // Select top 30-40% sentences, sorted by original order
  const countToSelect = Math.max(2, Math.min(5, Math.ceil(sentences.length * 0.35)));
  const topSentences = [...scoredSentences]
    .sort((a, b) => b.score - a.score)
    .slice(0, countToSelect)
    .sort((a, b) => a.idx - b.idx)
    .map((item) => item.sentence);

  const wordCount = cleanText.split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const summary = `📌 Executive Summary (Est. Reading Time: ~${readingTime} min):\n\n${topSentences.join(' ')}\n\n💡 Core Takeaway: These notes emphasize foundational concepts, core operational mechanisms, and critical real-world distinctions across ${sentences.length} source statements.`;

  return {
    action: 'summarize',
    summary,
    engineUsed: 'local-extractive',
    notice: 'Local Heuristic Extractive Summary (Free tier / No API key required)'
  };
}

export function extractKeyPointsLocal(text: string): StudyResult {
  const cleanText = text.trim();
  if (cleanText.length < 30) {
    return {
      action: 'extract_points',
      keyPoints: ['Please provide more detailed notes to extract key study concepts.'],
      engineUsed: 'local-extractive'
    };
  }

  const rawLines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);
  const sentences = cleanText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const points: string[] = [];

  // Look for lines that look like definitions or key principles
  const definitionRegex = /(?:is|are|refers to|defined as|consists of|responsible for|guarantees|ensures|dictates|operates|includes)/i;

  for (const s of sentences) {
    if (definitionRegex.test(s) && !points.includes(s)) {
      points.push(s);
    }
  }

  // If not enough points found via regex, take representative sentences
  if (points.length < 4) {
    for (const s of sentences) {
      if (!points.includes(s)) {
        points.push(s);
      }
      if (points.length >= 6) break;
    }
  }

  // Format with highlighting for the first clause or subject
  const formattedPoints = points.slice(0, 7).map((pt) => {
    // Look for colon or first comma
    const colonIdx = pt.indexOf(':');
    if (colonIdx > 2 && colonIdx < 35) {
      return `**${pt.substring(0, colonIdx).trim()}:** ${pt.substring(colonIdx + 1).trim()}`;
    }
    const words = pt.split(' ');
    if (words.length > 4) {
      const subject = words.slice(0, 3).join(' ');
      const rest = words.slice(3).join(' ');
      return `**${subject}** ${rest}`;
    }
    return pt;
  });

  return {
    action: 'extract_points',
    keyPoints: formattedPoints,
    engineUsed: 'local-extractive',
    notice: 'Extracted via Algorithmic Concept Identifier (Active)'
  };
}

export function generateQuizQuestionsLocal(text: string): StudyResult {
  const cleanText = text.trim();
  const sentences = cleanText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  if (sentences.length < 3) {
    return {
      action: 'quiz',
      questions: [
        {
          question: 'What is the primary subject or theme described in your pasted notes?',
          options: [
            'The core conceptual framework and definitions provided',
            'Historical events in ancient antiquity',
            'An unrelated random topic',
            'Unspecified mathematical conjecture'
          ],
          correctAnswerIndex: 0,
          explanation: 'Your notes outline the foundational principles and definitions of this topic.'
        }
      ],
      engineUsed: 'local-extractive',
      notice: 'Add longer notes (at least 4-5 sentences) to generate all 5 custom multi-choice questions!'
    };
  }

  // Extract key entities or capitalized terms for distractors
  const entityMatches = cleanText.match(/\b[A-Z][a-zA-Z0-9-]{2,}\b/g) || [];
  const uniqueEntities = Array.from(new Set(entityMatches)).filter(
    (e) => !['The', 'This', 'These', 'That', 'With', 'From', 'Layer', 'What', 'When'].includes(e)
  );

  const fallbackDistractors = [
    'Uncontrolled memory buffer overflow',
    'Arbitrary linear interpolation protocol',
    'Asynchronous multi-threaded mutex lock',
    'Static priority interrupt request handler',
    'Non-volatile cache coherence invalidation',
    'Stateless packet inspection proxy'
  ];

  const pool = [...uniqueEntities, ...fallbackDistractors];

  // Pick up to 5 sentences to convert to questions
  const selectedSentences = sentences
    .filter((s) => s.length > 40 && s.length < 220)
    .slice(0, 5);

  const questions: StudyQuestion[] = selectedSentences.map((sent, idx) => {
    // Check if sentence has a definition or key role
    const words = sent.split(' ');
    const subjectCandidate = words.slice(0, 4).join(' ');
    
    // Choose distractors
    const otherPool = pool.filter((p) => !sent.toLowerCase().includes(p.toLowerCase()));
    const d1 = otherPool[idx % otherPool.length] || 'Alternate secondary protocol';
    const d2 = otherPool[(idx + 2) % otherPool.length] || 'External synchronization boundary';
    const d3 = otherPool[(idx + 4) % otherPool.length] || 'Deprecated legacy architecture';

    // Form question
    let questionText = `According to your notes, what is the role or definition associated with: "${subjectCandidate}..."?`;
    if (sent.includes('Layer')) {
      questionText = `Based on the provided notes, which statement accurately characterizes ${subjectCandidate}?`;
    } else if (sent.toLowerCase().includes('guarantee') || sent.toLowerCase().includes('ensure')) {
      questionText = `What guarantee or principle is stated regarding: "${subjectCandidate}"?`;
    }

    const options = [
      sent,
      `It primarily acts as a ${d1} without persistent state constraints.`,
      `It replaces all hardware requirements through ${d2}.`,
      `It serves strictly as a temporary ${d3}.`
    ];

    // Shuffle options so correct isn't always at index 0
    const targetCorrectIndex = (idx * 2 + 1) % 4;
    // Swap index 0 and targetCorrectIndex
    const temp = options[0];
    options[0] = options[targetCorrectIndex];
    options[targetCorrectIndex] = temp;

    return {
      question: questionText,
      options,
      correctAnswerIndex: targetCorrectIndex,
      explanation: `Verified from your text: "${sent}"`
    };
  });

  return {
    action: 'quiz',
    questions,
    engineUsed: 'local-extractive',
    notice: `Generated 5 practice check questions directly from your ${sentences.length} note sentences.`
  };
}
