import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Normalize the raw marks',
    text: 'Quiz, assignment, mid, and final scores are clamped into the 0-100 range before evaluation.'
  },
  {
    title: 'Fuzzify into memberships',
    text: 'Each score becomes low, medium, and high membership values using triangular shapes.'
  },
  {
    title: 'Apply rules',
    text: 'The system takes the minimum matching membership across each rule antecedent.'
  },
  {
    title: 'Defuzzify',
    text: 'The rule outputs are merged with centroid logic to create one crisp fuzzy score.'
  }
];

const rules = [
  'All low marks tend to produce low attainment.',
  'Strong mid and final scores push the output toward high attainment.',
  'Mixed performance usually lands in the medium band.',
  'A high final can still improve the overall score.'
];

const FuzzyPage = () => {
  return (
    <div className="public-page info-page">
      <section className="public-section info-hero">
        <div className="public-container">
          <div className="info-layout">
            <div className="info-copy reveal reveal--1">
              <span className="eyebrow">Fuzzy Logic Engine</span>
              <h1 className="public-title">Why fuzzy scoring is used and how it is calculated.</h1>
              <p className="public-lead">
                Raw marks are not always enough to explain student performance. Fuzzy logic turns exam marks into
                low, medium, and high memberships, then combines them into a score that is easier to interpret.
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
            <h2 className="section-title">The score is explainable from start to finish.</h2>
            <p className="section-copy">
              The backend uses triangular membership functions and a rule base, so the result is not just a hidden
              number. It is the output of a transparent academic scoring pipeline.
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
              <span className="section-kicker">Why fuzzy helps</span>
              <h2 className="section-title">It handles borderline cases better than a rigid pass/fail view.</h2>
              <p className="section-copy">
                Two students can both score 58, but one may have a strong final exam and the other may have weak
                consistency. Fuzzy logic keeps that nuance visible.
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
                <span className="section-kicker">Attainment bands</span>
                <div className="band-list">
                  <div className="band-list__item">
                    <strong>Low</strong>
                    <span>Below 40</span>
                  </div>
                  <div className="band-list__item">
                    <strong>Medium</strong>
                    <span>40 to 69.99</span>
                  </div>
                  <div className="band-list__item">
                    <strong>High</strong>
                    <span>70 and above</span>
                  </div>
                </div>
                <p className="section-copy">
                  This is the same logic the result engine uses when it assigns attainment levels and risk bands.
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