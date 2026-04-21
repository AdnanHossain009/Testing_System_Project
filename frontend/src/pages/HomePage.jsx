import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Role-Based Access Control',
    text: 'Students manage enrollments, faculty review assessments, heads approve courses, and admins oversee system operations. Every user sees only their relevant tools and data.'
  },
  {
    title: 'Streamlined Enrollment Workflow',
    text: 'Students request enrollment, faculty review qualifications, department heads verify CLO-PLO mappings, and active courses appear in real-time for outcome tracking.'
  },
  {
    title: 'CLO-PLO Mapping & Verification',
    text: 'Courses define Course Learning Outcomes (CLOs) with weighted mappings to Program Learning Outcomes (PLOs). Department heads approve mappings before course activation.'
  },
  {
    title: 'Intelligent Fuzzy Scoring',
    text: 'Raw assessment marks are normalized, fuzzified into membership functions, and converted into Low/Medium/High attainment classifications for clearer outcome understanding.'
  }
];

const workflow = [
  {
    step: '01',
    title: 'Create your account',
    text: 'Register as a student, faculty member, department head, or administrator. Each role unlocks specific features and dashboard views tailored to academic responsibilities.'
  },
  {
    step: '02',
    title: 'Search and request enrollment',
    text: 'Students browse available courses by code, title, or faculty member, then submit enrollment requests. Faculty receive notifications and can approve or provide feedback.'
  },
  {
    step: '03',
    title: 'Verify outcomes before activation',
    text: 'Department heads review course CLOs and PLO mappings to ensure academic alignment. Courses become active only after outcome verification is complete.'
  },
  {
    step: '04',
    title: 'Assess and analyze results',
    text: 'Faculty enter assessment marks, which are processed through fuzzy logic to generate attainment scores. Real-time dashboards show CLO achievement and program-level PLO analytics.'
  }
];

const metrics = [
  { value: '4', label: 'Role-specific dashboards' },
  { value: '3', label: 'Explainer pages (Fuzzy, OBE, CLO-PLO)' },
  { value: '1', label: 'Integrated outcome pipeline' }
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
                Intelligent assessment management with fuzzy logic scoring and CLO-PLO alignment.
              </h1>
              <p className="public-lead">
                OBE Assess transforms how institutions manage student enrollment, measure learning outcomes, and evaluate program effectiveness. Built for faculty, students, department heads, and administrators, the platform provides role-based workflows, real-time analytics, and transparent outcome tracking from course request to achievement measurement.
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
            <h2 className="section-title">Comprehensive tools for every stakeholder in the learning journey.</h2>
            <p className="section-copy">
              From enrollment requests to outcome analysis, OBE Assess integrates every academic workflow. Students, faculty, and administrators collaborate through role-based interfaces that keep the system transparent and academically rigorous.
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
            <h2 className="section-title">A structured academic workflow that scales from registration to degree completion.</h2>
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
              <span className="section-kicker">Built for institutional confidence</span>
              <h2 className="section-title">
                Transparent, defensible, and audit-ready outcome management.
              </h2>
              <p className="section-copy">
                Every course request, approval, assessment, and result is logged and traced. The system maintains complete transparency for program reviews, accreditation visits, and academic audits.
              </p>

              <div className="info-grid">
                <div className="info-card">
                  <strong>Audit trails</strong>
                  <p>Every action is logged with user, timestamp, and justification for institutional confidence.</p>
                </div>
                <div className="info-card">
                  <strong>Outcome alignment</strong>
                  <p>All assessments, enrollments, and analytics trace back to defined CLOs and PLOs.</p>
                </div>
                <div className="info-card">
                  <strong>Ready for viva</strong>
                  <p>The complete academic logic is visible and explainable, not hidden in proprietary algorithms.</p>
                </div>
              </div>
            </div>

            <div className="info-panel reveal reveal--2">
              <div className="glass-card glass-card--highlight">
                <span className="section-kicker">Learn the concepts</span>
                <p className="section-copy">
                  Understand the core systems powering the platform before you sign in.
                </p>
                <div className="quick-link-grid">
                  <Link to="/fuzzy" className="quick-link-card">
                    <strong>Fuzzy Logic</strong>
                    <span>How assessment marks become attainment levels.</span>
                  </Link>
                  <Link to="/obe" className="quick-link-card">
                    <strong>OBE Framework</strong>
                    <span>How outcomes drive the learning and assessment workflow.</span>
                  </Link>
                  <Link to="/clo-plo" className="quick-link-card">
                    <strong>CLO-PLO Mapping</strong>
                    <span>How course outcomes connect to program goals.</span>
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
              <span className="section-kicker">Ready to begin</span>
              <h2 className="section-title">Join your institution's outcome-based assessment platform.</h2>
            </div>
            <div className="cta-band__actions">
              <Link className="public-button" to="/signup">
                Create Account
              </Link>
              <Link className="public-button public-button--ghost" to="/login">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;