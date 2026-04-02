import { Link } from 'react-router-dom';

const StatCard = ({ label, value, subtitle, to }) => {
  const content = (
    <>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {subtitle ? <small className="muted">{subtitle}</small> : null}
      {to ? <div className="stat-link-text">Open details →</div> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="card stat-card stat-card-link">
        {content}
      </Link>
    );
  }

  return <div className="card stat-card">{content}</div>;
};

export default StatCard;
