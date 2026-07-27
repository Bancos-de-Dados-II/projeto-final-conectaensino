import { useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function toggleSidebar() {
    setSidebarOpen((currentValue) => !currentValue);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="app">
      <Header onMenuClick={toggleSidebar} />

      <Sidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Fechar menu lateral"
          onClick={closeSidebar}
        />
      )}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
