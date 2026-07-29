function DashboardSkeleton() {
  return (
    <div className="dashboard dashboard--analytics">
      <div className="skeleton skeleton--heading" />

      <div className="stats-grid stats-grid--five">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="skeleton skeleton--stat" key={index} />
        ))}
      </div>

      <div className="analytics-grid">
        <div className="skeleton skeleton--chart skeleton--chart-wide" />
        <div className="skeleton skeleton--chart" />
        <div className="skeleton skeleton--chart" />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
