const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(`API 請求失敗: 狀態碼 ${response.status}`);
    }
    return response.json();
};

export const CustomizedDataProvider = {
    getList: async (resource, params) => {
        if (resource === 'audit_log') {
            const json = await fetchJson(`/api/Administrator/check/audit_log`);
            return {
                data: json.audit_log_data,
                total: json.audit_log_data_count,
            };
        }

        if (resource === 'writer') {
            const json = await fetchJson(`/api/Administrator/check/user_list`);
            return {
                data: json.user_data,
                total: json.total_user_number,
            };
        }

        throw new Error(`尚未實作 ${resource} 的 getList API`);
    },

    getManyReference: async (resource, params) => {
        if (resource === 'news_metadata' && params.target === 'user_id') {
            const userId = params.id;
            const json = await fetchJson(`/api/Administrator/check/user/news_list?user_id=${userId}`);

            return {
                data: json.user_news_list,
                total: json.user_news_list_count,
            };
        }

        throw new Error(`尚未實作 ${resource} 的 getManyReference API`);
    },

    delete: async (resource, params) => {
        if (resource === 'writer') {
            await fetchJson(`/api/Administrator/revoke/user_account?user_id=${params.id}`, {
                method: 'DELETE',
            });
            return { data: { id: params.id } };
        }

        if (resource === 'news_metadata') {
            await fetchJson(`/api/Administrator/takedown/user/news?news_id=${params.id}`, {
                method: 'DELETE',
            });
            return { data: { id: params.id } };
        }

        throw new Error(`不允許刪除 ${resource}`);
    },

    getOne: (resource, params) => Promise.resolve({ data: { id: params.id } }),
    create: () => Promise.reject('系統不允許從此處新增'),
    update: () => Promise.reject('系統不允許從此處修改'),
    getMany: () => Promise.reject('不需要此功能'),
};