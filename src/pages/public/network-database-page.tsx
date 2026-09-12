import { Link } from 'react-router-dom';
import headerLogo02 from '@/assets/images/buzzerhood-logo-02.png';
import { PublicNetworkPreview } from '@/features/network/public-network-preview';
import './network-database-page.css';

export function NetworkDatabasePage() {
  return <main className="network-database-page"><header><Link to="/home-02"><img src={headerLogo02} alt="Buzzerhood" /></Link><Link to="/home-02">Kembali ke Beranda</Link></header><PublicNetworkPreview /></main>;
}
