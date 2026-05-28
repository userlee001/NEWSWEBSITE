import style from './App.module.css';
import { Routes, Route } from "react-router-dom";
import { UpdateNews } from "./page/UpdateNews.jsx";
import { ListNews } from "./page/ListNews.jsx";
import { LoginWriter } from "./page/LoginWriter.jsx";
import { WriteNews } from "./page/WriteNews.jsx";
import { RegisterWriter } from "./page/RegisterWriter.jsx"
export function App() {
    return (
        <Routes>
            <Route path="/list" element={<ListNews />}/>
            <Route path="/login" element={<LoginWriter />}/>
            <Route path="/update/:newsid" element={<UpdateNews />}/>
            <Route path="/write" element={<WriteNews/>}/>
            <Route path="/register" element={<RegisterWriter/>}></Route>
        </Routes>
    );
}

