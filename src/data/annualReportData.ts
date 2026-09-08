import { AnnualReportData } from '../types';

export const INITIAL_ANNUAL_REPORT_DATA: AnnualReportData = {
  title: '6-Month Progress Report',
  subtitle: 'Six-monthly progress and achievements across our global research partnership',
  projectTitle: 'NIHR Global Health Research Group on Violence Against Women and Violence Against Children',
  projectReference: 'NIHR156915',
  latestReportSubmitted: '8 July 2026',
  latestDocumentVersion: '24 August 2026',
  nextReportDue: 'February 2027',
  nextReportDueDateISO: '2027-02-28',
  documentUrl: 'https://drive.google.com/file/d/1-NIHR156915-6-Month-Progress-Report-2026-v2.pdf/view',
  lastUpdated: '24 August 2026',
  statusLabel: 'Implementation progressing, with some timetable pressures',
  statusSummary: 'The programme has moved from initial mobilisation into implementation readiness and early delivery. Governance, survivor-centred engagement, ethics, data access, capacity strengthening, research outputs, and policy partnerships have advanced. Some activities remain behind the original timetable because of institutional agreements, ethics and government approvals, recruitment, fund transfers, and country-level governance processes. These delays have affected timing but have not changed the programme’s aims, planned outputs, or deliverables.',
  
  metrics: [
    {
      id: 'm-1',
      figure: '5',
      label: 'Partner Countries',
      detail: 'Actively contributing: Brazil, India, Mexico, South Africa, and Sri Lanka',
      status: 'Completed',
      category: 'Country',
      badgeNote: 'Active Partnership'
    },
    {
      id: 'm-2',
      figure: '2',
      label: 'Accepted Publications',
      detail: 'Accepted peer-reviewed articles published in high-impact global health journals',
      status: 'Completed',
      category: 'Publication',
      badgeNote: 'Peer-Reviewed'
    },
    {
      id: 'm-3',
      figure: '3',
      label: 'Brazilian Manuscripts',
      detail: 'Additional manuscripts submitted utilizing national surveillance and survey datasets',
      status: 'Completed',
      category: 'Publication',
      badgeNote: 'Submitted'
    },
    {
      id: 'm-4',
      figure: '10',
      label: 'LMIC Researchers',
      detail: 'Early-stage researchers completed the intensive 16-week GenderPro Certificate',
      status: 'Completed',
      category: 'Training',
      badgeNote: 'Certified'
    },
    {
      id: 'm-5',
      figure: '6',
      label: 'Advanced Trainees',
      detail: 'Researchers received advanced methodology training linked to REMAP-IPV & NNVAWI',
      status: 'Completed',
      category: 'Training',
      badgeNote: 'Specialist'
    },
    {
      id: 'm-6',
      figure: '12',
      label: 'Hospital Social Workers',
      detail: 'Began family-strengthening intervention training with MOSAIC in South Africa',
      status: 'Active',
      category: 'Intervention',
      badgeNote: 'In Training'
    },
    {
      id: 'm-7',
      figure: '~66',
      label: 'Organisations Mapped',
      detail: 'Comprehensive multi-sectoral institutional landscape mapped across Brazil',
      status: 'Completed',
      category: 'Partnership',
      badgeNote: 'Completed'
    },
    {
      id: 'm-8',
      figure: '6',
      label: 'Survivor Panels',
      detail: 'Panels planned across 3 provinces in Sri Lanka, engaging ~90 survivors with trauma-informed protocols',
      status: 'Planned',
      category: 'Survivor',
      badgeNote: 'Planned (Not Completed)'
    },
    {
      id: 'm-9',
      figure: '8',
      label: 'NGOs Consulted',
      detail: 'Civil society organisations consulted in India to adapt survivor-centred engagement models',
      status: 'Completed',
      category: 'Partnership',
      badgeNote: 'Consulted'
    },
    {
      id: 'm-10',
      figure: '11',
      label: 'Priority Challenges',
      detail: 'Collaborative priority operational challenges identified with the Belo Horizonte municipal network',
      status: 'Completed',
      category: 'Partnership',
      badgeNote: 'Co-Identified'
    }
  ],

  highlights: [
    {
      id: 'h-1',
      number: 1,
      title: 'Governance and programme management',
      iconName: 'ShieldCheck',
      points: [
        'The Independent Advisory Board was established and held its first meeting on 13 April 2026.',
        'Regular country-lead, work-package, core-team, and consortium meetings are in place.',
        'A project portal, activity tracker, approval tracker, and updated risk register support monitoring and escalation.'
      ]
    },
    {
      id: 'h-2',
      number: 2,
      title: 'Survivor-centred research',
      iconName: 'HeartHandshake',
      points: [
        'The South African team developed draft trauma-informed guidance for survivor panels.',
        'South Africa received ethics approval for survivor-panel activities in June 2026.',
        'India adapted its approach following consultation, moving from one generic panel to separate panels reflecting different experiences of violence.',
        'Sri Lanka is preparing six survivor panels across three provinces.',
        'Brazil received ethical approval on 16 May 2026 and has developed partnerships to support survivor participation.'
      ]
    },
    {
      id: 'h-3',
      number: 3,
      title: 'Data and evidence',
      iconName: 'Database',
      points: [
        'South Africa secured access to the Birth to 30+ cohort, which has followed approximately 4,000 mothers and children since 1990.',
        'A data-sharing agreement for the Asenze Study, involving approximately 1,600 children, is progressing.',
        'Mexico completed national data mapping and developed an ENDIREH 2021 working paper on disclosure and formal help-seeking.',
        'Brazil submitted three manuscripts using national surveillance and survey data.'
      ]
    },
    {
      id: 'h-4',
      number: 4,
      title: 'Policy and health-system engagement',
      iconName: 'Building2',
      points: [
        'The Brazil team supported strategic planning with the Belo Horizonte Municipal Network for Supporting Women in Situations of Violence.',
        'Engagement is underway with ministries, health authorities, civil society organisations, police, and community stakeholders across partner countries.',
        'Mexico is developing a health-system provider-response study with IMSS Bienestar.',
        'South Africa is adapting a family-strengthening intervention for hospital delivery with MOSAIC and hospital social workers.'
      ]
    },
    {
      id: 'h-5',
      number: 5,
      title: 'Capacity strengthening',
      iconName: 'GraduationCap',
      points: [
        'Ten LMIC-based early-stage researchers completed the 16-week GenderPro Certificate Programme.',
        'Six participants received advanced training linked to REMAP-IPV and NNVAWI.',
        'Researchers have been paired with writing mentors to develop peer-reviewed manuscripts.',
        'Approximately 20 researchers and graduate students attended an INEGI/ENDIREH methods and ethics seminar in Mexico.'
      ]
    },
    {
      id: 'h-6',
      number: 6,
      title: 'Research outputs',
      iconName: 'FileText',
      points: [
        'Two accepted peer-reviewed publications were reported.',
        'Three additional manuscripts were submitted in Brazil.',
        'A Mexico working paper and national dataset map are in development.',
        'Further outputs will include survivor-panel guidance, policy briefs, training materials, conference presentations, and public-facing communications.'
      ]
    }
  ],

  workPackages: [
    {
      id: 'wp-1',
      code: 'WP1',
      title: 'Survivor panels and community engagement',
      status: 'Progressing',
      statusExplanation: 'Implementation progressing steadily across all partner territories with completed ethical approvals in SA and Brazil.',
      focus: 'Move from guidance and consultation into locally adapted survivor-panel implementation.',
      details: [
        'Trauma-informed guidance drafted and adapted for partner country contexts.',
        'Ethics clearances secured in South Africa (June 2026) and Brazil (May 2026).',
        'India refined model to separate panels capturing distinct forms of gender-based violence.',
        'Sri Lanka pre-implementation groundwork active for 6 panels across 3 provinces.'
      ]
    },
    {
      id: 'wp-2',
      code: 'WP2',
      title: 'Data, surveys, and epidemiological analysis',
      status: 'Progressing',
      statusExplanation: 'Major cohort access established; secondary analysis pipelines underway.',
      focus: 'Advance secondary analyses, data-sharing agreements, the Sri Lankan household survey, and the Mexico provider-response study.',
      details: [
        'Birth to 30+ cohort (~4,000 mother-child pairs) access successfully formalized.',
        'Asenze Study (~1,600 children) data-sharing agreement progressing towards sign-off.',
        'Mexico ENDIREH 2021 working paper on disclosure pathways completed.',
        'Three Brazil epidemiological papers under peer review with national health surveillance data.'
      ]
    },
    {
      id: 'wp-3',
      code: 'WP3',
      title: 'Economic analysis',
      status: 'Requires recovery',
      statusExplanation: 'Timeline delayed due to upstream data dependencies and staffing re-allocation. Active catch-up roadmap initiated.',
      focus: 'Initiate delayed cost-of-inaction work, refine social accounting methods, and confirm data sources and sequencing.',
      details: [
        'Cost-of-inaction methodology framework undergoing refinement to match available LMIC data streams.',
        'Sequencing aligned with WP2 secondary datasets to feed cost estimation equations.',
        'Health economists re-evaluating national health accounts and social expenditure indices.',
        'Recovery sprint planned for Q3-Q4 2026 to ensure deliverable milestones are reconciled.'
      ]
    },
    {
      id: 'wp-4',
      code: 'WP4',
      title: 'Intervention and policy development',
      status: 'Progressing',
      statusExplanation: 'Clinical hospital partnerships established; policy networks actively co-designing interventions.',
      focus: 'Continue hospital-based intervention adaptation in South Africa, complete the Brazilian scoping review, and strengthen policy-facing work.',
      details: [
        '12 hospital social workers mobilized in South Africa for MOSAIC family-strengthening intervention.',
        'Strategic collaboration established with Belo Horizonte Municipal Network for Supporting Women in Situations of Violence.',
        'IMSS Bienestar provider-response study protocol in active design in Mexico.',
        'Scoping review of health-system intervention entry points advancing in Brazil.'
      ]
    },
    {
      id: 'wp-5',
      code: 'WP5',
      title: 'Training and capacity strengthening',
      status: 'Progressing',
      statusExplanation: 'High cohort completion rate; ongoing mentorship and doctoral student recruitment.',
      focus: 'Support manuscripts, appoint Master’s and PhD students, and consolidate the LMIC research training cohort.',
      details: [
        '10 early-career researchers graduated from the 16-week GenderPro Certificate course.',
        '6 fellows attended international advanced methodology workshops (REMAP-IPV & NNVAWI).',
        'Academic writing mentorship programme paired LMIC authors with senior publishing mentors.',
        'Doctoral and Master’s scholarship appointment processes underway across partner universities.'
      ]
    }
  ],

  priorities: [
    'Complete remaining institutional, contractual, ethics, government, and fund-transfer processes.',
    'Launch locally adapted survivor panels where approvals and safeguarding arrangements are complete.',
    'Advance surveys, fieldwork, and secondary data analyses.',
    'Progress delayed economic analyses.',
    'Continue intervention adaptation and policy engagement.',
    'Support publications, policy briefs, training resources, and public-facing outputs.',
    'Progress Master’s and PhD appointments.',
    'Maintain active risk monitoring, safeguarding, and cross-country learning.'
  ],

  risks: [
    'Delayed ethics, contractual, government, and institutional approvals',
    'Fund-transfer and procurement delays',
    'Recruitment and staff-capacity constraints',
    'Mexico leadership transition',
    'Data-access and data-sharing dependencies',
    'Safeguarding requirements for survivor engagement'
  ],

  mitigations: 'Live approval and risk trackers, regular governance meetings, early escalation, documented handovers, partner support, and re-sequencing activities so analysis, training, and stakeholder engagement can continue while fieldwork is delayed.',

  financeAssurance: 'The programme remains within its approved overall budget. Some partner budgets show underspend because activities and fund transfers have been delayed.',

  safeguardingAssurance: 'No safeguarding, fraud, corruption, or major financial irregularities were reported during the reporting period.',

  safeguardingNote: 'Survivor engagement must only begin when ethics approvals, confidentiality arrangements, referral pathways, reimbursement processes, and appropriate support mechanisms are in place.',

  impactNarrative: 'The programme is building a credible multi-country, survivor-centred platform for research and impact. Its emerging contribution includes stronger evidence, improved research methods, increased LMIC research capacity, deeper policy partnerships, and more locally relevant health-system responses. Sustainability is supported by embedding activities within existing universities, health services, civil society networks, and government structures.',

  sdgs: [
    {
      code: 'SDG 3',
      title: 'Good Health and Well-being',
      color: '#4C9F38',
      description: 'Strengthening health-system provider responses, trauma-informed clinical pathways, and mental health support for survivors.'
    },
    {
      code: 'SDG 5',
      title: 'Gender Equality',
      color: '#FF3A21',
      description: 'Centering survivor voices, eliminating violence against women and girls, and advancing gender-transformative evidence.'
    },
    {
      code: 'SDG 10',
      title: 'Reduced Inequalities',
      color: '#DD1367',
      description: 'Building sustained LMIC research leadership, empowering marginalized populations, and addressing social determinants of harm.'
    },
    {
      code: 'SDG 16',
      title: 'Peace, Justice and Strong Institutions',
      color: '#00689D',
      description: 'Safeguarding children from abuse and violence, bolstering justice pathways, and reinforcing municipal protection networks.'
    },
    {
      code: 'SDG 17',
      title: 'Partnerships for the Goals',
      color: '#19486A',
      description: 'Fostering deep south-south and north-south collaborations between academic institutions, civil society, and governmental ministries.'
    }
  ]
};
