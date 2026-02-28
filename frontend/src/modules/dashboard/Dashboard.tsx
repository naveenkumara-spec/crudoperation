import React, { useState, useEffect, useMemo } from 'react';
import { Users, Building2, UserCheck, TrendingUp, Calendar, Clock, Cake, PartyPopper, Home, Briefcase, Sparkles } from 'lucide-react';
import { notification } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    activeEmployees: 0,
    growth: '+0%'
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Array<{ date: string; type: 'holiday'|'wfh'|'workday'|'birthday'|'anniversary'; label: string }>>([]);
  const [filters, setFilters] = useState<Record<string, boolean>>({ holiday: true, wfh: true, workday: true, birthday: true, anniversary: true });
  const months = useMemo(() => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const flag = sessionStorage.getItem('justLoggedIn');
    if (flag) {
      sessionStorage.removeItem('justLoggedIn');
      notification.open({
        message: `Welcome back, ${user?.name || 'user'}!`,
        description: 'You\'re now signed in. Check the calendar for today’s events and reminders.',
        placement: 'topRight',
        duration: 4,
      });
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const monthIdx = currentDate.getMonth();
        const resp = await fetch(`${API_BASE}/users?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await resp.json();
        const arr: Array<{ date: string; type: 'holiday'|'wfh'|'workday'|'birthday'|'anniversary'; label: string }> = [];
        if (Array.isArray(data.data)) {
          data.data.forEach((u: any) => {
            if (u.dob) {
              const d = new Date(u.dob);
              if (d.getMonth() === monthIdx) {
                const dateStr = format(new Date(currentDate.getFullYear(), monthIdx, d.getDate()), 'yyyy-MM-dd');
                arr.push({ date: dateStr, type: 'birthday', label: `${u.username}'s Birthday` });
              }
            }
            if (u.joining_date) {
              const j = new Date(u.joining_date);
              if (j.getMonth() === monthIdx) {
                const dateStr = format(new Date(currentDate.getFullYear(), monthIdx, j.getDate()), 'yyyy-MM-dd');
                arr.push({ date: dateStr, type: 'anniversary', label: `${u.username}'s Work Anniversary` });
              }
            }
          });
        }
        const m = currentDate.getMonth();
        const y = currentDate.getFullYear();
        const sample: Array<{ date: string; type: 'holiday'|'wfh'|'workday'|'birthday'|'anniversary'; label: string }> = [
          { date: format(new Date(y, m, 1), 'yyyy-MM-dd'), type: 'workday', label: 'Working Day' },
          { date: format(new Date(y, m, 5), 'yyyy-MM-dd'), type: 'holiday', label: 'Holiday' },
          { date: format(new Date(y, m, 12), 'yyyy-MM-dd'), type: 'wfh', label: 'WFH' }
        ];
        setEvents([...arr, ...sample]);
      } catch (_e) {
        setEvents([]);
      }
    };
    load();
  }, [currentDate]);

  const statCards = [
    { title: 'Total Employees', value: stats.totalEmployees, icon: Users, color: '#3182ce', bg: '#ebf4ff' },
    { title: 'Departments', value: stats.totalDepartments, icon: Building2, color: '#38a169', bg: '#f0fff4' },
    { title: 'Active Now', value: stats.activeEmployees, icon: UserCheck, color: 'var(--primary)', bg: '#fffaf0' },
    { title: 'Monthly Growth', value: stats.growth, icon: TrendingUp, color: '#e53e3e', bg: '#fff5f5' },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's what's happening with your workforce today.</p>
      </header>

      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <span>{stat.title}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="content-card recent-activity">
          <div className="card-header">
            <h2><Clock size={20} /> Recent Activity</h2>
            <button className="view-all">View All</button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot blue"></div>
              <div className="activity-text">
                <p><strong>New employee</strong> John Doe joined the Engineering team.</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot green"></div>
              <div className="activity-text">
                <p><strong>Attendance policy</strong> updated by HR Admin.</p>
                <span>5 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card upcoming-events">
          <div className="card-header">
            <h2><Calendar size={20} /> Pending Requests</h2>
            <span className="badge">4 New</span>
          </div>
          <div className="request-list">
            <p className="empty-msg">No urgent pending requests.</p>
          </div>
        </div>
      </div>

      <div className="content-card calendar-card">
        <div className="calendar-controls">
          <div className="month-title">{new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate)}</div>
          <div className="months">
            {months.map((m, idx) => (
              <button
                key={m}
                className={`month-pill ${idx === currentDate.getMonth() ? 'active' : ''}`}
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), idx, 1))}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="legend">
            <button className={`legend-pill holiday ${filters.holiday ? 'on' : 'off'}`} onClick={() => setFilters(f => ({ ...f, holiday: !f.holiday }))}><PartyPopper size={16} /> Holiday</button>
            <button className={`legend-pill wfh ${filters.wfh ? 'on' : 'off'}`} onClick={() => setFilters(f => ({ ...f, wfh: !f.wfh }))}><Home size={16} /> WFH</button>
            <button className={`legend-pill workday ${filters.workday ? 'on' : 'off'}`} onClick={() => setFilters(f => ({ ...f, workday: !f.workday }))}><Briefcase size={16} /> Workingday</button>
            <button className={`legend-pill birthday ${filters.birthday ? 'on' : 'off'}`} onClick={() => setFilters(f => ({ ...f, birthday: !f.birthday }))}><Cake size={16} /> Birthday</button>
            <button className={`legend-pill anniversary ${filters.anniversary ? 'on' : 'off'}`} onClick={() => setFilters(f => ({ ...f, anniversary: !f.anniversary }))}><Sparkles size={16} /> Work Anniversary</button>
          </div>
        </div>
        <div className="cal-wrap">
          <CalendarGrid
            date={currentDate}
            events={events.filter(e => (filters as any)[e.type])}
          />
        </div>
      </div>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          padding-bottom: 24px;
        }
        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -1px;
        }
        .dashboard-header p {
          color: #64748b;
          font-weight: 500;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .stat-card {
          background: #fff;
          padding: 20px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
          border-color: var(--primary);
        }
        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-info h3 {
          font-size: 1.8rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -1px;
          line-height: 1;
        }
        .stat-info span {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
          display: block;
          margin-top: 4px;
        }
        .dashboard-content {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }
        @media (max-width: 1200px) {
          .dashboard-content { grid-template-columns: 1fr; }
        }
        .content-card {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          min-height: 300px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .card-header h2 {
          font-size: 1.1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .view-all {
          color: #3b82f6;
          background: #eff6ff;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .view-all:hover {
          background: #3b82f6;
          color: #fff;
        }
        .activity-item {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }
        .activity-dot.blue { background: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.5); }
        .activity-dot.green { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
        .activity-text p {
          font-size: 0.9rem;
          color: #1e293b;
          margin-bottom: 2px;
          line-height: 1.5;
        }
        .activity-text span {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .badge {
          background: #fef2f2;
          color: #ef4444;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          border: 1px solid #fee2e2;
        }
        .empty-msg {
          text-align: center;
          color: #94a3b8;
          padding: 60px 0;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .calendar-card { margin-top: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 16px; overflow: visible; display: flex; flex-direction: column; width: 100%; align-self: center; }
        .calendar-controls { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        .month-title { font-size: 22px; font-weight: 900; color: #0f172a; }
        .months { display: flex; gap: 8px; flex-wrap: wrap; }
        .month-pill { border: 1px solid #e2e8f0; background: #fff; padding: 6px 12px; border-radius: 999px; font-weight: 700; color: #475569; cursor: pointer; }
        .month-pill.active { background: #fb923c; color: #fff; border-color: #fb923c; }
        .legend { display: flex; gap: 8px; flex-wrap: wrap; }
        .legend-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: none; font-weight: 700; cursor: pointer; }
        .legend-pill.holiday { background: #fff7ed; color: #9a3412; }
        .legend-pill.wfh { background: #f0fdf4; color: #166534; }
        .legend-pill.workday { background: #f0f9ff; color: #075985; }
        .legend-pill.birthday { background: #f5f3ff; color: #5b21b6; }
        .legend-pill.anniversary { background: #ecfeff; color: #0e7490; }
        .legend-pill.off { opacity: 0.5; }
        .cal-wrap { overflow: visible; border-radius: 12px; }
        @media (max-width: 1200px) {
          .calendar-card { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

const CalendarGrid: React.FC<{ date: Date; events: Array<{ date: string; type: string; label: string }> }> = ({ date, events }) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const rows: JSX.Element[] = [];
  let day = startDate;
  const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  while (day <= endDate) {
    const days: JSX.Element[] = [];
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const key = format(cloneDay, 'yyyy-MM-dd');
      const dayEvents = events.filter(e => e.date === key);
      days.push(
        <div key={key} className={`cal-cell ${!isSameMonth(cloneDay, monthStart) ? 'muted' : ''} ${isSameDay(cloneDay, new Date()) ? 'today' : ''}`}>
          <div className="cal-date">{format(cloneDay, 'd')}</div>
          {dayEvents.slice(0, 2).map((e, idx) => (
            <div key={idx} className={`cal-event ${e.type}`}>
              {e.type === 'birthday' && <Cake size={16} />}
              {e.type === 'holiday' && <PartyPopper size={16} />}
              {e.type === 'wfh' && <Home size={16} />}
              {e.type === 'workday' && <Briefcase size={16} />}
              {e.type === 'anniversary' && <Sparkles size={16} />}
              <span></span>
            </div>
          ))}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div className="cal-row" key={format(addDays(day, -1), 'yyyy-MM-dd')}>{days}</div>);
  }

  return (
    <div className="cal-root">
      <div className="cal-header">
        {weekdays.map(w => <div key={w} className="cal-head-cell">{w}</div>)}
      </div>
      <div className="cal-body">{rows}</div>
      <style>{`
        .cal-root { width: 100%; }
        .cal-header { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); border: 1px solid #e5e7eb; border-bottom: none; border-radius: 12px 12px 0 0; }
        .cal-head-cell { padding: 16px 12px; font-size: 15px; font-weight: 800; color: #475569; background: #fff; border-right: 1px solid #e5e7eb; }
        .cal-head-cell:last-child { border-right: none; }
        .cal-body { display: grid; grid-template-rows: repeat(6, minmax(110px, auto)); border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; }
        .cal-row { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); }
        .cal-cell { background: #fff; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 14px; min-height: 110px; display: flex; flex-direction: column; }
        .cal-row .cal-cell:first-child { border-left: 1px solid #e5e7eb; }
        .cal-row .cal-cell:last-child { border-right: none; }
        .cal-row:last-child .cal-cell { border-bottom: none; }
        .cal-cell.muted { background: #fcfcfd; color: #94a3b8; }
        .cal-cell.today { outline: 2px solid #fde68a; outline-offset: -2px; }
        .cal-date { font-weight: 800; color: #0f172a; }
        .cal-event { width: 100%; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; padding: 16px 0; margin-top: auto; }
        .cal-event.holiday { background: #fff7ed; }
        .cal-event.wfh { background: #f0fdf4; }
        .cal-event.workday { background: #f0f9ff; }
        .cal-event.birthday { background: #f5f3ff; }
        .cal-event.anniversary { background: #ecfeff; }
      `}</style>
    </div>
  );
};

export default Dashboard;
