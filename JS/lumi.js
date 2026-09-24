
    (() => {
      const garden = document.querySelector('[data-impact-garden]');
      const canvas = document.getElementById('impact-canvas');
      const ambientOrbElement = document.querySelector('.ambient-orb');
      const ctx = canvas.getContext('2d', { alpha: true });
      const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const impacts = [];
      const colors = ['#e3f1ff', '#b6d9ff', '#80baff', '#4f94f4', '#79cfff'];
      let width = 0;
      let height = 0;
      let pixelRatio = 1;
      let frame = 0;
      let lastBloom = 0;
      let lastPoint = null;
      const ambient = { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0 };
      let inView = false;

      function sizeCanvas() {
        const rect = garden.getBoundingClientRect();
        pixelRatio = Math.min(devicePixelRatio || 1, 1.25);
        width = Math.round(rect.width);
        height = Math.round(rect.height);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }

      function wake() {
        if (prefersReducedMotion || !inView) return;
        if (!frame) frame = requestAnimationFrame(paint);
      }

      function easeOut(value) { return 1 - Math.pow(1 - value, 3); }

      function makeFragments(count) {
        return Array.from({ length: count }, () => {
          const angle = Math.random() * Math.PI * 2;
          return {
            angle,
            distance: 22 + Math.random() * 148,
            length: 3 + Math.random() * 11,
            width: Math.random() > .82 ? 2.2 : 1.15,
            tilt: (Math.random() - .5) * .78,
            delay: Math.random() * .21,
            color: colors[Math.floor(Math.random() * colors.length)],
            dot: Math.random() > .64,
            spark: Math.random() > .8
          };
        });
      }

      function addImpact(x, y, strength = 1) {
        if (prefersReducedMotion || !inView) return;
        if (impacts.length >= 6) return;
        impacts.push({
          x, y,
          start: performance.now(),
          life: 1120 + Math.random() * 180,
          scale: strength,
          fragments: makeFragments(22)
        });
        wake();
      }

      function drawImpact(impact, now) {
        const age = Math.max(0, (now - impact.start) / impact.life);
        if (age >= 1) return false;
        const bloom = easeOut(Math.min(age * 1.85, 1));
        const fade = age < .64 ? 1 : 1 - ((age - .64) / .36);
        ctx.save();
        ctx.lineCap = 'round';
        for (const fragment of impact.fragments) {
          const local = Math.max(0, (age - fragment.delay) / (1 - fragment.delay));
          if (local === 0) continue;
          const travel = fragment.distance * (.17 + .83 * easeOut(Math.min(local * 1.25, 1))) * impact.scale;
          const x = impact.x + Math.cos(fragment.angle) * travel;
          const y = impact.y + Math.sin(fragment.angle) * travel * .76;
          const length = fragment.length * (.38 + .62 * local) * impact.scale;
          const direction = fragment.angle + fragment.tilt;
          ctx.globalAlpha = fade * (.28 + .64 * local);
          ctx.strokeStyle = fragment.color;
          ctx.lineWidth = fragment.width;
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(direction) * length / 2, y - Math.sin(direction) * length / 2);
          ctx.lineTo(x + Math.cos(direction) * length / 2, y + Math.sin(direction) * length / 2);
          ctx.stroke();
          if (fragment.dot) {
            ctx.fillStyle = fragment.color;
            ctx.beginPath();
            ctx.arc(x, y, fragment.width * (fragment.spark ? 1.22 : .7), 0, Math.PI * 2);
            ctx.fill();
          }
          if (fragment.spark && local < .58) {
            const sparkLength = length * (1.5 - local);
            ctx.globalAlpha = fade * (1 - local) * .55;
            ctx.lineWidth = .8;
            ctx.beginPath();
            ctx.moveTo(x - Math.cos(direction) * sparkLength, y - Math.sin(direction) * sparkLength);
            ctx.lineTo(x + Math.cos(direction) * sparkLength, y + Math.sin(direction) * sparkLength);
            ctx.stroke();
          }
        }
        ctx.restore();
        return true;
      }

      function updateAmbientOrb() {
        ambient.vx += (ambient.targetX - ambient.x) * .032;
        ambient.vy += (ambient.targetY - ambient.y) * .032;
        ambient.vx *= .82;
        ambient.vy *= .82;
        ambient.x += ambient.vx;
        ambient.y += ambient.vy;
        ambientOrbElement.style.transform = `translate3d(${ambient.x.toFixed(2)}px, ${ambient.y.toFixed(2)}px, 0)`;
        return Math.abs(ambient.targetX - ambient.x) > .08 || Math.abs(ambient.targetY - ambient.y) > .08 || Math.hypot(ambient.vx, ambient.vy) > .04;
      }

      function paint(now) {
        frame = 0;
        ctx.clearRect(0, 0, width, height);
        for (let index = impacts.length - 1; index >= 0; index--) {
          if (!drawImpact(impacts[index], now)) impacts.splice(index, 1);
        }
        const ambientMoving = updateAmbientOrb();
        if (impacts.length) canvas.classList.add('active');
        else canvas.classList.remove('active');
        if (impacts.length || ambientMoving) {
          frame = requestAnimationFrame(paint);
        } else {
          canvas.classList.remove('active');
        }
      }

      garden.addEventListener('pointermove', (event) => {
        if (!inView || prefersReducedMotion) return;
        const bounds = garden.getBoundingClientRect();
        const now = performance.now();
        const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        ambient.targetX = ((point.x / width) - .5) * 94;
        // Keep the orb tucked above the card: lower pointer positions nudge it upward,
        // so its top edge never drops into view.
        ambient.targetY = -Math.max(0, ((point.y / height) - .5) * 58);
        const distance = lastPoint ? Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) : 90;
        if (distance > 58 && now - lastBloom > 145) {
          addImpact(point.x, point.y, Math.min(1.18, .82 + distance / 260));
          lastPoint = point;
          lastBloom = now;
        }
        wake();
      }, { passive: true });

      garden.addEventListener('pointerleave', () => {
        lastPoint = null;
        ambient.targetX = 0;
        ambient.targetY = 0;
        wake();
      });
      garden.addEventListener('pointerdown', (event) => {
        if (!inView || prefersReducedMotion) return;
        const bounds = garden.getBoundingClientRect();
        addImpact(event.clientX - bounds.left, event.clientY - bounds.top, 1.35);
      }, { passive: true });

      new ResizeObserver(sizeCanvas).observe(garden);
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        if (!inView) {
          impacts.length = 0;
          ambient.x = 0;
          ambient.y = 0;
          ambient.targetX = 0;
          ambient.targetY = 0;
          ambient.vx = 0;
          ambient.vy = 0;
          ambientOrbElement.style.transform = 'translate3d(0, 0, 0)';
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          ctx.clearRect(0, 0, width, height);
          canvas.classList.remove('active');
        }
      }, { threshold: .12 }).observe(garden);
      sizeCanvas();
    })();
