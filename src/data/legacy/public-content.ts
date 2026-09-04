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
  'Launching butuh exposure',
  'Marketplace minim review',
  'Event / live streaming sepi partisipan',
  'Press release kurang tersebar',
  'Butuh percakapan digital',
  'Sulit menjangkau komunitas tertentu',
  'Butuh influencer dalam jumlah besar',
  'Butuh media online untuk publikasi',
  'Butuh campaign serentak di banyak channel',
] as const;

export const activationProducts = [
  { mark: '01', name: 'Social Engagement', desc: 'Like · Comment · Share · Save · View · Follow · Mention' },
  { mark: '02', name: 'Marketplace', desc: 'Review · Rating · Product Interaction · Traffic' },
  { mark: '03', name: 'Trending & Conversation', desc: 'Hashtag & Keyword Activation · Comment Activation' },
  { mark: '04', name: 'Live Activation', desc: 'Live Viewer · Live Comment · Webinar Participant' },
  { mark: '05', name: 'Creator Campaign', desc: 'KOL · Influencer · Reviewer · Affiliate' },
  { mark: '06', name: 'Media Publication', desc: 'Press Release · Media Placement · Media Blast · Digital PR' },
  { mark: '07', name: 'Community Activation', desc: 'Event Participant · Offline Activation · Sampling' },
  { mark: '08', name: 'Digital Advertising', desc: 'Meta · TikTok · Google · YouTube Ads' },
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
  'Influencer',
  'Community',
  'Buzzer',
  'Content Distribution',
  'Reach',
  'Conversation',
  'Engagement',
  'Traffic',
  'Conversion',
] as const;

export const whyBuzzerhood = [
  { mark: '1', name: 'Human Network', desc: 'Mengutamakan jaringan manusia & akun aktif.' },
  { mark: '2', name: 'Multi Channel', desc: 'Campaign berjalan lintas platform.' },
  { mark: '3', name: 'Scalable', desc: 'Dari skala lokal hingga nasional.' },
  { mark: '4', name: 'Targeted', desc: 'Jaringan dipilih sesuai kebutuhan campaign.' },
  { mark: '5', name: 'Fast Activation', desc: 'Diaktivasi langsung dari database jaringan.' },
  { mark: '6', name: 'Measurable', desc: 'Aktivitas dipantau & dilaporkan.' },
  { mark: '7', name: 'One Network', desc: 'Media, creator, community, buzzer — satu ekosistem.' },
  { mark: '8', name: 'Transparent', desc: 'Laporan lengkap dengan data terukur.' },
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
  { num: '01', title: 'Media Network', image: 'https://images.pexels.com/photos/7651804/pexels-photo-7651804.jpeg?auto=compress&cs=tinysrgb&w=700', alt: 'Jaringan media', items: ['Media Online', 'Media Lokal', 'Media Nasional', 'Media Niche', 'Portal Berita', 'Media Kuliner', 'Media Wisata', 'Media Teknologi'] },
  { num: '02', title: 'Creator Network', image: 'https://images.pexels.com/photos/13835575/pexels-photo-13835575.jpeg?auto=compress&cs=tinysrgb&w=700', alt: 'Creator network', items: ['Nano Influencer', 'Micro Influencer', 'Mid-tier Influencer', 'Macro Influencer', 'Mega Influencer', 'TikTok Creator', 'YouTuber', 'KOL'] },
  { num: '03', title: 'Community Network', image: 'https://images.pexels.com/photos/9287491/pexels-photo-9287491.jpeg?auto=compress&cs=tinysrgb&w=700', alt: 'Community network', items: ['Komunitas Kreatif', 'Komunitas Mahasiswa', 'Komunitas Musik', 'Komunitas Olahraga', 'Komunitas Otomotif', 'Komunitas Gaming', 'Komunitas UMKM', 'Fanbase'] },
  { num: '04', title: 'Buzzer Network', image: 'https://images.pexels.com/photos/6770610/pexels-photo-6770610.jpeg?auto=compress&cs=tinysrgb&w=700', alt: 'Buzzer network', items: ['Like', 'Comment', 'Share', 'View', 'Reply', 'Mention', 'Hashtag', 'Conversation'] },
] as const;

export const targetStats = [
  { num: '1.000', label: 'media online' },
  { num: '2.000', label: 'influencer / creator' },
  { num: '500', label: 'komunitas' },
  { num: '5.000', label: 'digital accounts network' },
] as const;
