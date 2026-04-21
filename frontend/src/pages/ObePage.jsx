import { Link } from 'react-router-dom';

const pillars = [
  {
    title: 'Define clear learning outcomes',
    text: 'Every course specifies its Course Learning Outcomes (CLOs), and each program articulates its Program Learning Outcomes (PLOs). Outcomes are measurable, specific, and aligned with institutional mission.'
  },
  {
    title: 'Measure and assess achievement',
    text: 'Multiple assessments (quizzes, assignments, exams, projects) collect evidence of CLO attainment. Results are aggregated using fuzzy logic to produce transparent, defensible attainment scores.'
  },
  {
    title: 'Use data to improve',
    text: 'Dashboards highlight weak CLOs and PLOs, guiding curriculum revision, instructor professional development, and assessment redesign. The feedback loop is transparent and actionable.'
  }
];

const flow = [
  'Faculty define CLOs when proposing a course and map CLOs to PLOs with weighted contributions.',
  'Department heads verify CLO clarity and PLO alignment before course activation.',
  'Faculty create and link assessments to specific CLOs during course delivery.',
  'Assessment results are normalized and fuzzified into CLO attainment scores.',
  'CLO scores are aggregated and rolled up into PLO attainment at the program level.',
  'Dashboards display CLO and PLO attainment trends to inform continuous improvement.'
];

const ObePage = () => {
  return (
    <div className="public-page info-page">
      <section className="public-section info-hero">
        <div className="public-container">
          <div className="info-layout">
            <div className="info-copy reveal reveal--1">
              <span className="eyebrow">Outcome-Based Education</span>
              <h1 className="public-title">Learning outcomes define success, not just grades and rankings.</h1>
              <p className="public-lead">
                Outcome-Based Education shifts focus from input measures (hours taught) to output measures (what students actually achieve). OBE Assess embeds this philosophy into every decision: course requests are validated by CLO clarity, assessments are linked to outcomes, and analytics report on CLO attainment rather than raw scores alone.
              </p>

              <div className="hero-actions">
                <Link className="public-button" to="/clo-plo">
                  See CLO PLO mapping
                </Link>
                <Link className="public-button public-button--ghost" to="/">
                  Back to home
                </Link>
              </div>
            </div>

            <div className="formula-card reveal reveal--2">
              <div className="formula-card__header">
                <span className="section-kicker">Platform flow</span>
                <strong>Assessment to outcome pipeline</strong>
              </div>
              {flow.map((item, index) => (
                <div className="formula-line" key={item}>
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="section-head">
            <span className="section-kicker">Why it matters</span>
            <h2 className="section-title">Outcomes drive accountability, improvement, and institutional credibility.</h2>
            <p className="section-copy">
              When every course, every assessment, and every result traces back to defined outcomes, the institution can demonstrate that its programs work. This transparency is essential for accreditation, program reviews, and stakeholder confidence.
            </p>
          </div>

          <div className="feature-grid">
            {pillars.map((item, index) => (
              <article className={`feature-card reveal reveal--${Math.min(index + 1, 3)}`} key={item.title}>
                <span className="feature-card__index">0{index + 1}</span>
                <h3 className="feature-card__title">{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="split-layout">
            <div className="info-stack reveal reveal--1">
              <span className="section-kicker">How OBE is implemented</span>
              <h2 className="section-title">OBE is enforced at every stage: proposal, approval, assessment, and analysis.</h2>
              <p className="section-copy">
                Faculty cannot activate a course without defining CLOs and PLO mappings. Department heads validate those mappings before approval. Assessment results flow into CLO dashboards. Analytics always trace back to outcomes, never just to grades.
              </p>

              <div className="info-grid">
                <div className="info-card">
                  <strong>CLO Definition</strong>
                  <p>Measurable statements of what students will know and do after completing the course.</p>
                </div>
                <div className="info-card">
                  <strong>PLO Alignment</strong>
                  <p>Each CLO is explicitly weighted to one or more program-level outcomes, showing how the course supports broader degree goals.</p>
                </div>
                <div className="info-card">
                  <strong>Outcome Attainment</strong>
                  <p>Fuzzy-scored evidence showing whether students achieved CLO targets, aggregated to assess PLO effectiveness.</p>
                </div>
              </div>
            </div>

            <div className="info-panel reveal reveal--2">
              <div className="glass-card glass-card--highlight">
                <span className="section-kicker">Result & analytics pipeline</span>
                <div className="band-list">
                  <div className="band-list__item">
                    <strong>Assessment input</strong>
                    <span>Raw marks linked to specific CLOs.</span>
                  </div>
                  <div className="band-list__item">
                    <strong>CLO scoring</strong>
                    <span>Marks fuzzified into Low/Medium/High attainment.</span>
                  </div>
                  <div className="band-list__item">
                    <strong>PLO aggregation</strong>
                    <span>CLO results rolled up to program-level analytics.</span>
                  </div>
                  <div className="band-list__item">
                    <strong>Improvement loop</strong>
                    <span>Trends inform curriculum and instruction changes.</span>
                  </div>
                </div>
                <div className="cta-row">
                  <Link className="public-button" to="/signup">
                    Start using OBE Assess
                  </Link>
                  <Link className="public-button public-button--ghost" to="/login">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ObePage;