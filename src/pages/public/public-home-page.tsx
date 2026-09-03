import { Link } from 'react-router-dom';
import { packages, products, teamRoles, problems, activationProducts, workflowSteps, campaignFlowNodes, whyBuzzerhood, networkComposition, targetStats } from '@/data/legacy/public-content';
import { PublicNetworkPreview } from '@/features/network/public-network-preview';
import { PartnerRegistrationForm } from '@/features/registration/partner-registration-form';

const tickerItems = [
  { label: 'Network Growth', number: '+18% QoQ' },
  { label: 'Campaign Revenue', number: 'Rp750 Jt/bln' },
  { label: 'Reach', number: '3,365,742+' },
  { label: 'Engagement', number: '4.8%' },
  { label: 'Active Media', number: '23+' },
  { label: 'Active Influencer', number: '101+' },
  { label: 'Repeat Client', number: '34+' },
];

export function PublicHomePage() {
  return (
    <div className="site">
      <PublicNavbar />
      <section className="hero" id="beranda">
        <div className="hero-bg" />
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">BUZZERHOOD NETWORK</p>
            <h1>Media, Influence &amp; Distribution Network</h1>
            <p className="lead">Buzzerhood menghubungkan brand dengan media, KOL, influencer, creator, dan komunitas untuk campaign yang lebih terarah, terukur, dan siap dijalankan.</p>
            <div className="hero-cta">
              <Link className="btn-solid" to="/campaign-request">Diskusikan Campaign</Link>
              <a className="btn-ghost" href="#database">Lihat Network Database</a>
            </div>
          </div>
          <SignalGraphic />
        </div>
        <MetricsTicker />
      </section>

      <section className="position">
        <div className="wrap position-grid reveal">
          <blockquote>
            Buzzerhood dibangun sebagai <span className="hi">distribution infrastructure.</span>
            <br />
            <span className="strike">Bukan sekadar jasa buzzer.</span>
          </blockquote>
          <div className="support">
            <div className="position-photo">
              <div className="photo-tile">
                <img src="https://images.pexels.com/photos/36733315/pexels-photo-36733315.jpeg?auto=compress&cs=tinysrgb&w=900" alt="Tim Buzzerhood menyusun strategi campaign" loading="lazy" />
                <span className="cap">Strategy session — tim campaign</span>
              </div>
            </div>
            <p>Kebanyakan jasa buzzer berhenti di penyebaran pesan. Buzzerhood menata seluruh alur: data jaringan, strategi distribusi, pemilihan partner, monitoring publikasi, sampai reporting.</p>
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">MASALAH YANG KAMI SELESAIKAN</p>
          <h2>Ketika campaign butuh dorongan lebih</h2>
          <p>Buzzerhood hadir untuk brand yang mengalami salah satu, atau beberapa, situasi berikut.</p>
        </div>
        <div className="chip-list reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {problems.map((problem) => (
            <span className="chip" key={problem}>{problem}</span>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="section-head"><p className="eyebrow">OPERATIONAL TEAM</p><h2>Delapan peran, satu campaign</h2></div>
        <div className="team-grid">
          {teamRoles.map((role, index) => (
            <div className="team-cell" key={role}>
              <span className="mark">{String(index + 1).padStart(2, '0')}</span>
              <span className="role">{role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" id="jaringan">
        <div className="head-with-photo">
          <div className="section-head">
            <p className="eyebrow">NETWORK COMPOSITION</p>
            <h2>Satu database, tiga lapisan jaringan</h2>
          </div>
          <div className="photo-row">
            <img src="https://images.pexels.com/photos/7652054/pexels-photo-7652054.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Creator bekerja dengan kamera" loading="lazy" />
            <img src="https://images.pexels.com/photos/7651804/pexels-photo-7651804.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Media sosial dan publikasi" loading="lazy" />
          </div>
        </div>
        <div className="comp-cols">
          {networkComposition.map((item) => (
            <div className="comp-col" key={item.num}>
              <p className="tnum">{item.num}</p>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" id="layanan">
        <div className="section-head"><p className="eyebrow">SERVICES</p><h2>Tujuh cara menyalurkan pesan brand</h2></div>
        <div className="product-list">
          {products.map((product) => (
            <article className="product-row" key={product.name}>
              <div>
                <h3 className="pname">{product.name}</h3>
                <p className="pfreq">{product.freq}</p>
                <p className="pdesc">{product.desc}</p>
              </div>
              <ul>{product.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">PRODUK AKTIVASI</p>
          <h2>Unit aktivasi di dalam setiap layanan</h2>
          <p>Komponen yang bisa dikombinasikan sesuai kebutuhan campaign.</p>
        </div>
        <div className="team-grid reveal">
          {activationProducts.map((item) => (
            <div className="team-cell" key={item.mark}>
              <span className="mark">{item.mark}</span>
              <span className="role">
                {item.name}
                <br />
                <span style={{ fontWeight: 400, color: 'var(--paper-faint)', fontSize: '12.5px', textTransform: 'none' }}>{item.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">CARA KERJA</p>
          <h2>Enam langkah dari konsultasi sampai laporan</h2>
          <p>Proses yang sama untuk setiap skala campaign — lokal maupun nasional.</p>
        </div>
        <div className="pkg-list reveal">
          {workflowSteps.map((step) => (
            <div className="pkg-row" key={step.idx}>
              <div className="pkg-idx">{step.idx}</div>
              <div>
                <div className="pkg-name">{step.name}</div>
                <div className="pkg-sub">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">CAMPAIGN FLOW</p>
          <h2>Dari brand sampai konversi</h2>
          <p>Satu alur distribusi yang menghubungkan seluruh jaringan Buzzerhood.</p>
        </div>
        <div className="flow-chain reveal" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {campaignFlowNodes.map((node, index) => (
            <span key={node}>
              <span className={node === 'Buzzerhood' ? 'fnode hi' : 'fnode'} style={{ display: 'inline-block', padding: '10px 18px', border: '1px solid var(--line-strong)', borderRadius: '999px', fontSize: '13px', fontWeight: 700, color: node === 'Buzzerhood' ? 'var(--orange-2)' : 'var(--paper-dim)' }}>{node}</span>
              {index < campaignFlowNodes.length - 1 && <span className="farrow" style={{ margin: '0 8px', color: 'var(--paper-faint)' }}>→</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="wrap" id="paket">
        <div className="section-head"><p className="eyebrow">PACKAGES</p><h2>Skala campaign, dari lokal sampai nasional</h2></div>
        <div className="pkg-list">
          {packages.map((item, index) => (
            <article className="pkg-row" key={item.name}>
              <span className="pkg-idx">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="pkg-name">{item.name}</h3>
                <p className="pkg-sub">{item.subtitle}</p>
              </div>
              <strong className="pkg-price">{item.price}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">KENAPA BUZZERHOOD</p>
          <h2>Tujuh alasan brand memilih kami</h2>
          <p>Bukan sekadar angka — tapi jaringan yang bisa dipertanggungjawabkan.</p>
        </div>
        <div className="team-grid reveal">
          {whyBuzzerhood.map((item) => (
            <div className="team-cell" key={item.mark}>
              <span className="mark">{item.mark}</span>
              <span className="role">
                {item.name}
                <br />
                <span style={{ fontWeight: 400, color: 'var(--paper-faint)', fontSize: '12.5px', textTransform: 'none' }}>{item.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="target-grid">
          <div>
            <p className="eyebrow">NETWORK TARGET</p>
            <h2>Menuju 5.000 akun digital dalam satu database</h2>
            <p className="lead">MVP menyiapkan fondasi agar jaringan legacy dapat dimigrasikan bertahap ke database buzzerhood, diverifikasi, dan dipakai untuk campaign internal.</p>
          </div>
          <div className="target-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {targetStats.map((stat) => (
              <div key={stat.label}>
                <span className="target-num" style={{ display: 'block', fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 900, fontSize: 'clamp(36px, 4.6vw, 54px)', lineHeight: 1 }}>{stat.num}</span>
                <span className="target-lbl" style={{ display: 'block', marginTop: '10px', fontSize: '13.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicNetworkPreview />
      <PartnerRegistrationForm />

      <section className="wrap cta-final" id="kontak">
        <p className="eyebrow">READY TO DISTRIBUTE?</p>
        <h2>Siap menggerakkan jaringan untuk campaign berikutnya?</h2>
        <p>Buzzerhood menyiapkan infrastruktur distribusi dari strategi sampai laporan.</p>
        <Link className="btn-solid" to="/campaign-request">Mulai Campaign</Link>
      </section>

      <PublicFooter />
    </div>
  );
}

function PublicNavbar() {
  return (
    <header className="nav">
      <Link className="brand" to="/">
        BUZZER<span>HOOD</span>
      </Link>
      <nav aria-label="Navigasi utama">
        <a href="#jaringan">Jaringan</a>
        <a href="#layanan">Layanan</a>
        <a href="#paket">Paket</a>
        <a href="#database">Database</a>
        <a href="#daftar">Daftar Partner</a>
        <a href="#kontak">Kontak</a>
      </nav>
      <Link className="nav-cta" to="/campaign-request">Mulai Campaign</Link>
    </header>
  );
}

function SignalGraphic() {
  return (
    <div className="signal-wrap" aria-label="Ilustrasi jaringan distribusi">
      <div className="pulse" />
      <div className="pulse pulse2" />
      <div className="pulse pulse3" />
      <span className="node node-a">Brand</span>
      <span className="node node-b">Media</span>
      <span className="node node-c">KOL</span>
      <span className="node node-d">Community</span>
      <strong>Distribution OS</strong>
    </div>
  );
}

function MetricsTicker() {
  return (
    <div className="ticker-band" aria-label="Metrik jaringan">
      <div className="ticker-track">
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <span className="tick" key={`${item.label}-${index}`}>
            <strong>{item.number}</strong>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="foot-grid">
      <div>
        <Link className="foot-brand" to="/">
          BUZZER<span>HOOD</span>
        </Link>
        <p>Media, Influence & Distribution Network.</p>
      </div>
      <div className="foot-cols">
        <div>
          <h3>Contact</h3>
          <a href="mailto:hello@dev-buzzerhood.carubra.com">hello@dev-buzzerhood.carubra.com</a>
          <a href="https://dev-buzzerhood.carubra.com">dev-buzzerhood.carubra.com</a>
        </div>
        <div>
          <h3>Product</h3>
          <a href="#layanan">Buzzerhood Buzzer</a>
          <a href="#layanan">Buzzerhood Creator</a>
          <a href="#layanan">Buzzerhood Media</a>
          <a href="#layanan">Buzzerhood Community</a>
        </div>
        <div>
          <h3>Navigate</h3>
          <a href="#jaringan">Jaringan</a>
          <a href="#paket">Paket</a>
          <a href="#database">Database</a>
          <a href="#daftar">Daftar Partner</a>
          <a href="#kontak">Kontak</a>
        </div>
      </div>
      <p className="foot-bottom">© 2026 Buzzerhood. Legacy design preserved for React migration.</p>
    </footer>
  );
}
