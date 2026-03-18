import { useEffect, useState } from "react";
import "./NewsList.css";
import { useNavigate } from "react-router-dom";

export default function NewsList({ category, page, setPage, searchResult, setSearchResult, searchPage, handleSearch }) {
    const [newsListMap, setNewsListMap] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        (async () => {
            const result1 = await fetch(`/api/newslist/${category}/${page}`);
            const result2 = await result1.json();
            const data = result2.data || [];
            console.log(data);
            setNewsListMap(data);
            setSearchResult(null);
            // eslint-disable-next-line
            searchPage.current = 1;
        })()
    }, [category, page, setSearchResult,searchPage]);

    if (searchResult) {
        return (
            <div className="news-list">
                {searchResult.map((news) => {
                    const date = new Date(news.created_at);
                    const utc8String = date.toLocaleString("zh-TW", {
                        timeZone: "Asia/Taipei",
                        hour12: false,      // 24 小時制
                    });
                    return (<div key={newsListMap.id} className="news-card" onClick={() => navigate(`/content/${news.id}`)}>
                        <div className="cover-img-div">
                            <img src={`/images/${news.cover_image_path}`} className="cover-img" />
                        </div>
                        <div className="title-and-time">
                            <h1 className="title">{news.title}</h1>
                            <h1 className="time">{utc8String}</h1>
                        </div>
                    </div>);
                })}
                <div className="morenews" onClick={() => handleSearch()}>更多新聞</div>
            </div>
        )
    }


    return (
        <div className="news-list">
            {newsListMap.map((news) => {
                const date = new Date(news.created_at);
                const utc8String = date.toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    hour12: false,      // 24 小時制
                });
                return (<div key={newsListMap.id} className="news-card" onClick={() => navigate(`/content/${news.id}`)}>
                    <div className="cover-img-div">
                        <img src={`/images/${news.cover_image_path}`} className="cover-img" />
                    </div>
                    <div className="title-and-time">
                        <h1 className="title">{news.title}</h1>
                        <h1 className="time">{utc8String}</h1>
                    </div>
                </div>);
            })}
            <div className="morenews" onClick={() => setPage(a => a + 1)}>更多新聞</div>
        </div>
    )
}