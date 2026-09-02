export const teamRoles = [
  'Network Manager',
  'Media Relation',
  'Influencer Relation',
  'Campaign Manager',
  'Content Planner',
  'Social Media Specialist',
  'Data Analyst',
  'Monitoring Team',
] as const;

export const products = [
  { name: 'Media Blast', frequency: '100–1.000 media/network', description: 'Distribusi rilis ke ratusan hingga ribuan media dan akun jaringan sekaligus, untuk awareness cepat.', items: ['Local & national media', 'Publisher network'] },
  { name: 'KOL Campaign', frequency: 'Influencer campaign', description: 'Campaign terkurasi bersama KOL dan influencer yang audiensnya cocok dengan brand.', items: ['Micro & macro influencer', 'Brief & performance report'] },
  { name: 'Digital PR', frequency: 'Publication · News · Reputation', description: 'Publikasi berita, distribusi rilis, dan pengelolaan reputasi digital jangka panjang.', items: ['Press distribution', 'Reputation management'] },
  { name: 'Creator Campaign', frequency: 'TikTok · Instagram · YouTube', description: 'Konten native yang diproduksi langsung oleh kreator di platform masing-masing.', items: ['Konten sesuai gaya platform', 'Kreator terverifikasi'] },
  { name: 'Community Amplification', frequency: 'Community-based campaign', description: 'Menggerakkan komunitas untuk menyebarkan pesan secara organik dan kredibel.', items: ['500+ komunitas jaringan', 'Engagement terarah'] },
  { name: 'Social Conversation', frequency: 'Organic conversation campaign', description: 'Membangun percakapan organik di media sosial tanpa terasa seperti iklan.', items: ['Seeding percakapan', 'Monitoring respons'] },
  { name: 'Brand Reputation', frequency: 'Monitoring · Sentiment · Strategy', description: 'Memantau sentimen digital brand dan menyusun strategi respons yang tepat.', items: ['Digital monitoring', 'Sentiment analysis', 'Response strategy'] },
] as const;

export const packages = [
  { name: 'Local Campaign', subtitle: 'Jangkauan kota/lokal', price: 'Rp15–50 Jt' },
  { name: 'Regional Campaign', subtitle: 'Jangkauan provinsi/regional', price: 'Rp50–150 Jt' },
  { name: 'National Campaign', subtitle: 'Jangkauan nasional', price: 'Rp150–500 Jt' },
  { name: 'Integrated Influence Campaign', subtitle: 'Kombinasi penuh media + KOL + komunitas', price: 'Rp500 Jt–2 M+' },
  { name: 'Monthly PR Retainer', subtitle: 'Kontrak bulanan berkelanjutan', price: 'Rp25–150 Jt/bln' },
] as const;
