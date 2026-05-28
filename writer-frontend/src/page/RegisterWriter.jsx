import { useState, useEffect, useRef } from "react";
import style from "./RegisterWriter.module.css";
import jQuery from 'jquery';
import 'jquery.ripples';
import monkeyCloseEyeSvg from "../assets/monkey-close-eye.svg";
import monkeyOpenEyeSvg from "../assets/monkey-open-eye.svg";
import { useNavigate } from "react-router-dom";

export function RegisterWriter() {

    const navigate = useNavigate();
    const [showUsername, setShowUsername] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const backgroundRef = useRef(null);
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    const toggleUsernameVisibility = () => {
        setShowUsername((a) => { return !a; });
    }
    const togglePasswordVisibility = () => {
        setShowPassword((a) => { return !a; });
    }

    const handleLogin = async () => {

        const username = usernameRef.current.value;
        const password = passwordRef.current.value;
        usernameRef.current.value = "";
        passwordRef.current.value = "";
        let response;
        try {
            response = await fetch("/api/authentication/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username, password: password })
            });
        } catch (err) {
            console.log(err);
            alert("伺服器錯誤");
            return;
        }

        const data = await response.json();
        if (data.message === "success") {
            return navigate("/login");
        }
        if (data.message === "fail") {
            alert("帳號或密碼錯誤");
            return;
        }
    }

    useEffect(() => {
        // 2. 當元件掛載到畫面上時，啟動 jQuery 水波紋
        if (backgroundRef.current) {
            jQuery(backgroundRef.current).ripples({
                resolution: 512,
                dropRadius: 20,
                perturbance: 0.04,
            });
        }

        // 當使用者離開這個頁面時，必須把水波紋銷毀，否則會吃光記憶體！
        return () => {
            if (backgroundRef.current) {
                jQuery(backgroundRef.current).ripples('destroy');
            }
        };
    }, []);

    return (
        <div className={style["login-container"]} ref={backgroundRef}>
            <div className={style["username-wrapper"]}>
                <input ref={usernameRef} className={style["username"]} type={showUsername ? "text" : "password"} placeholder="請輸入帳號" />
                <button type="button" className={style["username-eye-button"]} onClick={toggleUsernameVisibility}>
                    {showUsername ? <img src={monkeyOpenEyeSvg} /> : <img src={monkeyCloseEyeSvg} />}
                </button>
            </div>
            <div className={style["password-wrapper"]}>
                <input ref={passwordRef} className={style["password"]} type={showPassword ? "text" : "password"} placeholder="請輸入密碼" />
                <button type="button" className={style["password-eye-button"]} onClick={togglePasswordVisibility}>
                    {showPassword ? <img src={monkeyOpenEyeSvg} /> : <img src={monkeyCloseEyeSvg} />}
                </button>
            </div>
            <div className={style["request-button-wrapper"]}>
                <button type="button" className={style["submit-username-and-password"]} onClick={handleLogin}>建立帳號</button>
                <button type="button" className={style["submit-username-and-password"]} onClick={() => navigate("/login")}>已有帳號，前往登入頁面</button>
            </div>

        </div>
    );
}