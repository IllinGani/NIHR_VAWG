export interface ModulePermissions {
  overview?: boolean;
  annual_report?: boolean;
  suite?: boolean;
  activity?: boolean;
  gantt?: boolean;
  directory?: boolean;
  dissemination?: boolean;
  capacity?: boolean;
  users?: boolean;
  settings?: boolean;
}

export interface ActionPermissions {
  export?: boolean;
  createEdit?: boolean;
  delete?: boolean;
  manageUsers?: boolean;
}

export interface UserPermissions {
  modules?: ModulePermissions;
  actions?: ActionPermissions;
  allowedCountries?: string[];
}

export interface UserProfile {
  id: string; // Firestore Document ID
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user' | string;
  customRoleName?: string;
  isApproved: boolean;
  requestedAt: string;
  password?: string;
  isPreApproved?: boolean;
  updatedAt?: string;
  permissions?: UserPermissions;
  teamMemberId?: string;
}

export interface ResourceLink {
  label: string;
  url: string;
}

export interface Ticket {
  id?: string;
  no: string;
  date: string;
  ticketInfo: string;
  owners?: string[];
  owner?: string;
  action: string;
  status: string;
  completedDate: string;
  deadline: string;
  comments: string;
  category: string;
  isCore?: boolean;
  isArchived?: boolean;
  links?: ResourceLink[];
  countries?: string[];
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalyticsData {
  id?: string;
  platform: string;
  spend: number;
  clicks: number;
  engagement: number;
  completions: number;
  adDays: number;
  date: string;
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DisseminationItem {
  id?: string;
  title: string;
  summary: string;
  links?: ResourceLink[];
  link?: string;
  date: string;
  type: string; // 'Publication' | 'Report' | 'Event' | 'Media' | 'News & Updates' | 'Publications' | 'Events & Workshops' | 'Research' | 'Policy' | 'Guidance'
  cmsPage?: 'news_and_events' | 'resource_hub';
  category?: string;
  attachmentUrl?: string;
  fileName?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WPStatus {
  wp: string;
  progress: number;
  summary: string[];
}

export interface PersonalPriority {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  order: number;
}

export interface TeamMember {
  id: string;
  name: string;
  roles: string[];
  workPackages: string[];
  country: string;
  institution: string;
  email: string;
  initials: string;
  bio?: string;
  photoUrl?: string;
  linkedUserId?: string;
  linkedUserEmail?: string;
}

export interface Manuscript {
  id?: string;
  title: string;
  leadAuthorName: string;
  leadAuthorEmail: string;
  leadAuthorInstitution: string;
  leadAuthorCountry: string;
  leadAuthorOrcid?: string;
  coAuthors?: string[];
  workPackage: 'Core' | 'WP1' | 'WP2' | 'WP3' | 'WP4' | 'WP5' | 'Cross-cutting' | string;
  targetJournal?: string;
  writingStage: 'Concept / Outlining' | 'Drafting' | 'Internal Review & Feedback' | 'Under Revision' | 'Ready for Submission' | 'Submitted / Under Review' | string;
  abstract: string;
  keywords?: string[];
  ecrOpportunities?: string;
  isOpenForCollaboration: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface NihrTrainee {
  id?: string;
  title: string; // Dr, Mr, Ms, Prof, etc.
  firstName: string;
  lastName: string;
  degreeType?: string; // PhD, MSc, MPhil, MRes, N/A, etc.
  startDate: string;
  finishDate: string;
  anticipatedDegreeAwardDate?: string;
  professionalBackground: 'AHP' | 'dentist' | 'medically qualified' | 'midwife' | 'nurse' | 'other health professional' | 'not a health professional' | string;
  percentNihrFunding: 'fully funded' | '25%+' | string;
  nationality: string;
  employingOrgCountry: string;
  employingOrgName: string;
  traineeMainLocationCountry: string;
  projectName?: string;
  nextDestination?: string;
  orcid?: string;
  email: string;
  hasMentor: 'UK' | 'LMIC' | 'both' | 'no' | string;
  plainEnglishSummary?: string;
  gender: 'M' | 'F' | 'not stated' | string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface LiteratureItem {
  id?: string;
  title: string;
  materialType: 'academic journals' | 'methods' | 'docs made by us' | 'guidance' | 'reports' | string;
  description: string;
  wpTag?: string;
  workPackageTag?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface GanttTask {
  id: string; // This will be the Firestore document ID
  name: string;
  category: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  progress: number; // 0-100
  owner?: string;
  isCore?: boolean;
  createdAt?: string; // ISO or formatted date string
  userId?: string;
  updatedAt?: string;
}

export interface TrainingEvent {
  id?: string;
  title: string;
  type: 'Short course' | 'Workshop' | 'Video' | 'Lecture' | 'Mentoring' | 'Conference' | 'Other';
  workPackage: 'WP1' | 'WP2' | 'WP3' | 'WP4' | 'WP5' | 'Cross-cutting';
  country: 'UK' | 'South Africa' | 'Sri Lanka' | 'Brazil' | 'Mexico' | 'Peru' | 'Other';
  leadFacilitator: string;
  partnerOrganisation: string;
  date: string;
  deliveryMode: 'Online' | 'In-person' | 'Hybrid';
  status: 'Planned' | 'Confirmed' | 'Delivered' | 'Cancelled';
  attendeesCount: number;
  targetAudience: string; // E.g., "ECRs, doctoral students"
  notes?: string;
  evidenceUploaded?: string; // agenda, slides, etc.
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface MentoringRecord {
  id?: string;
  menteeName: string;
  mentorName: string;
  country: 'UK' | 'South Africa' | 'Sri Lanka' | 'Brazil' | 'Mexico' | 'Peru' | 'Other';
  institution: string;
  careerStage: 'ECR' | 'Doctoral student' | 'Master’s student' | 'Postgraduate researcher' | 'Research fellow' | 'Other';
  mentoringFocus: 'Publication' | 'Methods' | 'Leadership' | 'Policy engagement' | 'Grant writing' | 'Data analysis' | 'Career development' | 'Other';
  meetingDate: string;
  nextMeetingDate?: string;
  status: 'Active' | 'Paused' | 'Completed';
  keyActions: string;
  followUpRequired: string; // Yes / No or textual requirements
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TrainingResource {
  id?: string;
  title: string;
  resourceType: 'Slides' | 'Video' | 'Recording' | 'Reading list' | 'Template' | 'Guidance document' | 'Certificate' | 'Other';
  topicArea: 'Survivor engagement in research' | 'Trauma-informed research' | 'Health data science' | 'Health economics' | 'Complex evaluation' | 'Policy evaluation' | 'Safeguarding' | 'Knowledge mobilisation' | 'Research ethics';
  workPackage: 'WP1' | 'WP2' | 'WP3' | 'WP4' | 'WP5' | 'Cross-cutting';
  countryRelevance: string;
  uploadUrlOrLink: string;
  owner: string;
  dateUploaded: string;
  versionNumber: string;
  status: 'Draft' | 'Approved' | 'Archived';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AttendanceRecord {
  id?: string;
  eventName: string;
  eventId?: string;
  participantName: string;
  email: string;
  country: 'UK' | 'South Africa' | 'Sri Lanka' | 'Brazil' | 'Mexico' | 'Peru' | 'Other';
  institution: string;
  roleCareerStage: string;
  attendanceConfirmed: 'Yes' | 'No';
  certificateIssued: 'Yes' | 'No';
  dateCertificateIssued?: string;
  feedbackSubmitted: 'Yes' | 'No';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TrainingFeedback {
  id?: string;
  eventName: string;
  eventId?: string;
  responsesCount: number;
  avgUsefulnessRating: number; // 1-5
  avgConfidenceRating: number; // 1-5
  qualitativeFeedback: string;
  suggestedImprovements?: string;
  followUpNeeds?: string;
  actionOwner?: string;
  actionDeadline?: string;
  actionStatus: 'Pending' | 'In Progress' | 'Completed';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AnnualReportMetric {
  id: string;
  figure: string;
  label: string;
  detail: string;
  status: 'Completed' | 'Active' | 'Planned';
  category: 'Country' | 'Publication' | 'Training' | 'Intervention' | 'Survivor' | 'Partnership';
  badgeNote?: string;
}

export interface AnnualReportHighlight {
  id: string;
  number: number;
  title: string;
  iconName: string;
  points: string[];
}

export interface AnnualReportWorkPackage {
  id: string;
  code: string;
  title: string;
  status: 'Progressing' | 'Requires recovery' | 'Completed';
  statusExplanation: string;
  focus: string;
  details: string[];
}

export interface AnnualReportData {
  id?: string;
  title: string;
  subtitle: string;
  projectTitle: string;
  projectReference: string;
  latestReportSubmitted: string;
  latestDocumentVersion: string;
  nextReportDue: string;
  nextReportDueDateISO: string;
  documentUrl: string;
  lastUpdated: string;
  statusLabel: string;
  statusSummary: string;
  metrics: AnnualReportMetric[];
  highlights: AnnualReportHighlight[];
  workPackages: AnnualReportWorkPackage[];
  priorities: string[];
  risks: string[];
  mitigations: string;
  financeAssurance: string;
  safeguardingAssurance: string;
  safeguardingNote: string;
  impactNarrative: string;
  sdgs: { code: string; title: string; color: string; description: string }[];
  updatedAt?: string;
  updatedBy?: string;
}
