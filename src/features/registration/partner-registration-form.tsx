import { useState } from 'react';

type PartnerCategory = 'media' | 'influencer' | 'komunitas' | 'buzzer';

export function PartnerRegistrationForm() {
  const [activeTab, setActiveTab] = useState<PartnerCategory>('media');
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    whatsapp: '',
    kota: '',
    pesan: '',
    consent: false,
  });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.consent) {
      setMessage('Harap setujui penggunaan data terlebih dahulu.');
      return;
    }
    const form = e.currentTarget;
    const formValues = new FormData(form);
    const data: Record<string, string> = {};
    formValues.forEach((value, key) => {
      data[key] = value.toString();
    });
    data.category = activeTab;
    
    // Temporary mailto fallback
    const subject = `Partner Registration - ${activeTab}`;
    const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
    window.location.href = `mailto:partner@dev-buzzerhood.carubra.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    setSuccess(true);
    setMessage('Formulir akan dikirim via email. Tim kami akan menghubungi dalam 2×24 jam kerja.');
  }

  return (
    <section id="daftar" className="db-section">
      <div className="wrap">
        <div className="section-head reveal">
          <p className="eyebrow">PROGRAM PARTNER</p>
          <h2>Gabung ke Buzzerhood Network</h2>
          <p>Terbuka untuk media online, influencer, content creator, komunitas, dan buzzer/digital activator. Partner mendaftar → diverifikasi tim kami → masuk database → mendapat opportunity campaign.</p>
        </div>

        <div className="mini-steps reveal" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <span className="fnode" style={{ border: '1px solid var(--line-strong)', borderRadius: '999px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--paper-dim)' }}>1. Daftar</span>
          <span style={{ color: 'var(--paper-faint)' }}>→</span>
          <span className="fnode" style={{ border: '1px solid var(--line-strong)', borderRadius: '999px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--paper-dim)' }}>2. Verifikasi</span>
          <span style={{ color: 'var(--paper-faint)' }}>→</span>
          <span className="fnode" style={{ border: '1px solid var(--line-strong)', borderRadius: '999px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--paper-dim)' }}>3. Masuk Database</span>
          <span style={{ color: 'var(--paper-faint)' }}>→</span>
          <span className="fnode hi" style={{ border: '1px solid var(--orange)', borderRadius: '999px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--orange-2)', background: 'rgba(255,90,31,0.1)' }}>4. Opportunity Campaign</span>
        </div>

        <div className="reveal">
          <div className="pform-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button type="button" className={activeTab === 'media' ? 'pform-tab active' : 'pform-tab'} onClick={() => setActiveTab('media')} style={{ padding: '12px 20px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: activeTab === 'media' ? 'var(--orange)' : 'transparent', color: activeTab === 'media' ? 'var(--ink)' : 'var(--paper-dim)', fontWeight: 700, cursor: 'pointer' }}>Media Online</button>
            <button type="button" className={activeTab === 'influencer' ? 'pform-tab active' : 'pform-tab'} onClick={() => setActiveTab('influencer')} style={{ padding: '12px 20px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: activeTab === 'influencer' ? 'var(--orange)' : 'transparent', color: activeTab === 'influencer' ? 'var(--ink)' : 'var(--paper-dim)', fontWeight: 700, cursor: 'pointer' }}>Influencer / Creator</button>
            <button type="button" className={activeTab === 'komunitas' ? 'pform-tab active' : 'pform-tab'} onClick={() => setActiveTab('komunitas')} style={{ padding: '12px 20px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: activeTab === 'komunitas' ? 'var(--orange)' : 'transparent', color: activeTab === 'komunitas' ? 'var(--ink)' : 'var(--paper-dim)', fontWeight: 700, cursor: 'pointer' }}>Komunitas</button>
            <button type="button" className={activeTab === 'buzzer' ? 'pform-tab active' : 'pform-tab'} onClick={() => setActiveTab('buzzer')} style={{ padding: '12px 20px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: activeTab === 'buzzer' ? 'var(--orange)' : 'transparent', color: activeTab === 'buzzer' ? 'var(--ink)' : 'var(--paper-dim)', fontWeight: 700, cursor: 'pointer' }}>Buzzer / Digital Activator</button>
          </div>

          <div className="pform-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-l)', padding: '32px' }}>
            {message && <div className="form-msg" style={{ padding: '14px', marginBottom: '20px', borderRadius: 'var(--radius-m)', background: success ? 'rgba(111,207,151,0.12)' : 'rgba(255,179,71,0.12)', color: success ? 'var(--good)' : 'var(--signal)' }}>{message}</div>}

            {!success && (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Nama Lengkap / Nama Brand <span style={{ color: 'var(--orange)' }}>*</span></span>
                    <input type="text" name="nama" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} placeholder="Nama kamu atau nama brand/media" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Email <span style={{ color: 'var(--orange)' }}>*</span></span>
                    <input type="email" name="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="nama@email.com" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>No. WhatsApp <span style={{ color: 'var(--orange)' }}>*</span></span>
                    <input type="tel" name="whatsapp" required value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="08xxxxxxxxxx" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Kota / Domisili <span style={{ color: 'var(--orange)' }}>*</span></span>
                    <input type="text" name="kota" required value={formData.kota} onChange={(e) => setFormData({ ...formData, kota: e.target.value })} placeholder="Malang, Surabaya, dll" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
                  </label>
                </div>

                {activeTab === 'media' && <MediaFields />}
                {activeTab === 'influencer' && <InfluencerFields />}
                {activeTab === 'komunitas' && <KomunitasFields />}
                {activeTab === 'buzzer' && <BuzzerFields />}

                <label style={{ display: 'grid', gap: '6px', marginTop: '24px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Pesan Tambahan (opsional)</span>
                  <textarea name="pesan" value={formData.pesan} onChange={(e) => setFormData({ ...formData, pesan: e.target.value })} placeholder="Ceritakan hal lain yang perlu tim Buzzerhood tahu..." rows={4} style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)', resize: 'vertical' }} />
                </label>

                <label style={{ display: 'flex', alignItems: 'start', gap: '10px', marginTop: '20px', cursor: 'pointer' }}>
                  <input type="checkbox" name="consent" checked={formData.consent} onChange={(e) => setFormData({ ...formData, consent: e.target.checked })} style={{ marginTop: '3px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--paper-dim)' }}>Saya setuju data ini digunakan Buzzerhood untuk keperluan verifikasi dan kerja sama campaign. <span style={{ color: 'var(--orange)' }}>*</span></span>
                </label>

                <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button type="submit" className="btn-solid">Kirim Pendaftaran</button>
                  <span style={{ fontSize: '12.5px', color: 'var(--paper-faint)', textAlign: 'center' }}>Tim kami akan menghubungi lewat email/WhatsApp dalam 2×24 jam kerja.</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MediaFields() {
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper-faint)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detail Media</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Nama Media / Website <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="text" name="media_nama" required placeholder="Nama media atau portal" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Link Website <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="url" name="media_link" required placeholder="https://namamedia.com" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Kategori Media</span>
          <select name="media_kategori" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }}>
            <option>Media Online Nasional</option>
            <option>Media Online Lokal / Regional</option>
            <option>Portal Berita</option>
            <option>Media Niche / Komunitas</option>
            <option>Blog</option>
            <option>Lainnya</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Rata-rata Pengunjung / Bulan</span>
          <select name="media_traffic" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }}>
            <option>&lt; 10 ribu / bulan</option>
            <option>10 – 50 ribu / bulan</option>
            <option>50 – 150 ribu / bulan</option>
            <option>150 – 500 ribu / bulan</option>
            <option>&gt; 500 ribu / bulan</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function InfluencerFields() {
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper-faint)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detail Influencer / Creator</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Nama / Brand Akun <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="text" name="inf_nama" required placeholder="Nama akun / brand personal" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Username / Handle Utama <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="text" name="inf_handle" required placeholder="@handle" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Jumlah Followers / Subscribers <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="number" name="inf_followers" required placeholder="cth. 15000" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Kecenderungan Konten / Niche</span>
          <select name="inf_niche" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }}>
            <option>Food & Kuliner</option>
            <option>Lifestyle</option>
            <option>Beauty & Fashion</option>
            <option>Travel</option>
            <option>Event & Hiburan</option>
            <option>Olahraga</option>
            <option>Gadget & Teknologi</option>
            <option>Parenting & Keluarga</option>
            <option>Otomotif</option>
            <option>Komunitas Umum</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Rate per Konten</span>
          <select name="inf_rate" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }}>
            <option>&lt; Rp1 Juta</option>
            <option>Rp1 – 3 Juta</option>
            <option>Rp3 – 7 Juta</option>
            <option>Rp7 – 15 Juta</option>
            <option>Rp15 – 30 Juta</option>
            <option>&gt; Rp30 Juta</option>
            <option>Nego / Barter</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Link Portfolio / Media Kit (opsional)</span>
          <input type="url" name="inf_portfolio" placeholder="https://..." style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
      </div>
      <div style={{ marginTop: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)', display: 'block', marginBottom: '10px' }}>Platform Utama <span style={{ color: 'var(--orange)' }}>*</span></span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Threads', 'Lainnya'].map((platform) => (
            <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid var(--line-strong)', borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>
              <input type="checkbox" name="inf_platform" value={platform} />
              {platform}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function KomunitasFields() {
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper-faint)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detail Komunitas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Nama Komunitas <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="text" name="kom_nama" required placeholder="Nama komunitas" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Jumlah Anggota <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="number" name="kom_anggota" required placeholder="cth. 500" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Jenis Komunitas</span>
          <select name="kom_jenis" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }}>
            <option>Komunitas Kreatif</option>
            <option>Komunitas Mahasiswa</option>
            <option>Komunitas Musik</option>
            <option>Komunitas Olahraga</option>
            <option>Komunitas Otomotif</option>
            <option>Komunitas Gaming</option>
            <option>Komunitas Lifestyle</option>
            <option>Komunitas UMKM</option>
            <option>Komunitas Lokal</option>
            <option>Fanbase</option>
            <option>Lainnya</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Rate Aktivasi</span>
          <select name="kom_rate" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }}>
            <option>&lt; Rp1 Juta</option>
            <option>Rp1 – 3 Juta</option>
            <option>Rp3 – 7 Juta</option>
            <option>Rp7 – 15 Juta</option>
            <option>&gt; Rp15 Juta</option>
            <option>Nego / Barter</option>
          </select>
        </label>
      </div>
      <div style={{ marginTop: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)', display: 'block', marginBottom: '10px' }}>Platform Utama Komunitas</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['Instagram', 'WhatsApp Group', 'Discord', 'TikTok', 'Lainnya'].map((platform) => (
            <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid var(--line-strong)', borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>
              <input type="checkbox" name="kom_platform" value={platform} />
              {platform}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuzzerFields() {
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper-faint)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detail Buzzer / Digital Activator</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Nama / Username Aktif <span style={{ color: 'var(--orange)' }}>*</span></span>
          <input type="text" name="buz_nama" required placeholder="Nama atau username" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Jumlah Akun Dikelola (opsional)</span>
          <input type="number" name="buz_akun" placeholder="cth. 5" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }} />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>Rate per Task</span>
          <select name="buz_rate" style={{ padding: '12px 14px', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-m)', background: 'var(--ink)', color: 'var(--paper)' }}>
            <option>&lt; Rp50 Ribu</option>
            <option>Rp50 – 150 Ribu</option>
            <option>Rp150 – 500 Ribu</option>
            <option>&gt; Rp500 Ribu</option>
            <option>Nego</option>
          </select>
        </label>
      </div>
      <div style={{ marginTop: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)', display: 'block', marginBottom: '10px' }}>Platform Aktif <span style={{ color: 'var(--orange)' }}>*</span></span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['Instagram', 'TikTok', 'X (Twitter)', 'Threads', 'Lainnya'].map((platform) => (
            <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid var(--line-strong)', borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>
              <input type="checkbox" name="buz_platform" value={platform} />
              {platform}
            </label>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)', display: 'block', marginBottom: '10px' }}>Jenis Aktivitas</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['Like', 'Comment', 'Share', 'View', 'Reply', 'Hashtag'].map((activity) => (
            <label key={activity} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid var(--line-strong)', borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--paper-dim)' }}>
              <input type="checkbox" name="buz_aktivitas" value={activity} />
              {activity}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
