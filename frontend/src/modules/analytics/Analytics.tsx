import React from 'react';
import { BarChart, PieChart, LineChart, ScatterChart, Gauge } from '@mui/x-charts';
import {
    LayoutDashboard,
    PieChart as PieIcon,
    BarChart3,
    LineChart as LineIcon,
    AreaChart as AreaIcon,
    ArrowUpRight,
    TrendingUp,
    Users,
    Activity,
    Target,
    Zap,
    MousePointer2
} from 'lucide-react';
import { Card, Row, Col, Typography, Space, Tag, Select, Divider } from 'antd';

const { Title, Text } = Typography;

const Analytics: React.FC = () => {
    const [viewMode, setViewMode] = React.useState('bar');
    const [isLoading, setIsLoading] = React.useState(false);

    // ── Sample Data ──────────────────────────────────────────────────────────
    const barData = [
        { department: 'IT', headcount: 45, turnover: 5 },
        { department: 'HR', headcount: 12, turnover: 2 },
        { department: 'Sales', headcount: 38, turnover: 8 },
        { department: 'Marketing', headcount: 25, turnover: 4 },
        { department: 'Finance', headcount: 18, turnover: 1 },
    ];

    const pieData = [
        { id: 0, value: 35, label: 'Full-time', color: '#3b82f6' },
        { id: 1, value: 25, label: 'Part-time', color: '#10b981' },
        { id: 2, value: 20, label: 'Contract', color: '#f59e0b' },
        { id: 3, value: 20, label: 'Freelance', color: '#ec4899' },
    ];

    const lineData = [
        { month: 'Jan', revenue: 4000, expenses: 2400 },
        { month: 'Feb', revenue: 3000, expenses: 1398 },
        { month: 'Mar', revenue: 2000, expenses: 9800 },
        { month: 'Apr', revenue: 2780, expenses: 3908 },
        { month: 'May', revenue: 1890, expenses: 4800 },
        { month: 'Jun', revenue: 2390, expenses: 3800 },
    ];

    const areaData = [
        { day: 'Mon', actives: 120 },
        { day: 'Tue', actives: 150 },
        { day: 'Wed', actives: 180 },
        { day: 'Thu', actives: 140 },
        { day: 'Fri', actives: 210 },
        { day: 'Sat', actives: 250 },
        { day: 'Sun', actives: 230 },
    ];

    const scatterData = [
        { x: 1, y: 4.5, id: 1 }, { x: 2, y: 5.2, id: 2 }, { x: 3, y: 4.8, id: 3 },
        { x: 5, y: 6.1, id: 4 }, { x: 8, y: 7.5, id: 5 }, { x: 10, y: 8.2, id: 6 },
        { x: 12, y: 7.9, id: 7 }, { x: 15, y: 9.1, id: 8 }, { x: 18, y: 8.8, id: 9 },
    ];

    // Simulate loading on change to show dynamic behavior
    const handleViewChange = (val: string) => {
        setIsLoading(true);
        setViewMode(val);
        setTimeout(() => setIsLoading(false), 500);
    };

    return (
        <div className="fade-in" style={{ padding: '0px', minHeight: '100%' }}>
            {/* ── Header & Toolbar ────────────────────────────────────────── */}
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                background: '#fff',
                padding: '20px',
                borderRadius: '20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                border: '1px solid #edf2f7'
            }}>
                <Space align="center" size={16}>
                    <div style={{
                        background: 'var(--primary)',
                        padding: '12px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                        transform: 'rotate(-5deg)'
                    }}>
                        <LayoutDashboard size={24} color="#000" />
                    </div>
                    <div>
                        <Title level={3} style={{ margin: 0, fontWeight: 850, letterSpacing: '-0.8px', color: '#0f172a' }}>
                            Enterprise Analytics
                        </Title>
                        <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                            Real-time intelligence across 6 core dimensions
                        </Text>
                    </div>
                </Space>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ textAlign: 'right', display: 'none' /* Hidden on laptops if narrow */ }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Mode</div>
                    </div>
                    <Select
                        value={viewMode}
                        style={{ width: 220 }}
                        onChange={handleViewChange}
                        dropdownStyle={{ borderRadius: '12px' }}
                        options={[
                            { label: 'Headcount Metrics', value: 'bar' },
                            { label: 'Employment Type', value: 'pie' },
                            { label: 'Financial Trends', value: 'line' },
                            { label: 'User Engagement', value: 'area' },
                            { label: 'Performance Correlation', value: 'scatter' },
                            { label: 'Efficiency Score', value: 'gauge' },
                        ]}
                    />
                    <div style={{
                        background: 'rgba(0,0,0,0.06)',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px rgba(0,0,0,0.2)' }}></div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#854d0e', letterSpacing: '0.05em' }}>LIVE DATA</span>
                    </div>
                </div>
            </div>

            {/* ── Charts Loader/Content ────────────────────────────────────────── */}
            {isLoading ? (
                <div style={{ padding: '100px', textAlign: 'center' }}>
                    <div className="att-spinner" style={{ margin: '0 auto 20px' }}></div>
                    <Text type="secondary">Updating visualization...</Text>
                </div>
            ) : (
                <Row gutter={[24, 24]}>
                    {/* Bar Chart */}
                    {(viewMode === 'bar') && (
                        <Col xs={24}>
                            <ChartCard
                                title="Headcount by Department"
                                subtitle="Distribution of workforce across business units"
                                icon={<BarChart3 size={20} color="var(--primary)" />}
                            >
                                <BarChart
                                    dataset={barData}
                                    xAxis={[{
                                        scaleType: 'band',
                                        dataKey: 'department',
                                        label: 'Department',
                                        categoryGapRatio: 0.4,
                                        barGapRatio: 0.2
                                    }]}
                                    series={[
                                        { dataKey: 'headcount', label: 'Headcount', color: 'var(--primary)' },
                                        { dataKey: 'turnover', label: 'Turnover', color: '#ef4444' },
                                    ]}
                                    height={350}
                                    margin={{ top: 20, bottom: 50, left: 50, right: 20 }}
                                />
                            </ChartCard>
                        </Col>
                    )}

                    {/* Pie Chart */}
                    {(viewMode === 'pie') && (
                        <Col xs={24}>
                            <ChartCard
                                title="Employment Type"
                                subtitle="Breakdown of contract configurations"
                                icon={<PieIcon size={20} color="#3b82f6" />}
                            >
                                <div style={{ display: 'flex', justifyContent: 'center', height: '400px' }}>
                                    <PieChart
                                        series={[{
                                            data: pieData,
                                            innerRadius: 100,
                                            outerRadius: 160,
                                            paddingAngle: 5,
                                            cornerRadius: 12,
                                        }]}
                                        height={400}
                                    />
                                </div>
                            </ChartCard>
                        </Col>
                    )}

                    {/* Line Chart */}
                    {(viewMode === 'line') && (
                        <Col xs={24}>
                            <ChartCard
                                title="Revenue vs Expenses"
                                subtitle="Financial performance over the last 6 months"
                                icon={<LineIcon size={20} color="#10b981" />}
                            >
                                <LineChart
                                    xAxis={[{ scaleType: 'point', data: lineData.map(d => d.month) }]}
                                    series={[
                                        { data: lineData.map(d => d.revenue), label: 'Revenue', color: '#3b82f6' },
                                        { data: lineData.map(d => d.expenses), label: 'Expenses', color: '#ff4d4f' },
                                    ]}
                                    height={400}
                                />
                            </ChartCard>
                        </Col>
                    )}

                    {/* Area Chart */}
                    {(viewMode === 'area') && (
                        <Col xs={24}>
                            <ChartCard
                                title="Daily Active Sessions"
                                subtitle="User engagement metrics throughout the week"
                                icon={<AreaIcon size={20} color="#ec4899" />}
                            >
                                <LineChart
                                    xAxis={[{ scaleType: 'point', data: areaData.map(d => d.day) }]}
                                    series={[{ data: areaData.map(d => d.actives), label: 'Active Users', color: 'var(--primary)', area: true }]}
                                    height={400}
                                />
                            </ChartCard>
                        </Col>
                    )}

                    {/* Scatter Chart */}
                    {(viewMode === 'scatter') && (
                        <Col xs={24}>
                            <ChartCard
                                title="Performance vs Experience"
                                subtitle="Correlation between years of service and performance score"
                                icon={<MousePointer2 size={20} color="#8b5cf6" />}
                            >
                                <ScatterChart
                                    series={[{ data: scatterData, label: 'Employee Correlation', color: '#8b5cf6' }]}
                                    height={400}
                                    xAxis={[{ label: 'Experience (Years)' }]}
                                    yAxis={[{ label: 'Performance Score' }]}
                                />
                            </ChartCard>
                        </Col>
                    )}

                    {/* Gauge Chart */}
                    {(viewMode === 'gauge') && (
                        <Col xs={24}>
                            <ChartCard
                                title="Overall Efficiency Score"
                                subtitle="Real-time operational productivity metric"
                                icon={<Zap size={20} color="#f59e0b" />}
                            >
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', position: 'relative' }}>
                                    <Gauge
                                        width={300}
                                        height={300}
                                        value={82}
                                        startAngle={-110}
                                        endAngle={110}
                                        innerRadius="80%"
                                        outerRadius="100%"
                                    />
                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                        <Title level={1} style={{ margin: 0, fontSize: '48px', color: '#f59e0b' }}>82%</Title>
                                        <Text strong type="secondary">Productivity</Text>
                                    </div>
                                </div>
                            </ChartCard>
                        </Col>
                    )}
                </Row>
            )}

            <style>{`
                .chart-card-hover {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid #e2e8f0 !important;
                    background: #ffffff !important;
                }
                .chart-card-hover:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    border-color: var(--primary) !important;
                }
                .att-spinner { width:44px; height:44px; border:4px solid #e2e8f0; border-top-color:var(--primary); border-radius:50%; animation:spin 0.8s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite; }
                @keyframes spin { to { transform:rotate(360deg); } }

                @media (max-width: 1440px) {
                    .chart-card-hover { border-radius: 16px !important; }
                }
            `}</style>
        </div>
    );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; subtitle?: string }> = ({ title, value, icon, color }) => (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #edf2f7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#718096' }}>{title}</span>
            <div style={{ color, background: `${color}15`, padding: '8px', borderRadius: '12px' }}>{icon}</div>
        </div>
        <div style={{ fontSize: '28px', fontWeight: 850, color: '#1a202c', letterSpacing: '-1px' }}>{value}</div>
    </div>
);

const ChartCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, icon, children }) => (
    <Card className="chart-card-hover" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
            <div style={{
                width: '48px',
                height: '48px',
                background: '#f8fafc',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #f1f5f9'
            }}>
                {icon}
            </div>
            <div>
                <Title level={4} style={{ margin: 0, fontWeight: 800, fontSize: '18px', color: '#1e293b', letterSpacing: '-0.3px' }}>{title}</Title>
                <Text type="secondary" style={{ fontSize: '13px', fontWeight: 500 }}>{subtitle}</Text>
            </div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '12px' }}>
            {children}
        </div>
    </Card>
);

export default Analytics;
