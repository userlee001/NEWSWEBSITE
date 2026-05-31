import {
    List,
    Datagrid,
    TextField,
    DeleteButton,
    ReferenceManyField,
    DateField
} from 'react-admin';

const WriterNewsPanel = () => {
    return (
        <ReferenceManyField reference="news_metadata" target="user_id" label="該作者發表的新聞">
            <Datagrid>
                <TextField source="title" label="新聞標題" />
                <TextField source="category" label="分類" />
                <DateField source="created_at" label="發布時間" showTime />

                <DeleteButton
                    label="下架此新聞"
                    mutationMode="pessimistic"
                    confirmTitle="確認下架"
                    confirmContent="您確定要強制下架這篇新聞嗎？"
                />
            </Datagrid>
        </ReferenceManyField>
    );
};

export function WriterList() {
    return (
        <List title="作者名單與新聞管理">
            <Datagrid expand={<WriterNewsPanel />}>
                <TextField source="id" label="使用者 UUID" />
                <TextField source="authorname" label="作者名稱" />
                <TextField source="role" label="系統角色" />
                <DeleteButton
                    label="強制註銷帳號"
                    mutationMode="pessimistic"
                    confirmTitle="確認註銷"
                    confirmContent="註銷帳號將會刪除該使用者，此動作無法復原，是否繼續？"
                />
            </Datagrid>
        </List>
    );
}