import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <Link href="/">
            <h1>Contest App</h1>
          </Link>
          <nav>
            {isAuthenticated ? (
              <>
                <Link href="/">Contests</Link>
                <Link href="/create-contest">Create Contest</Link>
                <Link href="/my-contests">My Contests</Link>
                <span>Welcome, {user?.username}</span>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">Login</Link>
                <Link href="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </nav>
      <div className="container">{children}</div>
    </div>
  );
}
