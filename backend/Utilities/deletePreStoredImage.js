import fs from 'fs';

export function handleDeletePreStoredImage(filesNameList) {
    if (!filesNameList || !Array.isArray(filesNameList)) {
        return;
    }
    filesNameList.forEach((fileName) => {
        const filePath = `/app/public/images/${fileName}`;
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`刪除失敗: ${fileName} `, err);
            } else {
                console.log(`檔案刪除成功: ${fileName}`);
            }
        });
    });
}