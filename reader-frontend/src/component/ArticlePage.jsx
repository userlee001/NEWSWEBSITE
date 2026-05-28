import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./ArticlePage.module.css";
import isEqual from 'lodash/isEqual';

export default function ArticlePage() {

    const [searchParams] = useSearchParams();
    const newsId = searchParams.get("newsid");

    const [news, setNews] = useState({});

    useEffect(() => {
        (async () => {
            let response = await fetch(`/api/reader/news/content?newsid=${newsId}`);
            let result = await response.json();
            setNews(result || {});
        })();
    }, [newsId, setNews]);

    if(isEqual(news, {})) {
        return (
            <div>
                loading....
            </div>
        );
    }
    return (
        <div className={`${styles["block-wrapper"]}`}>
            <div className={styles["maintitle-wrapper"]}>
                <div className={`${styles["cover-image-wrapper"]}`}>
                    <img className={`${styles["cover-image"]}`} src={`/images/${news["cover"]["cover_image_path"]}`} alt="nonono" />
                </div>
                <div className={styles["maintitle-container"]} dangerouslySetInnerHTML={{
                    __html: news["cover"]["title"]
                }}></div>
                <div className={styles["basic-information-container"]}>
                    <div className={styles["author-name"]}>{news["cover"]["authorname"]}</div>
                    <div className={styles["date"]}>
                        {(new Date(news["cover"]["created_at"])).toLocaleString("zh-TW", {
                            timeZone: "Asia/Taipei",
                            hour12: false,      // 24 小時制
                        })}
                    </div>
                </div>
            </div>
            {
                news["content"].map((content) => {
                    return (
                        <div className={styles["content-wrapper"]} key={content["id"]}>
                            <div className={`${styles["content-image-wrapper"]}`}>
                                <img className={`${styles["content-image"]}`} src={`/images/${content["content_image_path"]}`} alt="nonono" />
                            </div>
                            <div className={styles["content-container"]} dangerouslySetInnerHTML={{
                                __html: content["content"]
                            }}></div>
                        </div>
                    );
                })
            }
        </div>
    );
}
