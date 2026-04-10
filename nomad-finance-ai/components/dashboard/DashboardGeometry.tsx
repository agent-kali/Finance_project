export function DashboardGeometry() {
  return (
    <>
      <style>{`
        @keyframes dashboardGeoTriangle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(8deg); }
        }
        @keyframes dashboardGeoSquare {
          0%, 100% { transform: translateY(0) rotate(20deg); }
          50% { transform: translateY(-7px) rotate(26deg); }
        }
        @keyframes dashboardGeoPulseTop {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.5; }
        }
        @keyframes dashboardGeoPulseBottom {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.5; }
        }
        .dashboard-geo-triangle {
          animation: dashboardGeoTriangle 12s ease-in-out infinite;
        }
        .dashboard-geo-square {
          transform-origin: 11px 11px;
          animation: dashboardGeoSquare 15s ease-in-out 2s infinite;
        }
        .dashboard-geo-pulse-top {
          animation: dashboardGeoPulseTop 3s ease-in-out infinite;
        }
        .dashboard-geo-pulse-bottom {
          animation: dashboardGeoPulseBottom 4s ease-in-out 1.5s infinite;
        }
      `}</style>

      {/* 1. Floating triangle — top-left */}
      <svg
        className="dashboard-geo-triangle pointer-events-none fixed z-10"
        width={28}
        height={28}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        style={{ top: 120, left: 88, opacity: 0.25 }}
      >
        <polygon points="14,4 24,24 4,24" stroke="#b8956a" strokeWidth={0.8} fill="none" />
      </svg>

      {/* 2. Rotated square — bottom-right */}
      <svg
        className="dashboard-geo-square pointer-events-none fixed z-10"
        width={22}
        height={22}
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        style={{ bottom: 80, right: 32, opacity: 0.2 }}
      >
        <rect x={1} y={1} width={20} height={20} rx={2} stroke="#b8956a" strokeWidth={0.8} fill="none" />
      </svg>

      {/* 3. Horizontal line — left middle */}
      <div
        className="pointer-events-none fixed z-10"
        aria-hidden="true"
        style={{
          top: "45%",
          left: 80,
          width: 36,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(184,149,106,0.4), transparent)",
        }}
      />

      {/* 4. Horizontal line — right */}
      <div
        className="pointer-events-none fixed z-10"
        aria-hidden="true"
        style={{
          top: "32%",
          right: 24,
          width: 28,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(184,149,106,0.35), transparent)",
        }}
      />

      {/* 5. Pulsing dot — top */}
      <div
        className="dashboard-geo-pulse-top pointer-events-none fixed z-10 rounded-full bg-[#b8956a]"
        aria-hidden="true"
        style={{ top: 24, left: "45%", width: 4, height: 4 }}
      />

      {/* 6. Small dot — bottom */}
      <div
        className="dashboard-geo-pulse-bottom pointer-events-none fixed z-10 rounded-full bg-[#b8956a]"
        aria-hidden="true"
        style={{ bottom: 140, left: "38%", width: 3, height: 3 }}
      />
    </>
  );
}
