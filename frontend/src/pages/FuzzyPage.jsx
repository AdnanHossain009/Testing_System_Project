import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Input normalization',
    text: 'All assessment scores (quiz, assignment, midterm, final) are normalized to a 0-100 scale using min-max normalization to ensure consistent fuzzy processing.'
  },
  {
    title: 'Triangular membership functions',
    text: 'Each normalized score is converted into three membership values: Low, Medium, and High using triangular membership functions centered at 25, 50, and 75 respectively.'
  },
  {
    title: 'Rule evaluation',
    text: 'The system evaluates predefined fuzzy rules (e.g., "IF low AND low THEN low attainment"). The strength of each rule is determined by the minimum membership across the rule antecedents.'
  },
  {
    title: 'Defuzzification & classification',
    text: 'Rule outputs are combined using weighted average logic and defuzzified using centroid calculation. The final crisp value maps to Low, Medium, or High attainment classification.'
  }
];

const rules = [
  'Consistently weak marks → Low attainment across assessments',
  'Strong midterm and final scores → Push overall attainment toward High',
  'Mixed performance across assessments → Medium attainment classification',
  'High final score significantly improves overall outcome, even with earlier weak performance',
  'Very low final score limits overall attainment, regardless of earlier strong assessments'
];

const FuzzyPage = () => {
  return (
    <div className="public-page info-page">
      <section className="public-section info-hero">
        <div className="public-container">
          <div className="info-layout">
            <div className="info-copy reveal reveal--1">
              <span className="eyebrow">Fuzzy Logic Engine</span>
              <h1 className="public-title">Transform raw assessment marks into interpretable attainment levels.</h1>
              <p className="public-lead">
                Traditional pass/fail scoring loses important nuance in borderline cases. OBE Assess uses fuzzy logic to normalize exam marks into membership functions (low, medium, high), apply academic rules, and generate crisp attainment scores that are transparent and defensible for any academic audit.
              </p>

              <div className="hero-actions">
                <Link className="public-button" to="/signup">
                  Try the platform
                </Link>
                <Link className="public-button public-button--ghost" to="/">
                  Back to home
                </Link>
              </div>
            </div>

            <div className="formula-card reveal reveal--2">
              <div className="formula-card__header">
                <span className="section-kicker">Backend logic</span>
                <strong>Actual flow used in the app</strong>
              </div>
              <div className="formula-line">1. Normalize marks to 0-100.</div>
              <div className="formula-line">2. Compute triangular memberships for low, medium, and high.</div>
              <div className="formula-line">3. Find rule strength using the minimum membership.</div>
              <div className="formula-line">4. Defuzzify with a centroid across the 0-100 range.</div>
              <div className="formula-line">5. Classify into Low, Medium, or High attainment.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="section-head">
            <span className="section-kicker">How it works</span>
            <h2 className="section-title">A mathematically sound pipeline from raw marks to attainment classification.</h2>
            <p className="section-copy">
              Every step is traceable and defensible. The backend implements industry-standard fuzzy logic with transparent rules, so any reviewer or academic auditor can verify the result logic.
            </p>
          </div>

          <div className="feature-grid">
            {steps.map((item, index) => (
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
              <span className="section-kicker">Why fuzzy logic matters</span>
              <h2 className="section-title">Better accuracy in borderline and mixed-performance cases.</h2>
              <p className="section-copy">
                Consider two students both scoring 58 on a course. One scored low on quizzes but excelled in the final exam. The other was consistent throughout but never strong. Fuzzy logic preserves this performance pattern, leading to fairer and more nuanced outcome assessment.
              </p>

              <div className="info-grid">
                {rules.map((rule) => (
                  <div className="info-card" key={rule}>
                    <strong>{rule}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-panel reveal reveal--2">
              <div className="glass-card glass-card--highlight">
                <span className="section-kicker">Standard attainment bands</span>
                <div className="band-list">
                  <div className="band-list__item">
                    <strong>Low attainment</strong>
                    <span>Fuzzy score: 0–39</span>
                  </div>
                  <div className="band-list__item">
                    <strong>Medium attainment</strong>
                    <span>Fuzzy score: 40–69</span>
                  </div>
                  <div className="band-list__item">
                    <strong>High attainment</strong>
                    <span>Fuzzy score: 70–100</span>
                  </div>
                </div>
                <p className="section-copy">
                  These attainment bands are consistent across all CLO evaluations and dashboards. Risk and alert thresholds are derived from these same bands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FuzzyPage;