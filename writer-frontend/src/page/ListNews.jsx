import style from "./ListNews.module.css";
import { useEffect, useState } from "react";

export function ListNews() {
    const [pageNumber, setPageNumber] = useState(0);
    const [pageNumberInputValue, setPageNumberInputValue] = useState(0);
    const [newsList, setNewsList] = useState([]);

    useEffect(() => {
        console.log(pageNumber);
        (async () => {
            try {
                const reponse = await fetch(`/api/writer/listnews/?page_number=${pageNumber}`);
                const result = await reponse.json();
                setNewsList(result.news_list || []);
            } catch (err) {
                console.error("Fetch news failed:", err);
                setNewsList([]);
            }
        })();
    }, [pageNumber]);

    const handlePreviousPageButton = () => {
        if (pageNumber >= 1) {
            const newPageNumber = pageNumber - 1;
            setPageNumber(newPageNumber);
            setPageNumberInputValue(newPageNumber);
        }
    }

    const handleNextPageButton = () => {
        const newPageNumber = pageNumber + 1;
        setPageNumber(newPageNumber);
        setPageNumberInputValue(newPageNumber);
    }

    const handlePageInputKeyIn = (e) => {
        const newPageNumber = parseInt(e.target.value, 10);
        if (!Number.isNaN(newPageNumber) && newPageNumber >= 0) {
            setPageNumberInputValue(newPageNumber);
        }
    }

    const handlepageInputSubmit = (e) => {
        if (e.key === 'Enter') {
            setPageNumber(pageNumberInputValue);
        }
    }

    return (
        <div className={style["list-news-wrapper"]}>
            {newsList.map((news) => {
                return (
                    <div className={style["news"]} key={news["id"]}>
                        <div className={style["news-cover-image-wrapper"]}>
                            <img src={`/images/${news["cover_image_path"]}`} alt="no-cover" className={style["news-cover-image"]} />
                        </div>
                        <div className={style["news-information"]}>
                            <div className={style["news-title"]}>
                                <div dangerouslySetInnerHTML={{
                                    __html: news["title"]
                                }} />
                            </div>
                            <div className={style["news-information-label-wrapper"]}>
                                <div className={style["news-label-name"]}>
                                    {news["category"]}
                                </div>
                                <div className={style["news-latest-update-time"]}>
                                    {news["created_at"]}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div className={style["page-handler-wrapper"]}>
                <button className={style["previous-page-button"]} onClick={handlePreviousPageButton}>
                    上一頁
                </button>
                <button className={style["next-page-button"]} onClick={handleNextPageButton}>
                    下一頁
                </button>
                <div className={style["exact-page-input-wrapper"]}>
                    <div>跳轉至第</div>
                    <input value={pageNumberInputValue} id={style["exact-page-input"]} type="text" onChange={handlePageInputKeyIn} onKeyDown={handlepageInputSubmit} />
                    <div>頁</div>
                </div>
            </div>
        </div>
    );
}