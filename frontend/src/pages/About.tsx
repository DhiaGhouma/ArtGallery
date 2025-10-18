import { useEffect, useRef } from 'react';
import { Palette, Users, Zap, Heart, Globe, Shield } from 'lucide-react';

// ProfileCard Component
const ProfileCard = ({
  avatarUrl,
  name = 'Team Member',
  title = 'Role',
  handle = 'username',
  status = 'Available',
  contactText = 'Contact',
  showUserInfo = true,
  enableTilt = true,
  onContactClick
}) => {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!enableTilt) return;

    const card = cardRef.current;
    const wrap = wrapRef.current;
    if (!card || !wrap) return;

    const updateTransform = (x, y) => {
      const width = card.clientWidth;
      const height = card.clientHeight;
      const percentX = Math.min(Math.max((100 / width) * x, 0), 100);
      const percentY = Math.min(Math.max((100 / height) * y, 0), 100);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      wrap.style.setProperty('--pointer-x', `${percentX}%`);
      wrap.style.setProperty('--pointer-y', `${percentY}%`);
      wrap.style.setProperty('--rotate-x', `${-(centerX / 5)}deg`);
      wrap.style.setProperty('--rotate-y', `${centerY / 4}deg`);
      wrap.style.setProperty('--pointer-from-center', Math.min(Math.hypot(percentY - 50, percentX - 50) / 50, 1));
    };

    const handlePointerMove = (e) => {
      const rect = card.getBoundingClientRect();
      updateTransform(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handlePointerEnter = () => {
      wrap.classList.add('active');
      card.classList.add('active');
    };

    const handlePointerLeave = () => {
      wrap.classList.remove('active');
      card.classList.remove('active');
      updateTransform(card.clientWidth / 2, card.clientHeight / 2);
    };

    card.addEventListener('pointerenter', handlePointerEnter);
    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerleave', handlePointerLeave);

    updateTransform(card.clientWidth / 2, card.clientHeight / 2);

    return () => {
      card.removeEventListener('pointerenter', handlePointerEnter);
      card.removeEventListener('pointermove', handlePointerMove);
      card.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [enableTilt]);

  return (
    <div ref={wrapRef} className="profile-card-wrapper" style={{
      '--pointer-x': '50%',
      '--pointer-y': '50%',
      '--rotate-x': '0deg',
      '--rotate-y': '0deg',
      '--pointer-from-center': '0'
    }}>
      <section ref={cardRef} className="profile-card">
        <div className="profile-inside">
          <div className="profile-shine" />
          <div className="profile-glare" />
          <div className="profile-avatar-content">
            <img
              className="profile-avatar"
              src={avatarUrl}
              alt={`${name} avatar`}
              loading="lazy"
            />
            {showUserInfo && (
              <div className="profile-user-info">
                <div className="profile-user-details">
                  <div className="profile-mini-avatar">
                    <img src={avatarUrl} alt={`${name} mini`} loading="lazy" />
                  </div>
                  <div className="profile-user-text">
                    <div className="profile-handle">@{handle}</div>
                    <div className="profile-status">{status}</div>
                  </div>
                </div>
                <button
                  className="profile-contact-btn"
                  onClick={onContactClick}
                  type="button"
                  aria-label={`Contact ${name}`}
                >
                  {contactText}
                </button>
              </div>
            )}
          </div>
          <div className="profile-content">
            <div className="profile-details">
              <h3>{name}</h3>
              <p>{title}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Main About Component
const About = () => {
  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!parallaxRef.current) return;
      const scrolled = window.scrollY;
      parallaxRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: 'Share Your Art',
      description: 'Upload and showcase your artistic creations to a global community of art lovers.',
      icon: Palette,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Connect & Collaborate',
      description: 'Join forums, participate in challenges, and connect with fellow artists worldwide.',
      icon: Users,
      color: 'from-pink-500 to-orange-500',
    },
    {
      title: 'AI-Powered Discovery',
      description: 'Discover new art through intelligent recommendations tailored to your taste.',
      icon: Zap,
      color: 'from-orange-500 to-yellow-500',
    },
    {
      title: 'Marketplace',
      description: 'Buy and sell artwork in a secure, vibrant marketplace built for creators.',
      icon: Heart,
      color: 'from-yellow-500 to-purple-500',
    },
  ];

  const team = [
    {
      name: 'Dhia Ghouma',
      role: 'Lead Developer',
      handle: 'dhiaghouma',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
    {
      name: 'Khalil Ayari',
      role: 'Full Stack Developer',
      handle: 'khalilayari',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    },
    {
      name: 'Khedher Moetaz',
      role: 'Backend Developer',
      handle: 'khedhermoetaz',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    },
    {
      name: 'Mekki Yosr',
      role: 'Frontend Developer',
      handle: 'mekkiyosr',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    },
    {
      name: 'Mtaallah Khalil',
      role: 'UI/UX Designer',
      handle: 'mtaallahkhalil',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <style>{`
        .profile-card-wrapper {
          perspective: 500px;
          transform: translate3d(0, 0, 0.1px);
          position: relative;
          touch-action: none;
          transition: all 0.3s ease;
        }

        .profile-card-wrapper::before {
          content: '';
          position: absolute;
          inset: -10px;
          background: radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),
            hsla(266,100%,90%,0.3) 4%,
            hsla(266,50%,80%,0.2) 10%,
            hsla(266,25%,70%,0.1) 50%,
            hsla(266,0%,60%,0) 100%);
          border-radius: 30px;
          transition: all 0.5s ease;
          filter: blur(36px);
          transform: scale(0.8);
          opacity: 0;
        }

        .profile-card-wrapper.active::before {
          opacity: 1;
          filter: blur(40px);
          transform: scale(0.9);
        }

        .profile-card {
          height: 400px;
          width: 280px;
          display: grid;
          aspect-ratio: 0.7;
          border-radius: 30px;
          position: relative;
          background: linear-gradient(145deg, rgba(96,73,110,0.55), rgba(113,196,255,0.27)),
                      conic-gradient(from 124deg at 50% 50%, #c137ffff 0%, #07c6ffff 40%, #07c6ffff 60%, #c137ffff 100%);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          transition: transform 0.5s ease;
          transform: translate3d(0, 0, 0.1px) rotateX(0deg) rotateY(0deg);
          overflow: hidden;
        }

        .profile-card.active {
          transition: none;
          transform: translate3d(0, 0, 0.1px) rotateX(var(--rotate-y)) rotateY(var(--rotate-x));
        }

        .profile-inside {
          position: absolute;
          inset: 1px;
          background: linear-gradient(145deg, rgba(96,73,110,0.55), rgba(113,196,255,0.27));
          background-color: rgba(0,0,0,0.8);
          border-radius: 30px;
        }

        .profile-shine, .profile-glare {
          position: absolute;
          inset: 0;
          border-radius: 30px;
          pointer-events: none;
        }

        .profile-shine {
          background: radial-gradient(circle at var(--pointer-x) var(--pointer-y),
            rgba(255,255,255,0.1) 0%, transparent 60%);
          mix-blend-mode: overlay;
        }

        .profile-glare {
          background: radial-gradient(circle at var(--pointer-x) var(--pointer-y),
            rgba(255,255,255,0.15) 0%, transparent 50%);
          mix-blend-mode: soft-light;
        }

        .profile-avatar-content {
          position: relative;
          height: 100%;
          overflow: hidden;
          border-radius: 30px;
        }

        .profile-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: calc(1.5 - var(--pointer-from-center, 0));
          transition: opacity 0.3s ease;
        }

        .profile-user-info {
          position: absolute;
          bottom: 15px;
          left: 15px;
          right: 15px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 15px;
          padding: 10px 12px;
        }

        .profile-user-details {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-mini-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .profile-mini-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-user-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .profile-handle {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.95);
        }

        .profile-status {
          font-size: 10px;
          color: rgba(255,255,255,0.7);
        }

        .profile-contact-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          pointer-events: auto;
        }

        .profile-contact-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.4);
          transform: translateY(-1px);
        }

        .profile-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 20px;
          text-align: center;
          z-index: 1;
        }

        .profile-details {
          margin-top: 30px;
        }

        .profile-details h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 5px 0;
          background: linear-gradient(to bottom, #fff, #a5a5ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .profile-details p {
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          background: linear-gradient(to bottom, #fff, #8a8aff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-effect {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .hover-glow {
          transition: all 0.3s ease;
        }

        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(147,51,234,0.3);
          border-color: rgba(147,51,234,0.3);
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease forwards;
          opacity: 0;
        }
      `}</style>

      {/* Animated parallax background */}
      <div
        ref={parallaxRef}
        className="fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(270 100% 65% / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(330 100% 55% / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, hsl(180 100% 48% / 0.12) 0%, transparent 50%)
          `,
        }}
      />

      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-32 animate-fade-in">
          <h1 className="text-6xl sm:text-8xl font-bold gradient-text mb-6">
            About ArtVerse
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto">
            A vibrant community where creativity flows like liquid art, connecting artists and art lovers across the globe.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-32 text-center max-w-4xl mx-auto glass-effect p-12 rounded-3xl hover-glow animate-scale-in">
          <h2 className="text-5xl font-bold gradient-text mb-8">Our Mission</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            ArtVerse is a dynamic platform dedicated to empowering artists and art enthusiasts. We provide a space where creativity thrives, 
            connections are made, and art is celebrated in all its forms.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="glass-effect p-6 rounded-xl hover-glow">
              <Globe className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl font-semibold mb-2 text-white">Global Reach</h3>
              <p className="text-gray-400">Connect with artists worldwide</p>
            </div>
            <div className="glass-effect p-6 rounded-xl hover-glow">
              <Shield className="w-12 h-12 mx-auto mb-4 text-pink-400" />
              <h3 className="text-xl font-semibold mb-2 text-white">Safe & Secure</h3>
              <p className="text-gray-400">Protected transactions and content</p>
            </div>
            <div className="glass-effect p-6 rounded-xl hover-glow">
              <Heart className="w-12 h-12 mx-auto mb-4 text-orange-400" />
              <h3 className="text-xl font-semibold mb-2 text-white">Community First</h3>
              <p className="text-gray-400">Built by artists, for artists</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-32">
          <h2 className="text-5xl font-bold gradient-text text-center mb-16">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="glass-effect p-8 rounded-2xl hover-glow group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-block p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-32">
          <h2 className="text-5xl font-bold gradient-text text-center mb-16">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto justify-items-center">
            {team.map((member, index) => (
              <div
                key={index}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProfileCard
                  name={member.name}
                  title={member.role}
                  handle={member.handle}
                  status="Available"
                  contactText="Contact"
                  avatarUrl={member.avatarUrl}
                  showUserInfo={true}
                  enableTilt={true}
                  onContactClick={() => alert(`Contacting ${member.name}...`)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="text-center max-w-4xl mx-auto glass-effect p-12 rounded-3xl hover-glow animate-scale-in">
          <h2 className="text-5xl font-bold gradient-text mb-8">Our Impact</h2>
          <div className="mt-12 flex flex-wrap justify-center gap-12">
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text">10K+</div>
              <div className="text-gray-400 mt-2">Artists</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text">50K+</div>
              <div className="text-gray-400 mt-2">Artworks</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold gradient-text">100K+</div>
              <div className="text-gray-400 mt-2">Community Members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;