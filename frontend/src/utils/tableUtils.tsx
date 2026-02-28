import React from 'react';
import { Input, Button, Space } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';

export const getColumnSearchProps = <T,>(
    dataIndex: keyof T,
    title: string
): ColumnType<T> => {
    return {
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close, visible }) => (
            <div style={{ padding: 8 }} onKeyDown={(e: any) => e.stopPropagation()}>
                <Input
                    autoFocus
                    placeholder={`Search ${title}`}
                    value={selectedKeys[0]}
                    onChange={(e: any) => {
                        const val = e.target.value;
                        setSelectedKeys(val ? [val] : []);
                        // Trigger search immediately as the user types
                        confirm({ closeDropdown: false });
                    }}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        onClick={() => {
                            clearFilters && clearFilters();
                            confirm();
                        }}
                        size="small"
                        style={{ width: 80 }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        style={{ padding: 0 }}
                        onClick={() => {
                            close();
                        }}
                    >
                        Close
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <FilterOutlined style={{ color: filtered ? 'var(--primary)' : undefined }} />
        ),
        onFilter: (value, record: any) => {
            const val = record[dataIndex];
            if (val === undefined || val === null) return false;
            return val.toString().toLowerCase().includes((value as string).toLowerCase());
        },
    };
};
