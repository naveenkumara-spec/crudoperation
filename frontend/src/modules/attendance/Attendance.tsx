import React, { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts';
import { Calendar, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Table, Tag, Progress, DatePicker, Select, Divider, Typography, Button, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getColumnSearchProps } from '../../utils/tableUtils';

// ─── Types ──────────────────────────────────────────────────────────────────
interface RoleData {
    role: string;
    present: number;
    absent: number;
}

interface DepartmentData {
    name: string;
    roles: RoleData[];
}

interface AttendanceResponse {
    date: string;
    departments: DepartmentData[];
}

interface ChartRow {
    department: string;
    present: number;
    absent: number;
    // Index signature required by MUI X Charts DatasetElementType
    [key: string]: string | number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Component ───────────────────────────────────────────────────────────────
const Attendance: React.FC = () => {
    const [data, setData] = useState<AttendanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('month'), dayjs()]);
    const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
    const [availableDepts, setAvailableDepts] = useState<{ id: string, name: string }[]>([]);
    const today = new Date();

    // ── API Call ──────────────────────────────────────────────────────────────
    const fetchAttendance = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD')
            });

            if (selectedDepts.length > 0) {
                selectedDepts.forEach(id => params.append('department_id', id));
            }

            const response = await fetch(`${API_BASE}/attendance/report?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            const result: AttendanceResponse = await response.json();
            setData(result);
        } catch (err) {
            setError('Failed to load attendance data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/departments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) setAvailableDepts(result.data.map((d: any) => ({ id: d.id, name: d.name })));
        } catch (e) { console.error('Failed to fetch departments'); }
    };

    useEffect(() => { fetchDepts(); }, []);
    useEffect(() => { fetchAttendance(); }, [dateRange, selectedDepts]);
    // Note: Table filters (setFilters) are handled on the client-side for this report view

    // ── Derived chart data ────────────────────────────────────────────────────
    const chartData: ChartRow[] = (data?.departments || []).map(dept => ({
        department: dept.name.length > 8 ? dept.name.slice(0, 8) + '…' : dept.name,
        present: dept.roles.reduce((s, r) => s + r.present, 0),
        absent: dept.roles.reduce((s, r) => s + r.absent, 0),
    }));

    const totalPresent = chartData.reduce((s, r) => s + r.present, 0);
    const totalAbsent = chartData.reduce((s, r) => s + r.absent, 0);
    const total = totalPresent + totalAbsent;
    const pct = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="att-container">
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside className="att-sidebar">
                <div className="att-sidebar-header">
                    <div style={{ background: 'rgba(0,0,0,0.06)', padding: '8px', borderRadius: '10px' }}>
                        <TrendingUp size={18} color="var(--primary)" />
                    </div>
                    <span className="att-sidebar-title">Analytics Filters</span>
                </div>

                <div className="att-filter-group" style={{ marginBottom: '20px' }}>
                    <label className="att-filter-label">Quick Ranges</label>
                    <div className="att-quick-grid">
                        <button onClick={() => setDateRange([dayjs().startOf('week'), dayjs()])} className="att-quick-btn">This Week</button>
                        <button onClick={() => setDateRange([dayjs().startOf('month'), dayjs()])} className="att-quick-btn">This Month</button>
                        <button onClick={() => setDateRange([dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')])} className="att-quick-btn">Last Month</button>
                    </div>
                </div>

                <div className="att-filter-group">
                    <label className="att-filter-label">Date Range</label>
                    <DatePicker.RangePicker
                        value={dateRange}
                        onChange={(vals) => {
                            if (vals && vals[0] && vals[1]) {
                                setDateRange([vals[0], vals[1]]);
                            }
                        }}
                        style={{ width: '100%', borderRadius: '10px' }}
                        allowClear={false}
                    />
                </div>

                <div className="att-filter-group" style={{ marginTop: '20px' }}>
                    <label className="att-filter-label">Department Selection</label>
                    <Select
                        mode="multiple"
                        placeholder="All Departments"
                        style={{ width: '100%' }}
                        value={selectedDepts}
                        onChange={setSelectedDepts}
                        options={availableDepts.map(d => ({ label: d.name, value: d.id }))}
                        maxTagCount="responsive"
                        dropdownStyle={{ borderRadius: '10px' }}
                    />
                </div>

                <div className="att-sidebar-stats" style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Calendar size={14} color="#854d0e" />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' }}>Selected Period</span>
                    </div>
                    <div className="mini-val">{dateRange[0].format('MMM D')} - {dateRange[1].format('MMM D, YYYY')}</div>
                </div>
            </aside>

            {/* ── Main Content ────────────────────────────────────────────── */}
            <main className="att-main-content">
                <div className="att-page">
                    {/* Header */}
                    <div className="att-header">
                        <div>
                            <h1 className="att-title">Attendance Insights</h1>
                            <p className="att-sub">Detailed breakdown of workforce presence and metrics</p>
                        </div>
                        <div className="att-date-badge">
                            <Calendar size={18} color="#3182ce" />
                            <span className="att-date-text">{dateRange[0].format('DD MMM')} — {dateRange[1].format('DD MMM YYYY')}</span>
                            <span className="att-ro-tag" style={{ background: '#38a169' }}>ACTIVE</span>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="att-kpi-grid">
                        <KpiCard icon={<Users size={22} />} label="Total Records" value={total} color="#3182ce" bg="#ebf4ff" />
                        <KpiCard icon={<UserCheck size={22} />} label="Present" value={totalPresent} color="#38a169" bg="#f0fff4" />
                        <KpiCard icon={<UserX size={22} />} label="Absent" value={totalAbsent} color="#e53e3e" bg="#fff5f5" />
                        <KpiCard icon={<TrendingUp size={22} />} label="Avg. Rate" value={`${pct}%`} color="var(--primary)" bg="#fffaf0" />
                    </div>

                    {/* Chart */}
                    <div className="att-card">
                        <h2 className="att-card-title">Presence Overview by Department</h2>
                        {loading && (
                            <div className="att-loading">
                                <div className="att-spinner"></div>
                                <span>Generating report metrics…</span>
                            </div>
                        )}
                        {error && <div className="att-error">{error}</div>}
                        {!loading && !error && chartData.length === 0 && (
                            <div className="att-empty">No records found for the selected filters.</div>
                        )}
                        {!loading && !error && chartData.length > 0 && (
                            <BarChart
                                dataset={chartData}
                                xAxis={[{
                                    scaleType: 'band',
                                    dataKey: 'department',
                                    label: 'Department',
                                    categoryGapRatio: 0.8,
                                    barGapRatio: 0.1
                                }]}
                                yAxis={[{ label: 'Days' }]}
                                series={[
                                    { dataKey: 'present', label: 'Present', color: 'var(--primary)', stack: 'total' },
                                    { dataKey: 'absent', label: 'Absent', color: '#ef4444', stack: 'total' },
                                ]}
                                height={300}
                                margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
                                slotProps={{
                                    legend: {
                                        direction: 'horizontal',
                                        position: { vertical: 'top', horizontal: 'center' },
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Table */}
                    {!loading && !error && data && (
                        <div className="att-card" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 className="att-card-title" style={{ margin: 0 }}>Detailed Attendance Log</h2>
                                <Button type="primary" size="small" style={{ borderRadius: '6px', fontSize: '12px' }}>EXEL EXPORT</Button>
                            </div>
                            <AttendanceTable departments={data.departments} onFilterChange={setFilters} />
                        </div>
                    )}
                </div>
            </main>

            {/* Styles */}
            <style>{`
                .att-container { 
                    display: flex; 
                    width: 100%; 
                    min-height: calc(100vh - 120px); 
                    background: #fff; 
                    border-radius: 20px; 
                    overflow: hidden; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }
                
                .att-sidebar { width: 280px; background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column; }
                .att-sidebar-header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
                .att-sidebar-title { font-weight: 800; font-size: 1rem; color: #0f172a; letter-spacing: -0.5px; }
                .att-filter-group { display: flex; flex-direction: column; gap: 10px; }
                .att-filter-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
                .att-quick-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
                .att-quick-btn { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left; }
                .att-quick-btn:hover { border-color: var(--primary); background: #fffdf0; transform: translateX(4px); }
                .att-sidebar-stats { background: #fff9e6; border-radius: 14px; padding: 18px; border: 1px solid #fef3c7; }
                .mini-val { font-size: 14px; font-weight: 800; color: #854d0e; }

                .att-main-content { flex: 1; padding: 24px; overflow-y: auto; background: #fff; }
                .att-page { display: flex; flex-direction: column; gap: 24px; max-width: 1400px; margin: 0 auto; width: 100%; }
                
                .att-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom: 8px; }
                .att-title { font-size: 1.8rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; margin: 0; }
                .att-sub { color: #64748b; margin-top: 4px; font-size: 0.95rem; font-weight: 500; }
                .att-date-badge { display:flex; align-items:center; gap:10px; background:#f8fafc; padding:10px 18px; border-radius:12px; border:1px solid #e2e8f0; }
                .att-date-text { font-weight:700; color:#334155; font-size:13px; }
                .att-ro-tag { color:#fff; font-size:10px; font-weight:800; padding:4px 10px; border-radius:8px; letter-spacing: 0.05em; }

                .att-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px; }
                .att-kpi { background:#fff; padding:24px; border-radius:20px; display:flex; align-items:center; gap:16px; border:1px solid #e2e8f0; transition: all 0.3s ease; }
                .att-kpi:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-color: #cbd5e0; }
                .att-kpi-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
                .att-kpi-value { font-size:2rem; font-weight:900; color:#0f172a; line-height: 1; letter-spacing: -1px; }
                .att-kpi-label { font-size:0.85rem; color:#64748b; font-weight:600; margin-top:6px; }

                .att-card { background:#fff; border-radius:20px; padding:24px; border:1px solid #e2e8f0; }
                .att-card-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.4px; }

                .att-loading { display:flex; flex-direction:column; align-items:center; gap:16px; padding:100px; color:#64748b; }
                .att-spinner { width:48px; height:48px; border:5px solid #f1f5f9; border-top-color:var(--primary); border-radius:50%; animation:spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite; }
                @keyframes spin { to { transform:rotate(360deg); } }
                .att-error { background: #fef2f2; color: #b91c1c; padding: 24px; border-radius: 16px; text-align: center; font-weight: 700; border: 1px solid #fee2e2; }
                .att-empty { text-align:center; color:#94a3b8; padding:100px; font-size:1.1rem; font-weight: 600; }

                @media (max-width: 1440px) {
                    .att-sidebar { width: 240px; padding: 18px; }
                    .att-kpi-grid { gap: 12px; }
                    .att-kpi { padding: 18px; }
                    .att-kpi-value { font-size: 1.6rem; }
                }

                /* Pagination Layout */
                .att-antd-table .ant-pagination {
                    margin-top: 24px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                .att-antd-table .ant-pagination-total-text {
                    order: -1;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    bg: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, color, bg }) => (
    <div className="att-kpi">
        <div className="att-kpi-icon" style={{ background: bg, color }}>
            {icon}
        </div>
        <div>
            <div className="att-kpi-value" style={{ color }}>{value}</div>
            <div className="att-kpi-label">{label}</div>
        </div>
    </div>
);

export default Attendance;

// ─── Attendance Table ──────────────────────────────────────────────────────────
interface TableRow {
    key: string;
    department: string;
    role: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
    rowSpan: number;
}

const AttendanceTable: React.FC<{
    departments: DepartmentData[],
    onFilterChange: (filters: Record<string, any>) => void
}> = ({ departments, onFilterChange }) => {
    const [pageSize, setPageSize] = useState(15);
    const [current, setCurrent] = useState(1);

    // Flatten departments → one row per role, with rowSpan for Department column
    const rows: TableRow[] = [];
    departments.forEach(dept => {
        dept.roles.forEach((role, idx) => {
            const total = role.present + role.absent;
            const rate = total > 0 ? Math.round((role.present / total) * 100) : 0;
            rows.push({
                key: `${dept.name}-${role.role}`,
                department: dept.name,
                role: role.role,
                present: role.present,
                absent: role.absent,
                total,
                rate,
                rowSpan: idx === 0 ? dept.roles.length : 0,
            });
        });
    });

    const columns: ColumnsType<TableRow> = [
        {
            title: 'S.No',
            key: 'sno',
            width: 70,
            render: (_: any, __: any, index: number) => (
                <Typography.Text strong style={{ color: '#718096' }}>
                    {(current - 1) * pageSize + index + 1}
                </Typography.Text>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            width: 160,
            render: (dept: string) => (
                <Tooltip title={dept}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 160 }}>
                        <Typography.Text style={{
                            fontWeight: 700,
                            color: '#1a202c',
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {dept}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: '10px', marginTop: '-2px' }}>Department</Typography.Text>
                    </div>
                </Tooltip>
            ),
            ...getColumnSearchProps<TableRow>('department', 'Department'),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tooltip title={role}>
                    <Tag color="cyan" style={{
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0
                    }}>
                        {role}
                    </Tag>
                </Tooltip>
            ),
            ...getColumnSearchProps<TableRow>('role', 'Role'),
        },
        {
            title: 'Present',
            dataIndex: 'present',
            key: 'present',
            sorter: (a, b) => a.present - b.present,
            render: (val: number) => (
                <Tag color="green" style={{ borderRadius: '8px', fontWeight: 700, minWidth: '44px', textAlign: 'center' }}>
                    {val}
                </Tag>
            ),
            ...getColumnSearchProps<TableRow>('present', 'Present'),
        },
        {
            title: 'Absent',
            dataIndex: 'absent',
            key: 'absent',
            sorter: (a, b) => a.absent - b.absent,
            render: (val: number) => (
                <Tag color="red" style={{ borderRadius: '8px', fontWeight: 700, minWidth: '44px', textAlign: 'center' }}>
                    {val}
                </Tag>
            ),
            ...getColumnSearchProps<TableRow>('absent', 'Absent'),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            sorter: (a, b) => a.total - b.total,
            render: (val: number) => <Typography.Text style={{ fontWeight: 600 }}>{val}</Typography.Text>,
            ...getColumnSearchProps<TableRow>('total', 'Total'),
        },
        {
            title: 'Attendance Rate',
            dataIndex: 'rate',
            key: 'rate',
            width: 200,
            sorter: (a, b) => a.rate - b.rate,
            render: (rate: number) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Progress
                        percent={rate}
                        size="small"
                        style={{ flex: 1, margin: 0 }}
                        strokeColor={rate >= 75 ? '#38a169' : '#e53e3e'}
                        trailColor="#f0f0f0"
                        showInfo={false}
                    />
                    <Typography.Text style={{ fontWeight: 700, color: rate >= 75 ? '#38a169' : '#e53e3e', minWidth: '38px' }}>
                        {rate}%
                    </Typography.Text>
                </div>
            ),
            ...getColumnSearchProps<TableRow>('rate', 'Rate'),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={rows}
            pagination={{
                current,
                pageSize,
                showSizeChanger: true,
                pageSizeOptions: ['15', '30', '50', '100'],
                showTotal: (total, range) => (
                    <span style={{ color: '#4a5568' }}>
                        <strong style={{ color: '#2d3748' }}>{range[0]}–{range[1]}</strong> of <strong style={{ color: '#2d3748' }}>{total}</strong> records
                    </span>
                ),
                itemRender: (_: any, type: string, originalElement: any) => {
                    if (type === 'prev') return <span style={{ color: '#3182ce', fontWeight: 600, cursor: 'pointer', padding: '0 8px', fontSize: '13px' }}>Prev</span>;
                    if (type === 'next') return <span style={{ color: '#3182ce', fontWeight: 600, cursor: 'pointer', padding: '0 8px', fontSize: '13px' }}>Next</span>;
                    return originalElement;
                },
                position: ['bottomRight']
            }}
            scroll={{ x: 800, y: 400 }}
            getPopupContainer={(trigger) => trigger.closest('.att-antd-table') || document.body}
            bordered
            size="middle"
            className="att-antd-table"
            onChange={(pagination, f) => {
                if (pagination.current) setCurrent(pagination.current);
                if (pagination.pageSize) {
                    setPageSize(pagination.pageSize);
                    // Reset to first page if page size changes
                    if (pagination.pageSize !== pageSize) setCurrent(1);
                }
                onFilterChange(f);
            }}
            summary={pageData => {
                const totalP = pageData.reduce((s, r) => s + r.present, 0);
                const totalA = pageData.reduce((s, r) => s + r.absent, 0);
                const totalAll = totalP + totalA;
                const avgRate = totalAll > 0 ? Math.round((totalP / totalAll) * 100) : 0;
                return (
                    <Table.Summary.Row style={{ background: '#f8fafc', fontWeight: 700 }}>
                        <Table.Summary.Cell index={0} colSpan={2}>
                            <strong>Page Total</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                            <Tag color="green" style={{ fontWeight: 700 }}>{totalP}</Tag>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                            <Tag color="red" style={{ fontWeight: 700 }}>{totalA}</Tag>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            <strong>{totalAll}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                            <span style={{ fontWeight: 700, color: avgRate >= 75 ? '#38a169' : '#e53e3e' }}>{avgRate}%</span>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                );
            }}
        />
    );
};
