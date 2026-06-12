# Junior Cortez — Cinematic Videography Portfolio

A single-page, award-style portfolio experience for videographer **Junior Cortez**
(Wedding · Commercial · Corporate), built with vanilla HTML/CSS/JS — no build step.

## Tech

| Layer | Tool |
|---|---|
| Animation | [GSAP 3](https://gsap.com) + ScrollTrigger (CDN) |
| Smooth scroll | [Lenis](https://lenis.darkroom.engineering) (CDN) |
| WebGL hero | [Three.js](https://threejs.org) custom fbm-noise shader (CDN) |
| Type | Archivo Black (headings) · Syne · Inter · Cormorant Garamond (Google Fonts) |

## Experience highlights

- **Preloader** — the signature writes itself in lockstep with the 0–100% counter, then flies into its nav slot as the curtains open
- **Signature logo** — Junior's handwritten mark (`assets/logo.png`), also writes in on scroll in the footer
- **Three.js hero** — mouse-reactive smoky gradient shader (ink black → ice blue), camera-HUD framing (REC dot, live timecode), per-character title reveal
- **Custom cursor** — eased dot + ring with contextual `VIEW` / `PLAY` states
- **Magnetic elements** — logo, menu button, CTAs pull toward the cursor with elastic release
- **Fullscreen menu** — curtain wipe, staggered links, scramble-text hover
- **Velocity marquee** — speeds up with scroll velocity
- **Manifesto** — word-by-word scrub reveal + animated stat counters
- **Selected Work** — pinned horizontal scroll gallery with per-card parallax (swipeable row on mobile)
- **Services** — accordion rows with hover slide and ice-blue highlight
- **Showreel** — scrub-scales into frame, click to play with sound
- **Film grain** overlay, `prefers-reduced-motion` respected throughout, graceful fallbacks when WebGL/CDNs are unavailable

## Run it

It's a static site — open `index.html`, or serve it:

```bash
npx serve .          # or
python3 -m http.server 8000
```

## Replace the placeholders

Everything marked below is demo content for Junior to swap:

1. **Showreel video** — `index.html`, `#showreelVideo` `src` + `poster` (currently a Google sample clip)
2. **Project films** — each Work card carries `data-video` (YouTube ID) and `data-title`; cards open in the on-site lightbox player
3. **Email / socials** — `hello@juniorcortez.film` and Instagram/Vimeo/YouTube links (menu + footer)
4. **Stats** — `data-counter` values in the Manifesto section
5. **Contact form backend** — set `FORM_ENDPOINT` at the bottom of `js/main.js`
   to a [Formspree](https://formspree.io) (or similar) URL. Until then the form
   validates client-side and opens the visitor's mail client pre-filled.
