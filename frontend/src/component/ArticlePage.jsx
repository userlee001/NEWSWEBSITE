import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./ArticlePage.module.css";
export default function ArticlePage() {

    const { id } = useParams();
    const [completeNews, setCompleteNews] = useState(null);
    useEffect(() => {
        (async () => {
            const result = await fetch(`/api/content/${id}`);
            const data = (await result.json()).data || {};
            console.log(data);
            setCompleteNews(data);
        })()
    }, [id]);

    if (!completeNews) {
        return <></>;
    }

    const date = new Date(completeNews.created_at);
    const utc8String = date.toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
        hour12: false,      // 24 小時制
    });

    return (
        <div className={styles["detailed-content"]}>
            <div className={styles["alignment-purpose-div"]}>
                <h1 className={styles.title}>{completeNews.title}</h1>
                <div className={styles["name-and-time"]}>
                    <p className={styles.name}>{completeNews.authorname}</p>
                    <p className={styles.time}>{utc8String}</p>
                </div>
                <div className={styles["cover-image-div"]}>
                    <img src={`/images/${completeNews.cover_image_path}`} className={styles["cover-image"]} />
                </div>
                <hr className={styles.divider1}/>
                <hr className={styles.divider2}/>
                <p className={styles.content}>{completeNews.content}</p>
            </div>
        </div>
    )
}