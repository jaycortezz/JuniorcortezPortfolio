/* ==========================================================================
   HERO — Three.js shader backdrop
   A slow, smoky fbm-noise gradient (ink black → ice blue) that drifts
   with time and leans toward the cursor. Falls back to a CSS gradient if
   WebGL or the Three.js CDN is unavailable.
   ========================================================================== */

(function () {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof THREE === "undefined" || reduceMotion) {
    canvas.style.background =
      "radial-gradient(120% 90% at 70% 20%, #122430 0%, #02111b 60%)";
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  } catch (e) {
    canvas.style.background =
      "radial-gradient(120% 90% at 70% 20%, #122430 0%, #02111b 60%)";
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uRes: { value: new THREE.Vector2(1, 1) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uRes;

      // --- simplex-ish value noise + fbm ---
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
              dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
          mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
              dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
          u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = p * 2.05 + vec2(13.7, 7.3);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
        vec2 p = uv * aspect;

        // cursor influence — the smoke leans gently toward the mouse
        vec2 m = uMouse * aspect;
        float pull = smoothstep(0.9, 0.0, distance(p, m));

        float t = uTime * 0.05;
        vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t * 0.7));
        float n = fbm(p * 2.2 + q * 1.4 + pull * 0.35 + t * 0.5);

        // palette: ink black -> deep slate blue -> ice
        vec3 cBase = vec3(0.008, 0.067, 0.106);   // #02111b
        vec3 cMid  = vec3(0.106, 0.180, 0.235);   // deep slate blue
        vec3 cIce  = vec3(0.663, 0.769, 0.831);   // #a9c4d4

        vec3 col = mix(cBase, cMid, smoothstep(0.15, 0.75, n));
        col = mix(col, cIce, smoothstep(0.62, 0.95, n) * 0.5);
        col += cIce * pull * 0.07;

        // vignette to keep type legible
        float vig = smoothstep(1.25, 0.35, distance(uv, vec2(0.5, 0.45)));
        col *= mix(0.55, 1.0, vig);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  // Smoothly eased mouse target
  const target = { x: 0.5, y: 0.5 };
  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX / window.innerWidth;
    target.y = 1.0 - e.clientY / window.innerHeight;
  });

  const clock = new THREE.Clock();
  let inView = true;

  // Skip rendering when the hero is offscreen
  new IntersectionObserver(
    (entries) => { inView = entries[0].isIntersecting; },
    { threshold: 0 }
  ).observe(canvas);

  (function tick() {
    requestAnimationFrame(tick);
    if (!inView) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.x += (target.x - uniforms.uMouse.value.x) * 0.045;
    uniforms.uMouse.value.y += (target.y - uniforms.uMouse.value.y) * 0.045;
    renderer.render(scene, camera);
  })();
})();
