const submitButton = document.getElementById("submit-button");
submitButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password })
        });

        const data = await response.json();
        if (data.message === "success") {
            return window.location.href = "/write";
        }
        if (data.message === "fail") {
            alert("帳號或密碼錯誤");
            return
        }
    } catch (err) {
        console.log(err);
        alert("網路或伺服器錯誤");
    }
})