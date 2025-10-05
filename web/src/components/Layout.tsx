import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import '../styles/Layout.css';

interface LayoutProps {
  user?: any;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Veeqo EasyPost Integration</h1>
        </div>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">Compare Rates</Link>
          <Link to="/buy" className="nav-link">Buy Label</Link>
          <Link to="/orders" className="nav-link">Orders</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
        
        {user && (
          <div className="user-info">
            <span>{user.name || user.email}</span>
            {onLogout && (
              <button onClick={onLogout} className="logout-btn">
                Logout
              </button>
            )}
          </div>
        )}
      </nav>
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="footer">
        <p>&copy; 2025 Veeqo EasyPost Integration. All rights reserved.</p>
      </footer>
    </div>
  );
};
