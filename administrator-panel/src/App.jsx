import { Admin, Resource } from 'react-admin';
import { CustomizedDataProvider } from './CustomizedDataProvider';
import { AuditLogList } from './AuditLog';
import { WriterList } from './Writer';

function App() {
    return (
        <Admin dataProvider={CustomizedDataProvider}>

            <Resource
                name="audit_log"
                options={{ label: '系統審計日誌' }}
                list={AuditLogList}
            />

            <Resource
                name="writer"
                options={{ label: '作者管理' }}
                list={WriterList}
            />

            <Resource name="news_metadata" />

        </Admin>
    );
}

export default App;