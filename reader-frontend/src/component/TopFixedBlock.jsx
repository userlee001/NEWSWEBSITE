import "./TopFixedBlock.css";
import searchIconImage from "../assets/search-icon.svg";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const categoryListRequestPrefix = "/api/reader/news/list/category";
const searchListRequestPrefix = "/api/reader/news/list/search";

export default function TopFixedBlock({ setReaderRequestCollector }) {
    const navigate = useNavigate();
    const [searchKeyWord, setSearchKeyWord] = useState("");

    const handleCategoryDivClick = (category) => {
        setReaderRequestCollector(
            {
                distinguisher: "categoryList",
                category: category,
                page: 0,
                requestUrlPrefix: categoryListRequestPrefix
            }
        );
        navigate("/news/list");
    }

    const handleSearchIconDivClick = () => {
        setReaderRequestCollector(
            {
                distinguisher: "searchList",
                page: 0,
                keyword: searchKeyWord,
                requestUrlPrefix: searchListRequestPrefix
            }
        );
        navigate("/news/list");
    };

    return (
        <div className="top-fixed-bloock">
            <div className="logo-and-search">
                <div>
                    <input type="text" name="search-bar" className="search-bar"
                        value={searchKeyWord} onChange={(e) => { setSearchKeyWord(e.target.value) }} placeholder="  輸入標題關鍵字..." />
                    <div className="search-icon-div" onClick={handleSearchIconDivClick}>
                        <img src={searchIconImage} className="search-icon-img" />
                    </div>
                </div>
            </div>
            <div className="chose-category">
                <div className="latest-news" onClick={() => {handleCategoryDivClick(0)}}>最新</div>
                <div className="politics" onClick={() => {handleCategoryDivClick(1)}}>政治</div>
                <div className="sport" onClick={() => {handleCategoryDivClick(2)}}>體育</div>
                <div className="Finance" onClick={() => {handleCategoryDivClick(3)}}>財經</div>
            </div>
        </div>
    );

}