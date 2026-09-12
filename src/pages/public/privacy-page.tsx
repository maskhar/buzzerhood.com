import { Link } from 'react-router-dom';
import headerLogo02 from '@/assets/images/buzzerhood-logo-02.png';
import './privacy-page.css';
import './terms-page.css';

type PrivacySection = { title: string; paragraphs: string[]; items?: string[] };

const sections: PrivacySection[] = [
  { title: '1. Tentang Kebijakan Ini', paragraphs: ['Kebijakan Privasi ini menjelaskan cara Buzzerhood mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi data pribadi ketika Anda mengakses situs, menghubungi kami, mendaftar sebagai partner, atau menggunakan layanan campaign kami. Buzzerhood bertindak sebagai pengendali data pribadi untuk pemrosesan yang dijelaskan dalam kebijakan ini, kecuali dinyatakan lain dalam perjanjian layanan.'] },
  { title: '2. Data Pribadi yang Kami Kumpulkan', paragraphs: ['Kami dapat mengumpulkan kategori data berikut sesuai interaksi Anda dengan Buzzerhood:', 'Kami meminta agar Anda tidak mengirimkan data pribadi yang tidak relevan dengan layanan.'], items: ['Data identitas, seperti nama, nama pengguna, foto profil, dan tanggal lahir jika diperlukan.', 'Data kontak, seperti alamat email, nomor telepon atau WhatsApp, kota, dan alamat.', 'Data pekerjaan dan organisasi, seperti perusahaan, jabatan, industri, serta hubungan dengan brand atau partner.', 'Data campaign, seperti brief, anggaran, target audiens, materi, konten, persetujuan, publikasi, dan laporan performa.', 'Data akun dan keamanan, seperti identitas akun, status akses, waktu masuk, serta catatan aktivitas keamanan.', 'Data teknis, seperti alamat IP, perangkat, browser, sistem operasi, halaman yang dikunjungi, dan cookie.', 'Komunikasi melalui formulir, email, WhatsApp, dukungan, survei, atau kanal resmi lainnya.'] },
  { title: '3. Sumber Data', paragraphs: ['Data dapat kami peroleh langsung dari Anda, dari organisasi yang Anda wakili, dari partner yang terlibat dalam campaign, dari aktivitas Anda pada layanan, atau dari sumber publik dan penyedia layanan yang sah. Jika Anda memberikan data milik orang lain, Anda bertanggung jawab memastikan bahwa Anda berwenang memberikannya.'] },
  { title: '4. Tujuan dan Dasar Pemrosesan', paragraphs: ['Kami memproses data pribadi secara terbatas untuk tujuan berikut:', 'Pemrosesan didasarkan pada persetujuan, pelaksanaan kontrak, kewajiban hukum, kepentingan yang sah dengan mempertimbangkan hak Anda, atau dasar lain yang dibenarkan peraturan.'], items: ['Menanggapi pertanyaan, proposal, dan permintaan layanan.', 'Mengelola akun, partner, campaign, konten, publikasi, pembayaran, dan laporan.', 'Melaksanakan kontrak atau langkah sebelum terbentuknya kontrak.', 'Mengirim komunikasi operasional dan, jika diizinkan, informasi pemasaran.', 'Memverifikasi identitas, mencegah penyalahgunaan, dan menjaga keamanan.', 'Meningkatkan kualitas serta fungsi layanan.', 'Memenuhi kewajiban hukum, audit, sengketa, dan permintaan pihak berwenang yang sah.'] },
  { title: '5. Pembagian dan Pengungkapan Data', paragraphs: ['Data dapat dibagikan secara terbatas kepada tim Buzzerhood; pihak campaign terkait; penyedia hosting, komunikasi, analitik, penyimpanan, keamanan, pembayaran, atau layanan profesional; penerus usaha yang sah; serta pihak berwenang jika diwajibkan hukum.', 'Kami tidak menjual data pribadi. Penerima data wajib menggunakannya hanya untuk tujuan yang ditentukan dan menerapkan perlindungan yang sesuai.'] },
  { title: '6. Penyimpanan dan Retensi', paragraphs: ['Data disimpan selama diperlukan untuk tujuan pengumpulannya, masa hubungan layanan, pemenuhan kewajiban hukum dan kontrak, audit, keamanan, serta penyelesaian sengketa. Setelah masa retensi berakhir, data akan dihapus, dimusnahkan, atau dianonimkan secara aman, kecuali hukum mewajibkan penyimpanan lebih lama.'] },
  { title: '7. Transfer Data', paragraphs: ['Penyedia layanan tertentu dapat memproses atau menyimpan data di luar wilayah Indonesia. Jika transfer lintas batas terjadi, kami menerapkan persyaratan dan perlindungan yang diwajibkan hukum untuk menjaga tingkat perlindungan data pribadi Anda.'] },
  { title: '8. Keamanan Data', paragraphs: ['Kami menerapkan langkah teknis dan organisasional yang wajar, termasuk pembatasan akses, autentikasi, pencatatan aktivitas, dan pengamanan sistem. Tidak ada sistem elektronik yang sepenuhnya bebas risiko. Jika terjadi insiden yang berdampak pada data pribadi, kami akan melakukan penanganan dan pemberitahuan sesuai ketentuan yang berlaku.'] },
  { title: '9. Cookie dan Teknologi Serupa', paragraphs: ['Situs dapat menggunakan cookie yang diperlukan agar fitur berfungsi, menjaga sesi dan keamanan, mengingat preferensi, serta memahami penggunaan situs. Anda dapat mengatur cookie melalui browser. Menonaktifkan cookie tertentu dapat membatasi fungsi layanan.'] },
  { title: '10. Hak Anda', paragraphs: ['Sesuai ketentuan yang berlaku, Anda dapat meminta pelaksanaan hak berikut. Kami dapat meminta verifikasi identitas. Hak tertentu dapat dibatasi karena kewajiban hukum, keamanan, pembelaan klaim, atau alasan sah lainnya.'], items: ['Mendapatkan informasi dan akses atas data pribadi Anda.', 'Memperbaiki atau memperbarui data yang tidak akurat.', 'Mengakhiri, menghapus, atau memusnahkan data.', 'Menarik persetujuan dan menolak atau membatasi pemrosesan tertentu.', 'Memperoleh salinan data dalam format yang sesuai.', 'Mengajukan keberatan atas keputusan yang hanya didasarkan pada pemrosesan otomatis.', 'Mengajukan pengaduan atau tuntutan sesuai peraturan perundang-undangan.'] },
  { title: '11. Data Anak', paragraphs: ['Layanan Buzzerhood tidak ditujukan secara khusus kepada anak. Jika pemrosesan data anak diperlukan untuk suatu campaign, persetujuan orang tua atau wali dan perlindungan tambahan akan diterapkan sesuai ketentuan yang berlaku.'] },
  { title: '12. Tautan dan Layanan Pihak Ketiga', paragraphs: ['Situs dapat memuat tautan menuju platform pihak ketiga. Praktik privasi platform tersebut berada di luar kendali Buzzerhood. Tinjau kebijakan privasi mereka sebelum memberikan data.'] },
  { title: '13. Perubahan Kebijakan', paragraphs: ['Kebijakan ini dapat diperbarui untuk mencerminkan perubahan layanan atau hukum. Versi terbaru akan ditampilkan pada halaman ini bersama tanggal pembaruan. Perubahan material dapat kami sampaikan melalui kanal komunikasi yang sesuai.'] },
];

export function PrivacyPage() {
  return <main className="privacy-public">
    <header>
      <Link to="/home-02" aria-label="Buzzerhood — kembali ke beranda"><img src={headerLogo02} alt="Buzzerhood" /></Link>
      <Link to="/home-02">Kembali ke Beranda</Link>
    </header>
    <div className="terms-layout"><aside className="terms-toc"><p>DAFTAR ISI</p><nav>{sections.map((section) => <a key={section.title} href={`#${section.title.split(". ")[0]}`}>{section.title}</a>)}<a href="#14">14. Hubungi Kami</a></nav></aside><article>
      <p className="privacy-label">PRIVASI</p>
      <h1>Kebijakan Privasi</h1>
      <p className="privacy-updated">Terakhir diperbarui: 12 September 2026</p>
      {sections.map((section) => <section id={section.title.split(". ")[0]} key={section.title}>
        <h2>{section.title}</h2>
        <p>{section.paragraphs[0]}</p>
        {section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        {section.paragraphs.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>)}
      <section id="14"><h2>14. Hubungi Kami</h2><p>Untuk pertanyaan, pelaksanaan hak, atau pengaduan data pribadi, hubungi <a href="mailto:hallo@buzzerhood.com">hallo@buzzerhood.com</a>. Cantumkan subjek “Privasi Data” dan informasi yang cukup agar permintaan dapat diverifikasi dan ditindaklanjuti.</p></section>
    </article></div>
  </main>;
}
