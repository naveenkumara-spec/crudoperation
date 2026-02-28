import React, { useState, useEffect } from 'react';
import {
    Table, Button, Input, Tag, Space, Modal,
    Form, message, Dropdown, Avatar, Typography, Tooltip
} from 'antd';
import {
    SearchOutlined, PlusOutlined, MoreOutlined,
    EditOutlined, DeleteOutlined, BuildOutlined, TeamOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getColumnSearchProps } from '../../utils/tableUtils';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Department {
    id: number;
    name: string;
    description: string;
    employee_count: number;
    role_count?: number;
    roles?: string[];
    created_at: string;
}

const DEPT_COLORS: Record<string, string> = {
    Engineering: 'blue', Marketing: 'purple', Sales: 'green',
    HR: 'orange', Finance: 'gold', Operations: 'cyan', Design: 'magenta',
};
const getColor = (name: string) => DEPT_COLORS[name] || 'default';

const Departments: React.FC = () => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [filtered, setFiltered] = useState<Department[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [current, setCurrent] = useState<Department | null>(null);
    const [form] = Form.useForm();
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchDepts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/departments?search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) { setDepartments(result.data); setFiltered(result.data); }
        } catch { message.error('Failed to load departments'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDepts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const openAdd = () => { setCurrent(null); form.resetFields(); setModalOpen(true); };
    const openEdit = (d: Department) => { setCurrent(d); form.setFieldsValue(d); setModalOpen(true); };

    const handleDelete = (d: Department) => {
        Modal.confirm({
            title: `Delete "${d.name}"?`,
            content: 'This will unlink all employees from this department.',
            okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token');
                    await fetch(`${API_BASE}/departments/${d.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    message.success('Department deleted');
                    fetchDepts();
                } catch { message.error('Delete failed'); }
            }
        });
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const token = localStorage.getItem('token');
        const method = current ? 'PUT' : 'POST';
        const url = current ? `${API_BASE}/departments/${current.id}` : `${API_BASE}/departments`;
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(values)
            });
            if (res.ok) {
                message.success(`Department ${current ? 'updated' : 'created'} successfully`);
                setModalOpen(false);
                fetchDepts();
            } else {
                const data = await res.json();
                message.error(data.error || 'Operation failed');
            }
        } catch { message.error('Request failed'); }
    };

    const columns: ColumnsType<Department> = [
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
            title: 'Department', key: 'dept',
            render: (_v, r) => (
                <Space>
                    <Avatar
                        style={{ background: `var(--color-${getColor(r.name)}, #1677ff)`, color: '#fff', fontWeight: 700 }}
                        icon={<BuildOutlined />}
                    />
                    <div>
                        <Text strong style={{ fontSize: '0.95rem' }}>{r.name}</Text>
                        <br />
                        <div style={{ maxWidth: 300, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {r.roles && r.roles.length > 0 ? (
                                r.roles.map(role => (
                                    <Tooltip title={role} key={role}>
                                        <Tag style={{
                                            fontSize: '10px',
                                            margin: 0,
                                            maxWidth: '120px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            cursor: 'default'
                                        }}>
                                            {role}
                                        </Tag>
                                    </Tooltip>
                                ))
                            ) : (
                                <Text type="secondary" style={{ fontSize: '11px' }}>{r.description || 'No roles defined'}</Text>
                            )}
                        </div>
                    </div>
                </Space>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
            ...getColumnSearchProps<Department>('name', 'Department'),
        },
        {
            title: 'Color Tag', dataIndex: 'name', key: 'tag',
            render: (name: string) => <Tag color={getColor(name)} style={{ borderRadius: 8, fontWeight: 600 }}>{name}</Tag>,
            ...getColumnSearchProps<Department>('name', 'Tag'),
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
            ...getColumnSearchProps<Department>('employee_count', 'Employees'),
        },
        {
            title: 'Created', dataIndex: 'created_at', key: 'created_at',
            sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            render: (v: string) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            ...getColumnSearchProps<Department>('created_at', 'Created'),
        },
        {
            title: 'Action', key: 'action', width: 80,
            render: (_v, r) => {
                const items = [
                    (user?.role === 'admin' || user?.role === 'owner') && {
                        key: 'edit', label: 'Edit', icon: <EditOutlined />,
                        onClick: () => openEdit(r)
                    },
                    user?.role === 'owner' && {
                        key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true,
                        onClick: () => handleDelete(r)
                    },
                ].filter(Boolean) as any[];
                return (
                    <Dropdown
                        menu={{ items }}
                        trigger={['click']}
                        getPopupContainer={(trigger) => trigger.closest('.dept-antd-table') || document.body}
                    >
                        <Button type="text" icon={<MoreOutlined style={{ fontSize: 20 }} />} />
                    </Dropdown>
                );
            }
        }
    ];

    return (
        <div className="dept-page">
            {/* Header */}
            <div className="dept-header">
                <div>
                    <h1 className="dept-title">Departments</h1>
                    <p className="dept-sub">Manage your organizational departments</p>
                </div>
                <div className="dept-actions">
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Search departments…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: 260, borderRadius: 10 }}
                    />
                    {(user?.role === 'admin' || user?.role === 'owner') && (
                        <Button
                            type="primary" icon={<PlusOutlined />} onClick={openAdd}
                        style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: '#000', fontWeight: 700, borderRadius: 10, height: 40 }}
                        >
                            Add Department
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="dept-stats">
                <div className="dept-stat-card">
                    <span className="dept-stat-val">{departments.length}</span>
                    <span className="dept-stat-label">Total Departments</span>
                </div>
                <div className="dept-stat-card">
                    <span className="dept-stat-val">{departments.reduce((s, d) => s + d.employee_count, 0)}</span>
                    <span className="dept-stat-label">Total Employees</span>
                </div>
                <div className="dept-stat-card">
                    <span className="dept-stat-val">
                        {departments.length > 0
                            ? Math.round(departments.reduce((s, d) => s + d.employee_count, 0) / departments.length)
                            : 0}
                    </span>
                    <span className="dept-stat-label">Avg per Department</span>
                </div>
            </div>

            {/* Table */}
            <div className="dept-table-card">
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
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
                    onChange={(pagination) => {
                        if (pagination.current) setCurrentPage(pagination.current);
                        if (pagination.pageSize) {
                            setPageSize(pagination.pageSize);
                            if (pagination.pageSize !== pageSize) setCurrentPage(1);
                        }
                    }}
                    scroll={{ x: 800, y: 'calc(100vh - 425px)' }}
                    getPopupContainer={(trigger) => trigger.closest('.dept-antd-table') || document.body}
                    className="dept-antd-table"
                />
            </div>

            {/* Modal */}
            <Modal
                title={current ? 'Edit Department' : 'Add New Department'}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={() => setModalOpen(false)}
                okText={current ? 'Update' : 'Create'}
                okButtonProps={{ style: { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: '#000', fontWeight: 600 } }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                    <Form.Item name="name" label="Department Name" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="e.g. Engineering" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Brief description of the department…" />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .dept-page { display:flex; flex-direction:column; gap:20px; animation:fadeUp 0.4s ease; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
                .dept-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; }
                .dept-title { font-size:1.6rem; font-weight:800; color:#1a202c; margin: 0; }
                .dept-sub { color:#718096; font-size:0.85rem; margin-top:2px; }
                .dept-actions { display:flex; gap:12px; align-items:center; }
                .dept-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; }
                .dept-stat-card { background:#fff; border-radius:16px; padding:16px 20px; border:1px solid #edf2f7;
                    box-shadow:0 2px 4px rgba(0,0,0,0.03); display:flex; flex-direction:column; gap:2px; }
                .dept-stat-val { font-size:1.6rem; font-weight:800; color:var(--primary); }
                .dept-stat-label { font-size:0.75rem; color:#718096; font-weight:500; }
                .dept-table-card { position:relative; background:#fff; border-radius:16px; overflow:visible; border:1px solid #edf2f7; box-shadow:0 2px 4px rgba(0,0,0,0.03); }
                .dept-antd-table { position:relative; }
                
                /* Pagination Layout */
                .dept-antd-table .ant-pagination {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    width: 100% !important;
                    padding: 0 20px !important;
                }
                .dept-antd-table .ant-pagination-total-text {
                    order: -1;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
};

export default Departments;
