import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

export function MainLayout() {
  return <div className="app"><Header /><Sidebar /><main><Outlet /></main></div>;
}
