import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
    BarChart3,
  Package,
  ShoppingCart,
  Truck,
  Users,
  BarChart,
  Layers,
  Database,
  LogOut,
  Menu,
  X,
} from "lucide-react"; // for icons (npm install lucide-react)
import "./NavBar.css"; // 👈 custom CSS

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/login");
  };
  

  const menuItems = [
{ name: "Dashboard", path: "/dashboard", icon: <BarChart3 size={18} /> },

    { name: "Products", path: "/products", icon: <Package size={18} /> },
    { name: "Stock", path: "/stock", icon: <Database size={18} /> },
    { name: "Purchases", path: "/purchases", icon: <Truck size={18} /> },
    { name: "Sales", path: "/sales", icon: <ShoppingCart size={18} /> },
    { name: "Suppliers", path: "/suppliers", icon: <Users size={18} /> },
    { name: "Customers", path: "/customers", icon: <Layers size={18} /> },
    { name: "Reports", path: "/reports", icon: <BarChart size={18} /> },
  ];

  return (
    <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="logo">{collapsed ? "INV" : "Inventory"}</h2>
          <button
            className="menu-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <Menu size={22} /> : <X size={22} />}
          </button>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.name}
              className={
                location.pathname === item.path ? "active menu-item" : "menu-item"
              }
            >
              <Link to={item.path}>
                {item.icon}
                {!collapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {user && (
          <div className="sidebar-footer">
            <div className="user-info">
              {!collapsed && <span>Hello🖐, {user.name}</span>}
            </div>
            <button className="logout-btn" onClick={doLogout}>
              <LogOut size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default NavBar;
