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

export const problems = [
  'Konten sepi engagement',
  'Campaign kurang mendapat perhatian',
  'Produk baru sulit dikenal',
  'Traffic social media rendah',
  'Butuh jangkauan lebih luas',
  'Awareness brand masih minim',
] as const;

export const activationProducts = [
  { mark: '01', name: 'Social Engagement', desc: 'Like · Comment · Share · Save · View · Follow · Mention' },
  { mark: '02', name: 'Marketplace', desc: 'Review · Rating · Product Interaction · Traffic' },
  { mark: '03', name: 'Trending & Conversation', desc: 'Hashtag & Keyword Activation · Comment Activation' },
  { mark: '04', name: 'Live Activation', desc: 'Live Viewer · Live Comment · Webinar Participant' },
] as const;

export const workflowSteps = [
  { idx: '01', name: 'Consult', desc: 'Client menyampaikan kebutuhan dan target campaign.' },
  { idx: '02', name: 'Strategy', desc: 'Tim menentukan channel, audience, jaringan, dan metode campaign.' },
  { idx: '03', name: 'Network Matching', desc: 'Memilih media, influencer, creator, buzzer, atau komunitas yang sesuai.' },
  { idx: '04', name: 'Campaign', desc: 'Campaign mulai dijalankan sesuai timeline.' },
  { idx: '05', name: 'Monitoring', desc: 'Tim memantau publikasi, engagement, dan sentimen campaign.' },
  { idx: '06', name: 'Report', desc: 'Client menerima laporan lengkap dengan data dan insight campaign.' },
] as const;

export const campaignFlowNodes = [
  'Brand',
  'Buzzerhood',
  'Media',
  'Creator',
  'Komunitas',
  'Buzzer',
  'Audiens',
  'Konversi',
] as const;

export const whyBuzzerhood = [
  { mark: '1', name: 'Human Network', desc: 'Mengutamakan jaringan manusia & akun aktif.' },
  { mark: '2', name: 'Multi Channel', desc: 'Campaign berjalan lintas platform.' },
  { mark: '3', name: 'Scalable', desc: 'Dari skala lokal hingga nasional.' },
  { mark: '4', name: 'Targeted', desc: 'Jaringan dipilih sesuai kebutuhan campaign.' },
  { mark: '5', name: 'Transparent', desc: 'Laporan lengkap dengan data terukur.' },
  { mark: '6', name: 'Operational Team', desc: 'Tim dedicated untuk setiap campaign.' },
  { mark: '7', name: 'Network Database', desc: 'Akses ke database 5.000+ akun digital.' },
] as const;

export const products = [
  { name: 'Buzzerhood Buzzer', freq: 'Social engagement activation', desc: 'Aktivasi engagement organik menggunakan jaringan buzzer untuk memperbesar reach dan conversation.', items: ['Like, comment, share & view', 'Hashtag & trending activation', 'Social media campaign', 'Product launch', 'Event & awareness campaign'] },
  { name: 'Buzzerhood Creator', freq: 'Nano → Mega influencer', desc: 'Campaign menggunakan influencer dan content creator, dari nano hingga mega.', items: ['Content creation & review', 'Story, Reels, TikTok', 'Live & product experience'] },
  { name: 'Buzzerhood Media', freq: 'Press · Placement · Digital PR', desc: 'Distribusi informasi melalui jaringan media online, lokal, dan nasional.', items: ['Press release & media placement', 'Media blast & article publication', 'Digital PR'] },
  { name: 'Buzzerhood Community', freq: 'Community-based activation', desc: 'Aktivasi campaign melalui jaringan komunitas dan interest group.', items: ['Event & product activation', 'Sampling & gathering', 'Campaign movement'] },
  { name: 'Buzzerhood Adsense', freq: 'Meta · TikTok · Google · YouTube', desc: 'Memperbesar jangkauan campaign melalui paid distribution di berbagai channel.', items: ['Meta & Instagram Ads', 'TikTok & YouTube Ads', 'Google Ads'] },
  { name: 'Buzzerhood Custom', freq: 'Tailored campaign', desc: 'Campaign dirancang berdasarkan kebutuhan khusus client.', items: ['Political & public campaign', 'Product launching & event activation', 'Corporate & social movement'] },
  { name: 'Buzzerhood Mix', freq: 'Media + Creator + Community + Buzzer + Ads', desc: 'Menggabungkan beberapa jaringan sekaligus untuk jangkauan maksimal.', items: ['Kombinasi lintas jaringan', 'Strategi terintegrasi', 'Jangkauan lebih luas'] },
] as const;

export const packages = [
  { name: 'Local Campaign', subtitle: 'Jangkauan kota/lokal', price: 'Rp15–50 Jt' },
  { name: 'Regional Campaign', subtitle: 'Jangkauan provinsi/regional', price: 'Rp50–150 Jt' },
  { name: 'National Campaign', subtitle: 'Jangkauan nasional', price: 'Rp150–500 Jt' },
  { name: 'Integrated Influence Campaign', subtitle: 'Kombinasi penuh media + KOL + komunitas', price: 'Rp500 Jt–2 M+' },
  { name: 'Monthly PR Retainer', subtitle: 'Kontrak bulanan berkelanjutan', price: 'Rp25–150 Jt/bln' },
] as const;

export const networkComposition = [
  { num: '01', title: 'Media & Publisher', desc: 'Akun media, website, dan public figure untuk memperluas exposure campaign.' },
  { num: '02', title: 'KOL & Influencer', desc: 'Creator dengan audiens spesifik dari nano sampai mega tier.' },
  { num: '03', title: 'Community Network', desc: 'Komunitas lokal dan niche untuk conversation serta credibility layer.' },
] as const;

export const targetStats = [
  { num: '5.000', label: 'target akun' },
  { num: '124', label: 'record legacy' },
  { num: '7', label: 'platform kategori' },
] as const;
