import { CollegeDocument, CollegeNotice, KnowledgeItem } from '../types/index.ts';

export const UNIFIED_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb-001',
    title: 'Academic Policy 2026: Grading System, CGPA Scale & Passing Requirements',
    date: '2026-10-18',
    category: 'Academic Policies',
    department: 'Office of Academic Registrar',
    priority: 'urgent',
    location: 'Administrative Block, Registrar Office',
    summary: 'A 10-point Letter Grade Scale (A++: 10, A+: 9, B++: 8, B+: 7, C: 6, RA: 0). Passing requirements: min 50% aggregate and 30% in End-Semester Exam.',
    tags: ['grading', 'cgpa', 'sgpa', 'passing requirements', 'ra', 'smta1101', 'shsb1101', 'sphb1104', 'regulations'],
    isDemonstration: true,
    content: `Academic Policy 2026: Grading System, CGPA Scale & Passing Requirements

Sathyabama Institute of Science and Technology - Academic Regulations (Updated Fall 2026)

1. Grading System & SGPA/CGPA:
A 10-point Letter Grade Scale is adopted:
- A++ (Outstanding): 10 points (90-100 marks)
- A+ (Excellent): 9 points (80-89 marks)
- B++ (Very Good): 8 points (70-79 marks)
- B+ (Good): 7 points (60-69 marks)
- C (Above Average): 6 points (50-59 marks)
-  RA(REAPPEAR):  0 points (0-49 marks)
- AAA(ABSENT): 0 points (0marks)
-W(Withdrawal): 0 points(0 marks)
-ABS(Authorised Break Of Study): 0 points(0 marks)

2. PASSING REQUIREMENTS:
* A candidate should secure not less than 50% of total marks prescribed for the courses, subject to securing a minimum of 30% marks out of maximum mark in end semester exams. Then he/she shall be declared to have passed in the examination.

Course 1:
Course Code: SMTA1101
Course Name: Matrices and Calculus
CAE /50:46
ESE/ 50: 14
TOTAL /100:60
RESULT: RA

Course 2:
Course Code: SHSB1101
Course Name:Technical English
CAE /50:14
ESE/ 50: 46
TOTAL /100: 60
RESULT:PASS

Course 3:
Course Code: SPHB1104
Course Name:Physics
CAE /50:10
ESE/ 50:35
TOTAL /100: 45
RESULT: RA
* If a candidate fails to secure a pass in a particular course, it is mandatory that he/she shall register for the examination in that course during the next semester when examination is conducted in that course. It is mandatory that he/she should continue to register and reappear for the examination till he/she secures a pass.`.trim()
  },
  {
    id: 'kb-001b',
    title: 'Academic Policy 2026: Grading System, CGPA Scale & Passing Requirements',
    date: '2026-10-18',
    category: 'Academic Policies',
    department: 'Office of Academic Registrar',
    priority: 'standard',
    location: 'Administrative Block, Registrar Office',
    summary: 'A 10-point Letter Grade Scale (A++: 10, A+: 9, B++: 8, B+: 7, C: 6, RA: 0). Passing requirements: min 50% aggregate and 30% in End-Semester Exam.',
    tags: ['grading', 'cgpa', 'sgpa', 'passing requirements', 'ra', 'smta1101', 'shsb1101', 'sphb1104', 'regulations'],
    isDemonstration: true,
    content: `Academic Policy 2026: Grading System, CGPA Scale & Passing Requirements

Sathyabama Institute of Science and Technology - Academic Regulations (Updated Fall 2026)

1. Grading System & SGPA/CGPA:
A 10-point Letter Grade Scale is adopted:
- A++ (Outstanding): 10 points (90-100 marks)
- A+ (Excellent): 9 points (80-89 marks)
- B++ (Very Good): 8 points (70-79 marks)
- B+ (Good): 7 points (60-69 marks)
- C (Above Average): 6 points (50-59 marks)
-  RA(REAPPEAR):  0 points (0-49 marks)
- AAA(ABSENT): 0 points (0marks)
-W(Withdrawal): 0 points(0 marks)
-ABS(Authorised Break Of Study): 0 points(0 marks)

2. PASSING REQUIREMENTS:
* A candidate should secure not less than 50% of total marks prescribed for the courses, subject to securing a minimum of 30% marks out of maximum mark in end semester exams. Then he/she shall be declared to have passed in the examination.

Course 1:
Course Code: SMTA1101
Course Name: Matrices and Calculus
CAE /50:46
ESE/ 50: 14
TOTAL /100:60
RESULT: RA

Course 2:
Course Code: SHSB1101
Course Name:Technical English
CAE /50:14
ESE/ 50: 46
TOTAL /100: 60
RESULT:PASS

Course 3:
Course Code: SPHB1104
Course Name:Physics
CAE /50:10
ESE/ 50:35
TOTAL /100: 45
RESULT: RA
* If a candidate fails to secure a pass in a particular course, it is mandatory that he/she shall register for the examination in that course during the next semester when examination is conducted in that course. It is mandatory that he/she should continue to register and reappear for the examination till he/she secures a pass.`.trim()
  },
  {
    id: 'kb-attendance',
    title: 'Acamdemic policy:Attendance',
    date: '2026-10-10',
    category: 'Academic Policies',
    department: 'Office of Academic Registrar',
    priority: 'urgent',
    location: 'Administrative Block, Registrar Office',
    summary: 'Students must maintain a mandatory minimum attendance of 80% in each individual theory and 100% in laboratory course to be eligible to appear for End-Semester Examinations.',
    tags: ['attendance', '80%', '100% lab', 'detention', 'condonation', 'exams', 'medical condonation', 'regulations'],
    isDemonstration: true,
    content: `Academic Policy 2026: Attendance

Sathyabama Institute of Science and Technology - Academic Regulations (Updated Fall 2026)

Minimum Attendance Requirement:
Students must maintain a mandatory minimum attendance of 80% in each individual theory and 100% in laboratory course to be eligible to appear for End-Semester Examinations. Students with attendance between 60% and 80% due to medical emergencies or approved university sports/hackathon representations may apply for medical condonation upon submitting valid medical certificates within 5 working days of resumption. Attendance below 60% will result in course repetition (detention in that subject).`.trim()
  },
  {
    id: 'kb-002',
    title: 'Notice REF/EXAM/2026-08: Fall Midterm Examination Schedule & Hall Tickets',
    date: '2026-10-14',
    category: 'Exam Schedules',
    department: 'Controller of Examinations (COE)',
    priority: 'urgent',
    location: 'Main Exam Halls (Blocks A & B)',
    summary: 'Midterm exams begin Monday, Nov 3, 2026. Digital hall tickets with QR verification available for download on student ERP from Oct 28.',
    tags: ['midterm', 'exam schedule', 'hall ticket', 'dates', 'timings', 'rules'],
    isDemonstration: true,
    content: `
Sathyabama Institute of Science and Technology - Controller of Examinations Notice

Sub: Fall Semester 2026 Midterm Examination Schedule

1. Examination Dates:
Midterm assessments will be conducted from Monday, November 3, 2026 to Saturday, November 8, 2026.
Session 1 (Morning): 09:30 AM to 11:30 AM (B.Tech 3rd and 4th Year)
Session 2 (Afternoon): 02:00 PM to 04:00 PM (B.Tech 1st and 2nd Year)

2. Hall Ticket Download:
Digital Hall Tickets with QR verification will be available for download on the student ERP portal from October 28, 2026. No physical hall tickets will be issued. Students must produce their University ID Card along with the printed hall ticket.

3. Calculators & Smart Devices:
Only non-programmable scientific calculators (FX-991MS / FX-82MS or equivalent) are allowed for designated quantitative courses. Smartwatches, Bluetooth earphones, and mobile devices are strictly forbidden inside examination halls and subject to disciplinary expulsion under Malpractice Code 4.
    `.trim()
  },
  {
    id: 'kb-003',
    title: 'InnovateX 2026: National 48-Hour Hackathon Guidelines & Registrations',
    date: '2026-10-12',
    category: 'Events & Hackathons',
    department: 'Innovation & Student Activities',
    priority: 'important',
    location: 'Dr. APJ Abdul Kalam Innovation Hub (Building B, Floor 3)',
    summary: 'Annual 48-hour hackathon scheduled for Nov 20-22, 2026. Teams of 2 to 4 members. $10,000 prize pool, zero registration fee. Free meals & high-speed Wi-Fi.',
    tags: ['hackathon', 'innovatex', 'prizes', 'registration', 'teams', 'dates', 'venue'],
    isDemonstration: true,
    content: `
Sathyabama Institute Annual Flagship Tech Event - InnovateX 2026

1. Event Overview & Schedule:
InnovateX is a 48-hour continuous national hackathon taking place from Friday, November 20, 2026 (04:00 PM) to Sunday, November 22, 2026 (05:00 PM) at the Dr. APJ Abdul Kalam Innovation Hub (Building B, Floor 3).

2. Eligibility & Team Size:
Undergraduate and graduate students from all accredited colleges are eligible. Teams must consist of 2 to 4 members. Multidisciplinary teams across engineering, design, and business are encouraged.

3. Registration Deadline & Fees:
Registration closes on November 10, 2026 at 11:59 PM. There is zero registration fee (free entry for all qualified short-listed teams). Meals, caffeine stations, and high-speed gigabit Wi-Fi are provided free of cost.

4. Themes & Prizes:
Tracks include: Generative AI & Automation, Sustainable Smart Cities, HealthTech & Assistive Devices, and Web3/Decentralized Computing. Total cash prize pool is $10,000 plus incubation credits and recruiter interview fast-tracks.
    `.trim()
  },
  {
    id: 'kb-004',
    title: 'Central Library & HPC Computing Center Facility Rules',
    date: '2026-10-05',
    category: 'Campus Facilities',
    department: 'University Library Committee',
    priority: 'standard',
    location: 'Central Library & Level 2 HPC Lab',
    summary: 'Starting Nov 1, the Exam Reading Room will be accessible 24/7 with student RFID badges. General book borrowing hours are 8:00 AM - 11:00 PM.',
    tags: ['library', 'hours', 'wifi', 'borrowing', 'fines', 'lab', 'hpc'],
    isDemonstration: true,
    content: `
Sathyabama Institute Central Library & Advanced Computing Facility Rules

1. Operational Hours:
- General Working Days: 08:00 AM to 11:00 PM
- Weekend & Public Holidays: 09:00 AM to 06:00 PM
- Exam Reading Room (Night Study Block): 24/7 access during exam months (November & December) with valid student RFID badges.

2. Book Borrowing Limits:
- Undergraduate Students: Up to 4 books for 14 days, renewable once online if no hold exists.
- Postgraduate & Research Scholars: Up to 8 books for 30 days.
- Overdue Fine: $0.50 per day per book after the due date.

3. High-Performance Computing (HPC) & GPU Lab:
Located on Level 2, Wing A. Access to NVIDIA A100 compute nodes requires submission of research advisor approval via the HPC Portal. Lab workstations are available for general coursework between 08:30 AM and 09:00 PM.
    `.trim()
  },
  {
    id: 'kb-005',
    title: 'Financial Aid Circular: Spring 2026 Merit Scholarships & Fee Deadlines',
    date: '2026-10-08',
    category: 'Deadlines',
    department: 'Financial Aid Office',
    priority: 'standard',
    location: 'Finance Wing (Building A, Room 104)',
    summary: 'First installment of Spring 2026 tuition due Dec 15, 2026 without late fee. Dean’s Merit Scholarship applications for CGPA 9.0+ close Nov 15.',
    tags: ['fees', 'scholarship', 'financial aid', 'deadlines', 'installment', 'late fee'],
    isDemonstration: true,
    content: `
Circular No. SIST/FIN/2026-44: Tuition & Merit Scholarship Notice

1. Spring 2026 Tuition Installment Schedule:
- First Installment (50%): Due by December 15, 2026 without late fee.
- Late payment window with $50 late charge: December 16 to December 23, 2026.
- Course registration will be placed on administrative hold after December 24, 2026 for unpaid balances.

2. Merit-Based Scholarships:
Students with CGPA 9.0 and above are eligible for the Dean's Merit Scholarship (30% tuition waiver). Applications must be submitted via the Financial Aid Portal before November 15, 2026, accompanied by the latest semester transcript.

3. Need-Based Emergency Grants:
Students experiencing sudden financial hardship or medical distress can request an Emergency Student Relief Grant of up to $1,000 by contacting studentwelfare@sathyabama.ac.in.
    `.trim()
  },
  {
    id: 'kb-006',
    title: 'Sathyabama Institute Residential Life & Student Safety Handbook',
    date: '2026-09-28',
    category: 'Campus Facilities',
    department: 'Directorate of Student Welfare',
    priority: 'standard',
    location: 'Campus Residences & Building E Clinic',
    summary: 'Hostel gates close at 10:00 PM weekdays / 10:30 PM weekends. University Health Clinic operates 24/7 with emergency helpline at +1 (800) 555-APEX.',
    tags: ['hostel', 'curfew', 'clinic', 'doctor', 'emergency', 'visitor', 'dining'],
    isDemonstration: true,
    content: `
Sathyabama Institute Residential Life & Student Safety Handbook

1. Hostel Curfew & Entry Timings:
Hostel resident gates close strictly at 10:00 PM on weekdays (Sunday to Thursday) and 10:30 PM on Friday and Saturday. Late entry requires pre-authorized digital leave approval (Outing Pass) through the Sathyabama Resident App approved by the Hostel Warden.

2. Campus Health & Wellness Clinic:
The University Medical Center (Building E) operates 24/7 with on-call physicians and registered nurses. Outpatient consultations are free for enrolled students. 
- General Physician hours: 09:00 AM - 05:00 PM daily.
- 24/7 Ambulance & Emergency Helpline: +1 (800) 555-APEX / Ext. 999.
- Free mental wellness and counseling sessions can be booked confidentially via counseling@sathyabama.ac.in.

3. Dining Hall Timings:
- Breakfast: 07:30 AM - 09:30 AM
- Lunch: 12:00 PM - 02:30 PM
- Evening Snacks & Coffee: 05:00 PM - 06:30 PM
- Dinner: 07:30 PM - 09:45 PM
    `.trim()
  },
  {
    id: 'kb-007',
    title: 'Academic Integrity & Plagiarism Standards Policy',
    date: '2026-09-15',
    category: 'Academic Policies',
    department: 'Dean of Academic Affairs',
    priority: 'standard',
    location: 'Academic Portal',
    summary: 'Turnitin similarity index must not exceed 15%. Direct, undisclosed copy-pasting of AI text into graded coursework is classified as academic misconduct.',
    tags: ['plagiarism', 'turnitin', 'academic integrity', 'assignments', 'penalties'],
    isDemonstration: true,
    content: `
Sathyabama Institute Academic Integrity Code

1. Plagiarism Thresholds:
All term papers, laboratory reports, and capstone theses must be submitted through the university Turnitin portal.
- Similarity index of 15% or below is acceptable (excluding cited references and standard bibliographies).
- Similarity between 16% and 25%: Assignment returned for revision with a mandatory 15% grade deduction.
- Similarity greater than 25%: Direct zero grade on assignment and formal referral to the Departmental Disciplinary Committee.

2. Generative AI Policy:
Students may use AI tools for brainstorming, grammar correction, and concept clarification. AI-generated text must be explicitly disclosed in the methodology section. Direct unacknowledged copy-pasting of AI outputs into submitted assignments constitutes plagiarism.
    `.trim()
  },
  {
    id: 'kb-008',
    title: 'Career Development & Fall Campus Placement Drive Schedule',
    date: '2026-10-15',
    category: 'Events & Hackathons',
    department: 'Placement Cell',
    priority: 'important',
    location: 'Building C Auditorium',
    summary: 'Final-year students with CGPA 6.5+ must submit verified resumes on the placement portal by Oct 25, 2026. Technical assessments start Nov 5.',
    tags: ['placement', 'jobs', 'internship', 'interview', 'resume', 'registration'],
    isDemonstration: true,
    content: `
Notice: Phase 1 Campus Recruitment Drive 2026-2027

1. Eligibility:
Final-year B.Tech, M.Tech, and MCA students with an aggregate CGPA of 6.5 or above and no active backlogs are eligible for Phase 1 campus drives.

2. Key Dates:
- Resume Portal Closes: October 25, 2026 (11:59 PM)
- Pre-Placement Talks (PPTs): October 27 - November 02, 2026
- Technical & Coding Assessments: November 05 - November 12, 2026
- On-Campus Personal Interviews: November 16 onwards in Building C Auditorium

3. Dress Code & Requirements:
Formal business attire is mandatory for all in-person interviews. Students must carry 3 printed copies of their verified resume and university ID badge.
    `.trim()
  }
];

// Helper converters for shared single source of truth
export function knowledgeItemToNotice(item: KnowledgeItem): CollegeNotice {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    category: item.category,
    description: item.summary,
    fullDetails: item.content,
    department: item.department,
    priority: item.priority,
    location: item.location,
    documentRefId: item.id,
    isDemonstration: item.isDemonstration,
    originalUrl: item.originalUrl,
    sourceWebsite: item.sourceWebsite,
    sourceUrl: item.sourceUrl,
    sourceId: item.sourceId,
    firstDiscovered: item.firstDiscovered,
    lastVerified: item.lastVerified,
    pdfUrl: item.pdfUrl,
    contentHash: item.contentHash,
    fileSize: item.fileSize,
    verificationStatus: item.verificationStatus,
    isOfficial: item.isOfficial !== undefined ? item.isOfficial : !item.isDemonstration
  };
}

export function aggregatedNoticeToNotice(an: import('../types/noticeAggregator').AggregatedNotice): CollegeNotice {
  return {
    id: an.id,
    title: an.title,
    date: an.publicationDate,
    category: an.category,
    description: an.summary,
    fullDetails: `${an.title}\n\nCategory: ${an.category}\nSource: ${an.sourceWebsite}\nPublished Date: ${an.publicationDate}\nOfficial Link: ${an.originalUrl}${an.pdfUrl ? `\nPDF Document: ${an.pdfUrl}` : ''}\nDepartment: ${an.department}\nVerification: ${an.verificationStatus.toUpperCase()}\n\nSummary:\n${an.summary}`,
    department: an.department,
    priority: an.priority,
    location: an.sourceWebsite,
    documentRefId: an.id,
    isDemonstration: false,
    originalUrl: an.originalUrl,
    sourceWebsite: an.sourceWebsite,
    sourceUrl: an.sourceUrl,
    sourceId: an.sourceId,
    firstDiscovered: an.firstDiscovered,
    lastVerified: an.lastVerified,
    verificationStatus: an.verificationStatus,
    pdfUrl: an.pdfUrl,
    contentHash: an.contentHash,
    fileSize: an.fileSize,
    isOfficial: true
  };
}

export function aggregatedNoticeToKnowledgeItem(an: import('../types/noticeAggregator').AggregatedNotice): KnowledgeItem {
  return {
    id: an.id,
    title: an.title,
    date: an.publicationDate,
    category: an.category,
    department: an.department,
    priority: an.priority,
    location: an.sourceWebsite,
    summary: an.summary,
    content: `${an.title}\n\nOfficial notice published by ${an.department} on ${an.sourceWebsite}.\nPublication Date: ${an.publicationDate}\nOfficial URL: ${an.originalUrl}\n${an.pdfUrl ? `Direct PDF Document: ${an.pdfUrl}\n` : ''}Verification Status: ${an.verificationStatus.toUpperCase()}\n\nDetails:\n${an.summary}`,
    tags: [an.category.toLowerCase(), an.sourceId, ...an.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)],
    isDemonstration: false,
    originalUrl: an.originalUrl,
    sourceWebsite: an.sourceWebsite,
    sourceUrl: an.sourceUrl,
    sourceId: an.sourceId,
    firstDiscovered: an.firstDiscovered,
    lastVerified: an.lastVerified,
    pdfUrl: an.pdfUrl,
    contentHash: an.contentHash,
    fileSize: an.fileSize,
    isOfficial: true,
    verificationStatus: an.verificationStatus
  };
}

export function knowledgeItemToDocument(item: KnowledgeItem): CollegeDocument {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    lastUpdated: item.date,
    department: item.department,
    content: item.content,
    tags: item.tags,
    isDemonstration: item.isDemonstration
  };
}

// Global cached derived datasets
export const SAMPLE_DOCUMENTS: CollegeDocument[] = UNIFIED_KNOWLEDGE_BASE.map(knowledgeItemToDocument);
export const SAMPLE_NOTICES: CollegeNotice[] = UNIFIED_KNOWLEDGE_BASE.map(knowledgeItemToNotice);

const STORAGE_KEY = 'campusmind_unified_knowledge_base_v4';

export function loadStoredKnowledgeBase(): KnowledgeItem[] {
  if (typeof window === 'undefined') return UNIFIED_KNOWLEDGE_BASE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('campusmind_unified_knowledge_base_v3') || localStorage.getItem('campusmind_unified_knowledge_base_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default records receive the latest official text
        const defaultMap = new Map(UNIFIED_KNOWLEDGE_BASE.map(item => [item.id, item]));
        const updatedItems = parsed.map((item: KnowledgeItem) => {
          if (item.id === 'kb-001' || item.id === 'kb-001b' || item.id === 'kb-attendance') {
            return defaultMap.get(item.id) || item;
          }
          return item;
        });
        // Ensure kb-attendance exists
        if (!updatedItems.some(i => i.id === 'kb-attendance')) {
          const att = defaultMap.get('kb-attendance');
          if (att) updatedItems.push(att);
        }
        return updatedItems;
      }
    }
  } catch (err) {
    console.warn('Failed to load knowledge base from localStorage:', err);
  }
  return UNIFIED_KNOWLEDGE_BASE;
}

export function saveStoredKnowledgeBase(items: KnowledgeItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to persist knowledge base to localStorage:', err);
  }
}

export const SAMPLE_STUDY_NOTES = [
  {
    title: 'Computer Networks: The 7 OSI Layers',
    topic: 'Computer Science',
    content: `The Open Systems Interconnection (OSI) reference model characterizes computing and telecommunication functions into seven logical abstraction layers.
Layer 1 is the Physical Layer, transmitting raw unstructured bit streams over physical media such as fiber optics, copper cables, and radio frequencies.
Layer 2 is the Data Link Layer, responsible for node-to-node data transfer, error detection, framing, and Media Access Control (MAC) addressing. Key protocols include Ethernet (802.3) and Wi-Fi (802.11).
Layer 3 is the Network Layer, handling logical host addressing (IPv4 and IPv6) and routing packets across heterogeneous networks using protocols like OSPF, BGP, and ICMP. Routers operate primarily at Layer 3.
Layer 4 is the Transport Layer, providing end-to-end communication reliability, flow control, and multiplexing using port numbers. Transmission Control Protocol (TCP) guarantees reliable, connection-oriented delivery with three-way handshaking, whereas User Datagram Protocol (UDP) offers connectionless, low-latency streaming without retransmission.
Layer 5 is the Session Layer, managing, establishing, and terminating conversational sessions between applications.
Layer 6 is the Presentation Layer, formatting data, handling syntax conversion, encryption (such as SSL/TLS), and compression.
Layer 7 is the Application Layer, interfacing directly with software applications. Common application protocols include HTTP, HTTPS, DNS, FTP, and SMTP.`
  },
  {
    topic: 'Database Systems',
    title: 'Relational Database ACID Properties',
    content: `In database management systems, ACID properties ensure that database transactions are processed reliably, maintaining data consistency even in the event of power crashes, hardware failures, or network errors.
Atomicity dictates that a transaction is all-or-nothing: either every SQL statement in the transaction completes successfully, or the entire transaction is rolled back to its previous state. If an error occurs halfway through, no partial modifications persist.
Consistency guarantees that a transaction can only transition the database from one valid state to another valid state, maintaining all schema constraints, foreign keys, triggers, and uniqueness rules.
Isolation ensures that concurrent execution of transactions leaves the database in the exact same state that would have been obtained if the transactions were executed sequentially. Isolation levels include Read Uncommitted, Read Committed, Repeatable Read, and Serializable, with Serializable providing the highest safety against race conditions and phantom reads at the expense of throughput.
Durability ensures that once a transaction has committed, its changes survive permanently in non-volatile storage, even if a system crash occurs immediately following the commit. Write-ahead logging (WAL) is the standard mechanism used by PostgreSQL and modern DBMS engines to guarantee durability.`
  },
  {
    topic: 'Artificial Intelligence',
    title: 'Supervised vs. Unsupervised Machine Learning',
    content: `Machine learning algorithms are fundamentally categorized based on how they learn patterns from training data.
Supervised Learning trains models using labeled datasets where every input feature vector corresponds to a ground-truth target output. If the target is categorical (such as spam vs. not spam, or tumor detection), the problem is classification. Algorithms include Logistic Regression, Support Vector Machines (SVM), Decision Trees, Random Forests, and Artificial Neural Networks. If the target is continuous (such as house prices or temperature forecasting), the problem is regression, utilizing Linear Regression and Gradient Boosting.
Unsupervised Learning uncovers hidden structures, clusters, or representations in unlabeled data where ground-truth outputs do not exist. Principal tasks include Clustering (grouping similar items together using K-Means or DBSCAN), Dimensionality Reduction (compressing feature spaces while preserving variance using Principal Component Analysis or t-SNE), and Anomaly Detection.
A key challenge in supervised learning is preventing overfitting, where a model memorizes training noise rather than generalizing to unseen test data. Techniques to mitigate overfitting include L1/L2 regularization, dropout in neural networks, early stopping, and K-fold cross-validation.`
  }
];
