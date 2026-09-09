import React, { useEffect, useRef } from 'react';

const GalaxyBackground = React.forwardRef<HTMLCanvasElement>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; size: number; speed: number; opacity: number; hue: number }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create stars
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random(),
        hue: Math.random() > 0.7 ? 199 : Math.random() > 0.5 ? 270 : 180,
      });
    }

    // Create floating particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 200,
        hue: Math.random() > 0.5 ? 199 : 270,
      });
    }

    const animate = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      if (isLight) {
        ctx.fillStyle = 'hsl(220, 20%, 97%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Soft ambient gradients for light mode
        const gradient1 = ctx.createRadialGradient(
          canvas.width * 0.3, canvas.height * 0.4, 0,
          canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4
        );
        gradient1.addColorStop(0, 'hsla(270, 70%, 65%, 0.08)');
        gradient1.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient2 = ctx.createRadialGradient(
          canvas.width * 0.7, canvas.height * 0.6, 0,
          canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.3
        );
        gradient2.addColorStop(0, 'hsla(199, 80%, 55%, 0.07)');
        gradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars/particles in light mode
        stars.forEach(star => {
          star.opacity += (Math.random() - 0.5) * 0.02;
          star.opacity = Math.max(0.2, Math.min(1, star.opacity));
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 80%, 35%, ${star.opacity * 0.6})`;
          ctx.fill();

          star.y -= star.speed * 0.2;
          if (star.y < -5) {
            star.y = canvas.height + 5;
            star.x = Math.random() * canvas.width;
          }
        });

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          if (p.life > p.maxLife) {
            p.life = 0;
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * canvas.height;
          }
          const alpha = 1 - p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 80%, 40%, ${alpha * 0.35})`;
          ctx.fill();
        });
      } else {
        ctx.fillStyle = 'hsl(230, 25%, 3%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Nebula clouds
        const gradient1 = ctx.createRadialGradient(
          canvas.width * 0.3, canvas.height * 0.4, 0,
          canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.4
        );
        gradient1.addColorStop(0, 'hsla(270, 60%, 30%, 0.05)');
        gradient1.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient2 = ctx.createRadialGradient(
          canvas.width * 0.7, canvas.height * 0.6, 0,
          canvas.width * 0.7, canvas.height * 0.6, canvas.width * 0.3
        );
        gradient2.addColorStop(0, 'hsla(199, 100%, 50%, 0.03)');
        gradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        stars.forEach(star => {
          star.opacity += (Math.random() - 0.5) * 0.02;
          star.opacity = Math.max(0.2, Math.min(1, star.opacity));
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 100%, 80%, ${star.opacity})`;
          ctx.fill();
          // Glow
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 100%, 60%, ${star.opacity * 0.1})`;
          ctx.fill();
          star.y -= star.speed * 0.2;
          if (star.y < -5) {
            star.y = canvas.height + 5;
            star.x = Math.random() * canvas.width;
          }
        });

        // Draw particles
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          if (p.life > p.maxLife) {
            p.life = 0;
            p.x = Math.random() * canvas.width;
            p.y = Math.random() * canvas.height;
          }
          const alpha = 1 - p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha * 0.5})`;
          ctx.fill();
        });
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />;
});

GalaxyBackground.displayName = 'GalaxyBackground';

export default GalaxyBackground;
