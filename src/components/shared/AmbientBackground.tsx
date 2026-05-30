"use client";

import { useEffect, useRef } from "react";

type Orb = {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  color: [number, number, number];
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
};

type Particle = {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let time = 0;
    let orbs: Orb[] = [];
    let particles: Particle[] = [];
    const colors: Array<[number, number, number]> = [
      [74, 158, 255],
      [100, 80, 220],
      [52, 211, 153],
      [167, 139, 250],
      [125, 211, 252],
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const createOrb = (): Orb => {
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 260 + 140,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.25,
        color,
        alpha: Math.random() * 0.055 + 0.02,
        pulseSpeed: Math.random() * 0.006 + 0.002,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    };

    const createParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.12,
      dy: (Math.random() - 0.5) * 0.12,
      alpha: Math.random() * 0.45 + 0.08,
      twinkleSpeed: Math.random() * 0.018 + 0.004,
      twinkleOffset: Math.random() * Math.PI * 2,
    });

    const init = () => {
      resize();
      orbs = Array.from({ length: 6 }, createOrb);
      particles = Array.from({ length: 90 }, createParticle);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      for (const orb of orbs) {
        const pulse =
          1 + Math.sin(time * orb.pulseSpeed * 60 + orb.pulseOffset) * 0.15;
        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius * pulse,
        );

        gradient.addColorStop(
          0,
          `rgba(${orb.color.join(",")},${orb.alpha})`,
        );
        gradient.addColorStop(
          0.5,
          `rgba(${orb.color.join(",")},${orb.alpha * 0.4})`,
        );
        gradient.addColorStop(1, `rgba(${orb.color.join(",")},0)`);
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        orb.x += orb.dx;
        orb.y += orb.dy;

        if (orb.x < -orb.radius) orb.x = width + orb.radius;
        if (orb.x > width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = height + orb.radius;
        if (orb.y > height + orb.radius) orb.y = -orb.radius;
      }

      for (const particle of particles) {
        const twinkle =
          0.5 +
          0.5 *
            Math.sin(
              time * particle.twinkleSpeed * 60 + particle.twinkleOffset,
            );

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${
          particle.alpha * (0.3 + 0.7 * twinkle)
        })`;
        ctx.fill();

        particle.x += particle.dx;
        particle.y += particle.dy;

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }

      frame = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);

    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="bg-image" />
      <div className="bg-overlay" />
      <canvas ref={canvasRef} id="bgCanvas" />
    </>
  );
}
