const StatCard = ({ label, value, subtitle }) => {
  return (
    <div className="card stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {subtitle ? <small className="muted">{subtitle}</small> : null}
    </div>
  );
};

export default StatCard;
