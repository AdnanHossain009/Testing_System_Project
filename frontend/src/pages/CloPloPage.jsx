import { Link } from 'react-router-dom';

const examples = [
  {
    clo: 'CLO1',
    mapping: 'PLO1 0.6  •  PLO2 0.4',
    note: 'One CLO can contribute to more than one PLO.'
  },
  {
    clo: 'CLO2',
    mapping: 'PLO2 0.7  •  PLO3 0.3',
    note: 'Weights describe how strongly the CLO supports each PLO.'
  },
  {
    clo: 'CLO3',
    mapping: 'PLO3 1.0',
    note: 'A CLO can also map directly to a single PLO.'
  }
];

const checklist = [
  'Every course has clearly defined CLOs (typically 3–6 outcomes).',
  'Each CLO is mapped to one or more PLOs with explicit weights (0.0–1.0).',
  'Mapping weights are academically justified (e.g., CLO1 supports PLO2 with 0.6 weight).',
  'Department head approves the mapping before the course becomes active.',
  'Mapping is reused consistently in all assessment and analytics workflows.'
];

const CloPloPage = () => {
  return (
    <div className="public-page info-page">
      <section className="public-section info-hero">
        <div className="public-container">
          <div className="info-layout">
            <div className="info-copy reveal reveal--1">
              <span className="eyebrow">CLO to PLO mapping</span>
              <h1 className="public-title">How course outcomes connect to and support program goals.</h1>
              <p className="public-lead">
                Course Learning Outcomes (CLOs) are specific skills and knowledge students gain from a course. Program Learning Outcomes (PLOs) describe what graduates should achieve across the entire degree program. Weighted CLO-PLO mappings show how each course contributes to program-level goals, making curriculum alignment transparent and measurable.
              </p>

              <div className="hero-actions">
                <Link className="public-button" to="/obe">
                  Read about OBE
                </Link>
                <Link className="public-button public-button--ghost" to="/">
                  Back to home
                </Link>
              </div>
            </div>

            <div className="formula-card reveal reveal--2">
              <div className="formula-card__header">
                <span className="section-kicker">Mapping example</span>
                <strong>How a single CLO can support multiple PLOs</strong>
              </div>
              <div className="matrix">
                <div className="matrix-row matrix-row--head">
                  <span>CLO</span>
                  <span>Mapped PLOs</span>
                  <span>Meaning</span>
                </div>
                {examples.map((item) => (
                  <div className="matrix-row" key={item.clo}>
                    <span>{item.clo}</span>
                    <span>{item.mapping}</span>
                    <span>{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="section-head">
            <span className="section-kicker">Why it matters</span>
            <h2 className="section-title">Mapping proves curriculum coverage and program coherence.</h2>
            <p className="section-copy">
              Without explicit mappings, it is impossible to verify whether students actually encounter all program outcomes, or whether some are over-emphasized while others are neglected. Clear mappings make curriculum gaps visible and accountability auditable.
            </p>
          </div>

          <div className="feature-grid">
            {checklist.map((item, index) => (
              <article className={`feature-card reveal reveal--${Math.min(index + 1, 3)}`} key={item}>
                <span className="feature-card__index">0{index + 1}</span>
                <h3 className="feature-card__title">Approval check</h3>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="split-layout">
            <div className="info-stack reveal reveal--1">
              <span className="section-kicker">How mapping works in OBE Assess</span>
              <h2 className="section-title">Mapping is enforced at proposal, approval, and result stages.</h2>
              <p className="section-copy">
                When faculty request a new course, they submit CLO descriptions and weighted PLO mappings. Department heads review and approve the mapping before the course activates. Assessment results are then scored and aggregated using the same mapping structure, ensuring consistency from planning through evaluation.
              </p>

              <div className="info-grid">
                <div className="info-card">
                  <strong>Explicit alignment</strong>
                  <p>Every CLO is deliberately mapped to program outcomes with documented weights.</p>
                </div>
                <div className="info-card">
                  <strong>Verified by leadership</strong>
                  <p>Department heads approve the mapping, confirming academic rigor and curriculum coherence.</p>
                </div>
                <div className="info-card">
                  <strong>Used in assessment</strong>
                  <p>The same mapping is used to aggregate CLO results into PLO-level analytics and insights.</p>
                </div>
              </div>
            </div>

            <div className="info-panel reveal reveal--2">
              <div className="glass-card glass-card--highlight">
                <span className="section-kicker">Get started</span>
                <p className="section-copy">
                  Ready to implement outcome-based assessment? Create an account, propose a course, and define your CLOs and PLO mappings. The full system guides you through each step.
                </p>
                <div className="cta-row">
                  <Link className="public-button" to="/signup">
                    Create Account
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

export default CloPloPage;