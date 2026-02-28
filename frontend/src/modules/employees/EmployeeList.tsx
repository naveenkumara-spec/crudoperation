import React, { useState, useEffect } from 'react';
import {
    Table,
    Input,
    Button,
    Tag,
    Space,
    Dropdown,
    Menu,
    Modal,
    Form,
    InputNumber,
    Select,
    message,
    Typography,
    Avatar,
    Tooltip
} from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    PlusOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getColumnSearchProps } from '../../utils/tableUtils';
import { Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;
const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmployeeList: React.FC = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [filters, setFilters] = useState<Record<string, any>>({});

    // Modal states
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
    const [form] = Form.useForm();

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                search: searchTerm,
                page: String(page),
                limit: String(limit),
                sortBy: sortField,
                order: sortOrder
            });

            // Add filters to params
            Object.entries(filters).forEach(([key, values]) => {
                if (values && Array.isArray(values) && values.length > 0) {
                    values.forEach(v => params.append(key, String(v)));
                }
            });

            const response = await fetch(`${API_BASE}/employees?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (response.ok) {
                setEmployees(result.data);
                setTotal(result.pagination.total);
            }
        } catch (err) {
            message.error('Failed to fetch employees');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEmployees();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, page, limit, sortField, sortOrder, filters]);

    const handleDelete = (id: number | string) => {
        if (user?.role !== 'owner') {
            message.warning('Only owners can delete employees');
            return;
        }

        Modal.confirm({
            title: 'Are you sure you want to delete this employee?',
            content: 'This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE}/employees/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        message.success('Employee deleted successfully');
                        fetchEmployees();
                    }
                } catch (err) {
                    message.error('Delete failed');
                }
            },
        });
    };

    const handleEdit = (employee: Employee) => {
        setCurrentEmployee(employee);
        form.setFieldsValue(employee);
        setIsEditModalVisible(true);
    };

    const handleAdd = () => {
        setCurrentEmployee(null);
        form.resetFields();
        setIsEditModalVisible(true);
    };

    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            const method = currentEmployee ? 'PUT' : 'POST';
            const url = currentEmployee
                ? `${API_BASE}/employees/${currentEmployee.id}`
                : `${API_BASE}/employees`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                message.success(`Employee ${currentEmployee ? 'updated' : 'added'} successfully`);
                setIsEditModalVisible(false);
                fetchEmployees();
            } else {
                const data = await response.json();
                message.error(data.message || 'Operation failed');
            }
        } catch (err) {
            console.error('Validation failed:', err);
        }
    };

    const columns: ColumnsType<Employee> = [
        {
            title: 'S.No',
            key: 'index',
            width: 70,
            render: (_text, _record, index) => (
                <Text strong style={{ color: '#718096' }}>
                    {(page - 1) * limit + index + 1}
                </Text>
            ),
        },
        {
            title: 'Employee',
            key: 'employee',
            dataIndex: 'name', // Added dataIndex for server sorting
            render: (_text, record) => (
                <Space size="middle">
                    <Avatar
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.name}`}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: 'var(--primary)', color: '#000' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>ID-{record.id}</Text>
                    </div>
                </Space>
            ),
            sorter: true,
            ...getColumnSearchProps<Employee>('name', 'Employee'),
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            sorter: true,
            render: (text: string) => (
                <Tooltip title={text}>
                    <div style={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
            ...getColumnSearchProps<Employee>('designation', 'Designation'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Inactive', value: 'inactive' },
            ],
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'} style={{ textTransform: 'capitalize', borderRadius: '12px', fontWeight: 600 }}>
                    {status || 'active'}
                </Tag>
            ),
            ...getColumnSearchProps<Employee>('status', 'Status'),
        },
        {
            title: 'Salary',
            dataIndex: 'salary',
            key: 'salary',
            render: (salary: number) => `$${Number(salary).toLocaleString()}`,
            sorter: true,
            ...getColumnSearchProps<Employee>('salary', 'Salary'),
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_text, record) => {
                const items = [
                    {
                        key: 'view',
                        label: 'View Details',
                        icon: <EyeOutlined />,
                        onClick: () => {
                            setViewEmployee(record);
                            setIsViewModalVisible(true);
                        },
                    },
                    (user?.role === 'admin' || user?.role === 'owner') && {
                        key: 'edit',
                        label: 'Edit Details',
                        icon: <EditOutlined />,
                        onClick: () => handleEdit(record),
                    },
                    (user?.role === 'owner') && {
                        key: 'delete',
                        label: 'Delete Record',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => handleDelete(record.id),
                    },
                ].filter(Boolean) as any[];

                return (
                    <Dropdown
                        menu={{ items }}
                        trigger={['click']}
                        getPopupContainer={(trigger) => trigger.closest('.ems-antd-table') || document.body}
                    >
                        <Button type="text" icon={<MoreOutlined style={{ fontSize: '20px' }} />} />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <div className="employee-list-container">
            <div className="header-section">
                <div className="search-filters">
                    <Input
                        placeholder="Search by name or title..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        style={{ width: 320, borderRadius: '10px' }}
                    />
                    <Button icon={<FilterOutlined />} style={{ borderRadius: '10px' }}>Filter</Button>
                </div>
                {(user?.role === 'admin' || user?.role === 'owner') && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        style={{
                            backgroundColor: 'var(--primary)',
                            borderColor: 'var(--primary)',
                            color: '#000',
                            fontWeight: 700,
                            borderRadius: '10px',
                            height: '40px'
                        }}
                    >
                        Add Employee
                    </Button>
                )}
            </div>

            <div className="table-card">
                <Table
                    columns={columns}
                    dataSource={employees}
                    rowKey="id"
                    loading={isLoading}
                    scroll={{ x: 1000, y: 'calc(100vh - 400px)' }}
                    getPopupContainer={(trigger) => trigger.closest('.ems-antd-table') || document.body}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: total,
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
                    onChange={(pagination, filters, sorter: any) => {
                        if (pagination.current) setPage(pagination.current);
                        if (pagination.pageSize) setLimit(pagination.pageSize);

                        if (sorter && sorter.field) {
                            setSortField(sorter.field);
                            setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC');
                        }

                        setFilters(filters);
                    }}
                    className="ems-antd-table"
                />
            </div>

            <Modal
                title="Employee Details"
                open={isViewModalVisible}
                onOk={() => setIsViewModalVisible(false)}
                onCancel={() => setIsViewModalVisible(false)}
                okText="Close"
                cancelButtonProps={{ style: { display: 'none' } }}
                bodyStyle={{ paddingTop: 8 }}
            >
                {viewEmployee && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${viewEmployee.name}`}
                                icon={<UserOutlined />}
                                size={48}
                                style={{ backgroundColor: 'var(--primary)', color: '#000' }}
                            />
                            <div>
                                <Text style={{ fontSize: 18, fontWeight: 800 }}>{viewEmployee.name}</Text>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                    <Tag color={viewEmployee.status === 'active' ? 'green' : 'red'} style={{ borderRadius: 8, fontWeight: 700 }}>
                                        {viewEmployee.status}
                                    </Tag>
                                    <Text type="secondary">ID-{viewEmployee.id}</Text>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12
                        }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 10, padding: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Designation</div>
                                <div style={{ fontWeight: 700, color: '#1a202c' }}>{viewEmployee.designation}</div>
                            </div>
                            <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 10, padding: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Department</div>
                                <div style={{ fontWeight: 700, color: '#1a202c' }}>{viewEmployee.department || '—'}</div>
                            </div>
                            <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 10, padding: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salary</div>
                                <div style={{ fontWeight: 700, color: '#1a202c' }}>${Number(viewEmployee.salary).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                title={currentEmployee ? "Edit Employee" : "Add New Employee"}
                open={isEditModalVisible}
                onOk={handleModalSubmit}
                onCancel={() => setIsEditModalVisible(false)}
                okText={currentEmployee ? "Update" : "Add"}
                okButtonProps={{ style: { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: '#000', fontWeight: 600 } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ status: 'active' }}
                    style={{ marginTop: '20px' }}
                >
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter employee name' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="designation"
                        label="Designation"
                        rules={[{ required: true, message: 'Please enter designation' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="salary"
                        label="Salary"
                        rules={[{ required: true, message: 'Please enter salary' }]}
                    >
                        <InputNumber style={{ width: '100%' }} formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="Status"
                    >
                        <Select>
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .employee-list-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    height: 100%;
                    overflow: hidden;
                }
                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                }
                .search-filters {
                    display: flex;
                    gap: 16px;
                }
                .table-card {
                    position: relative;
                    background: #fff;
                    border-radius: 16px;
                    border: 1px solid #f0f0f0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    overflow: visible;
                }
                .ems-antd-table {
                    position: relative;
                }
                .ems-antd-table .ant-table-thead > tr > th {
                    background: #f8fafc;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #8c8c8c;
                    font-weight: 700;
                    padding: 16px;
                }
                .ems-antd-table .ant-table-tbody > tr > td {
                    padding: 14px 24px;
                }
                .ems-antd-table .ant-table-pagination {
                    padding: 16px 24px;
                    margin: 0 !important;
                    border-top: 1px solid #f0f0f0;
                }
                .ant-btn-primary:hover {
                    background: var(--primary) !important;
                    border-color: var(--primary) !important;
                }
                .ant-pagination-item-active {
                    border-color: var(--primary) !important;
                }
                .ant-pagination-item-active a {
                    color: #000 !important;
                }
                
                /* Pagination Layout */
                .ems-antd-table .ant-pagination {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    width: 100% !important;
                }
                .ems-antd-table .ant-pagination-total-text {
                    order: -1;
                    margin-right: auto;
                }
            `}</style>
        </div>
    );
};

export default EmployeeList;
