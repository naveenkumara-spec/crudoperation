import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Steps } from 'antd';
import { Mail, Lock, CheckCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
    visible: boolean;
    onCancel: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ visible, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleEmailFinish = (values: any) => {
        setLoading(true);
        // Simulate email verification
        setTimeout(() => {
            message.success('Verification code sent to your email!');
            setLoading(false);
            setCurrentStep(1);
        }, 1000);
    };

    const handlePasswordFinish = (values: any) => {
        setLoading(true);
        // Simulate password update
        setTimeout(() => {
            message.success('Password updated successfully!');
            setLoading(false);
            setCurrentStep(2);
        }, 1500);
    };

    const steps = [
        {
            title: 'Verify Email',
            content: (
                <Form onFinish={handleEmailFinish} layout="vertical">
                    <p style={{ color: '#64748b', marginBottom: 24 }}>Enter your registered email address to receive a reset link.</p>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<Mail size={16} />} placeholder="name@company.com" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ marginTop: 16 }}>
                        Send Reset Link
                    </Button>
                </Form>
            ),
        },
        {
            title: 'New Password',
            content: (
                <Form onFinish={handlePasswordFinish} layout="vertical" form={form}>
                    <Form.Item name="oldPassword" label="Temporary / Old Password" rules={[{ required: true }]}>
                        <Input.Password prefix={<Lock size={16} />} placeholder="Old Password" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please input your new password!' },
                            { min: 8, message: 'Password must be at least 8 characters!' }
                        ]}
                        hasFeedback
                    >
                        <Input.Password prefix={<Lock size={16} />} placeholder="New Password" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="confirm"
                        label="Confirm Password"
                        dependencies={['newPassword']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Please confirm your password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<Lock size={16} />} placeholder="Confirm New Password" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ marginTop: 16 }}>
                        Update Password
                    </Button>
                </Form>
            ),
        },
        {
            title: 'Success',
            content: (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>All Done!</h3>
                    <p style={{ color: '#64748b' }}>Your password has been reset successfully. You can now use your new password to log in.</p>
                    <Button type="primary" block size="large" onClick={onCancel} style={{ marginTop: 24 }}>
                        Close
                    </Button>
                </div>
            ),
        }
    ];

    const resetModal = () => {
        setCurrentStep(0);
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Account Recovery"
            open={visible}
            onCancel={resetModal}
            footer={null}
            centered
            destroyOnClose
        >
            <Steps
                current={currentStep}
                size="small"
                style={{ marginBottom: 32 }}
                items={[
                    { title: 'Identity' },
                    { title: 'Reset' },
                    { title: 'Done' }
                ]}
            />
            <div className="reset-step-content">
                {steps[currentStep].content}
            </div>
        </Modal>
    );
};

export default ForgotPasswordModal;
