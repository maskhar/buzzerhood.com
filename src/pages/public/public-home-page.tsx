import { Link } from 'react-router-dom';
import { useEffect, useState, type MouseEvent } from 'react';
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
  useSectionReveal();

  return (
    <div className="site">
      <PublicNavbar />
      <main>
      <section className="hero" id="beranda">
        <div className="hero-bg" />
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">DIGITAL INFLUENCE, MEDIA &amp; COMMUNITY NETWORK</p>
            <h1>Media, Influence &amp; Distribution Network</h1>
            <p className="lead">Buzzerhood menghubungkan brand, media online, influencer, content creator, komunitas, dan audiens untuk menjalankan campaign secara terukur — bukan sekadar menambah like, comment, atau views.</p>
            <p className="lead hero-tagline">Amplify the Message. Build the Conversation. Create the Impact.</p>
            <div className="hero-cta">
              <Link className="btn-solid" to="/campaign-request">Diskusikan Campaign</Link>
              <a className="btn-ghost" href="/" onClick={(event) => { event.preventDefault(); document.getElementById('database')?.scrollIntoView({ behavior: 'smooth' }); }}>Lihat Network Database</a>
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
            <p>Kebanyakan jasa &quot;buzzer&quot; berhenti di satu campaign lalu selesai. Buzzerhood dibangun sebagai jaringan permanen — media, kreator, dan komunitas yang sama terus dipakai ulang, diukur performanya, dan makin efisien setiap campaign berikutnya.</p>
            <p>Satu database, satu tim operasional, satu standar pelaporan — untuk media blast, KOL campaign, digital PR, sampai monitoring reputasi.</p>
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
        <div className="head-with-photo reveal">
          <div className="section-head">
            <p className="eyebrow">TIM OPERASIONAL</p>
            <h2>Delapan peran, satu campaign</h2>
            <p>Setiap campaign dikerjakan oleh tim lintas fungsi — dari riset jaringan sampai pelaporan sentimen.</p>
          </div>
          <div className="photo-tile"><img src="https://images.pexels.com/photos/7643897/pexels-photo-7643897.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Tim Buzzerhood berdiskusi" loading="lazy" /><span className="cap">Cross-function team</span></div>
        </div>
        <div className="team-grid reveal">
          {teamRoles.map((role, index) => (
            <div className="team-cell" key={role}>
              <span className="mark">{String(index + 1).padStart(2, '0')}</span>
              <span className="role">{role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" id="jaringan">
        <div className="section-head reveal">
            <p className="eyebrow">KOMPOSISI JARINGAN</p>
            <h2>Satu database, empat lapisan jaringan</h2>
            <p>Media, creator, komunitas, dan buzzer network — dikurasi dan diperbarui terus-menerus.</p>
        </div>
        <div className="comp-cols cols-4 reveal">
          {networkComposition.map((item) => (
            <div className="comp-col" key={item.num}>
              <div className="photo-tile"><img src={item.image} alt={item.alt} loading="lazy" /></div>
              <h3>{item.title}</h3>
              <div className="chip-list">{item.items.map((entry) => <span className="chip" key={entry}>{entry}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap" id="layanan">
        <div className="head-with-photo reveal">
          <div className="section-head">
            <p className="eyebrow">LAYANAN UTAMA</p>
            <h2>Tujuh lini layanan Buzzerhood</h2>
            <p>Dari aktivasi organik sampai campaign custom — dipilih sesuai kebutuhan dan skala brand.</p>
          </div>
          <div className="photo-tile"><img src="https://images.pexels.com/photos/7652054/pexels-photo-7652054.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Tim menyusun layanan campaign" loading="lazy" /></div>
        </div>
        <div className="product-list reveal">
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
        <div className="team-grid activation-grid reveal">
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
        <div className="workflow-grid reveal">
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
        <div className="target reveal">
          <div className="target-photo photo-tile"><img src="https://images.pexels.com/photos/36766687/pexels-photo-36766687.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Tim Buzzerhood" loading="lazy" /></div>
          <div className="section-head"><p className="eyebrow">TARGET JARINGAN 2027</p><h2>Menuju 5.000 akun digital dalam satu database</h2><p>Empat kategori jaringan yang terus dikurasi setiap bulan.</p></div>
          <div className="target-grid">{targetStats.map((stat) => <div key={stat.label}><div className="target-num">{stat.num}</div><div className="target-lbl">{stat.label}</div></div>)}</div>
          <div className="target-fields"><p>Data utama per akun</p><div className="field-chips">{['Nama / Brand','Username IG/TikTok/YouTube','Location','Followers','Engagement','Category','Tier','Rate','Contact','Status','Campaign History'].map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="target-fields"><p>Target client Buzzerhood</p><div className="field-chips">{['Brand / Corporate','UMKM','Government','Agency','Event Organizer','Startup','Public Figure','Musician / Artist','Property','Hospitality','F&B','Tourism','Education'].map((item) => <span key={item}>{item}</span>)}</div></div>
        </div>
      </section>

      <PublicNetworkPreview />
      <PartnerRegistrationForm />

      <section className="wrap cta-final" id="kontak">
        <p className="eyebrow">READY TO DISTRIBUTE?</p>
        <h2>Siap menggerakkan jaringan untuk campaign berikutnya?</h2>
        <p>Ceritakan target dan budget campaign — tim Buzzerhood akan menyusun kombinasi media, kreator, dan komunitas yang paling relevan.</p>
        <div className="hero-cta"><a className="btn-solid" href="mailto:hello@dev-buzzerhood.carubra.com">hello@dev-buzzerhood.carubra.com</a><a className="btn-ghost" href="https://dev-buzzerhood.carubra.com">dev-buzzerhood.carubra.com</a></div>
        <div className="cta-photos photo-row cols-3"><div className="photo-tile"><img src="https://images.pexels.com/photos/13835575/pexels-photo-13835575.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Creator" loading="lazy" /></div><div className="photo-tile"><img src="https://images.pexels.com/photos/7651734/pexels-photo-7651734.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Tim campaign" loading="lazy" /></div><div className="photo-tile"><img src="https://images.pexels.com/photos/9287491/pexels-photo-9287491.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Komunitas" loading="lazy" /></div></div>
      </section>

      <PublicFooter />
      </main>
    </div>
  );
}

function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    closeMenu();
  };

  return (
    <header className="nav">
      <Link className="brand" to="/">
        BUZZER<span>HOOD</span>
      </Link>
      <button className="nav-toggle" type="button" aria-expanded={isOpen} aria-controls="public-navigation" onClick={() => setIsOpen((open) => !open)}>
        <span className="sr-only">{isOpen ? 'Tutup' : 'Buka'} navigasi</span>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <nav className={isOpen ? 'is-open' : undefined} id="public-navigation" aria-label="Navigasi utama">
        <a href="/" onClick={(event) => scrollToSection(event, 'jaringan')}>Jaringan</a>
        <a href="/" onClick={(event) => scrollToSection(event, 'layanan')}>Layanan</a>
        <a href="/" onClick={(event) => scrollToSection(event, 'paket')}>Paket</a>
        <a href="/" onClick={(event) => scrollToSection(event, 'database')}>Database</a>
        <a href="/" onClick={(event) => scrollToSection(event, 'daftar')}>Daftar Partner</a>
        <a href="/" onClick={(event) => scrollToSection(event, 'kontak')}>Kontak</a>
      </nav>
      <Link className="nav-cta" to="/campaign-request">Mulai Campaign</Link>
    </header>
  );
}

function useSectionReveal() {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('main > section')];
    sections.forEach((section) => section.classList.add('reveal-on-scroll'));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting)),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
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
        {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
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
  return <footer className="public-footer"><div className="wrap"><div className="footer-main"><div className="footer-brand-block"><Link className="foot-brand" to="/">BUZZER<span>HOOD</span></Link><p>Media, influence &amp; distribution network. Bagian dari grup Utero Kreatif Indonesia.</p></div><div className="foot-cols"><div><h3>Layanan</h3><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('layanan')?.scrollIntoView({ behavior: 'smooth' }); }}>Media Blast</a><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('layanan')?.scrollIntoView({ behavior: 'smooth' }); }}>KOL Campaign</a><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('layanan')?.scrollIntoView({ behavior: 'smooth' }); }}>Digital PR</a><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('layanan')?.scrollIntoView({ behavior: 'smooth' }); }}>Brand Reputation</a></div><div><h3>Perusahaan</h3><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('jaringan')?.scrollIntoView({ behavior: 'smooth' }); }}>Jaringan</a><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('paket')?.scrollIntoView({ behavior: 'smooth' }); }}>Paket</a><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('database')?.scrollIntoView({ behavior: 'smooth' }); }}>Database</a><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('daftar')?.scrollIntoView({ behavior: 'smooth' }); }}>Daftar Partner</a><a href="/" onClick={(event) => { event.preventDefault(); window.history.replaceState(null, '', window.location.pathname + window.location.search); document.getElementById('kontak')?.scrollIntoView({ behavior: 'smooth' }); }}>Kontak</a></div></div></div><div className="foot-bottom"><span>Buzzerhood Media · Buzzerhood Creator · Buzzerhood Community · Buzzerhood Organic · Buzzerhood Adsense · Buzzerhood Custom · Buzzerhood Mix</span><div><span>© 2026 Buzzerhood — PT Utero Kreatif Indonesia.</span><span>Malang, Jawa Timur, Indonesia.</span></div></div></div></footer>;
}
