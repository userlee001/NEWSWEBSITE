import style from "./UpdateNews.module.css";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ContentEditor } from "../component/ContentEditor.jsx";
import { MainTitleEditor } from "../component/MainTitleEditor.jsx";

export function UpdateNews() {
    const { newsid: newsId } = useParams();
    const [blockList, setBlockList] = useState([]);
    const [mainTitle, setMainTitle] = useState({ content: "", category: "1", imageFile: null });

    useEffect(() => {
        (async () => {
            const response = await fetch(`/api/writer/newscontent/${newsId}`);
            const result = await response.json();
            let titleBlock = result["cover"] || {};
            {
                const response = await fetch(`/images/${titleBlock["cover_image_path"]}`);
                const coverImageblob = await response.blob();
                const coverImage = new File([coverImageblob], titleBlock["cover_image_path"], { type: coverImageblob.type });
                titleBlock = { content: titleBlock["title"] || "", category: titleBlock["category"] || "1", imageFile: coverImage || null };
            }
            setMainTitle(titleBlock);
            let contentBlockList = result["content"] || [];
            contentBlockList = await Promise.all(
                contentBlockList.map(async (block) => {
                    const response = await fetch(`/images/${block["content_image_path"]}`);
                    const contentImageblob = await response.blob();
                    const contentImage = new File([contentImageblob], block["content_image_path"], { type: contentImageblob.type })
                    return (
                        {
                            id: crypto.randomUUID(),
                            content: block["content"],
                            imageFile: contentImage
                        }
                    )
                })
            );
            setBlockList(contentBlockList);
        })()
    }, [newsId]);

    const handleAddAPassage = () => {
        setBlockList((prev) => {
            return [...prev,
            {
                id: crypto.randomUUID(),
                content: "",
                imageFile: null
            }
            ]
        });
    }

    const handleDeleteAPassage = () => {
        setBlockList((prev) => {
            return prev.slice(0, -1);
        })
    }

    const handleBlockChange = (id, field, value) => {
        setBlockList((prev) => {
            return prev.map((block) => {
                return block.id === id ? { ...block, [field]: value } : block;
            });
        });
    }


    const handleUpdateNews = () => {
        const formData = new FormData();
        formData.append("mainTitleText", mainTitle.content);
        if (mainTitle.imageFile) {
            formData.append("mainTitleImageFile", mainTitle.imageFile);
        }
        formData.append("category", mainTitle.category);
        const blocksInformation = blockList.map((block) => {
            return {
                id: block.id,
                content: block.content,
            }
        });
        formData.append("blocksInformation", JSON.stringify(blocksInformation));
        blockList.forEach((block) => {
            if (block.imageFile) {
                formData.append(`image_${block.id}`, block.imageFile);
            }
        })
        fetch(`/api/writer/update/news/${newsId}`, {
            method: "PATCH",
            body: formData
        })
            .then((response) => { return response.json(); })
            .then(({ message }) => { return console.log(message); });
    }

    const handleDeleteNews = () => {
        fetch(`/api/writer/delete/news/${newsId}`, {
            method: "DELETE"
        })
            .then((response) => { return response.json(); })
            .then(({ message }) => { return console.log(message); });
    }

    return (
        <div className={style["write-news-wrapper"]}>
            <MainTitleEditor
                onContentChange={(html) => { return setMainTitle((prev) => { return { ...prev, "content": html }; }); }}
                onImageFileChange={(file) => { return setMainTitle((prev) => { return { ...prev, "imageFile": file }; }); }}
                onCategoryChange={(category) => { return setMainTitle((prev) => { return { ...prev, "category": category } }) }}
                initialSetting={mainTitle}
            />
            {
                blockList.map((passage) => {
                    return (
                        <ContentEditor
                            key={passage.id}
                            onContentChange={(html) => { return handleBlockChange(passage.id, "content", html) }}
                            onImageFileChange={(file) => { return handleBlockChange(passage.id, "imageFile", file) }}
                            initialSetting={passage}
                        />
                    );
                })
            }
            <div className={style["passage-handle-button-wrapper"]}>
                <button onClick={handleAddAPassage}>加一段</button>
                <button onClick={handleDeleteAPassage}>減一段</button>
                <button onClick={handleUpdateNews}>發布更新</button>
                <button onClick={handleDeleteNews}>刪除新聞</button>
            </div>
        </div>
    );
}
