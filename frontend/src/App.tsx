import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { Dashboard } from './pages/Dashboard';
import { GuestRSVP } from './pages/GuestRSVP';
import { SeatingMap } from './pages/SeatingMap';
import { BudgetManager } from './pages/BudgetManager';
import { EventPlanner } from './pages/EventPlanner';
import { EventWebsiteGen } from './pages/EventWebsiteGen';
import { Certificates } from './pages/Certificates';
import { SponsorsStaff } from './pages/SponsorsStaff';
import { MediaGallery } from './pages/MediaGallery';
import { Ticketing } from './pages/Ticketing';

interface EventData {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  theme: string;
  website_slug: string;
  website_config: any;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  
  // Notification states
  const [notifications, setNotifications] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchActiveEvent = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/events/1`);
      if (res.ok) {
        const data = await res.json();
        setActiveEvent(data);
      }
    } catch (err) {
      console.error("Error fetching active event data", err);
    }
  };

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  const triggerNotification = (message: string) => {
    setNotifications(prev => [message, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const clearNotifications = () => {
    setUnreadCount(0);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard eventId={1} triggerNotification={triggerNotification} />;
      case 'guests':
        return <GuestRSVP eventId={1} triggerNotification={triggerNotification} />;
      case 'seating':
        return <SeatingMap eventId={1} triggerNotification={triggerNotification} />;
      case 'budget':
        return <BudgetManager eventId={1} triggerNotification={triggerNotification} />;
      case 'aiPlanner':
        return <EventPlanner eventId={1} triggerNotification={triggerNotification} />;
      case 'websiteGen':
        return <EventWebsiteGen eventId={1} activeEvent={activeEvent} refreshEvent={fetchActiveEvent} triggerNotification={triggerNotification} />;
      case 'engagement':
        return <Dashboard eventId={1} triggerNotification={triggerNotification} />; // Redirects to Dashboard containing polls and QA boards
      case 'certificates':
        return <Certificates eventId={1} triggerNotification={triggerNotification} />;
      case 'sponsorsStaff':
        return <SponsorsStaff eventId={1} triggerNotification={triggerNotification} />;
      case 'gallery':
        return <MediaGallery eventId={1} triggerNotification={triggerNotification} />;
      case 'ticketing':
        return <Ticketing eventId={1} triggerNotification={triggerNotification} />;
      default:
        return <Dashboard eventId={1} triggerNotification={triggerNotification} />;
    }
  };

  // Synchronize sidebar tabs that may map to subpages
  useEffect(() => {
    if (activeTab === 'ticketing') {
      setActiveTab('ticketing');
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F3F4F6] font-sans flex antialiased">
      
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Layout */}
      <div className="flex-1 pl-72 flex flex-col min-h-screen">
        
        {/* Navbar */}
        <Navbar 
          activeEvent={activeEvent} 
          notificationCount={unreadCount} 
          clearNotifications={clearNotifications}
          notifications={notifications} 
        />
        
        {/* Content Wrapper */}
        <main className="flex-1 mt-20 p-8 pb-24 overflow-y-auto">
          {renderActivePage()}
        </main>
        
      </div>

      {/* Floating AI Chat Assistant */}
      <AIAssistantWidget eventId={1} />
      
    </div>
  );
};

export default App;
