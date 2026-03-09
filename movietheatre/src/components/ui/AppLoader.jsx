import { useEffect, useState } from 'react';

export default function AppLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.floor(Math.random() * 18) + 5;
        if (next >= 100) { clearInterval(interval); return 100; }
        return next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-loader">
      <div className="loader-logo">
        <i className="fas fa-film"></i>
        <span>Movie<strong>Theatre</strong></span>
      </div>
      <div className="loader-bar">
        <div className="loader-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="loader-pct">{progress}%</p>
    </div>
  );
}
