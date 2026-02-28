import React, { useEffect, useState } from 'react';
import { Modal, List, Typography, Divider, Input, Space } from 'antd';
import { Bell, Shield, Palette } from 'lucide-react';
import { useUI } from '../../context/UIContext';

const { Text } = Typography;

interface SettingsModalProps {
    visible: boolean;
    onCancel: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onCancel }) => {
    const { primaryColor, setPrimaryColor } = useUI();
    const [draft, setDraft] = useState<string>(primaryColor);

    useEffect(() => {
        if (visible) setDraft(primaryColor);
    }, [visible, primaryColor]);

    const commitIfValid = (v: string) => {
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
            setPrimaryColor(v);
        }
    };

    return (
        <Modal
            title="System Settings"
            open={visible}
            onCancel={onCancel}
            footer={null}
            centered
        >
            <Divider plain style={{ margin: '0 0 16px' }}>Appearance</Divider>
            <List split={false}>
                <List.Item>
                    <List.Item.Meta
                        avatar={<Palette size={20} color={primaryColor} />}
                        title="Theme Color"
                        description="Enter a hex code to set your brand color"
                    />
                </List.Item>
                <div style={{ padding: '4px 8px 12px' }}>
                    <Input
                        value={draft}
                        onChange={(e) => {
                            let v = e.target.value.trim();
                            // Allow typing without blocking: only hex chars up to 6, optional leading '#'
                            const simple = v.startsWith('#') ? v.slice(1) : v;
                            if (/^[0-9a-fA-F]{0,6}$/.test(simple)) {
                                if (!v.startsWith('#')) v = '#' + simple;
                                setDraft(v);
                                commitIfValid(v);
                            }
                        }}
                        onBlur={() => commitIfValid(draft)}
                        onPressEnter={() => commitIfValid(draft)}
                        placeholder="#40a9ff"
                        maxLength={7}
                    />
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                        Example: #40a9ff (supports 3 or 6 hex digits)
                    </div>
                </div>
            </List>

            <Divider plain style={{ margin: '24px 0 16px' }}>Notifications</Divider>
            <List split={false}>
                <List.Item>
                    <List.Item.Meta
                        avatar={<Bell size={20} color="#8b5cf6" />}
                        title="Push Notifications"
                        description="Receive alerts about important updates"
                    />
                </List.Item>
            </List>

            <Divider plain style={{ margin: '24px 0 16px' }}>Security</Divider>
            <List split={false} style={{ marginBottom: 16 }}>
                <List.Item>
                    <List.Item.Meta
                        avatar={<Shield size={20} color="#10b981" />}
                        title="Two-Factor Auth"
                        description="Add an extra layer of security to your account"
                    />
                </List.Item>
            </List>
        </Modal>
    );
};

export default SettingsModal;
