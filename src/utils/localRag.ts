import { CollegeDocument } from '../types/index.ts';

interface RagResult {
  found: boolean;
  answer: string;
  sourceDocTitle?: string;
  sourceDocId?: string;
  confidenceScore: number;
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'were',
  'weren\'t', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves', 'tell', 'give', 'know', 'please', 'college', 'student',
  'students', 'apex', 'sathyabama'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function searchCollegeDocuments(
  question: string,
  documents: CollegeDocument[]
): RagResult {
  const queryTokens = tokenize(question);

  if (queryTokens.length === 0) {
    return {
      found: false,
      answer: "Please enter a specific question about college notices, exam schedules, attendance policies, hackathons, or campus facilities.",
      confidenceScore: 0
    };
  }

  // Score each document
  interface ScoredDoc {
    doc: CollegeDocument;
    score: number;
    matchingSentences: { sentence: string; score: number }[];
  }

  const scoredDocs: ScoredDoc[] = documents.map((doc) => {
    let docScore = 0;
    const titleTokens = tokenize(doc.title);
    const tagTokens = doc.tags.flatMap((t) => tokenize(t));
    const contentText = doc.content;

    // Split content into sentences
    const sentences = contentText
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    // Score based on title & tag matches
    for (const token of queryTokens) {
      if (titleTokens.includes(token)) docScore += 8;
      if (tagTokens.includes(token)) docScore += 6;
      if (doc.category.toLowerCase().includes(token)) docScore += 4;
    }

    const scoredSentences: { sentence: string; score: number }[] = [];

    for (const sentence of sentences) {
      const sentenceTokens = tokenize(sentence);
      let sentScore = 0;

      for (const token of queryTokens) {
        if (sentenceTokens.includes(token)) {
          sentScore += 3;
        }
      }

      // Bonus for adjacent phrase matches
      const rawSentenceLower = sentence.toLowerCase();
      const rawQuestionLower = question.toLowerCase();

      // Check 2-word n-grams
      for (let i = 0; i < queryTokens.length - 1; i++) {
        const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
        if (rawSentenceLower.includes(bigram)) {
          sentScore += 7;
        }
      }

      // Specific domain keywords
      if (rawQuestionLower.includes('attendance') && (rawSentenceLower.includes('80%') || rawSentenceLower.includes('attendance') || rawSentenceLower.includes('100%'))) sentScore += 12;
      if ((rawQuestionLower.includes('passing') || rawQuestionLower.includes('pass') || rawQuestionLower.includes('grading') || rawQuestionLower.includes('cgpa') || rawQuestionLower.includes('reappear') || rawQuestionLower.includes('ra')) && (rawSentenceLower.includes('50%') || rawSentenceLower.includes('30%') || rawSentenceLower.includes('reappear') || rawSentenceLower.includes('letter grade') || rawSentenceLower.includes('end semester'))) sentScore += 12;
      if (rawQuestionLower.includes('hall ticket') && rawSentenceLower.includes('hall ticket')) sentScore += 10;
      if (rawQuestionLower.includes('hackathon') && rawSentenceLower.includes('innovatex')) sentScore += 10;
      if (rawQuestionLower.includes('curfew') && rawSentenceLower.includes('10:00 pm')) sentScore += 10;
      if (rawQuestionLower.includes('plagiarism') && rawSentenceLower.includes('15%')) sentScore += 10;
      if (rawQuestionLower.includes('clinic') || rawQuestionLower.includes('health') || rawQuestionLower.includes('doctor')) {
        if (rawSentenceLower.includes('clinic') || rawSentenceLower.includes('medical') || rawSentenceLower.includes('24/7')) sentScore += 10;
      }

      if (sentScore > 0) {
        scoredSentences.push({ sentence, score: sentScore });
      }
    }

    scoredSentences.sort((a, b) => b.score - a.score);

    const totalSentenceScore = scoredSentences.slice(0, 3).reduce((acc, curr) => acc + curr.score, 0);
    const combinedScore = docScore + totalSentenceScore;

    return {
      doc,
      score: combinedScore,
      matchingSentences: scoredSentences
    };
  });

  scoredDocs.sort((a, b) => b.score - a.score);

  const topMatch = scoredDocs[0];

  // Minimum relevance threshold to prevent hallucinated answers
  const CONFIDENCE_THRESHOLD = 8;

  if (!topMatch || topMatch.score < CONFIDENCE_THRESHOLD || topMatch.matchingSentences.length === 0) {
    return {
      found: false,
      answer: "Information could not be found in the current college documents or notices. Please check with the Dean's Office, Student Welfare, or Academic Registrar for official assistance.",
      confidenceScore: topMatch ? Math.round((topMatch.score / 30) * 100) : 0
    };
  }

  // Extract top 2-3 most relevant sentences
  const relevantSentences = topMatch.matchingSentences.slice(0, 3).map((s) => s.sentence);
  
  // Format neat, authoritative student answer
  let formattedAnswer = relevantSentences.join(' ');

  // Prefix summary if helpful
  const confidencePercentage = Math.min(99, Math.round((topMatch.score / (queryTokens.length * 9)) * 100));

  return {
    found: true,
    answer: formattedAnswer,
    sourceDocTitle: topMatch.doc.title,
    sourceDocId: topMatch.doc.id,
    confidenceScore: confidencePercentage
  };
}

/**
 * Retrieves the top relevant college documents/notices matching a query
 * Avoids dumping entire 200+ doc repository into Gemini context
 */
export function getRelevantCollegeDocuments(
  question: string,
  documents: CollegeDocument[],
  limit = 6
): CollegeDocument[] {
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) {
    return documents.slice(0, limit);
  }

  const scored = documents.map((doc) => {
    let score = 0;
    const titleTokens = tokenize(doc.title);
    const tagTokens = doc.tags.flatMap((t) => tokenize(t));
    const contentLower = doc.content.toLowerCase();
    const questionLower = question.toLowerCase();

    for (const token of queryTokens) {
      if (titleTokens.includes(token)) score += 10;
      if (tagTokens.includes(token)) score += 6;
      if (doc.category.toLowerCase().includes(token)) score += 4;
      if (contentLower.includes(token)) score += 2;
    }

    // Direct phrase matching
    for (let i = 0; i < queryTokens.length - 1; i++) {
      const phrase = `${queryTokens[i]} ${queryTokens[i + 1]}`;
      if (contentLower.includes(phrase)) score += 8;
    }

    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Take top scored documents, filtering out completely irrelevant ones if possible
  const positive = scored.filter((s) => s.score > 0);
  if (positive.length > 0) {
    return positive.slice(0, limit).map((s) => s.doc);
  }

  // Fallback to latest documents
  return documents.slice(0, limit);
}

