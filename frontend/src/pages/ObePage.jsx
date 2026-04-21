import { Link } from 'react-router-dom';

const pillars = [
  {
    title: 'Define outcomes',
    text: 'Every course has clear CLOs, and each program defines the broader PLOs it expects.'
  },
  {
    title: 'Measure attainment',
    text: 'Assessments are linked to CLOs so scores can be aggregated into meaningful outcomes.'
  },
  {
    title: 'Improve teaching',
    text: 'Weak outcomes highlight where instruction, assessments, or mappings need adjustment.'
  }
];

const flow = [
  'Assessments collect raw performance data.',
  'CLO attainment is computed from those assessments.',
  'CLO-PLO mapping converts course outcome data into program-level insight.',
  'Dashboards summarize the result for faculty, heads, and students.'
];

const ObePage = () => {
  return (
    <div className="public-page info-page">
      <section className="public-section info-hero">
        <div className="public-container">
          <div className="info-layout">
            <div className="info-copy reveal reveal--1">
              <span className="eyebrow">Outcome-Based Education</span>
              <h1 className="public-title">OBE explains what students should achieve, not only what they score.</h1>
              <p className="public-lead">
                In this platform, OBE is visible in the way courses are built, assessments are mapped, and results
                are converted into CLO and PLO attainment.
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
            <h2 className="section-title">The app keeps OBE visible at every layer.</h2>
            <p className="section-copy">
              Course creation, result evaluation, and analytics all reference the same outcome structure. That makes
              the system easier to defend in a viva or review session.
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
              <span className="section-kicker">How this app uses OBE</span>
              <h2 className="section-title">Course requests only become real courses after outcome review.</h2>
              <p className="section-copy">
                Faculty course proposals include CLOs and CLO-PLO mappings. Department heads check them before
                approval, so the created course already fits the outcome model.
              </p>

              <div className="info-grid">
                <div className="info-card">
                  <strong>CLOs</strong>
                  <p>Course-level statements that can be measured through assessments.</p>
                </div>
                <div className="info-card">
                  <strong>PLOs</strong>
                  <p>Program-level goals that show the broader capability students should gain.</p>
                </div>
                <div className="info-card">
                  <strong>Attainment</strong>
                  <p>The numeric summary that tells whether the course outcomes were achieved.</p>
                </div>
              </div>
            </div>

            <div className="info-panel reveal reveal--2">
              <div className="glass-card glass-card--highlight">
                <span className="section-kicker">Result engine connection</span>
                <div className="band-list">
                  <div className="band-list__item">
                    <strong>Assessments</strong>
                    <span>Feed raw marks into the scoring pipeline.</span>
                  </div>
                  <div className="band-list__item">
                    <strong>CLO diagnostics</strong>
                    <span>Show why a CLO is strong or weak.</span>
                  </div>
                  <div className="band-list__item">
                    <strong>PLO charts</strong>
                    <span>Summarize the program-level picture.</span>
                  </div>
                </div>
                <div className="cta-row">
                  <Link className="public-button" to="/signup">
                    Explore the system
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