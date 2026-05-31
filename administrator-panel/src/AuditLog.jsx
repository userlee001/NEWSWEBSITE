import { List, Datagrid, TextField, DateField, NumberField } from 'react-admin';

export const AuditLogList = () => (
    <List title="系統審計日誌">
        <Datagrid>
            <DateField source="created_at" label="操作時間" showTime />
            <TextField source="author_name" label="操作者" emptyText="無名氏/系統" />
            <TextField source="action" label="動作" />
            <TextField source="api_path" label="API 路徑" />
            <TextField source="request_method" label="方法" />
            <NumberField source="status_code" label="狀態碼" />
            <TextField source="target_table" label="目標資料表" emptyText="-" />
            <TextField source="target_data_id" label="目標資料 ID" emptyText="-" />
        </Datagrid>
    </List>
);