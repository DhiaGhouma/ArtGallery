import { Link, useLocation } from 'react-router-dom';
import { Home, Image, Upload, User, LogOut, Search, Compass, Users, Calendar, ShoppingBag, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-border">
      <div className="container mx-auto ">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
               alt="ArtVerse Logo"
               className="w-20 h-20 object-contain"
            />


          </Link>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className={isActive('/') ? 'glow-effect' : ''}
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>

            <Link to="/explore">
              <Button
                variant={isActive('/explore') ? 'default' : 'ghost'}
                size="sm"
                className={isActive('/explore') ? 'glow-effect' : ''}
              >
                <Compass className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Explore</span>
              </Button>
            </Link>

            <Link to="/marketplace">
              <Button
                variant={isActive('/marketplace') ? 'default' : 'ghost'}
                size="sm"
                className={isActive('/marketplace') ? 'glow-effect' : ''}
              >
                <ShoppingBag className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Market</span>
              </Button>
            </Link>

            <Link to="/community">
              <Button
                variant={isActive('/community') ? 'default' : 'ghost'}
                size="sm"
                className={isActive('/community') ? 'glow-effect' : ''}
              >
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Community</span>
              </Button>
            </Link>

            {/* <Link to="/events">
              <Button
                variant={isActive('/events') ? 'default' : 'ghost'}
                size="sm"
                className={isActive('/events') ? 'glow-effect' : ''}
              >
                <Calendar className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Events</span>
              </Button>
            </Link> */}

            {isAuthenticated && (
              <>
                <Link to="/upload">
                  <Button
                    variant={isActive('/upload') ? 'default' : 'ghost'}
                    size="sm"
                    className={isActive('/upload') ? 'glow-effect' : ''}
                  >
                    <Upload className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Upload</span>
                  </Button>
                </Link>

                <Link to="/profile">
                  <Button
                    variant={isActive('/profile') ? 'default' : 'ghost'}
                    size="sm"
                    className={isActive('/profile') ? 'glow-effect' : ''}
                  >
                    <User className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}

            {!isAuthenticated && (
              <Link to="/login">
                <Button size="sm" className="glow-effect">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
