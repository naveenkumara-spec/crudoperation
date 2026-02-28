import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Upload, Button, message, Divider, Row, Col } from 'antd';
import { Upload as UploadIcon, User as UserIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';

interface ProfileModalProps {
    visible: boolean;
    onCancel: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onCancel }) => {
    const { user, updateUser } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);

    useEffect(() => {
        if (visible && user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                age: user.age,
                dob: user.dob ? dayjs(user.dob) : null,
                gender: user.gender || 'Male',
                salary: user.salary,
                department: user.department || 'Engineering',
                location: user.location,
                address: user.address,
                bio: user.bio,
                joiningDate: user.joining_date ? dayjs(user.joining_date) : null,
            });
        }
    }, [visible, user, form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('age', values.age || '');
            formData.append('dob', values.dob ? values.dob.format('YYYY-MM-DD') : '');
            formData.append('joining_date', values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : '');
            formData.append('gender', values.gender);
            formData.append('salary', values.salary || '');
            formData.append('department', values.department);
            formData.append('location', values.location || '');
            formData.append('address', values.address || '');
            formData.append('bio', values.bio || '');

            if (fileList.length > 0 && fileList[0].originFileObj) {
                formData.append('avatar', fileList[0].originFileObj);
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            updateUser(data.user);
            message.success('Profile updated successfully!');
            onCancel();
        } catch (err: any) {
            message.error(err.message || 'Failed to update profile');
            console.error('Update profile error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList);
    };

    const avatarUrl = user?.avatar;

    return (
        <Modal
            title="Personal Profile"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={1000}
            centered
            styles={{
                body: {
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto'
                }
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <Row gutter={24}>
                    <Col span={24} style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '2px solid #e2e8f0',
                                margin: '0 auto'
                            }}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <UserIcon size={48} color="#94a3b8" />
                                )}
                            </div>
                            <Upload
                                showUploadList={false}
                                beforeUpload={() => false}
                                onChange={handleFileChange}
                                fileList={fileList}
                            >
                                <Button
                                    size="small"
                                    shape="circle"
                                    icon={<UploadIcon size={14} />}
                                    style={{ position: 'absolute', bottom: 0, right: 0 }}
                                />
                            </Upload>
                        </div>
                    </Col>

                    <Col span={12}>
                        <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
                            <Input disabled />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item name="age" label="Age">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: 'Date of Birth is required' }]}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="joiningDate" label="Date of Joining" rules={[{ required: true, message: 'Date of Joining is required' }]}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Gender is required' }]}>
                            <Select options={[
                                { label: 'Male', value: 'Male' },
                                { label: 'Female', value: 'Female' },
                                { label: 'Other', value: 'Other' }
                            ]} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Department is required' }]}>
                            <Select options={[{ label: 'Engineering', value: 'Engineering' }, { label: 'HR', value: 'HR' }]} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="salary" label="Salary ($)" rules={[
                            { required: true, message: 'Salary is required' },
                            { validator: (_,_val) => Promise.resolve() }
                        ]}>
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item name="location" label="Work Location" rules={[{ required: true, message: 'Work Location is required' }]}>
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item name="address" label="Residential Address">
                            <Input.TextArea rows={2} />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item name="bio" label="Biography">
                            <Input.TextArea rows={3} placeholder="Tell us about yourself..." />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />
                <div style={{ textAlign: 'right' }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>Save Changes</Button>
                </div>
            </Form>
            <style>{`
                .ant-modal-body::-webkit-scrollbar {
                    display: none;
                }
                .ant-modal-body {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </Modal>
    );
};

export default ProfileModal;
