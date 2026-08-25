import { useEffect, useState } from 'react';

const FORMATTER = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(interval);
  }, []);

  return <span className="taskbar-clock">{now ? FORMATTER.format(now) : ''}</span>;
}
