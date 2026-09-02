export function AccessDeniedPage({ workspace }: { workspace: string }) {
  return <main className="workspace-page"><p className="eyebrow">ACCESS DENIED</p><h1>Akses {workspace} tidak tersedia.</h1><p>Anda sudah login, tetapi tidak memiliki membership aktif untuk workspace ini.</p></main>;
}
