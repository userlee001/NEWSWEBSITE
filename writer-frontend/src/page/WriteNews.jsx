import style from "./WriteNews.module.css";
import React, { useState } from 'react';
import { ContentEditor } from "../component/ContentEditor.jsx";
import { MainTitleEditor } from "../component/MainTitleEditor.jsx";

export function WriteNews() {
    const [blockList, setBlockList] = useState([]);
    const [mainTitle, setMainTitle] = useState({ content: "", category: "1", imageFile: null });

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


    const handleReleaseNews = () => {
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
        fetch("/api/writer/write", {
            method: "POST",
            body: formData
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
            />
            {
                blockList.map((passage) => {
                    return (
                        <ContentEditor
                            key={passage.id}
                            onContentChange={(html) => { return handleBlockChange(passage.id, "content", html) }}
                            onImageFileChange={(file) => { return handleBlockChange(passage.id, "imageFile", file) }}
                        />
                    );
                })
            }
            <div className={style["passage-handle-button-wrapper"]}>
                <button onClick={handleAddAPassage}>加一段</button>
                <button onClick={handleDeleteAPassage}>減一段</button>
                <button onClick={handleReleaseNews}>發布新聞</button>
            </div>
        </div>
    );
}