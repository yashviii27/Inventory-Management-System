import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ProductsList from "./pages/Products/ProductsList";
import StockList from "./pages/Stock/StockList";
import PurchasesList from "./pages/Purchases/PurchasesList";
import CreatePurchase from "./pages/Purchases/CreatePurchase";
import SalesList from "./pages/Sales/SalesList";
import CreateSale from "./pages/Sales/CreateSale";
import Suppliers from "./pages/Suppliers/Suppliers";
import Customers from "./pages/Customers/Customers";
import Reports from "./pages/Reports/Reports";
import Dashboard from "./pages/Dashboard/Dashboard";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

// ✅ Layout to conditionally show NavBar and handle public pages
const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavPaths = ["/login", "/register"];
  const shouldHideNav = hideNavPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideNav && <NavBar />}
      <div className={`main-content ${shouldHideNav ? "public-page" : ""}`}>
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/products" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute>
                  <StockList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases"
              element={
                <ProtectedRoute>
                  <PurchasesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases/create"
              element={
                <ProtectedRoute>
                  <CreatePurchase />
                </ProtectedRoute>
              }
            />

            {/* ✅ Sales Management */}
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <SalesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/create"
              element={
                <ProtectedRoute>
                  <CreateSale />
                </ProtectedRoute>
              }
            />

            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <div className="container mt-5">
                  <h3>404 - Page Not Found</h3>
                  <p>The page you are looking for does not exist.</p>
                </div>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
