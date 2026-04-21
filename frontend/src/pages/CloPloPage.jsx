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
  'The course has clear CLOs.',
  'Each CLO is mapped to one or more PLOs.',
  'The mapping weights are reasonable and balanced.',
  'The department head reviews the mapping before approval.'
];

const CloPloPage = () => {
  return (
    <div className="public-page info-page">
      <section className="public-section info-hero">
        <div className="public-container">
          <div className="info-layout">
            <div className="info-copy reveal reveal--1">
              <span className="eyebrow">CLO to PLO mapping</span>
              <h1 className="public-title">CLOs describe course goals. PLOs describe program goals.</h1>
              <p className="public-lead">
                The platform uses weighted mappings so a course can show how strongly each learning outcome supports
                the broader program structure.
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
            <h2 className="section-title">The mapping is what connects a course to the full program story.</h2>
            <p className="section-copy">
              In this system, department heads inspect CLOs and PLO weights before a faculty course request becomes
              active. That makes the approval flow academically meaningful.
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
              <span className="section-kicker">How it is used in the app</span>
              <h2 className="section-title">Faculty submit the mapping when they request a new course.</h2>
              <p className="section-copy">
                The department head checks the CLO list and PLO weights, then either approves the course or sends it
                back for revision.
              </p>

              <div className="info-grid">
                <div className="info-card">
                  <strong>Transparency</strong>
                  <p>The relationship between outcomes is visible instead of implicit.</p>
                </div>
                <div className="info-card">
                  <strong>Consistency</strong>
                  <p>The same mapping is reused in the result and analytics pipeline.</p>
                </div>
                <div className="info-card">
                  <strong>Accountability</strong>
                  <p>Approvals happen with an academic justification, not just a course name.</p>
                </div>
              </div>
            </div>

            <div className="info-panel reveal reveal--2">
              <div className="glass-card glass-card--highlight">
                <span className="section-kicker">Next action</span>
                <p className="section-copy">
                  Want to see the full workflow? Sign in, browse the catalog, or create an account from the public
                  homepage.
                </p>
                <div className="cta-row">
                  <Link className="public-button" to="/signup">
                    Sign Up
                  </Link>
                  <Link className="public-button public-button--ghost" to="/login">
                    Login
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