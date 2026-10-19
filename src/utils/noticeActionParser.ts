import { CollegeNotice } from '../types';
import { NoticeBreakdown, CalendarEventConfig } from '../types/noticeActions';

/**
 * Extracts explicit dates and deadlines from notice title and description
 */
export function extractDatesFromNotice(notice: CollegeNotice): {
  eventDate: string | null;
  deadline: string | null;
  isDateExplicit: boolean;
  notes?: string;
} {
  const fullText = `${notice?.title || ''} ${notice?.description || (notice as any)?.summary || ''} ${notice?.fullDetails || ''}`;

  // 1. Check for explicit deadline keywords like "last date: DD.MM.YYYY" or "registration closes DD/MM/YYYY"
  const deadlineMatch = fullText.match(/(?:last date|deadline|closes on|due by|submission by|before|apply by)[:\s]+(\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{4})/i);
  let deadline: string | null = null;
  if (deadlineMatch) {
    deadline = normalizeDate(deadlineMatch[1]);
  }

  // 2. Check for explicit event/review date in text like "on 24th July 2026" or "dated 30.09.2026"
  const explicitEventMatch = fullText.match(/(?:meeting on|held on|commencing on|exam on|conducted on|starts? on|dated?)\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+[0-9]{4})/i)
    || fullText.match(/(?:meeting on|held on|commencing on|exam on|conducted on)\s+(\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{4})/i);

  if (explicitEventMatch) {
    const parsed = normalizeDate(explicitEventMatch[1]);
    if (parsed) {
      return {
        eventDate: parsed,
        deadline,
        isDateExplicit: true,
        notes: `Extracted explicit date from notice text: "${explicitEventMatch[0]}"`
      };
    }
  }

  // 3. Check for month-year exam periods like "November / December 2026"
  const monthYearMatch = fullText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s*\/\s*(?:January|February|March|April|May|June|July|August|September|October|November|December))?\s+(202[4-9])/i);
  if (monthYearMatch) {
    return {
      eventDate: null,
      deadline,
      isDateExplicit: false,
      notes: `Notice refers to an exam/academic period: ${monthYearMatch[0]}. Exact individual paper schedule depends on batch timetable.`
    };
  }

  return {
    eventDate: null,
    deadline,
    isDateExplicit: false,
    notes: 'No specific event date is specified in the circular title. Publication date was ' + notice.date
  };
}

/**
 * Normalizes varied university date strings (DD.MM.YYYY, 24th July 2026, etc.) to YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/(st|nd|rd|th)/gi, '').trim();

  // Match DD.MM.YYYY or DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  // Try standard parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  return null;
}

/**
 * Generates local grounded breakdown and checklist when Gemini is offline or as instant preview
 */
export function generateLocalBreakdown(notice: CollegeNotice): NoticeBreakdown {
  const { eventDate, deadline, isDateExplicit, notes } = extractDatesFromNotice(notice);
  const title = notice?.title || '';
  const desc = notice?.description || (notice as any)?.summary || '';
  const titleLower = title.toLowerCase();
  const descLower = desc.toLowerCase();

  let targetAudience = 'All Sathyabama University Students';
  let actionRequired = 'Informational circular: verify your course/batch details.';
  const missingOrUncertainDetails: string[] = [];
  const checklistItems: string[] = [];

  // Determine audience and grounded actions based on verified content
  if (titleLower.includes('ph.d') || titleLower.includes('research') || titleLower.includes('supervisor')) {
    targetAudience = 'Ph.D. Research Scholars, Supervisors & Doctoral Candidates';
    if (titleLower.includes('admission')) {
      actionRequired = 'Submit online Ph.D. application for the upcoming session and download official circular.';
      checklistItems.push('Download and review official Ph.D. admission circular PDF');
      checklistItems.push('Verify eligibility criteria and required research entrance documents');
      checklistItems.push('Submit application before session registration closes');
    } else if (titleLower.includes('timetable') || titleLower.includes('exam')) {
      actionRequired = 'Check your registered course work subject codes and examination timings.';
      checklistItems.push('Download research methodology / course work timetable');
      checklistItems.push('Verify your candidate registration number in the published candidates list');
      checklistItems.push('Note down exam hall venue and reporting time');
    } else if (titleLower.includes('review meeting')) {
      actionRequired = 'Attend mandatory doctoral six-month progress review meeting.';
      checklistItems.push('Verify candidate name in published review meeting list');
      checklistItems.push('Prepare research progress report and presentation for DC committee');
    } else {
      checklistItems.push('Review research circular specifications');
      checklistItems.push('Contact Centre for Academic Research if queries arise');
    }
  } else if (titleLower.includes('cae') || titleLower.includes('continuous assessment')) {
    targetAudience = 'Undergraduate & Postgraduate Batches appearing for Continuous Assessment Exams';
    actionRequired = 'Download official CAE timetable for your batch and note subject exam dates.';
    checklistItems.push('Open the official CAE timetable PDF matching your specific batch years');
    checklistItems.push('Cross-verify theory course codes and internal examination slots');
    checklistItems.push('Ensure minimum mandatory 80% attendance is maintained for CAE eligibility');
  } else if (titleLower.includes('end semester') || titleLower.includes('ese') || titleLower.includes('arrear')) {
    targetAudience = 'Undergraduate and Postgraduate students registered for End Semester Examinations';
    actionRequired = 'Check theory and arrear examination timetables and verify hall-ticket clearance.';
    checklistItems.push('Download End Semester / Arrear examination schedule');
    checklistItems.push('Confirm course registration and arrear paper exam codes');
    checklistItems.push('Verify minimum 30% end-semester exam score requirement to pass (50% aggregate)');
  } else if (titleLower.includes('result')) {
    targetAudience = 'Candidates who appeared for recently concluded semester examinations';
    actionRequired = 'Access student ERP portal to verify results and check passing / reappear (RA) status.';
    checklistItems.push('Login to student portal to inspect published grades and SGPA');
    checklistItems.push('Verify any course with RA (Reappear) status for next semester exam registration');
    checklistItems.push('Check re-evaluation deadline if requesting paper re-totalling');
  } else if (notice.category === 'Academic Notices' || titleLower.includes('regulation') || titleLower.includes('attendance')) {
    targetAudience = 'Current SIST Undergraduates & Postgraduates';
    actionRequired = 'Review official university academic policies and credit guidelines.';
    checklistItems.push('Verify minimum 80% theory and 100% lab attendance requirement');
    checklistItems.push('Check condonation policy guidelines (60%-80% medical emergency criteria)');
  } else {
    checklistItems.push(`Read full announcement details from ${notice.department}`);
    checklistItems.push('Visit original official portal link for updates or contact department');
  }

  // Detect missing or unconfirmed details
  if (!isDateExplicit && !eventDate) {
    missingOrUncertainDetails.push('Exact examination session date/time for individual subjects is published inside the linked timetable PDF, not in this notice header.');
  }
  if (!deadline) {
    missingOrUncertainDetails.push('No explicit application/fee deadline date was stated in this announcement bulletin.');
  }
  if (!notice.location) {
    missingOrUncertainDetails.push('Specific hall/venue is not detailed in the notice summary; check department bulletin.');
  }

  return {
    announcement: desc || notice.title,
    targetAudience,
    actionRequired,
    explicitDeadline: deadline,
    missingOrUncertainDetails,
    checklistItems,
    eventDates: [
      {
        title: notice.title,
        date: eventDate,
        time: null,
        isExplicit: isDateExplicit,
        notes: notes || undefined
      }
    ],
    sourceUrl: notice.originalUrl || notice.sourceUrl || 'https://www.sathyabama.ac.in/',
    sourceWebsite: notice.sourceWebsite || 'Sathyabama Institute of Science and Technology',
    pdfUrl: notice.pdfUrl,
    verificationStatus: notice.verificationStatus || 'verified'
  };
}

/**
 * Generates an RFC 5545 compliant .ics calendar file content
 */
export function generateIcsContent(event: CalendarEventConfig): string {
  // Format dates: YYYYMMDD or YYYYMMDDTHHMMSSZ
  const formatDateForIcs = (dateStr: string, timeStr?: string): string => {
    const cleanDate = dateStr.replace(/-/g, '');
    if (!timeStr) {
      return cleanDate; // All-day: VALUE=DATE
    }
    const [h, m] = timeStr.split(':');
    const hh = (h || '09').padStart(2, '0');
    const mm = (m || '00').padStart(2, '0');
    return `${cleanDate}T${hh}${mm}00`;
  };

  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `campusmind-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sathyabama.ac.in`;

  const isAllDay = !event.startTime;
  const startProp = isAllDay
    ? `DTSTART;VALUE=DATE:${formatDateForIcs(event.startDate)}`
    : `DTSTART:${formatDateForIcs(event.startDate, event.startTime)}`;

  const endDate = event.endDate || event.startDate;
  const endProp = isAllDay
    ? `DTEND;VALUE=DATE:${formatDateForIcs(endDate)}`
    : `DTEND:${formatDateForIcs(endDate, event.endTime || event.startTime)}`;

  // Escape special chars in text
  const escapeText = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusMind AI//Sathyabama University Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    startProp,
    endProp,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description + (event.url ? `\\n\\nOfficial Link: ${event.url}` : ''))}`,
    event.location ? `LOCATION:${escapeText(event.location)}` : 'LOCATION:Sathyabama Institute of Science and Technology',
    'STATUS:CONFIRMED',
    'CATEGORIES:EDUCATION,EXAM,CAMPUS',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the generated .ics file
 */
export function downloadIcsFile(event: CalendarEventConfig, filename?: string) {
  const content = generateIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeFilename = (filename || event.title.slice(0, 30))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_') + '.ics';

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
