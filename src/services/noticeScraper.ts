import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import { AggregatedNotice, MonitoredSource, NoticeCategory, VerificationStatus } from '../types/noticeAggregator.ts';

export const OFFICIAL_SOURCES: Omit<MonitoredSource, 'noticeCount' | 'status' | 'lastChecked' | 'lastSuccess'>[] = [
  {
    id: 'sathyabama_home',
    name: 'Sathyabama Official Portal (Home & News)',
    url: 'https://www.sathyabama.ac.in/',
    description: 'Official university portal homepage, latest news updates, exam result bulletins, and institutional rankings.'
  },
  {
    id: 'sathyabama_research',
    name: 'Sathyabama Research Announcements',
    url: 'https://www.sathyabama.ac.in/research/announcements',
    description: 'Centre for Academic Research circulars, Ph.D. admissions, course work timetables, supervisor lists, and scholar review notices.'
  },
  {
    id: 'sathyabama_timetable',
    name: 'Sathyabama Examination Timetables',
    url: 'https://www.sathyabama.ac.in/academics/time_table',
    description: 'Controller of Examinations portal publishing theory, practical, and arrear examination timetables.'
  },
  {
    id: 'sathyabama_curriculum',
    name: 'Sathyabama Curriculum & Academic Regulations',
    url: 'https://www.sathyabama.ac.in/academics/curriculum-syllabus',
    description: 'Official academic regulations, university curriculum frameworks, credit systems, and syllabi.'
  },
  {
    id: 'sist_notification',
    name: 'SIST Official Notification Directory',
    url: 'https://sist.sathyabama.ac.in/website/Notification/',
    description: 'Direct university server directory hosting Continuous Assessment Exam (CAE) timetables and official circular PDFs.'
  },
  {
    id: 'sathyabama_examinations',
    name: 'Sathyabama Academic Regulations & Examinations',
    url: 'https://www.sathyabama.ac.in/academics/examinations',
    description: 'Office of Controller of Examinations portal publishing undergraduate and postgraduate examination regulations and evaluation frameworks.'
  },
  {
    id: 'sathyabama_academic_calendar',
    name: 'Sathyabama Student Academic Calendar',
    url: 'https://www.sathyabama.ac.in/student/academic-calendar',
    description: 'University Academic Affairs calendar portal publishing semester schedules, instructional day counts, and academic session notices.'
  }
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (CampusMind-Aggregator/2.0)';

/**
 * Generates a stable content hash for deduplication
 */
export function generateContentHash(canonicalUrl: string, title: string): string {
  const normUrl = canonicalUrl.toLowerCase().trim().replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const normTitle = title.toLowerCase().trim().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(`${normUrl}::${normTitle}`).digest('hex').slice(0, 16);
}

/**
 * Categorizes a notice based on title and content keywords
 */
export function categorizeNotice(title: string, content: string = ''): NoticeCategory {
  const text = `${title} ${content}`.toLowerCase();

  if (/result|marksheet|grade sheet|declared|gpa|cgpa/i.test(text)) {
    return 'Results';
  }
  if (/time table|timetable|schedule|exam dates|exam slot/i.test(text)) {
    return 'Timetables';
  }
  if (/cae|ese|theory exam|practical exam|arrear exam|hall ticket|admit card|exam fee/i.test(text)) {
    return 'Examinations';
  }
  if (/admission|apply now|ph\.d programme|session|entrance exam|application for registration/i.test(text)) {
    return 'Admissions';
  }
  if (/research|supervisor|course work|synopsis|thesis|viva|fellowship|review meeting/i.test(text)) {
    return 'Research';
  }
  if (/hackathon|summit|techno summit|cultural|fest|workshop|seminar|conference|celebrat|webinar/i.test(text)) {
    return 'Events';
  }
  if (/placement|recruitment|recruiter|campus interview|career|offer|internship/i.test(text)) {
    return 'Placements';
  }
  if (/scholarship|merit award|stipend|financial assistance|grant/i.test(text)) {
    return 'Scholarships';
  }
  if (/curriculum|syllabus|regulation|attendance|condonation|credit|policy/i.test(text)) {
    return 'Academic Notices';
  }

  return 'General';
}

/**
 * Formats dates extracted from Indian university formats (DD.MM.YYYY, DD/MM/YYYY, etc.) to ISO YYYY-MM-DD
 */
export function parseDate(rawDateStr: string): string {
  if (!rawDateStr) return new Date().toISOString().slice(0, 10);

  // Match DD.MM.YYYY or DD/MM/YYYY
  const dmyMatch = rawDateStr.match(/(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match standard YYYY-MM-DD
  const ymdMatch = rawDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return ymdMatch[0];
  }

  // Match textual dates like "July 16, 2026" or "14.08.2026"
  const parsed = Date.parse(rawDateStr);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetch HTML with a strict timeout, user agent, and exponential retry logic
 */
async function fetchHtml(url: string, timeoutMs = 15000, maxRetries = 2): Promise<{ html: string; status: number }> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const html = await res.text();
      return { html, status: res.status };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        // Exponential backoff: 500ms, 1000ms
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}

/**
 * Scraper for Source 1: https://www.sathyabama.ac.in/
 */
async function scrapeHomepage(): Promise<AggregatedNotice[]> {
  const sourceUrl = 'https://www.sathyabama.ac.in/';
  const { html } = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const notices: AggregatedNotice[] = [];
  const seenTitles = new Set<string>();

  // Parse view-latest-news and ticker items
  $('.views-field-title').each((_, el) => {
    let title = $(el).text().trim();
    if (!title || title.length < 5) return;
    if (['News Update', 'Latest News', 'CAMPUS NEWS', 'Read More'].includes(title)) return;

    // Clean repetitive prefix if any
    title = title.replace(/^CAMPUS NEWS\s*/i, '').replace(/\s*Read More$/i, '').trim();
    if (seenTitles.has(title.toLowerCase())) return;
    seenTitles.add(title.toLowerCase());

    const aTag = $(el).find('a').length ? $(el).find('a') : $(el).parent().find('a');
    const href = aTag.attr('href') || '';
    const fullUrl = href ? new URL(href, sourceUrl).toString() : sourceUrl;

    const dateText = $(el).parent().find('.views-field-field-news-posted-date').text().trim();
    const pubDate = parseDate(dateText);

    const category = categorizeNotice(title);
    const hash = generateContentHash(fullUrl, title);
    const now = new Date().toISOString();

    const isPdf = fullUrl.toLowerCase().endsWith('.pdf');

    notices.push({
      id: `notice-${hash}`,
      title,
      publicationDate: pubDate,
      category,
      summary: `Official announcement published on the Sathyabama Institute of Science and Technology portal regarding ${title}.`,
      originalUrl: fullUrl,
      sourceWebsite: 'Sathyabama Official Portal (Home & News)',
      sourceId: 'sathyabama_home',
      sourceUrl,
      firstDiscovered: now,
      lastVerified: now,
      verificationStatus: 'verified',
      pdfUrl: isPdf ? fullUrl : undefined,
      contentHash: hash,
      priority: category === 'Examinations' || category === 'Results' ? 'urgent' : 'important',
      department: category === 'Results' ? 'Controller of Examinations' : 'Office of University Communications',
      isOfficial: true
    });
  });

  return notices;
}

/**
 * Scraper for Source 2: https://www.sathyabama.ac.in/research/announcements
 */
async function scrapeResearchAnnouncements(): Promise<AggregatedNotice[]> {
  const sourceUrl = 'https://www.sathyabama.ac.in/research/announcements';
  const { html } = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const notices: AggregatedNotice[] = [];

  $('h4').each((_, el) => {
    const rawTitle = $(el).text().trim();
    if (!rawTitle || rawTitle.length < 8) return;

    // Check if it's an announcement (contains Ph.D, Date, Registration, etc.)
    const dateMatch = rawTitle.match(/\(Date:\s*([^\)]+)\)/i);
    let pubDate = new Date().toISOString().slice(0, 10);
    let cleanTitle = rawTitle;

    if (dateMatch) {
      pubDate = parseDate(dateMatch[1]);
      cleanTitle = rawTitle.replace(/\(Date:\s*[^\)]+\)/i, '').trim();
    }

    const parent = $(el).parent();
    const aTag = $(el).find('a').length 
      ? $(el).find('a') 
      : parent.find('a').length 
      ? parent.find('a') 
      : $(el).next().find('a');

    const href = aTag.attr('href') || '';
    const fullUrl = href ? new URL(href, sourceUrl).toString() : sourceUrl;
    const isPdf = fullUrl.toLowerCase().includes('.pdf');

    const category = categorizeNotice(cleanTitle, 'research');
    const hash = generateContentHash(fullUrl, cleanTitle);
    const now = new Date().toISOString();

    notices.push({
      id: `notice-${hash}`,
      title: cleanTitle,
      publicationDate: pubDate,
      category,
      summary: `Official notification from Centre for Academic Research, SIST: ${cleanTitle}.`,
      originalUrl: fullUrl,
      sourceWebsite: 'Sathyabama Research Announcements',
      sourceId: 'sathyabama_research',
      sourceUrl,
      firstDiscovered: now,
      lastVerified: now,
      verificationStatus: 'verified',
      pdfUrl: isPdf ? fullUrl : undefined,
      contentHash: hash,
      priority: cleanTitle.toLowerCase().includes('admissions') || cleanTitle.toLowerCase().includes('timetable') ? 'urgent' : 'important',
      department: 'Centre for Academic Research',
      isOfficial: true
    });
  });

  return notices;
}

/**
 * Scraper for Source 3: https://www.sathyabama.ac.in/academics/time_table
 */
async function scrapeTimeTable(): Promise<AggregatedNotice[]> {
  const sourceUrl = 'https://www.sathyabama.ac.in/academics/time_table';
  const { html } = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const notices: AggregatedNotice[] = [];

  const article = $('article');
  article.find('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || href.startsWith('mailto:') || href.includes('email-protection')) return;

    const linkText = $(el).text().trim();
    const parentText = $(el).parent().text().trim().replace(/\s+/g, ' ');

    let title = '';
    if (parentText.toLowerCase().includes('time table') || parentText.toLowerCase().includes('exam')) {
      title = parentText.replace(/click here/gi, '').replace(/\s*-\s*$/, '').trim();
    } else {
      title = linkText || 'Official Examination Time Table';
    }

    if (title.length < 6) return;

    const fullUrl = new URL(href, sourceUrl).toString();
    const isPdf = fullUrl.toLowerCase().includes('.pdf');

    // Extract any embedded date like "01.10.2026"
    const dateMatch = title.match(/(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/);
    const pubDate = dateMatch ? parseDate(dateMatch[1]) : '2026-10-01';

    const hash = generateContentHash(fullUrl, title);
    const now = new Date().toISOString();

    notices.push({
      id: `notice-${hash}`,
      title,
      publicationDate: pubDate,
      category: 'Timetables',
      summary: `End Semester and Arrear Examination Timetable released by Controller of Examinations, Sathyabama Institute of Science and Technology.`,
      originalUrl: fullUrl,
      sourceWebsite: 'Sathyabama Examination Timetables',
      sourceId: 'sathyabama_timetable',
      sourceUrl,
      firstDiscovered: now,
      lastVerified: now,
      verificationStatus: 'verified',
      pdfUrl: isPdf ? fullUrl : undefined,
      contentHash: hash,
      priority: 'urgent',
      department: 'Controller of Examinations',
      isOfficial: true
    });
  });

  return notices;
}

/**
 * Scraper for Source 4: https://www.sathyabama.ac.in/academics/curriculum-syllabus
 */
async function scrapeCurriculumSyllabus(): Promise<AggregatedNotice[]> {
  const sourceUrl = 'https://www.sathyabama.ac.in/academics/curriculum-syllabus';
  const { html } = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const notices: AggregatedNotice[] = [];

  // Scrape syllabus & regulations links
  $('article a, .field--name-body a, a[href*="syllabus"], a[href*="REGULATION"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || href.startsWith('mailto:') || href.includes('email-protection') || href.startsWith('#')) return;

    const text = $(el).text().trim();
    if (!text || text.length < 4) return;
    if (['Facebook', 'Twitter', 'Instagram', 'YouTube', 'Skip to main content'].includes(text)) return;

    const fullUrl = new URL(href, sourceUrl).toString();
    const isPdf = fullUrl.toLowerCase().includes('.pdf');
    const title = text.startsWith('Regulations') ? `Academic Regulations & Course Curriculum: ${text}` : text;

    const hash = generateContentHash(fullUrl, title);
    const now = new Date().toISOString();

    notices.push({
      id: `notice-${hash}`,
      title,
      publicationDate: '2026-08-01',
      category: 'Academic Notices',
      summary: `Official academic syllabus, curriculum structure, and university regulations portal document for Sathyabama students.`,
      originalUrl: fullUrl,
      sourceWebsite: 'Sathyabama Curriculum & Academic Regulations',
      sourceId: 'sathyabama_curriculum',
      sourceUrl,
      firstDiscovered: now,
      lastVerified: now,
      verificationStatus: 'verified',
      pdfUrl: isPdf ? fullUrl : undefined,
      contentHash: hash,
      priority: 'standard',
      department: 'Office of Academic Affairs & Registrar',
      isOfficial: true
    });
  });

  return notices;
}

/**
 * Scraper for Source 5: https://sist.sathyabama.ac.in/website/Notification/
 */
async function scrapeSistNotificationDirectory(): Promise<AggregatedNotice[]> {
  const sourceUrl = 'https://sist.sathyabama.ac.in/website/Notification/';
  const { html } = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const notices: AggregatedNotice[] = [];

  $('tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length >= 4) {
      const a = $(tds[1]).find('a');
      const href = a.attr('href');
      let filename = a.text().trim();
      const rawDate = $(tds[2]).text().trim();
      const size = $(tds[3]).text().trim();

      if (href && filename && filename !== 'Parent Directory') {
        const fullUrl = new URL(href, sourceUrl).toString();
        const isPdf = fullUrl.toLowerCase().endsWith('.pdf');

        // Clean up title for student readability
        let cleanTitle = filename.replace(/\.pdf$/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanTitle.toLowerCase().startsWith('cae')) {
          cleanTitle = `Continuous Assessment Examination: ${cleanTitle}`;
        }

        const pubDate = parseDate(rawDate);
        const category = categorizeNotice(cleanTitle, filename);
        const hash = generateContentHash(fullUrl, cleanTitle);
        const now = new Date().toISOString();

        notices.push({
          id: `notice-${hash}`,
          title: cleanTitle,
          publicationDate: pubDate,
          category,
          summary: `Official university server notification circular published under SIST directory: ${cleanTitle} (${size}).`,
          originalUrl: fullUrl,
          sourceWebsite: 'SIST Official Notification Directory',
          sourceId: 'sist_notification',
          sourceUrl,
          firstDiscovered: now,
          lastVerified: now,
          verificationStatus: 'verified',
          pdfUrl: isPdf ? fullUrl : undefined,
          contentHash: hash,
          priority: category === 'Examinations' || category === 'Timetables' ? 'urgent' : 'important',
          department: category === 'Events' ? 'Student Cultural Affairs' : 'Controller of Examinations',
          fileSize: size,
          isOfficial: true
        });
      }
    }
  });

  return notices;
}

/**
 * Scraper for Source 6: https://www.sathyabama.ac.in/academics/examinations
 */
async function scrapeExaminations(): Promise<AggregatedNotice[]> {
  const sourceUrl = 'https://www.sathyabama.ac.in/academics/examinations';
  const { html } = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const notices: AggregatedNotice[] = [];
  const seenTitles = new Set<string>();
  const now = new Date().toISOString();

  // 1. Scrape Academic Regulation PDFs (UG B.E./B.Tech, UG B.A./B.Sc, PG M.E./M.Tech)
  $('article a, .field--name-body a, a[href*="REGULATION"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    let text = $(el).text().trim().replace(/\s+/g, ' ');
    if (!href || href.startsWith('mailto:') || href.startsWith('#') || !text) return;
    if (['Facebook', 'Twitter', 'Instagram', 'YouTube', 'fb', 'twit', 'insta', 'youtube'].includes(text.toLowerCase())) return;

    if (href.toLowerCase().includes('.pdf') && (text.includes('UG') || text.includes('PG') || text.includes('REGULATION') || text.includes('B.E') || text.includes('M.E'))) {
      const fullUrl = new URL(href, sourceUrl).toString();
      const title = text.startsWith('Academic') ? text : `Academic Examination Regulations: ${text}`;
      if (seenTitles.has(title.toLowerCase())) return;
      seenTitles.add(title.toLowerCase());

      const hash = generateContentHash(fullUrl, title);
      notices.push({
        id: `notice-${hash}`,
        title,
        publicationDate: '2026-04-15',
        category: 'Examinations',
        summary: `Official examination regulations, course credit requirements, evaluation scheme, and degree passing criteria released by Controller of Examinations.`,
        originalUrl: fullUrl,
        sourceWebsite: 'Sathyabama Academic Regulations & Examinations',
        sourceId: 'sathyabama_examinations',
        sourceUrl,
        firstDiscovered: now,
        lastVerified: now,
        verificationStatus: 'verified',
        pdfUrl: fullUrl,
        contentHash: hash,
        priority: 'urgent',
        department: 'Controller of Examinations',
        isOfficial: true
      });
    }
  });

  // 2. Scrape End Semester Examination Results bulletins
  $('a[href*="results"], a[href*="result"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (!href || text.length < 5 || text.toLowerCase() === 'result') return;

    const fullUrl = new URL(href, sourceUrl).toString();
    const title = text;
    if (seenTitles.has(title.toLowerCase())) return;
    seenTitles.add(title.toLowerCase());

    const hash = generateContentHash(fullUrl, title);
    notices.push({
      id: `notice-${hash}`,
      title,
      publicationDate: '2026-05-20',
      category: 'Results',
      summary: `Official End Semester Examination Results notification bulletin published by the Controller of Examinations.`,
      originalUrl: fullUrl,
      sourceWebsite: 'Sathyabama Academic Regulations & Examinations',
      sourceId: 'sathyabama_examinations',
      sourceUrl,
      firstDiscovered: now,
      lastVerified: now,
      verificationStatus: 'verified',
      contentHash: hash,
      priority: 'urgent',
      department: 'Controller of Examinations',
      isOfficial: true
    });
  });

  // 3. Scrape UG Course Regulations core evaluation framework
  const bodyText = $('.field--name-body, article, .node__content').text();
  if (bodyText.includes('UG COURSE REGULATIONS') && !seenTitles.has('ug course regulations')) {
    seenTitles.add('ug course regulations');
    const title = 'Undergraduate Course Regulations & Examination Framework (Rule 1.1 - Structure of Programmes)';
    const hash = generateContentHash(sourceUrl, title);
    notices.push({
      id: `notice-${hash}`,
      title,
      publicationDate: '2026-08-01',
      category: 'Academic Notices',
      summary: `Official undergraduate curriculum structure, minimum credit requirements, continuous assessment scheme, and end semester examination eligibility rules.`,
      originalUrl: sourceUrl,
      sourceWebsite: 'Sathyabama Academic Regulations & Examinations',
      sourceId: 'sathyabama_examinations',
      sourceUrl,
      firstDiscovered: now,
      lastVerified: now,
      verificationStatus: 'verified',
      contentHash: hash,
      priority: 'important',
      department: 'Controller of Examinations & Academic Council',
      isOfficial: true
    });
  }

  return notices;
}

/**
 * Scraper for Source 7: https://www.sathyabama.ac.in/student/academic-calendar
 */
async function scrapeAcademicCalendar(): Promise<AggregatedNotice[]> {
  const sourceUrl = 'https://www.sathyabama.ac.in/student/academic-calendar';
  const { html } = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const notices: AggregatedNotice[] = [];
  const now = new Date().toISOString();

  // Scrape Academic Calendar notices
  const bodyText = $('.field--name-body, article, .node__content').text().replace(/\s+/g, ' ');
  const title = 'Undergraduate and Postgraduate Academic Calendar (All Regular Batches)';
  const hash = generateContentHash(sourceUrl, title);

  notices.push({
    id: `notice-${hash}`,
    title,
    publicationDate: '2026-08-10',
    category: 'Academic Notices',
    summary: bodyText.slice(0, 180) || `Official academic calendar for Undergraduate and Postgraduate courses across all regular batches published by Sathyabama Institute of Science and Technology.`,
    originalUrl: sourceUrl,
    sourceWebsite: 'Sathyabama Student Academic Calendar',
    sourceId: 'sathyabama_academic_calendar',
    sourceUrl,
    firstDiscovered: now,
    lastVerified: now,
    verificationStatus: 'verified',
    contentHash: hash,
    priority: 'important',
    department: 'Office of Academic Affairs & Registrar',
    isOfficial: true
  });

  // Check for any calendar PDF links
  $('article a, .field--name-body a, a[href*="calendar"], a[href*="schedule"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (href.toLowerCase().endsWith('.pdf') && text.length > 5) {
      const fullUrl = new URL(href, sourceUrl).toString();
      const pdfHash = generateContentHash(fullUrl, text);
      notices.push({
        id: `notice-${pdfHash}`,
        title: `Academic Calendar Schedule: ${text}`,
        publicationDate: '2026-08-10',
        category: 'Academic Notices',
        summary: `Official academic calendar document released by Registrar's office: ${text}.`,
        originalUrl: fullUrl,
        sourceWebsite: 'Sathyabama Student Academic Calendar',
        sourceId: 'sathyabama_academic_calendar',
        sourceUrl,
        firstDiscovered: now,
        lastVerified: now,
        verificationStatus: 'verified',
        pdfUrl: fullUrl,
        contentHash: pdfHash,
        priority: 'important',
        department: 'Office of Academic Affairs & Registrar',
        isOfficial: true
      });
    }
  });

  return notices;
}

/**
 * Aggregates notices across all 7 monitored official sources
 */
export async function collectAllOfficialNotices(): Promise<{
  notices: AggregatedNotice[];
  sourcesStatus: Record<string, { status: 'online' | 'error'; count: number; error?: string; httpStatus?: number }>;
}> {
  const results: AggregatedNotice[] = [];
  const sourcesStatus: Record<string, { status: 'online' | 'error'; count: number; error?: string; httpStatus?: number }> = {};

  const scrapers: Array<{
    id: string;
    fn: () => Promise<AggregatedNotice[]>;
  }> = [
    { id: 'sathyabama_home', fn: scrapeHomepage },
    { id: 'sathyabama_research', fn: scrapeResearchAnnouncements },
    { id: 'sathyabama_timetable', fn: scrapeTimeTable },
    { id: 'sathyabama_curriculum', fn: scrapeCurriculumSyllabus },
    { id: 'sist_notification', fn: scrapeSistNotificationDirectory },
    { id: 'sathyabama_examinations', fn: scrapeExaminations },
    { id: 'sathyabama_academic_calendar', fn: scrapeAcademicCalendar }
  ];

  for (const { id, fn } of scrapers) {
    try {
      console.log(`[Notice Aggregator] Fetching from source: ${id}...`);
      const items = await fn();
      results.push(...items);
      sourcesStatus[id] = {
        status: 'online',
        count: items.length,
        httpStatus: 200
      };
      console.log(`[Notice Aggregator] Successfully fetched ${items.length} notices from ${id}`);
    } catch (err: any) {
      console.error(`[Notice Aggregator] Failed to fetch source ${id}:`, err?.message || err);
      sourcesStatus[id] = {
        status: 'error',
        count: 0,
        error: err?.message || 'Network request failed',
        httpStatus: err?.status || 500
      };
    }

    // Polite delay between requests to avoid overloading official servers
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  return { notices: results, sourcesStatus };
}
