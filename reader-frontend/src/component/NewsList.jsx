import "./NewsList.css";
import { useNavigate } from "react-router-dom";

export default function NewsList({ setReaderRequestCollector, newsList }) {
    const navigate = useNavigate();

    const handleMoreNewsDivClick = () => {
        setReaderRequestCollector((collector) => {
            let newCollector = structuredClone(collector);
            newCollector.page = newCollector.page + 1;
            return newCollector;
        });
    };

    return (
        <div className="news-list">
            {
                newsList.map((news) => {
                    const date = new Date(news.created_at);
                    const utc8String = date.toLocaleString("zh-TW", {
                        timeZone: "Asia/Taipei",
                        hour12: false,      // 24 小時制
                    });
                    return (
                        <div key={news.id} className="news-card" onClick={() => navigate(`/news/content?newsid=${news.id}`)}>
                            <div className="cover-img-div">
                                <img src={`/images/${news.cover_image_path}`} className="cover-img" />
                            </div>
                            <div className="title-and-time">
                                <h1 className="title" dangerouslySetInnerHTML={{ __html: `${news.title}` }} />
                                <h1 className="time">{utc8String}</h1>
                            </div>
                        </div>
                    );
                })
            }
            <div className="morenews" onClick={handleMoreNewsDivClick}>更多新聞</div>
        </div>
    )
}