import React, { useState, useCallback, useEffect } from 'react';
import {
    Table, Input, Tag, Avatar, Space, Typography, Card,
    Select, Statistic, Row, Col, Tooltip, Badge, Button, Checkbox, Popover
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { Search, Users as UsersIcon, Building2, UserCheck, UserX, Printer, Download } from 'lucide-react';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    age: number | null;
    gender: string | null;
    department: string | null;
    salary: number | null;
    location: string | null;
    joining_date: string | null;
    avatar: string | null;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
}

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Legal', 'Design', 'Product', 'Support'];
const ROLES = ['admin', 'employee'];
const GENDERS = ['Male', 'Female', 'Other'];

const roleColor: Record<string, string> = {
    admin: 'gold',
    employee: 'blue',
    owner: 'purple',
};

const genderColor: Record<string, string> = {
    Male: 'blue',
    Female: 'pink',
    Other: 'default',
};

const Users: React.FC = () => {
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState<string[]>([]);
    const [roleFilter, setRoleFilter] = useState<string[]>([]);
    const [genderFilter, setGenderFilter] = useState<string[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10 });
    const [sortBy, setSortBy] = useState('id');
    const [order, setOrder] = useState('ASC');
    const [stats, setStats] = useState({ total: 0, admins: 0, depts: 0 });
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [showAll, setShowAll] = useState(false);
    const DEFAULT_VISIBLE_COLS: Record<string, boolean> = {
        username: true,
        role: true,
        department: true,
        gender: true,
        age: true,
        salary: true,
        location: true,
        joining_date: true,
    };
    const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(DEFAULT_VISIBLE_COLS);

    const fetchUsers = useCallback(async (opts?: {
        page?: number; limit?: number; search?: string;
        sortBy?: string; order?: string;
        deptFilter?: string[]; roleFilter?: string[]; genderFilter?: string[];
    }) => {
        setLoading(true);
        try {
            const p = opts?.page ?? pagination.page;
            const l = opts?.limit ?? (showAll ? Math.max(pagination.total, 100000) : pagination.limit);
            const s = opts?.search ?? search;
            const sb = opts?.sortBy ?? sortBy;
            const o = opts?.order ?? order;
            const df = opts?.deptFilter ?? deptFilter;
            const rf = opts?.roleFilter ?? roleFilter;
            const gf = opts?.genderFilter ?? genderFilter;

            const params = new URLSearchParams({
                page: String(p),
                limit: String(l),
                search: s,
                sortBy: sb,
                order: o,
            });
            df.forEach(d => params.append('department', d));
            rf.forEach(r => params.append('role', r));
            gf.forEach(g => params.append('gender', g));

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setData(json.data || []);
            setPagination({ total: json.pagination.total, page: p, limit: l });

            // Compute stats from full unfiltered count on first load
            if (!opts) {
                setStats(prev => ({ ...prev, total: json.pagination.total }));
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, sortBy, order, deptFilter, roleFilter, genderFilter, showAll]);

    // Separate stats fetch (unfiltered total)
    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const [totalRes, adminRes] = await Promise.all([
                fetch(`${API_BASE}/users?limit=1&page=1`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/users?limit=1&page=1&role=admin`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const totalJson = await totalRes.json();
            const adminJson = await adminRes.json();
            setStats({
                total: totalJson.pagination?.total ?? 0,
                admins: adminJson.pagination?.total ?? 0,
                depts: DEPARTMENTS.length,
            });
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchUsers({ page: 1 });
    }, []);

    const handleTableChange = (
        pag: TablePaginationConfig,
        _filters: Record<string, FilterValue | null>,
        sorter: SorterResult<User> | SorterResult<User>[]
    ) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        const newSortBy = s.field as string || 'id';
        const newOrder = s.order === 'descend' ? 'DESC' : 'ASC';
        setSortBy(newSortBy);
        setOrder(newOrder);
        const nextPage = showAll ? 1 : (pag.current ?? 1);
        const nextLimit = showAll ? pagination.limit : (pag.pageSize ?? 10);
        setPagination(prev => ({ ...prev, page: nextPage, limit: nextLimit }));
        fetchUsers({
            page: nextPage,
            limit: nextLimit,
            sortBy: newSortBy,
            order: newOrder,
        });
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        fetchUsers({ search: val, page: 1 });
    };

    const handleDeptFilter = (val: string[]) => {
        setDeptFilter(val);
        fetchUsers({ deptFilter: val, page: 1 });
    };

    const handleRoleFilter = (val: string[]) => {
        setRoleFilter(val);
        fetchUsers({ roleFilter: val, page: 1 });
    };

    const handleGenderFilter = (val: string[]) => {
        setGenderFilter(val);
        fetchUsers({ genderFilter: val, page: 1 });
    };

    const handleExportCsv = () => {
        const printableCols = [
            { key: 'id', label: 'ID', get: (u: User) => String(u.id) },
            { key: 'username', label: 'User', get: (u: User) => u.username ?? '' },
            { key: 'role', label: 'Role', get: (u: User) => u.role ?? '' },
            { key: 'department', label: 'Department', get: (u: User) => u.department ?? '' },
            { key: 'gender', label: 'Gender', get: (u: User) => u.gender ?? '' },
            { key: 'age', label: 'Age', get: (u: User) => (u.age ?? '') as any },
            { key: 'salary', label: 'Salary', get: (u: User) => (u.salary ?? '') as any },
            { key: 'location', label: 'Location', get: (u: User) => u.location ?? '' },
            { key: 'joining_date', label: 'Joined', get: (u: User) => u.joining_date ? new Date(u.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '' },
        ].filter(c => c.key === 'id' || visibleCols[c.key]);

        const rowsSource = selectedRowKeys.length
            ? data.filter(u => selectedRowKeys.includes(u.id))
            : data;

        const headers = printableCols.map(c => c.label);
        const rows = rowsSource.map(u => printableCols.map(c => c.get(u)));

        const escapeCsv = (val: any) => {
            const str = String(val ?? '');
            if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
            return str;
        };

        const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_page_${pagination.page}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const win = window.open('', '_blank');
        if (!win) return;
        const styles = `
            <style>
                body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #1a202c; }
                h1 { margin: 0 0 12px; font-size: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                th { background: #f8fafc; text-transform: uppercase; font-weight: 700; font-size: 11px; color: #64748b; }
            </style>
        `;
        const printableCols = [
            { key: 'id', label: 'ID', get: (u: User) => String(u.id) },
            { key: 'username', label: 'User', get: (u: User) => u.username ?? '' },
            { key: 'role', label: 'Role', get: (u: User) => u.role ?? '' },
            { key: 'department', label: 'Department', get: (u: User) => u.department ?? '' },
            { key: 'gender', label: 'Gender', get: (u: User) => u.gender ?? '' },
            { key: 'age', label: 'Age', get: (u: User) => String(u.age ?? '') },
            { key: 'salary', label: 'Salary', get: (u: User) => String(u.salary ?? '') },
            { key: 'location', label: 'Location', get: (u: User) => u.location ?? '' },
            { key: 'joining_date', label: 'Joined', get: (u: User) => u.joining_date ? new Date(u.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '' },
        ].filter(c => c.key === 'id' || visibleCols[c.key]);

        const rowsSource = selectedRowKeys.length
            ? data.filter(u => selectedRowKeys.includes(u.id))
            : data;

        const headerCells = printableCols.map(c => `<th>${c.label}</th>`).join('');
        const rows = rowsSource.map(u => `
            <tr>${printableCols.map(c => `<td>${c.get(u)}</td>`).join('')}</tr>
        `).join('');
        const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8" />${styles}</head>
            <body>
                <h1>User Profiles</h1>
                <table>
                    <thead>
                        <tr>${headerCells}</tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <script>window.onload = () => setTimeout(() => window.print(), 100);</script>
            </body>
            </html>
        `;
        win.document.open();
        win.document.write(html);
        win.document.close();
    };

    const columns: ColumnsType<User> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
            width: 70,
            render: (id) => <Text type="secondary">{id}</Text>,
        },
        {
            title: 'User',
            key: 'username',
            sorter: true,
            dataIndex: 'username',
            render: (name: string, record: User) => (
                <Space>
                    <Avatar
                        src={record.avatar || undefined}
                        style={{ background: 'var(--primary)', color: '#000', fontWeight: 700 }}
                        size={38}
                    >
                        {!record.avatar && name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <Tooltip title={name}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        </Tooltip>
                        <Tooltip title={record.email}>
                            <Text type="secondary" style={{ fontSize: '0.78rem', display: 'inline-block', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.email}</Text>
                        </Tooltip>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            sorter: true,
            width: 110,
            render: (role: string) => (
                <Tag color={roleColor[role] || 'default'} style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {role}
                </Tag>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            sorter: true,
            render: (dept: string) => dept
                ? <Tooltip title={dept}><Text ellipsis style={{ maxWidth: 150 }}>{dept}</Text></Tooltip>
                : <Text type="secondary">—</Text>,
        },
        {
            title: 'Gender',
            dataIndex: 'gender',
            key: 'gender',
            width: 100,
            render: (g: string) => g
                ? <Badge color={genderColor[g] || 'gray'} text={g} />
                : <Text type="secondary">—</Text>,
        },
        {
            title: 'Age',
            dataIndex: 'age',
            key: 'age',
            sorter: true,
            width: 80,
            render: (age: number) => age ?? <Text type="secondary">—</Text>,
        },
        {
            title: 'Salary',
            dataIndex: 'salary',
            key: 'salary',
            sorter: true,
            width: 130,
            render: (s: number) => s
                ? <Text strong>₹{Number(s).toLocaleString('en-IN')}</Text>
                : <Text type="secondary">—</Text>,
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            render: (loc: string) => loc
                ? <Tooltip title={loc}><Text ellipsis style={{ maxWidth: 150 }}>{loc}</Text></Tooltip>
                : <Text type="secondary">—</Text>,
        },
        {
            title: 'Joined',
            dataIndex: 'joining_date',
            key: 'joining_date',
            sorter: true,
            width: 120,
            render: (d: string) => d
                ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : <Text type="secondary">—</Text>,
        },
    ];

    return (
        <div style={{ padding: '28px 32px' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>User Profiles</Title>
                <Text type="secondary">Manage and view all registered user accounts</Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title="Total Users"
                            value={stats.total}
                            prefix={<UsersIcon size={20} style={{ marginRight: 6, color: 'var(--primary)' }} />}
                            valueStyle={{ fontWeight: 800, color: '#1a202c' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title="Admins"
                            value={stats.admins}
                            prefix={<UserCheck size={20} style={{ marginRight: 6, color: '#52c41a' }} />}
                            valueStyle={{ fontWeight: 800, color: '#1a202c' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Statistic
                            title="Departments"
                            value={stats.depts}
                            prefix={<Building2 size={20} style={{ marginRight: 6, color: '#1677ff' }} />}
                            valueStyle={{ fontWeight: 800, color: '#1a202c' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card
                bordered={false}
                style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}
                bodyStyle={{ padding: '16px 20px' }}
            >
                <Row gutter={12} align="middle">
                    <Col flex="1">
                        <Input
                            prefix={<Search size={16} color="#94a3b8" />}
                            placeholder="Search by name, email or department..."
                            allowClear
                            onChange={e => handleSearch(e.target.value)}
                            style={{ borderRadius: 10 }}
                            size="large"
                        />
                    </Col>
                    <Col>
                        <Select
                            mode="multiple"
                            placeholder="Department"
                            style={{ minWidth: 180 }}
                            onChange={handleDeptFilter}
                            allowClear
                            maxTagCount={1}
                            size="large"
                        >
                            {DEPARTMENTS.map(d => <Option key={d} value={d}>{d}</Option>)}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            mode="multiple"
                            placeholder="Role"
                            style={{ minWidth: 140 }}
                            onChange={handleRoleFilter}
                            allowClear
                            maxTagCount={1}
                            size="large"
                        >
                            {ROLES.map(r => <Option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</Option>)}
                        </Select>
                    </Col>
                    <Col>
                        <Select
                            mode="multiple"
                            placeholder="Gender"
                            style={{ minWidth: 130 }}
                            onChange={handleGenderFilter}
                            allowClear
                            maxTagCount={1}
                            size="large"
                        >
                            {GENDERS.map(g => <Option key={g} value={g}>{g}</Option>)}
                        </Select>
                    </Col>
                </Row>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Popover
                    trigger="click"
                    placement="bottomLeft"
                    content={(
                        <div style={{ maxWidth: 240 }}>
                            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12, color: '#64748b' }}>Columns to include</div>
                            <Checkbox checked disabled>ID</Checkbox>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 6, marginTop: 8 }}>
                                {[
                                    { key: 'username', label: 'User' },
                                    { key: 'role', label: 'Role' },
                                    { key: 'department', label: 'Department' },
                                    { key: 'gender', label: 'Gender' },
                                    { key: 'age', label: 'Age' },
                                    { key: 'salary', label: 'Salary' },
                                    { key: 'location', label: 'Location' },
                                    { key: 'joining_date', label: 'Joined' },
                                ].map(opt => (
                                    <Checkbox
                                        key={opt.key}
                                        checked={visibleCols[opt.key]}
                                        onChange={e => setVisibleCols(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                                    >
                                        {opt.label}
                                    </Checkbox>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <Button size="small" onClick={() => {
                                    const cleared: Record<string, boolean> = {};
                                    Object.keys(DEFAULT_VISIBLE_COLS).forEach(k => cleared[k] = false);
                                    setVisibleCols(cleared);
                                }}>Clear</Button>
                                <Button size="small" type="primary" onClick={() => setVisibleCols(DEFAULT_VISIBLE_COLS)}>Reset</Button>
                            </div>
                        </div>
                    )}
                >
                    <Button>Columns</Button>
                </Popover>

                <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={handlePrint} icon={<Printer size={16} />}>
                        Print
                    </Button>
                    <Button onClick={handleExportCsv} icon={<Download size={16} />}>
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card
                bordered={false}
                style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                bodyStyle={{ padding: 0 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Table</Text>
                    <div>
                        <Checkbox
                            checked={showAll}
                            onChange={e => {
                                const enabled = e.target.checked;
                                setShowAll(enabled);
                                if (enabled) {
                                    const lim = pagination.total || 100000;
                                    setPagination(prev => ({ ...prev, page: 1, limit: lim }));
                                    fetchUsers({ page: 1, limit: lim });
                                } else {
                                    setPagination(prev => ({ ...prev, page: 1, limit: 10 }));
                                    fetchUsers({ page: 1, limit: 10 });
                                }
                            }}
                        >
                            Show all
                        </Checkbox>
                    </div>
                </div>
                <Table<User>
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        preserveSelectedRowKeys: true
                    }}
                    columns={columns.filter(c => (c.key === 'id') || visibleCols[c.key as string])}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: 1100, y: 'calc(100vh - 400px)' }}
                    pagination={
                        showAll
                            ? false
                            : {
                                current: pagination.page,
                                pageSize: pagination.limit,
                                total: pagination.total,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                                showTotal: (total, range) => (
                                    <span style={{ color: '#4a5568' }}>
                                        <strong style={{ color: '#2d3748' }}>{range[0]}–{range[1]}</strong> of <strong style={{ color: '#2d3748' }}>{total}</strong> users
                                    </span>
                                ),
                                itemRender: (_: any, type: string, originalElement: any) => {
                                    if (type === 'prev') return <span style={{ color: '#3182ce', fontWeight: 600, cursor: 'pointer', padding: '0 8px', fontSize: '13px' }}>Prev</span>;
                                    if (type === 'next') return <span style={{ color: '#3182ce', fontWeight: 600, cursor: 'pointer', padding: '0 8px', fontSize: '13px' }}>Next</span>;
                                    return originalElement;
                                },
                                position: ['bottomRight'],
                                style: { padding: '16px 20px' },
                              }
                    }
                    className="users-antd-table"
                    style={{ borderRadius: 14 }}
                />
            </Card>
            <style>{`
                .users-antd-table .ant-pagination {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    width: 100% !important;
                }
                .users-antd-table .ant-pagination-total-text {
                    order: -1;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
};

export default Users;
