import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Role-based access',
    text: 'Students, faculty, heads, and admins see only the tools they need.'
  },
  {
    title: 'Request and approval flow',
    text: 'Faculty approve student enrollments, and heads approve faculty course requests.'
  },
  {
    title: 'CLO-PLO mapping',
    text: 'Courses carry CLOs and weighted PLO mappings for transparent review.'
  },
  {
    title: 'Fuzzy evaluation',
    text: 'Assessment scores are normalized, fuzzified, and converted into readable attainment.'
  }
];

const workflow = [
  {
    step: '01',
    title: 'Create your account',
    text: 'Faculty, students, and heads sign up with the correct role from the public site.'
  },
  {
    step: '02',
    title: 'Search and request',
    text: 'Students search by course code, title, or faculty. Faculty can submit new course proposals.'
  },
  {
    step: '03',
    title: 'Review CLO and PLO',
    text: 'Approvers see course outcomes, mappings, and the academic context before deciding.'
  },
  {
    step: '04',
    title: 'Measure and improve',
    text: 'Results are evaluated with fuzzy logic, risk scoring, and outcome analytics.'
  }
];

const metrics = [
  { value: '3', label: 'Public explainer pages' },
  { value: '4', label: 'Role-aware dashboards' },
  { value: '1', label: 'Unified approval pipeline' }
];

const HomePage = () => {
  return (
    <div className="public-page home-page">
      <section className="public-section home-hero" id="overview">
        <div className="public-container">
          <div className="hero-grid">
            <div className="hero-copy reveal reveal--1">
              <span className="eyebrow">Outcome-Based Education Platform</span>
              <h1 className="public-title">
                A polished academic experience for enrollment, outcome tracking, and intelligent review.
              </h1>
              <p className="public-lead">
                The homepage, explainer pages, and dashboards now share the same blue-forward visual language,
                so the platform feels like one product from the first click to the last report.
              </p>

              <div className="hero-actions">
                <Link className="public-button" to="/signup">
                  Get Started
                </Link>
                <Link className="public-button public-button--ghost" to="/login">
                  Sign In
                </Link>
                <a className="public-button public-button--link" href="/#features">
                  Explore Features
                </a>
              </div>

              <div className="hero-tags">
                <span className="hero-tag">Fuzzy scoring</span>
                <span className="hero-tag">CLO-PLO alignment</span>
                <span className="hero-tag">Faculty approvals</span>
                <span className="hero-tag">Student requests</span>
              </div>
            </div>

            <div className="hero-panel reveal reveal--2">
              <div className="glass-card">
                <div className="glass-card__header">
                  <span className="section-kicker">Live workflow</span>
                  <strong>From request to result</strong>
                </div>

                <div className="flow-list">
                  <div className="flow-item">
                    <span className="flow-item__step">1</span>
                    <div>
                      <strong>Student requests enrollment</strong>
                      <p>Search courses by title, code, or faculty and send a request.</p>
                    </div>
                  </div>
                  <div className="flow-item">
                    <span className="flow-item__step">2</span>
                    <div>
                      <strong>Faculty reviews the course</strong>
                      <p>Faculty approve or reject requests from their inbox.</p>
                    </div>
                  </div>
                  <div className="flow-item">
                    <span className="flow-item__step">3</span>
                    <div>
                      <strong>Head verifies CLO and PLO</strong>
                      <p>Course proposals are checked before the course becomes active.</p>
                    </div>
                  </div>
                  <div className="flow-item">
                    <span className="flow-item__step">4</span>
                    <div>
                      <strong>Analytics stay in sync</strong>
                      <p>Results feed fuzzy scores, alerts, and outcome summaries.</p>
                    </div>
                  </div>
                </div>

                <div className="metric-grid">
                  {metrics.map((item) => (
                    <div className="metric-card" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section" id="features">
        <div className="public-container">
          <div className="section-head">
            <span className="section-kicker">Platform features</span>
            <h2 className="section-title">Everything is connected, but every role gets a clean path.</h2>
            <p className="section-copy">
              The public site explains the system before login, and the dashboard reuses the same visual system
              after login so the experience stays familiar.
            </p>
          </div>

          <div className="feature-grid">
            {highlights.map((item, index) => (
              <article className={`feature-card reveal reveal--${Math.min(index + 1, 3)}`} key={item.title}>
                <span className="feature-card__index">0{index + 1}</span>
                <h3 className="feature-card__title">{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section" id="workflow">
        <div className="public-container">
          <div className="section-head">
            <span className="section-kicker">How it works</span>
            <h2 className="section-title">A clean academic workflow, not a pile of forms.</h2>
          </div>

          <div className="timeline-grid">
            {workflow.map((item) => (
              <article className="timeline-card reveal" key={item.title}>
                <span className="timeline-card__step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section" id="impact">
        <div className="public-container">
          <div className="split-layout">
            <div className="info-stack reveal reveal--1">
              <span className="section-kicker">Why it feels professional</span>
              <h2 className="section-title">
                The public pages and dashboards share the same color language and spacing rhythm.
              </h2>
              <p className="section-copy">
                That means a visitor can read the homepage, open the Fuzzy or OBE explanations, and then sign in
                without feeling like they moved to a different system.
              </p>

              <div className="info-grid">
                <div className="info-card">
                  <strong>Consistent UI</strong>
                  <p>Blue accents, glass surfaces, and clean cards are used everywhere.</p>
                </div>
                <div className="info-card">
                  <strong>Clear journeys</strong>
                  <p>Every role has a dedicated path and a dedicated explanation page.</p>
                </div>
                <div className="info-card">
                  <strong>Ready for viva</strong>
                  <p>The platform logic is visible, not hidden behind vague labels.</p>
                </div>
              </div>
            </div>

            <div className="info-panel reveal reveal--2">
              <div className="glass-card glass-card--highlight">
                <span className="section-kicker">Explore the concepts</span>
                <div className="quick-link-grid">
                  <Link to="/fuzzy" className="quick-link-card">
                    <strong>Fuzzy</strong>
                    <span>Why and how the score is calculated.</span>
                  </Link>
                  <Link to="/obe" className="quick-link-card">
                    <strong>OBE</strong>
                    <span>How outcomes drive the learning workflow.</span>
                  </Link>
                  <Link to="/clo-plo" className="quick-link-card">
                    <strong>CLO PLO</strong>
                    <span>How course outcomes map to program outcomes.</span>
                  </Link>
                </div>
                <div className="cta-row">
                  <Link to="/signup" className="public-button">
                    Create Account
                  </Link>
                  <Link to="/login" className="public-button public-button--ghost">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section public-section--final">
        <div className="public-container">
          <div className="cta-band reveal">
            <div>
              <span className="section-kicker">Start here</span>
              <h2 className="section-title">A clean landing page now supports the same system users see after login.</h2>
            </div>
            <div className="cta-band__actions">
              <Link className="public-button" to="/signup">
                Sign Up
              </Link>
              <Link className="public-button public-button--ghost" to="/login">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;