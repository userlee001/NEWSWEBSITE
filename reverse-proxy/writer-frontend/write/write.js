const image = document.getElementById("preview-image");
const input = document.getElementById("photo");

input.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 生成 blob URL
  const url = URL.createObjectURL(file);
  image.src = url;

  // 用完釋放 memory
  image.onload = () => {
    URL.revokeObjectURL(url);
  }
});

