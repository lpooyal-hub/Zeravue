import { useEffect, useRef } from "react";

function buildDrops(width, height, intensity, flow) {
  const diagonal = Math.hypot(width, height);
  const layers = [
    {
      count: Math.round(120 + intensity * 160),
      speed: 380 + flow * 220,
      length: 20 + intensity * 16,
      width: 0.8,
      alpha: 0.16 + intensity * 0.08
    },
    {
      count: Math.round(80 + intensity * 130),
      speed: 520 + flow * 280,
      length: 34 + intensity * 22,
      width: 1.15,
      alpha: 0.24 + intensity * 0.12
    },
    {
      count: Math.round(46 + intensity * 90),
      speed: 700 + flow * 360,
      length: 52 + intensity * 30,
      width: 1.7,
      alpha: 0.34 + intensity * 0.16
    }
  ];

  return layers.flatMap((layer, layerIndex) =>
    Array.from({ length: layer.count }, () => ({
      x: Math.random() * (width + diagonal * 0.16) - diagonal * 0.08,
      y: Math.random() * (height + diagonal * 0.3) - diagonal * 0.15,
      speed: layer.speed * (0.8 + Math.random() * 0.4),
      length: layer.length * (0.7 + Math.random() * 0.45),
      width: layer.width * (0.8 + Math.random() * 0.4),
      alpha: layer.alpha * (0.7 + Math.random() * 0.35),
      drift: 74 + layerIndex * 18 + Math.random() * 22
    }))
  );
}

export function MonsoonRainCanvas({ intensity = 0.56, flow = 0.42 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);
  const dropsRef = useRef([]);
  const metricsRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      metricsRef.current = { width, height, dpr };
      dropsRef.current = buildDrops(width, height, intensity, flow);
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = performance.now();

    const render = (now) => {
      const { width, height } = metricsRef.current;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.globalCompositeOperation = "screen";

      const angle = Math.PI * 0.42;
      const dirX = -Math.cos(angle);
      const dirY = Math.sin(angle);

      dropsRef.current.forEach((drop) => {
        drop.x += dirX * drop.drift * delta;
        drop.y += dirY * drop.speed * delta;

        if (drop.y - drop.length > height + 40 || drop.x < -120) {
          drop.x = Math.random() * (width + 160);
          drop.y = -40 - Math.random() * 220;
        }

        const gradient = context.createLinearGradient(drop.x, drop.y, drop.x + dirX * drop.length, drop.y + dirY * drop.length);
        gradient.addColorStop(0, `rgba(255,255,255,0)`);
        gradient.addColorStop(0.35, `rgba(218,229,235,${drop.alpha * 0.75})`);
        gradient.addColorStop(1, `rgba(255,255,255,${drop.alpha})`);

        context.strokeStyle = gradient;
        context.lineWidth = drop.width;
        context.beginPath();
        context.moveTo(drop.x, drop.y);
        context.lineTo(drop.x + dirX * drop.length, drop.y + dirY * drop.length);
        context.stroke();
      });

      animationRef.current = window.requestAnimationFrame(render);
    };

    animationRef.current = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [flow, intensity]);

  return <canvas ref={canvasRef} className="rain-canvas-layer" aria-hidden="true" />;
}
