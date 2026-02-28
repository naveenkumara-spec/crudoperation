import React, { useState, useEffect } from 'react';
import {
    Table, Input, Tag, Space, Typography, Progress, Avatar,
    Button, Dropdown, Modal, Form, Select, message, Tooltip
} from 'antd';
import {
    SearchOutlined, SafetyCertificateOutlined, TeamOutlined,
    EditOutlined, DeleteOutlined, MoreOutlined, PlusOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getColumnSearchProps } from '../../utils/tableUtils';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Role {
    id: number;
    name: string;
    description: string;
    department_id: number | null;
    department_name?: string;
    employee_count: number;
    created_at?: string;
}

interface Department {
    id: number;
    name: string;
}

const ROLE_COLORS: string[] = [
    'blue', 'purple', 'green', 'orange', 'cyan', 'magenta', 'gold', 'lime', 'geekblue', 'volcano'
];

const Roles: React.FC = () => {
    const { user } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [filtered, setFiltered] = useState<Role[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [current, setCurrent] = useState<Role | null>(null);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [pageSize, setPageSize] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const roleParams = new URLSearchParams({ search: search });
            Object.entries(filters).forEach(([key, values]) => {
                if (values && Array.isArray(values) && values.length > 0) {
                    values.forEach(v => roleParams.append(key, String(v)));
                }
            });

            const [rolesRes, deptsRes] = await Promise.all([
                fetch(`${API_BASE}/roles?${roleParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/departments`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const rolesData = await rolesRes.json();
            const deptsData = await deptsRes.json();

            if (rolesRes.ok) { setRoles(rolesData.data); setFiltered(rolesData.data); }
            if (deptsRes.ok) { setDepartments(deptsData.data); }
        } catch { console.error('Failed to load data'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, filters]);

    const openAdd = () => { setCurrent(null); form.resetFields(); setModalOpen(true); };
    const openEdit = (r: Role) => { setCurrent(r); form.setFieldsValue(r); setModalOpen(true); };

    const handleDelete = (r: Role) => {
        Modal.confirm({
            title: `Delete role "${r.name}"?`,
            content: 'This will remove the role designation. Ensure no employees are assigned.',
            okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_BASE}/roles/${r.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        message.success('Role deleted');
                        fetchData();
                    } else {
                        const err = await res.json();
                        message.error(err.error || 'Delete failed');
                    }
                } catch { message.error('Request failed'); }
            }
        });
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const token = localStorage.getItem('token');
        const method = current ? 'PUT' : 'POST';
        const url = current ? `${API_BASE}/roles/${current.id}` : `${API_BASE}/roles`;
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(values)
            });
            if (res.ok) {
                message.success(`Role ${current ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchData();
            } else {
                const data = await res.json();
                message.error(data.error || 'Operation failed');
            }
        } catch { message.error('Request failed'); }
    };

    const maxCount = Math.max(...roles.map(r => r.employee_count), 1);

    const columns: ColumnsType<Role> = [
        {
            title: 'S.No',
            key: 'index',
            width: 70,
            render: (_v, _r, i) => (
                <Text strong style={{ color: '#718096' }}>
                    {(currentPage - 1) * pageSize + i + 1}
                </Text>
            ),
        },
        {
            title: 'Role / Designation', key: 'role',
            render: (_v, r, i) => (
                <Space>
                    <Avatar
                        style={{ backgroundColor: `hsl(${(i * 37) % 360},70%,55%)`, fontWeight: 700 }}
                        icon={<SafetyCertificateOutlined />}
                    />
                    <div>
                        <Text strong style={{ fontSize: '0.95rem' }}>{r.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Job Role</Text>
                    </div>
                </Space>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
            ...getColumnSearchProps<Role>('name', 'Role'),
        },
        {
            title: 'Department',
            dataIndex: 'department_id',
            key: 'department_id',
            filters: departments.map(d => ({ text: d.name, value: d.id })),
            render: (_v, r) => (
                <Tooltip title={r.department_name || 'N/A'}>
                    <Tag color="cyan" style={{
                        borderRadius: 8,
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'bottom'
                    }}>
                        {r.department_name || 'N/A'}
                    </Tag>
                </Tooltip>
            ),
            ...getColumnSearchProps<Role>('department_name' as any, 'Department'),
        },
        {
            title: 'Tag', dataIndex: 'name', key: 'tag',
            render: (name: string, _r, i) => (
                <Tooltip title={name}>
                    <Tag color={ROLE_COLORS[i % ROLE_COLORS.length]} style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'bottom'
                    }}>
                        {name}
                    </Tag>
                </Tooltip>
            ),
            ...getColumnSearchProps<Role>('name', 'Tag'),
        },
        {
            title: 'Employees', dataIndex: 'employee_count', key: 'employee_count',
            sorter: (a, b) => a.employee_count - b.employee_count,
            render: (count: number) => (
                <Space>
                    <TeamOutlined style={{ color: '#3182ce' }} />
                    <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700 }}>{count}</Tag>
                </Space>
            ),
            ...getColumnSearchProps<Role>('employee_count', 'Employees'),
        },
        {
            title: 'Distribution', key: 'distribution', width: 140,
            render: (_v, r) => {
                const pct = Math.round((r.employee_count / maxCount) * 100);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Progress
                            percent={pct}
                            size="small"
                            style={{ flex: 1, margin: 0 }}
                            strokeColor="var(--primary)"
                            trailColor="#f0f0f0"
                            showInfo={false}
                        />
                        <Text style={{ minWidth: 32, fontWeight: 600, fontSize: 12 }}>{pct}%</Text>
                    </div>
                );
            }
        },
        {
            title: 'Action', key: 'action', width: 80,
            render: (_v, r) => {
                const items = [
                    (user?.role === 'admin' || user?.role === 'owner') && { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => openEdit(r) },
                    (user?.role === 'owner') && { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(r) },
                ].filter(Boolean) as any[];
                return (
                    <Dropdown
                        menu={{ items }}
                        trigger={['click']}
                        getPopupContainer={(trigger) => trigger.closest('.roles-antd-table') || document.body}
                    >
                        <Button type="text" icon={<MoreOutlined style={{ fontSize: 20 }} />} />
                    </Dropdown>
                );
            }
        }
    ];

    const totalEmployees = roles.reduce((s, r) => s + r.employee_count, 0);

    return (
        <div className="roles-page">
            {/* Header */}
            <div className="roles-header-section">
                <div className="roles-title-group">
                    <h1 className="roles-primary-title">Roles & Designations</h1>
                    <p className="roles-secondary-sub">Manage and track job titles across the workforce</p>
                </div>
                <div className="roles-actions-group">
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Search roles…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="roles-search-input"
                    />
                    {(user?.role === 'admin' || user?.role === 'owner') && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openAdd}
                            className="roles-add-btn"
                        >
                            Add Role
                        </Button>
                    )}
                </div>
            </div>


            {/* Table */}
            <div className="roles-table-card">
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={loading}
                    onChange={(pagination, f) => {
                        if (pagination.current) setCurrentPage(pagination.current);
                        if (pagination.pageSize) {
                            setPageSize(pagination.pageSize);
                            if (pagination.pageSize !== pageSize) setCurrentPage(1);
                        }
                        setFilters(f);
                    }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['15', '30', '50', '100'],
                        showTotal: (total, range) => (
                            <span style={{ color: '#4a5568', marginRight: '8px' }}>
                                Showing <strong style={{ color: '#2d3748' }}>{range[0]} - {range[1]}</strong> of <strong style={{ color: '#2d3748' }}>{total}</strong>
                            </span>
                        ),
                        itemRender: (_: any, type: string, originalElement: any) => {
                            if (type === 'prev') return <span style={{ color: '#3182ce', fontWeight: 600, cursor: 'pointer', padding: '0 8px', fontSize: '13px' }}>Prev</span>;
                            if (type === 'next') return <span style={{ color: '#3182ce', fontWeight: 600, cursor: 'pointer', padding: '0 8px', fontSize: '13px' }}>Next</span>;
                            return originalElement;
                        },
                        position: ['bottomRight']
                    }}
                    scroll={{ x: 800, y: 'calc(100vh - 350px)' }}
                    getPopupContainer={(trigger) => trigger.closest('.roles-antd-table') || document.body}
                    className="roles-antd-table"
                    summary={pageData => {
                        const pTotal = pageData.reduce((s, r) => s + r.employee_count, 0);
                        return (
                            <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <strong>Page Total</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}>
                                    <Tag color="blue" style={{ fontWeight: 700 }}>{pTotal}</Tag>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4} />
                            </Table.Summary.Row>
                        );
                    }}
                />
            </div>

            <Modal
                title={current ? 'Edit Role' : 'Add New Role'}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={() => setModalOpen(false)}
                okText={current ? 'Update' : 'Create'}
                okButtonProps={{ style: { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: '#000', fontWeight: 600 } }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                    <Form.Item name="name" label="Role Name" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="e.g. Senior Developer" />
                    </Form.Item>
                    <Form.Item name="department_id" label="Department">
                        <Select
                            placeholder="Select department"
                            options={departments.map(d => ({ label: d.name, value: d.id }))}
                        />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Brief description of the role…" />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .roles-page { display:flex; flex-direction:column; gap:20px; padding: 4px; animation:fadeUp 0.4s ease; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
                
                .roles-header-section { display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; flex-wrap: wrap; gap: 16px; }
                .roles-primary-title { font-size:1.6rem; font-weight:800; color:#1a202c; margin:0; letter-spacing:-0.5px; }
                .roles-secondary-sub { color:#718096; font-size:0.85rem; margin:2px 0 0 0; }
                
                .roles-actions-group { display: flex; align-items: center; gap: 12px; }
                .roles-search-input { width: 240px; height: 40px; border-radius: 10px; border-color: #f0f0f0; }
                .roles-add-btn { background-color: var(--primary) !important; border-color: var(--primary) !important; color: #000 !important; font-weight: 700; border-radius: 10px; height: 40px; padding: 0 20px; }
                
                .roles-table-card { position:relative; background:#fff; border-radius:16px; overflow:visible; border:1px solid #edf2f7; box-shadow:0 2px 4px rgba(0,0,0,0.03); padding: 4px; }
                .roles-antd-table { position:relative; }
                
                /* Pagination Layout */
                .roles-antd-table .ant-pagination {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    width: 100% !important;
                    padding: 0 20px !important;
                }
                .roles-antd-table .ant-pagination-total-text {
                    order: -1;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
};

export default Roles;
