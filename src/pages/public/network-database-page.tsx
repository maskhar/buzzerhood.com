import { Link } from 'react-router-dom';
import headerLogo02 from '@/assets/images/buzzerhood-logo-02.png';
import { PublicNetworkPreview } from '@/features/network/public-network-preview';
import './network-database-page.css';

export function NetworkDatabasePage() {
  return <main className="network-database-page"><header><Link to="/home-02"><img src={headerLogo02} alt="Buzzerhood" /></Link><nav><a href="/home-02#beranda-02">Beranda</a><a href="/home-02#layanan-02">Layanan</a><a href="/home-02#paket-02">Paket</a><a href="/home-02#jaringan-02">Jaringan</a><a href="/home-02#studi-kasus-02">Studi Kasus</a><a href="/home-02#tentang-02">Tentang</a></nav><Link to="/home-02">Kembali ke Beranda</Link></header><PublicNetworkPreview /><footer><div><img src={headerLogo02} alt="Buzzerhood" /><span>Ideas People Impact</span></div><nav><b>Menu</b><a href="/home-02#beranda-02">Beranda</a><a href="/home-02#layanan-02">Layanan</a><a href="/home-02#paket-02">Paket</a><a href="/home-02#jaringan-02">Jaringan</a></nav><div><b>Hubungi Kami</b><a href="mailto:hallo@buzzerhood.com">hallo@buzzerhood.com</a><a href="/privacy">Privasi</a><a href="/terms">Syarat &amp; Ketentuan</a></div></footer></main>;
}
