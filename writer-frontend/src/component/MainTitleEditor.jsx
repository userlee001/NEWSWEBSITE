import { useEffect, useRef, useState } from "react";
import style from "./MainTitleEditor.module.css";
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '48px', '64px', '128px'];
Quill.register(SizeStyle, true);

const toolbarOptions = [
    [{ 'size': SizeStyle.whitelist }], // 字體大小
    ['bold', 'italic', 'underline', 'strike'],        // 文字樣式
    [{ 'color': [] }, { 'background': [] }],          // 文字顏色、背景顏色
    ['clean']                                         // 清除格式
];

export function MainTitleEditor({ onContentChange, onImageFileChange, onCategoryChange, initialSetting }) {
    const containerRef = useRef(null);
    // 💡 新增：專門用來包裝 Quill 的 Ref
    const quillWrapperRef = useRef(null); 
    const quillRef = useRef(null);
    const addImageInputRef = useRef(null);
    
    // 加入預設值的防呆處理
    const [preview, setPreview] = useState(initialSetting?.imageFile || null);
    const [category, setCategory] = useState(initialSetting?.category || "");

    useEffect(() => {
        const wrapper = quillWrapperRef.current;
        if (!wrapper) return;

        // 建立一個 div 讓 Quill 掛載
        const editorContainer = wrapper.ownerDocument.createElement('div');
        wrapper.appendChild(editorContainer);
        
        const quill = new Quill(editorContainer, {
            theme: "snow",
            modules: {
                toolbar: {
                    container: toolbarOptions
                }
            }
        });

        if (initialSetting?.content) {
            quill.clipboard.dangerouslyPasteHTML(initialSetting.content);
        }
        
        setupCustomSizeInput(quill, SizeStyle);
        quillRef.current = quill;
        
        quill.on('text-change', () => {
            onContentChange(quill.root.innerHTML);
        });

        return () => {
            // 💡 修正：只清空專屬的 wrapper，這會同時安全地移除 Quill 生成的 toolbar 與 container
            // 絕對不會影響到上方的圖片預覽區與單選框
            wrapper.innerHTML = "";
            quillRef.current = null;
        }
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return (() => {
            if (preview && preview.startsWith('blob:')) {
                // 加上 startsWith 判斷，避免 initialSetting 傳入的是一般網址字串時被錯誤 revoke
                URL.revokeObjectURL(preview);
            }
        });
    }, [preview]);

    const presentImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // 生成 blob URL
        const url = URL.createObjectURL(file);
        setPreview(url);
        onImageFileChange(file);
    };

    const handleDeleteImage = () => {
        if (addImageInputRef.current) {
            addImageInputRef.current.value = "";
        }
        setPreview(null);
        onImageFileChange(null);
    }

    const handleCategoryInput = (e) => {
        setCategory(e.target.value)
        onCategoryChange(e.target.value);
    }

    return (
        <div ref={containerRef} className={`${style["editor-wrapper"]} ${style["main-title"]}`}>
            <div className={`${style["preview-image-wrapper"]}`}>
                {preview && <img className={`${style["preview-image"]}`} src={preview} alt="preview" />}
                <div className={`${style["add-and-delete-image-wrapper"]}`}>
                    <input type="file" name="photo" accept="image/*" onChange={presentImage} ref={addImageInputRef}></input>
                    <button onClick={handleDeleteImage}>刪除照片</button>
                    <div className={style["category-option-wrapper"]}>
                        <p className={style["category-label-text"]}>類別標籤:</p>
                        <label className={style["category-option"]}>
                            <input type="radio" name="category-choice" value="1" checked={category === "1"} onChange={handleCategoryInput} />
                            政治
                        </label>
                        <label className={style["category-option"]}>
                            <input type="radio" name="category-choice" value="2" checked={category === "2"} onChange={handleCategoryInput} />
                            體育
                        </label>
                        <label className={style["category-option"]}>
                            <input type="radio" name="category-choice" value="3" checked={category === "3"} onChange={handleCategoryInput} />
                            財經
                        </label>
                    </div>
                </div>
            </div>
            
            {/* 💡 修正：用一個獨立的 div 作為 Quill 的外掛載點 */}
            <div ref={quillWrapperRef} className={style["quill-container"]}></div>
        </div>
    );
}

function setupCustomSizeInput(quill, SizeStyle) {
    const toolbar = quill.getModule('toolbar');
    const sizePicker = toolbar.container.querySelector('.ql-size.ql-picker');
    const label = sizePicker?.querySelector('.ql-picker-label');
    if (!label || !sizePicker) return;

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'ql-custom-size-input';
    input.placeholder = 'px';

    // 統一的更新函數：從 UI 標籤同步到 Input
    const syncInputFromUI = () => {
        const val = label.getAttribute('data-value');
        input.value = val ? val.replace('px', '') : '16';
    };

    // 1. 自動監視：只要選單標籤的屬性一變，Input 就同步
    const observer = new MutationObserver(syncInputFromUI);
    observer.observe(label, { attributes: true });

    // 2. 游標移動：當你點擊不同大小的字時，Quill 會改標籤屬性，Observer 會幫你同步
    quill.on('selection-change', (range) => {
        if (range) setTimeout(syncInputFromUI, 0);
    });

    // 3. 手動輸入：按下 Enter 時套用格式
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = input.value.trim();
            if (!val) return;
            const sizeWithUnit = val.endsWith('px') ? val : `${val}px`;

            if (!SizeStyle.whitelist.includes(sizeWithUnit)) {
                SizeStyle.whitelist.push(sizeWithUnit);
            }
            quill.format('size', sizeWithUnit);

            label.setAttribute('data-value', sizeWithUnit);
        }
    });

    sizePicker.parentNode.insertBefore(input, sizePicker.nextSibling);

    // 初始化時先量一次尺寸
    requestAnimationFrame(() => {
        const rect = sizePicker.getBoundingClientRect();
        if (rect.width && rect.height) {
            input.style.setProperty('--target-width', `${rect.width}px`);
            input.style.setProperty('--target-height', `${rect.height}px`);
        }
    });
}