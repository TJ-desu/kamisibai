import { getVideos } from '@/lib/data';
import VideoBrowser from '@/app/components/VideoBrowser';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // To ensure we see new uploads immediately in this prototype

export default async function Home() {
  const videos = await getVideos();

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <section style={{
        backgroundColor: 'var(--bg-accent)',
        padding: '60px 20px',
        textAlign: 'center',
        marginBottom: '40px',
        borderBottomLeftRadius: '50% 20px',
        borderBottomRightRadius: '50% 20px'
      }}>
        <div className="container">
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '10px',
            color: 'var(--text-dark)', /* Changed to dark text for greige theme */
            textShadow: 'none'
          }}>
            子どもに優しい紙芝居動画
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>
            忙しい毎日に、ちょっとした物語の時間を。
          </p>
        </div>
      </section>

      {/* Video Browser */}
      <VideoBrowser initialVideos={videos} />

      {/* Footer / Admin Link */}
      <footer style={{ marginTop: '80px', textAlign: 'center', color: '#aaa', fontSize: '0.8rem', paddingBottom: '20px' }}>
        <p>© 2025 Minato Moms Kamishibai</p>
        <p style={{ marginTop: '5px', fontSize: '0.7rem' }}>created by 港区限界ワーママ</p>
      </footer>
    </main>
  );
}
