
    (() => {
      const canvas = document.getElementById('bloom-canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      const status = document.getElementById('status');
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let width = 0;
      let height = 0;
      let pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
      let lastTime = performance.now();
      let lastBloom = 0;
      let previousPoint = null;
      let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
      let pointerUntil = 0;
      let frame = 0;
      const blooms = [];
      const pollen = [];
      const lotusPalette = ['#fff2fb', '#ffb5e3', '#eb6fb9', '#9a2d86'];

      function resize() {
        pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
        width = innerWidth;
        height = innerHeight;
        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if (blooms.length || pollen.length) wake();
      }

      function wake() {
        if (reducedMotion) return;
        canvas.classList.add('active');
        if (!frame) frame = requestAnimationFrame(paint);
      }

      function bloom(x, y, power = 1) {
        if (reducedMotion) return;
        blooms.push({
          x, y,
          born: performance.now(),
          life: 980 + Math.random() * 220,
          radius: (76 + Math.random() * 22) * power,
          rotation: -Math.PI / 2 + (Math.random() - .5) * .18
        });
        if (blooms.length > 3) blooms.shift();
        wake();
      }

      function scatter(x, y, amount = 8) {
        for (let i = 0; i < amount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = .25 + Math.random() * 1.25;
          pollen.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 1.35 + .45,
            born: performance.now(),
            life: 620 + Math.random() * 300,
            color: Math.random() > .55 ? '#ffd9ef' : '#ffc0df'
          });
        }
        if (pollen.length > 36) pollen.splice(0, pollen.length - 36);
        wake();
      }

      function lotusPetal(cx, cy, angle, length, width, alpha, inner = false) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.globalAlpha = alpha;
        const glow = ctx.createLinearGradient(0, 0, length, 0);
        glow.addColorStop(0, inner ? lotusPalette[3] : lotusPalette[2]);
        glow.addColorStop(.52, lotusPalette[1]);
        glow.addColorStop(1, lotusPalette[0]);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.moveTo(-length * .1, 0);
        ctx.bezierCurveTo(length * .2, -width * .55, length * .61, -width, length, 0);
        ctx.bezierCurveTo(length * .61, width, length * .2, width * .55, -length * .1, 0);
        ctx.fill();
        ctx.restore();
      }

      function drawLotus(flower, now) {
        const age = (now - flower.born) / flower.life;
        if (age >= 1) return false;
        const open = 1 - Math.pow(1 - Math.min(age * 2.35, 1), 3);
        const fade = age < .66 ? 1 : 1 - (age - .66) / .34;
        const pulse = 1 + Math.sin(age * Math.PI) * .05;
        ctx.save();
        for (let i = 0; i < 11; i++) {
          const angle = flower.rotation + (Math.PI * 2 * i / 11);
          lotusPetal(flower.x, flower.y, angle, flower.radius * open * pulse, flower.radius * .28 * open, fade * .84);
        }
        for (let i = 0; i < 7; i++) {
          const angle = flower.rotation + .19 + (Math.PI * 2 * i / 7);
          lotusPetal(flower.x, flower.y, angle, flower.radius * .62 * open, flower.radius * .17 * open, fade * .82, true);
        }
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#fff7fc';
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, Math.max(3, flower.radius * .1 * open), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      }

      function paint(now) {
        frame = 0;
        const delta = Math.min((now - lastTime) / 16.67, 2.5);
        lastTime = now;
        ctx.clearRect(0, 0, width, height);

        for (let i = blooms.length - 1; i >= 0; i--) {
          if (!drawLotus(blooms[i], now)) blooms.splice(i, 1);
        }

        ctx.save();
        for (let i = pollen.length - 1; i >= 0; i--) {
          const grain = pollen[i];
          const age = (now - grain.born) / grain.life;
          if (age >= 1) { pollen.splice(i, 1); continue; }
          grain.x += grain.vx * delta;
          grain.y += grain.vy * delta;
          grain.vx *= .985;
          grain.vy *= .985;
          ctx.globalAlpha = (1 - age) * .9;
          ctx.fillStyle = grain.color;
          ctx.beginPath();
          ctx.arc(grain.x, grain.y, grain.size * (1 - age * .45), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (now < pointerUntil) {
          ctx.save();
          const ring = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 24);
          ring.addColorStop(0, 'rgba(255, 238, 249, .7)');
          ring.addColorStop(.24, 'rgba(255, 160, 218, .18)');
          ring.addColorStop(1, 'rgba(255, 160, 218, 0)');
          ctx.fillStyle = ring;
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, 32, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (blooms.length || pollen.length || now < pointerUntil) {
          frame = requestAnimationFrame(paint);
        } else {
          canvas.classList.remove('active');
        }
      }

      addEventListener('pointermove', (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        const now = performance.now();
        pointerUntil = now + 90;
        const distance = previousPoint ? Math.hypot(event.clientX - previousPoint.x, event.clientY - previousPoint.y) : 99;
        if (distance > 46 && now - lastBloom > 145) {
          bloom(event.clientX, event.clientY, Math.min(1.22, .9 + distance / 210));
          if (Math.random() > .45) scatter(event.clientX, event.clientY, 3);
          lastBloom = now;
          previousPoint = { x: event.clientX, y: event.clientY };
        }
        wake();
      }, { passive: true });

      addEventListener('pointerleave', () => { pointerUntil = 0; });
      addEventListener('blur', () => { pointerUntil = 0; });
      addEventListener('resize', resize, { passive: true });
      addEventListener('pointerdown', (event) => {
        if (reducedMotion) return;
        bloom(event.clientX, event.clientY, 1.55);
        scatter(event.clientX, event.clientY, 14);
      }, { passive: true });

      document.querySelector('.install').addEventListener('click', () => {
        status.classList.add('show');
        bloom(innerWidth * .5, innerHeight * .5, 1.8);
        scatter(innerWidth * .5, innerHeight * .5, 18);
        setTimeout(() => status.classList.remove('show'), 2800);
      });

      resize();
    })();