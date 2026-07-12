import MumzoLogo from "@/components/MumzoLogo";

const COLORS = [
  { name: "Pink Deep", role: "Primary · CTAs, links, accents", hex: "#C85277", rgb: "200, 82, 119", tw: "pinkDeep" },
  { name: "Ink Plum", role: "Text & wordmark", hex: "#2D1720", rgb: "45, 23, 32", tw: "ink" },
  { name: "Blush", role: "Soft backgrounds, chips", hex: "#FCE1E6", rgb: "252, 225, 230", tw: "blush" },
  { name: "Rose", role: "Borders & mid-tones", hex: "#F1B3C2", rgb: "241, 179, 194", tw: "rose" },
  { name: "Pink Soft", role: "Section washes", hex: "#FDF1EC", rgb: "253, 241, 236", tw: "pinkSoft" },
  { name: "Cream BG", role: "Page background", hex: "#FEF8F5", rgb: "254, 248, 245", tw: "background" },
];

const VOICE = [
  { tag: "Warm", ex: "Delivered with love · to your doorstep" },
  { tag: "Confident", ex: "The widest baby shelf in your city." },
  { tag: "Playful", ex: "You've joined 22 other mamas on the list." },
  { tag: "Direct", ex: "Set it once. Never think again." },
];

const DOS = [
  "Use the wordmark on cream (#FEF8F5) or white",
  "Give the logo generous clear space",
  "Pair Fraunces italic with Manrope body",
  "Say 'mama' — never 'user', 'customer' or 'lady'",
];
const DONTS = [
  "Don't recolor the wordmark",
  "Don't stretch, skew or outline the logo",
  "Don't use gradients behind the mark",
  "Don't pair with cold blues or neon greens",
];

const DOC_HTML = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Mumzo Brand Book</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #2D1720; line-height: 1.6; padding: 40px; max-width: 900px; margin: auto; }
  h1 { font-size: 42pt; color: #2D1720; margin: 0 0 8pt; font-style: italic; }
  h1 em { color: #C85277; }
  h2 { font-size: 24pt; color: #2D1720; margin: 32pt 0 8pt; border-bottom: 2px solid #F1B3C2; padding-bottom: 6pt; font-style: italic; }
  h3 { font-size: 14pt; color: #C85277; margin: 20pt 0 6pt; text-transform: uppercase; letter-spacing: 2pt; }
  p, li { font-size: 11pt; }
  .eyebrow { font-size: 9pt; letter-spacing: 3pt; color: #C85277; text-transform: uppercase; font-weight: bold; }
  .cover { text-align: center; padding: 80pt 0; background: #FCE1E6; border: 1px solid #F1B3C2; margin-bottom: 40pt; }
  .cover .brand { font-size: 12pt; letter-spacing: 3pt; color: #C85277; text-transform: uppercase; margin-bottom: 20pt; font-weight: bold; }
  .cover h1 { font-size: 60pt; margin-bottom: 24pt; }
  .cover p { font-size: 13pt; color: #666; max-width: 500px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin: 16pt 0; }
  td, th { border: 1px solid #F1B3C2; padding: 12pt; vertical-align: top; text-align: left; font-size: 10pt; }
  th { background: #FCE1E6; font-weight: bold; color: #2D1720; }
  .swatch { width: 60pt; height: 60pt; display: inline-block; border: 1px solid #ddd; vertical-align: middle; margin-right: 8pt; }
  .callout { background: #FDF1EC; padding: 14pt; border-left: 4px solid #C85277; margin: 12pt 0; }
  ul { padding-left: 20pt; }
  .quote { font-style: italic; color: #2D1720; font-size: 14pt; margin: 6pt 0 12pt; }
  .footer { text-align: center; margin-top: 60pt; padding-top: 20pt; border-top: 1px solid #F1B3C2; font-size: 9pt; color: #999; letter-spacing: 2pt; text-transform: uppercase; }
</style></head>
<body>
  <div class="cover">
    <p class="brand">A quick commerce for mumzos</p>
    <h1>The Mumzo <em>Brand Book.</em></h1>
    <p>Everything you need to design for Mumzo — the widest baby shelf in your city. Colors, type, voice, and the small warm touches that make us us.</p>
    <p style="margin-top:24pt;font-size:10pt;letter-spacing:2pt;text-transform:uppercase;color:#999;">Version 1.0 · Hyderabad, India · 2026</p>
  </div>

  <p class="eyebrow">01 · Story</p>
  <h2>Built by moms, for moms.</h2>
  <p>Traditional quick-commerce apps carry a handful of baby SKUs — a couple of sizes and a few known brands. Mumzo is different. We stock the deep, dedicated shelf you'd expect from a baby specialist — hundreds of SKUs, every size, every stage, every essential — and bring it to your door.</p>
  <h3>Mission</h3><p>To be the only shelf a mama ever needs. Everything for baby, one tap away, delivered with love.</p>
  <h3>Vision</h3><p>A world where no mother has to compromise between speed and softness.</p>
  <h3>Voice</h3><p>Warm. Confident. Playful. Direct. We say "mama" — never "user" or "customer".</p>

  <p class="eyebrow">02 · Logo</p>
  <h2>Our mark.</h2>
  <div class="callout"><strong>Clear space:</strong> Give the mark breathing room — at least the height of the "m" on every side. Never crop, tuck under content, or overlap with imagery.</div>
  <div class="callout"><strong>Minimum size:</strong> Use no smaller than 24px (digital) or 12mm (print). Below that, use the mark-only variant.</div>
  <table>
    <tr><th style="width:50%">✓ Do</th><th>✗ Don't</th></tr>
    <tr><td>Use the wordmark on cream (#FEF8F5) or white</td><td>Don't recolor the wordmark</td></tr>
    <tr><td>Give the logo generous clear space</td><td>Don't stretch, skew or outline the logo</td></tr>
    <tr><td>Pair Fraunces italic with Manrope body</td><td>Don't use gradients behind the mark</td></tr>
    <tr><td>Say "mama" — never "user", "customer" or "lady"</td><td>Don't pair with cold blues or neon greens</td></tr>
  </table>

  <p class="eyebrow">03 · Colors</p>
  <h2>Our palette.</h2>
  <table>
    <tr><th>Swatch</th><th>Name</th><th>Role</th><th>HEX</th><th>RGB</th></tr>
    <tr><td><span class="swatch" style="background:#C85277"></span></td><td>Pink Deep</td><td>Primary · CTAs, links, accents</td><td>#C85277</td><td>200, 82, 119</td></tr>
    <tr><td><span class="swatch" style="background:#2D1720"></span></td><td>Ink Plum</td><td>Text & wordmark</td><td>#2D1720</td><td>45, 23, 32</td></tr>
    <tr><td><span class="swatch" style="background:#FCE1E6"></span></td><td>Blush</td><td>Soft backgrounds, chips</td><td>#FCE1E6</td><td>252, 225, 230</td></tr>
    <tr><td><span class="swatch" style="background:#F1B3C2"></span></td><td>Rose</td><td>Borders & mid-tones</td><td>#F1B3C2</td><td>241, 179, 194</td></tr>
    <tr><td><span class="swatch" style="background:#FDF1EC"></span></td><td>Pink Soft</td><td>Section washes</td><td>#FDF1EC</td><td>253, 241, 236</td></tr>
    <tr><td><span class="swatch" style="background:#FEF8F5"></span></td><td>Cream BG</td><td>Page background</td><td>#FEF8F5</td><td>254, 248, 245</td></tr>
  </table>
  <p><em>Pink Deep is the hero — reserve it for CTAs, links and micro-accents. Blush and Pink Soft carry the atmosphere. Ink Plum sets the mood and holds all text.</em></p>

  <p class="eyebrow">04 · Type</p>
  <h2>Our voice, set in letters.</h2>
  <table>
    <tr><th>Role</th><th>Font</th><th>Weights</th><th>Usage</th></tr>
    <tr><td>Editorial · Display</td><td><strong>Fraunces</strong> (Google Fonts)</td><td>300–500 italic</td><td>H1, H2, product & section titles</td></tr>
    <tr><td>Body · UI</td><td><strong>Manrope</strong> (Google Fonts)</td><td>300–700</td><td>Body copy, buttons, eyebrow labels</td></tr>
  </table>
  <h3>Type scale</h3>
  <ul>
    <li><strong>H1 · Hero display</strong> — Fraunces 60–96pt italic</li>
    <li><strong>H2 · Section heading</strong> — Fraunces 36–48pt italic</li>
    <li><strong>H3 · Card & product titles</strong> — Fraunces 24pt</li>
    <li><strong>Body</strong> — Manrope 16px, line-height 1.65</li>
    <li><strong>Eyebrow</strong> — Manrope 12px UPPERCASE, letter-spacing 0.28em, pink deep</li>
  </ul>

  <p class="eyebrow">05 · Voice & Tone</p>
  <h2>How we speak.</h2>
  <h3>Warm</h3><p class="quote">"Delivered with love · to your doorstep"</p>
  <h3>Confident</h3><p class="quote">"The widest baby shelf in your city."</p>
  <h3>Playful</h3><p class="quote">"You've joined 22 other mamas on the list."</p>
  <h3>Direct</h3><p class="quote">"Set it once. Never think again."</p>
  <table>
    <tr><th>✓ We say</th><th>✗ We don't say</th></tr>
    <tr><td>Mama · mumzos · your little one</td><td>User · customer · client</td></tr>
    <tr><td>Delivered with love</td><td>Deals · flash sale · discount code</td></tr>
    <tr><td>One shelf. Impossibly deep.</td><td>Widest range in India (absolute claims)</td></tr>
    <tr><td>From bump to age five</td><td>Buy now · Shop the drop · Grab yours</td></tr>
  </table>

  <p class="eyebrow">06 · Elements</p>
  <h2>Building blocks.</h2>
  <h3>Buttons</h3>
  <ul>
    <li><strong>Primary CTA</strong> — Pink Deep #C85277 pill, white text, Manrope 15px semibold</li>
    <li><strong>Secondary</strong> — White pill with 1px border in #E5CFD3</li>
    <li><strong>Small chip</strong> — Blush background, pink deep text</li>
  </ul>
  <h3>Radii</h3>
  <p>8px (small tags) · 16px (cards) · 24px (large sections) · 9999px (pills, avatars)</p>
  <h3>Spacing</h3>
  <p>Generous. Sections breathe with 64–96px vertical padding. Never crowd — mamas are already busy.</p>

  <div class="footer">
    <p>— with love, mumzo ♡</p>
    <p>Mumzo Brand Book · v1.0 · admin@mumzo.in · Hyderabad · 2026</p>
  </div>
</body>
</html>`;

function downloadDoc() {
  const blob = new Blob(
    ['\ufeff', DOC_HTML],
    { type: 'application/msword;charset=utf-8' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mumzo-brand-book.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BrandBook() {
  return (
    <main data-testid="brand-book" className="bg-background text-foreground min-h-screen font-body">
      <style>{`@media print { .no-print { display: none } .page-break { page-break-before: always } body { background: white } }`}</style>

      {/* Download CTAs */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={downloadDoc}
          data-testid="download-doc"
          className="px-5 py-2.5 rounded-full bg-white border border-border/70 text-sm font-semibold shadow-md hover:border-pinkDeep hover:text-pinkDeep transition-colors"
        >
          Download as Doc ↓
        </button>
        <button
          onClick={() => window.print()}
          data-testid="download-pdf"
          className="px-5 py-2.5 rounded-full bg-pinkDeep text-white text-sm font-semibold shadow-lg hover:bg-[#A93F63]"
        >
          Download as PDF ↓
        </button>
      </div>

      {/* Cover */}
      <section className="min-h-[85vh] flex flex-col justify-between px-8 md:px-20 py-12 md:py-16 bg-gradient-to-br from-blush via-pinkSoft to-background">
        <header className="flex items-center justify-between text-foreground">
          <MumzoLogo height={36} />
          <span className="text-[11px] uppercase tracking-[0.28em] text-pinkDeep font-semibold">Brand Book · 2026</span>
        </header>

        <div className="flex-1 flex flex-col justify-center py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.32em] text-pinkDeep font-semibold">A quick commerce for mumzos</p>
          <h1 className="mt-6 font-editorial text-6xl md:text-8xl leading-[0.98] tracking-tight max-w-4xl">
            The Mumzo <br /> <span className="italic text-pinkDeep">Brand Book.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-foreground/70 leading-relaxed">
            Everything you need to design for Mumzo — the widest baby shelf in your city.
            Colors, type, voice, and the small warm touches that make us us.
          </p>
        </div>

        <footer className="flex items-end justify-between text-[11px] uppercase tracking-widest text-foreground/50">
          <span>Version 1.0</span>
          <span>Hyderabad · India</span>
        </footer>
      </section>

      <div className="page-break" />

      {/* Story */}
      <Section eyebrow="01 · Story" title="Built by moms, for moms.">
        <div className="grid md:grid-cols-2 gap-12">
          <p className="text-lg leading-relaxed text-foreground/75 max-w-lg">
            Traditional quick-commerce apps carry a handful of baby SKUs — a couple of sizes and
            a few known brands. Mumzo is different. We stock the deep, dedicated shelf you'd
            expect from a baby specialist — hundreds of SKUs, every size, every stage, every
            essential — and bring it to your door.
          </p>
          <div className="space-y-6">
            <Value k="Mission" v="To be the only shelf a mama ever needs. Everything for baby, one tap away, delivered with love." />
            <Value k="Vision" v="A world where no mother has to compromise between speed and softness." />
            <Value k="Voice" v="Warm. Confident. Playful. Direct. We say 'mama' — never 'user' or 'customer'." />
          </div>
        </div>
      </Section>

      {/* Logo */}
      <Section eyebrow="02 · Logo" title="Our mark.">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Full lockup */}
          <Panel label="Primary wordmark">
            <div className="bg-background rounded-2xl p-10 flex items-center justify-center min-h-[180px]">
              <MumzoLogo height={64} />
            </div>
          </Panel>
          {/* Mark only */}
          <Panel label="Mark only · for avatars & icons">
            <div className="bg-background rounded-2xl p-10 flex items-center justify-center min-h-[180px]">
              <MumzoLogo variant="mark" height={80} />
            </div>
          </Panel>
          {/* Reversed */}
          <Panel label="On ink background">
            <div className="bg-ink rounded-2xl p-10 flex items-center justify-center min-h-[180px] text-background">
              <MumzoLogo height={64} color="#FEF8F5" accent="#F1B3C2" />
            </div>
          </Panel>
          {/* On brand pink */}
          <Panel label="On pink deep">
            <div className="bg-pinkDeep rounded-2xl p-10 flex items-center justify-center min-h-[180px] text-white">
              <MumzoLogo height={64} color="#FFFFFF" accent="#FEF8F5" />
            </div>
          </Panel>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <Guide title="Clear space" body="Give the mark breathing room — at least the height of the 'm' on every side. Never crop, tuck under content, or overlap with imagery." />
          <Guide title="Minimum size" body="Use no smaller than 24px (digital) or 12mm (print). Below that, use the mark-only variant." />
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <List title="Do" tone="do" items={DOS} />
          <List title="Don't" tone="dont" items={DONTS} />
        </div>
      </Section>

      {/* Colors */}
      <Section eyebrow="03 · Colors" title="Our palette.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COLORS.map((c) => (
            <div key={c.hex} className="rounded-2xl overflow-hidden border border-border/50 bg-white">
              <div className="h-32" style={{ background: c.hex }} />
              <div className="p-4">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-[11px] text-foreground/60 mt-0.5">{c.role}</p>
                <div className="mt-3 space-y-1 text-[11px] font-mono text-foreground/70">
                  <p>HEX · {c.hex}</p>
                  <p>RGB · {c.rgb}</p>
                  <p>TW · {c.tw}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-foreground/60 max-w-2xl">
          Pink Deep is the hero — reserve it for CTAs, links and micro-accents. Blush and Pink
          Soft carry the atmosphere. Ink Plum sets the mood and holds all text. Avoid using
          more than one warm neutral in the same layout.
        </p>
      </Section>

      {/* Typography */}
      <Section eyebrow="04 · Type" title="Our voice, set in letters.">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="p-8 rounded-3xl bg-white border border-border/50">
            <p className="text-xs uppercase tracking-widest text-pinkDeep font-semibold">Editorial · Display</p>
            <p className="mt-3 font-editorial text-6xl italic leading-none">Fraunces</p>
            <p className="mt-4 text-sm text-foreground/60">Google Fonts · variable italic · 300–500 weight</p>
            <div className="mt-6 space-y-2">
              <p className="font-editorial text-3xl">Everything for baby.</p>
              <p className="font-editorial text-2xl italic text-pinkDeep">Delivered with love.</p>
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-white border border-border/50">
            <p className="text-xs uppercase tracking-widest text-pinkDeep font-semibold">Body · UI</p>
            <p className="mt-3 font-body text-6xl leading-none tracking-tight">Manrope</p>
            <p className="mt-4 text-sm text-foreground/60">Google Fonts · 300–700 weight · UI, buttons, paragraphs</p>
            <div className="mt-6 space-y-2">
              <p className="font-body text-lg">The widest baby shelf in your city.</p>
              <p className="font-body text-sm text-foreground/60">Hundreds of SKUs, every size, every stage.</p>
            </div>
          </div>
        </div>

        {/* Ramp */}
        <div className="mt-10 p-8 rounded-3xl bg-pinkSoft border border-border/50">
          <p className="text-xs uppercase tracking-widest text-foreground/55 font-semibold mb-6">Type scale</p>
          <div className="space-y-4">
            <Ramp size="text-6xl md:text-8xl" font="font-editorial" note="H1 · Hero display">Mumzo</Ramp>
            <Ramp size="text-4xl md:text-6xl" font="font-editorial italic" note="H2 · Section heading">delivered with love</Ramp>
            <Ramp size="text-2xl md:text-3xl" font="font-editorial" note="H3 · Card & product titles">Mom of Kabir</Ramp>
            <Ramp size="text-base" font="font-body" note="Body · 16px · leading 1.65">A quick-commerce store built for moms.</Ramp>
            <Ramp size="text-xs uppercase tracking-widest" font="font-body font-semibold text-pinkDeep" note="Eyebrow · 12px · 0.28em tracking">Now shopping in Hyderabad</Ramp>
          </div>
        </div>
      </Section>

      {/* Voice */}
      <Section eyebrow="05 · Voice & Tone" title="How we speak.">
        <div className="grid md:grid-cols-2 gap-4">
          {VOICE.map((v) => (
            <div key={v.tag} className="p-6 rounded-2xl bg-white border border-border/50">
              <p className="text-xs uppercase tracking-widest text-pinkDeep font-semibold">{v.tag}</p>
              <p className="mt-3 font-editorial italic text-2xl leading-tight">"{v.ex}"</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <List title="We say" tone="do" items={[
            "Mama · mumzos · your little one",
            "Delivered with love",
            "One shelf. Impossibly deep.",
            "From bump to age five",
          ]} />
          <List title="We don't say" tone="dont" items={[
            "User · customer · client",
            "Deals · flash sale · discount code",
            "Widest range in India (avoid absolute claims)",
            "Buy now · Shop the drop · Grab yours",
          ]} />
        </div>
      </Section>

      {/* Elements */}
      <Section eyebrow="06 · Elements" title="Building blocks.">
        <div className="grid md:grid-cols-2 gap-8">
          <Panel label="Buttons">
            <div className="p-8 bg-background rounded-2xl flex flex-wrap gap-3 min-h-[180px] items-center">
              <button className="px-6 py-3 rounded-full bg-pinkDeep text-white text-sm font-semibold">Primary CTA</button>
              <button className="px-6 py-3 rounded-full bg-white border border-border text-sm font-semibold">Secondary</button>
              <button className="px-4 py-2 rounded-full bg-blush border border-rose text-pinkDeep text-xs font-semibold">Small chip</button>
            </div>
          </Panel>
          <Panel label="Chips & tags">
            <div className="p-8 bg-background rounded-2xl flex flex-wrap gap-2 min-h-[180px] items-center">
              <span className="px-4 py-1.5 rounded-full bg-blush border border-rose/40 text-xs text-pinkDeep font-semibold">Bestseller</span>
              <span className="px-4 py-1.5 rounded-full bg-white border border-border text-xs">Newborn 0–3M</span>
              <span className="px-4 py-1.5 rounded-full bg-pinkDeep text-white text-xs font-bold">20% OFF</span>
              <span className="px-4 py-1.5 rounded-full bg-pinkSoft border border-border text-xs text-foreground/70">All sizes</span>
            </div>
          </Panel>
          <Panel label="Cards">
            <div className="p-6 bg-background rounded-2xl">
              <div className="rounded-2xl bg-white border border-border/60 p-5">
                <p className="text-[10px] uppercase tracking-widest text-pinkDeep font-semibold">Nestlé</p>
                <p className="mt-2 font-medium">Cerelac Rice (6M+)</p>
                <p className="text-xs text-foreground/60">300 g</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-semibold">₹275 <span className="text-xs text-foreground/45 line-through ml-1">₹320</span></p>
                  <button className="px-4 py-1.5 rounded-full bg-pinkDeep text-white text-xs font-semibold">+ Add</button>
                </div>
              </div>
            </div>
          </Panel>
          <Panel label="Radii & spacing">
            <div className="p-8 bg-background rounded-2xl grid grid-cols-4 gap-3 min-h-[180px] items-center">
              {[8, 16, 24, 999].map((r) => (
                <div key={r} className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-pinkDeep" style={{ borderRadius: r }} />
                  <span className="text-[10px] text-foreground/60">{r === 999 ? "pill" : `${r}px`}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Section>

      {/* Closing */}
      <section className="px-8 md:px-20 py-24 text-center bg-gradient-to-br from-blush via-pinkSoft to-background border-t border-border/50">
        <MumzoLogo height={40} />
        <h2 className="mt-8 font-editorial text-4xl md:text-6xl italic leading-none">— with love, mumzo ♡</h2>
        <p className="mt-6 text-sm text-foreground/60">
          Questions? Write to <a href="mailto:admin@mumzo.in" className="text-pinkDeep font-semibold">admin@mumzo.in</a>
        </p>
        <p className="mt-16 text-[11px] uppercase tracking-[0.28em] text-foreground/40">
          Mumzo Brand Book · v1.0 · Hyderabad, 2026
        </p>
      </section>
    </main>
  );
}

const Section = ({ eyebrow, title, children }) => (
  <section className="px-8 md:px-20 py-16 md:py-24 border-t border-border/40">
    <p className="text-xs uppercase tracking-[0.3em] text-pinkDeep font-semibold">{eyebrow}</p>
    <h2 className="mt-4 font-editorial text-4xl md:text-6xl leading-[1.03] tracking-tight max-w-3xl">{title}</h2>
    <div className="mt-10">{children}</div>
  </section>
);

const Value = ({ k, v }) => (
  <div className="pt-4 border-t border-border/50">
    <p className="text-[11px] uppercase tracking-widest text-pinkDeep font-semibold">{k}</p>
    <p className="mt-2 text-base leading-relaxed">{v}</p>
  </div>
);

const Panel = ({ label, children }) => (
  <div>
    <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold mb-3">{label}</p>
    <div className="rounded-3xl border border-border/50 p-2 bg-pinkSoft">{children}</div>
  </div>
);

const Guide = ({ title, body }) => (
  <div className="p-6 rounded-2xl bg-white border border-border/50">
    <p className="text-[11px] uppercase tracking-widest text-pinkDeep font-semibold">{title}</p>
    <p className="mt-3 text-sm leading-relaxed text-foreground/75">{body}</p>
  </div>
);

const List = ({ title, items, tone }) => (
  <div className="p-6 rounded-2xl bg-white border border-border/50">
    <p className={`text-[11px] uppercase tracking-widest font-semibold ${tone === "do" ? "text-pinkDeep" : "text-destructive"}`}>{title}</p>
    <ul className="mt-4 space-y-2.5 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className={`mt-0.5 ${tone === "do" ? "text-pinkDeep" : "text-destructive"}`}>{tone === "do" ? "✓" : "✗"}</span>
          <span className="text-foreground/80">{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Ramp = ({ size, font, children, note }) => (
  <div className="flex items-baseline gap-6">
    <span className={`${size} ${font} leading-none`}>{children}</span>
    <span className="text-[11px] text-foreground/50 uppercase tracking-widest whitespace-nowrap">{note}</span>
  </div>
);
