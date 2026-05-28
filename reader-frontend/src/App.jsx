import TopFixedBlock from "./component/TopFixedBlock.jsx";
import NewsList from "./component/NewsList";
import ArticlePage from "./component/ArticlePage"
import { Routes, Route } from "react-router-dom";
import './App.css'
import { useEffect, useState } from "react";

function App() {
  const [readerRequestCollector, setReaderRequestCollector] = useState({});
  const [newsList, setNewsList] = useState([]);

  useEffect(() => {
    (async () => {
      let url = "";
      if (readerRequestCollector.distinguisher !== "categoryList" && readerRequestCollector.distinguisher !== "searchList") {
        return;
      }
      if (readerRequestCollector.distinguisher === "categoryList") {
        url = `${readerRequestCollector.requestUrlPrefix}?category=${encodeURIComponent(`${readerRequestCollector["category"]}`)}&page=${encodeURIComponent(`${readerRequestCollector["page"]}`)}`;
      }
      if (readerRequestCollector.distinguisher === "searchList") {
        url = `${readerRequestCollector.requestUrlPrefix}?page=${encodeURIComponent(`${readerRequestCollector["page"]}`)}&keyword=${encodeURIComponent(`${readerRequestCollector["keyword"]}`)}`;
      }
      try {
        let response = await fetch(url);
        let result = await response.json();
        const newFetchedNewsList = result?.news_list || []
        if(readerRequestCollector.page === 0){
          setNewsList(newFetchedNewsList);
        } else {
          setNewsList((previousNewsList) => {
            return [...previousNewsList, ...newFetchedNewsList];
          });
        }
      } catch (error) {
        console.error("發生錯誤: ", error);
        setNewsList([]);
      }
    })()
  }
    , [readerRequestCollector, setNewsList]);

  return (
    <>
      <TopFixedBlock setReaderRequestCollector={setReaderRequestCollector} />
      <Routes>
        <Route path="/news/list" element={<NewsList setReaderRequestCollector={setReaderRequestCollector} newsList={newsList} />} />
        <Route path="/news/content" element={<ArticlePage />} />
      </Routes>
    </>
  )
}

export default App;
