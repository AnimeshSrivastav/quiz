import './globals.css';

export const metadata = {
  title: 'Math Quiz Arena — Competitive Math Challenge',
  description:
    'Real-time competitive math quiz. Race against other players to solve math problems first!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {/* Background gradient blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-cyan-600/10 blur-[120px]" />
          <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-purple-600/8 blur-[120px]" />
        </div>

        {children}
      </body>
    </html>
  );
}
