const root = document.getElementById("root");

async function rootLayout() {
    const response = await fetch("/api/writer/listarticle");
    const result = (await response.json()).data;
    root.innerHTML = "<div class=\"alignment-purpose\" >" + result.map((news) => {
        const date = new Date(news.created_at);
        const utc8String = date.toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
            hour12: false,      // 24 小時制
        });
        return (
            `
                <div class="news-card">
                    <div class="cover-img-div">
                        <img src="/images/${news.cover_image_path}" class="cover-img" />
                    </div>
                    <div class="title-and-time">
                        <h1 class="title">${news.title}</h1>
                        <h1 class="time">${utc8String}</h1>
                    </div>
                    <div class="trashcan-button" data-id=${news.id}>
                        <img src="/delete/trashcan.png" class="trashcan-img"/> 
                    </div>
                </div>
            `
        )

    }).join("") + "</div>";
}

rootLayout();

document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("trashcan-button")) {
        return;
    }
    const id = e.target.dataset.id;
    console.log(id);
    fetch(`/api/writer/delete/${id}`, {
        method: "DELETE"
    })
        .then(reponse => reponse.json())
        .then(result => {
            console.log("刪除筆數:", result.data);
            rootLayout();
        })
        .catch(err => console.log(err));

})