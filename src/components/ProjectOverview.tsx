import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  Users, 
  Activity, 
  Shield, 
  Globe, 
  FileText,
  CheckCircle2
} from 'lucide-react';

export const ProjectOverview: React.FC = () => {
  const workPackages = [
    {
      id: 'WP1',
      title: 'Developing Diverse, Representative and Inclusive Survivor Panels',
      objective: 'Establishing survivor panels that meaningfully shape every stage of the research, ensuring lived experience is embedded across all WPs through co-design, training, and evaluation.',
      details: [
        'Meaningful representation in research design',
        'Lived experience embedded across WPs',
        'Co-design of training modules',
        'Ongoing ethical evaluation by panels'
      ],
      color: 'bg-yellow-50',
      icon: SearchIcon
    },
    {
      id: 'WP2',
      title: 'Healthcare Burden of VAW/C',
      objective: 'Quantifying the healthcare burden associated with VAW/C through data mapping, analysis, and a coordinated regional survey across partner countries.',
      details: [
        'Comprehensive data mapping across sites',
        'Regional burden of disease analysis',
        'Coordinated surveys in 5 anchor countries',
        'Identifying gaps in current healthcare responses'
      ],
      color: 'bg-orange-50',
      icon: ActivityIcon
    },
    {
      id: 'WP3',
      title: 'Economic Cost of Inaction',
      objective: 'Estimating the magnitude of the economic cost of inaction against the pervasive and damaging impacts of VAW/C — including lost opportunities accruing over the lifecycle — through evidence synthesis, focus groups, and social accounting matrix (SAM) modelling.',
      details: [
        'Lifecycle opportunity cost estimation',
        'Social Accounting Matrix (SAM) modelling',
        'Evidence synthesis on economic impacts',
        'Focus groups on local economic barriers'
      ],
      color: 'bg-purple-50',
      icon: ShieldIcon
    },
    {
      id: 'WP4',
      title: 'What Works to Prevent VAW/C',
      objective: 'Ascertaining which interventions and policies work best to prevent VAW/C in local contexts through evaluation frameworks, toolkits, policy analysis, and a pilot.',
      details: [
        'Local intervention policy analysis',
        'Evaluation framework development',
        'Evidence-based toolkits for practitioners',
        'Pilot implementation of best practices'
      ],
      color: 'bg-blue-50',
      icon: UsersIcon
    },
    {
      id: 'WP5',
      title: 'Knowledge Exchange & Training',
      objective: 'Maximising research uptake and building local capacity through open-access knowledge exchange, training, and mentorship across partner sites.',
      details: [
        'Open-access knowledge exchange platform',
        'Cross-site mentorship programs',
        'Capacity building for LMIC researchers',
        'Stakeholder training and policy uptake'
      ],
      color: 'bg-indigo-50',
      icon: GlobeIcon
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <section className="bg-brand-navy rounded-3xl p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <BookOpen size={14} className="text-brand-orange" />
            Project Protocol
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            NIHR Global Health Research Group on <br />
            <span className="text-brand-orange">Preventing VAW/VAC</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            A multi-country research initiative co-producing, evaluating, and scaling 
            evidence-based approaches to prevent Violence Against Women (VAW) 
            and Violence Against Children (VAC) in Global South settings.
          </p>
        </div>
      </section>

      {/* Background & Research Question */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Activity className="text-brand-orange" />
              Background
            </h2>
            <p className="text-slate-600 leading-relaxed">
              VAW affects an estimated one in three women, and VAC affects over one billion children — 
              both are global public health issues associated with a substantial burden of morbidity and mortality. 
              The Lancet Commission on VAW/C was established to identify best practices in adopting a 
              public health approach to VAW/C globally, and identified a critical gap: data, insights, 
              and survivor engagement on VAW/C are abundant in high-income countries but scarce in 
              low- and middle-income countries (LMICs). This Group brings together five anchor countries 
              engaged to address these concerns and provide recommendations to support Global South contexts.
            </p>
          </div>

          <div className="p-6 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl border-l-4 border-l-brand-orange">
            <h3 className="text-brand-navy font-bold flex items-center gap-2 mb-2">
              <Target size={18} />
              Research Question
            </h3>
            <p className="text-brand-navy font-medium text-lg leading-relaxed italic">
              "How can we develop and adopt best practices in preventing violence against women (VAW) and violence against children (VAC) in diverse Global South settings?"
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Globe className="text-brand-orange" />
              Aim
            </h2>
            <p className="text-slate-600 leading-relaxed">
              To work across South Africa, Mexico, Brazil, India, and Sri Lanka to co-produce — with survivors of VAW/C — 
              research using a trauma-informed framework that helps us understand the effects of violence across 
              different contexts, develop recommendations to prevent violence, and build local research capacity.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Key Principles</h3>
            <ul className="space-y-4">
              {[
                'Equitable LMIC partnerships',
                'Survivor-led, trauma-informed design',
                'Safeguarding excellence',
                'Policy-relevant evidence',
                'Interdisciplinary synergy'
              ].map((principle, i) => (
                <li key={principle} className="flex items-center gap-3 text-sm text-slate-700 font-bold">
                  <CheckCircle2 size={18} className="text-brand-orange shrink-0" />
                  {principle}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-brand-navy rounded-3xl p-8 text-white">
            <Shield className="text-brand-orange mb-4" size={32} />
            <h3 className="font-bold mb-2">Governance</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Activity is overseen by country leads and the General Governance Model, ensuring accountability 
              across both the work-package and country-team structures.
            </p>
          </div>
        </div>
      </section>

      {/* Work Packages */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Work Package Framework</h2>
          <div className="flex gap-2">
            {['1', '2', '3', '4', '5'].map(n => (
              <div key={n} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                {n}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {workPackages.map((wp, i) => (
            <motion.div 
              key={wp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-3xl border border-slate-200 shadow-sm ${wp.color} flex flex-col md:flex-row gap-8`}
            >
              <div className="md:w-1/3 shrink-0">
                <div className="inline-block px-3 py-1 bg-white rounded-lg shadow-sm border border-slate-200 text-xs font-black text-slate-900 mb-4">
                  {wp.id}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{wp.title}</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {wp.objective}
                </p>
              </div>
              <div className="flex-grow grid sm:grid-cols-2 gap-4">
                {wp.details.map((detail, idx) => (
                  <div key={idx} className="bg-white/50 p-4 rounded-xl border border-white/50 hover:border-brand-orange/30 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0 group-hover:scale-125 transition-transform"></div>
                      <p className="text-sm text-slate-700 leading-snug">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Summary */}
      <section className="p-10 bg-slate-900 rounded-3xl text-center space-y-6">
        <Globe size={48} className="text-brand-orange mx-auto opacity-50" />
        <h2 className="text-2xl font-bold text-white">Global Reach & Local Impact</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          We operate across partner sites in Brazil, India, Mexico, South Africa, and Sri Lanka, 
          supported by UK and international collaborators, to build a future free from violence.
        </p>
      </section>
    </div>
  );
};

// Simple Icon Components to avoid lucide imports if needed, but let's use Lucide
const SearchIcon = (props: any) => <FileText {...props} />;
const UsersIcon = (props: any) => <Users {...props} />;
const ActivityIcon = (props: any) => <Activity {...props} />;
const ShieldIcon = (props: any) => <Shield {...props} />;
const GlobeIcon = (props: any) => <Globe {...props} />;
