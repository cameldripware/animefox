import { useEffect, useRef } from 'react';

export default function SakuraParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const petalCount = 30;
    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';

      const size = Math.random() * 12 + 8;
      const left = Math.random() * 100;
      const duration = Math.random() * 10 + 12;
      const delay = Math.random() * 15;
      const rotation = Math.random() * 60 + 10;
      const scale = Math.random() * 0.5 + 0.7;

      petal.style.cssText = `
        width: ${size}px !important;
        height: ${size * 1.3}px !important;
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        transform: rotate(${rotation}deg) scale(${scale});
      `;

      container.appendChild(petal);
    }
  }, []);

  return <div ref={containerRef} className="sakura-container" />;
}