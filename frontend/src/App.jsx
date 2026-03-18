import TopFixedBlock from "./component/TopFixedBlock.jsx";
import NewsList from "./component/NewsList";
import ArticlePage from "./component/ArticlePage"
import { Routes, Route, useNavigate } from "react-router-dom";
import './App.css'
import { useState } from "react";
import { useRef } from "react";

function App() {
  const [category, setCategory] = useState(0);
  const [page, setPage] = useState(1);
  const [searchResult, setSearchResult] = useState(null);
  const searchPage = useRef(1);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const handleSearch = async () => {
    const response = await fetch(`/api/search/${searchPage.current}?keyword=${encodeURIComponent(keyword)}`);
    const data = (await response.json()).data || [];
    setSearchResult(data);
    navigate("/");
    searchPage.current += 1;
  }
  return (
    <>
      <TopFixedBlock setCategory={setCategory} setPage={setPage} setSearchResult={setSearchResult} searchPage={searchPage} handleSearch={handleSearch} keyword={keyword} setKeyword={setKeyword} />
      <Routes>
        <Route path="/" element={<NewsList category={category} page={page} setPage={setPage} searchResult={searchResult} setSearchResult={setSearchResult} searchPage={searchPage} handleSearch={handleSearch} />} />
        <Route path="/content/:id" element={<ArticlePage />} />
      </Routes>
    </>
  )
}

export default App;
