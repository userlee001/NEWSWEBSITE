import "./TopFixedBlock.css";
import searchIconImage from "../assets/search-icon.svg";
import { useNavigate } from "react-router-dom";

export default function TopFixedBlock({ setCategory, setPage, handleSearch,keyword, setKeyword }) {
    const navigate = useNavigate();

    return (
        <div className="top-fixed-bloock">
            <div className="logo-and-search">
                <div>
                    <input type="text" name="search-bar" className="search-bar"
                        value={keyword} onChange={(e) => { setKeyword(e.target.value) }} onKeyDown={(e) => { if (e.key === "Enter") { handleSearch(); } }} placeholder="  輸入標題關鍵字..." />
                    <div className="search-icon-div" onClick={() => { handleSearch(); }}>
                        <img src={searchIconImage} className="search-icon-img" />
                    </div>
                </div>
            </div>
            <div className="chose-category">
                <div className="latest-news" onClick={() => { setCategory(0); setPage(1); navigate("/"); }}>最新</div>
                <div className="politics" onClick={() => { setCategory(1); setPage(1); navigate("/"); }}>政治</div>
                <div className="sport" onClick={() => { setCategory(2); setPage(1); navigate("/"); }}>體育</div>
                <div className="Finance" onClick={() => { setCategory(3); setPage(1); navigate("/"); }}>財經</div>
            </div>
        </div>
    )






}