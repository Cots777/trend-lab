let allProductsData = [];
let productsLoaded = false;
let productsSource = 'unknown';
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites')) || [];
}

function setFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function getSelectedSizes() {
    return JSON.parse(localStorage.getItem('selectedSizes')) || {};
}

function setSelectedSizes(selectedSizes) {
    localStorage.setItem('selectedSizes', JSON.stringify(selectedSizes));
}

function getSelectedColors() {
    return JSON.parse(localStorage.getItem('selectedColors')) || {};
}

function setSelectedColors(selectedColors) {
    localStorage.setItem('selectedColors', JSON.stringify(selectedColors));
}

function getColorOptions(productId) {
    if (productId >= 1 && productId <= 4) {
        return [
            { name: 'Молочний', value: '#f5ede3' },
            { name: 'Рожевий', value: '#f8c7d8' },
            { name: 'Чорний', value: '#1f1f1f' },
            { name: 'Бежевий', value: '#d8c2a5' }
        ];
    }

    if (productId >= 5 && productId <= 8) {
        return [
            { name: 'Кремовий', value: '#f4ead9' },
            { name: 'Шоколадний', value: '#7b4b2a' },
            { name: 'Графітовий', value: '#4b4b4b' },
            { name: 'Сірий', value: '#c9ced6' }
        ];
    }

    if (productId >= 9 && productId <= 16) {
        return [
            { name: 'Білий', value: '#f8f4ef' },
            { name: 'Чорний', value: '#1f1f1f' },
            { name: 'Ніжно-рожевий', value: '#f2c9d7' },
            { name: 'Бежевий', value: '#dcc6aa' }
        ];
    }

    if (productId >= 17 && productId <= 28) {
        return [
            { name: 'Синій', value: '#6fa8dc' },
            { name: 'Графітовий', value: '#4b4b4b' },
            { name: 'Світло-сірий', value: '#d8dbe2' },
            { name: 'Чорний', value: '#1f1f1f' }
        ];
    }

    return [
        { name: 'Білий', value: '#f8f4ef' },
        { name: 'Чорний', value: '#1f1f1f' },
        { name: 'Сірий', value: '#c9ced6' },
        { name: 'Синій', value: '#6fa8dc' }
    ];
}

// 1. Додаємо стилі для контейнера (якщо їх немає в HTML)
if (!document.getElementById('products-dynamic-styles')) {
    const productsStyle = document.createElement('style');
    productsStyle.id = 'products-dynamic-styles';
    productsStyle.textContent = `
        #productsContainer {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 25px;
            margin-top: 30px;
            align-items: stretch;
        }
        .product {
            cursor: pointer;
        }
        #productsContainer .product {
            display: flex;
            flex-direction: column;
        }
        #productsContainer .product-info {
            padding: 14px 12px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            min-height: 128px;
        }
        #productsContainer .product h3 {
            margin: 0;
            line-height: 1.35;
            font-size: 1.15rem;
            color: #222;
        }
        #productsContainer .price {
            font-size: 1.2rem;
            color: #ff6b9d;
            font-weight: bold;
            margin-top: 10px;
        }
        #productsContainer .product-actions {
            display: flex;
            gap: 10px;
            margin-top: auto;
            padding: 0 12px 14px;
            box-sizing: border-box;
        }
        #productsContainer .favorite-btn,
        #productsContainer .quick-favorites-btn {
            margin: 0;
            min-height: 50px;
            width: 100%;
            border-radius: 12px;
            font-size: 1rem;
            line-height: 1.2;
            font-weight: 700;
            padding: 10px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            min-width: 0;
            white-space: normal;
            text-decoration: none;
            transition: transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
        }
        #productsContainer .favorite-btn:disabled {
            cursor: default;
            opacity: 0.92;
        }
        .favorites-dock {
            position: fixed;
            left: 50%;
            bottom: 16px;
            transform: translateX(-50%);
            z-index: 1100;
            width: min(520px, calc(100vw - 24px));
        }
        .favorites-dock-link {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 52px;
            border-radius: 14px;
            text-decoration: none;
            font-weight: 800;
            font-size: 1rem;
            color: #fff;
            background: linear-gradient(135deg, #7a5a48 0%, #5f4539 100%);
            box-shadow: 0 10px 24px rgba(95, 69, 57, 0.35);
            border: 2px solid rgba(255, 255, 255, 0.35);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .favorites-dock-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(95, 69, 57, 0.42);
        }
        #productsContainer .quick-favorites-btn {
            background: #fff7fa;
            border: 2px solid #ffb8d2;
            cursor: pointer;
            color: #d84a7f;
            box-shadow: 0 6px 12px rgba(216, 74, 127, 0.12);
        }
        #productsContainer .quick-favorites-btn:hover {
            background: #ffe2ee;
            transform: translateY(-2px);
            box-shadow: 0 10px 18px rgba(216, 74, 127, 0.16);
        }
        #productsContainer .favorite-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 18px rgba(255, 107, 157, 0.22);
        }
        .product-modal {
            position: fixed;
            inset: 0;
            z-index: 1200;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.65);
        }
        .product-modal.open {
            display: flex;
        }
        .product-modal-content {
            width: min(920px, 96vw);
            max-height: 92vh;
            overflow: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            padding: 20px;
            position: relative;
        }
        .modal-close {
            position: absolute;
            top: 12px;
            right: 12px;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            background: #f0f0f0;
            color: #333;
        }
        .modal-image {
            width: 100%;
            height: 480px;
            object-fit: cover;
            border-radius: 12px;
        }
        .modal-details {
            padding: 10px 4px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background: linear-gradient(180deg, #fff7f1 0%, #ffffff 100%);
            border: 1px solid #f0dfd3;
            border-radius: 12px;
            padding: 18px 16px;
        }
        .modal-title {
            margin: 0;
            font-size: 1.8rem;
            line-height: 1.25;
            color: #2f211a;
            font-weight: 800;
            letter-spacing: 0.2px;
        }
        #modalProductPrice {
            margin-top: -4px;
            font-size: 1.5rem;
            font-weight: 800;
            color: #c24776;
        }
        .modal-size-title {
            font-weight: 700;
            color: #4b362b;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-top: 2px;
        }
        .size-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: -2px;
        }
        .size-btn {
            min-width: 52px;
            border: 2px solid #d8c6bb;
            background: #fff;
            border-radius: 10px;
            padding: 8px 10px;
            font-weight: 700;
            cursor: pointer;
            color: #3f2d23;
            transition: all 0.2s ease;
        }
        .size-btn:hover {
            border-color: #c27e69;
            background: #fff7f2;
        }
        .size-btn.active {
            border-color: #7a5a48;
            background: #7a5a48;
            color: #fff;
            box-shadow: 0 6px 14px rgba(122, 90, 72, 0.28);
        }
        .modal-color-title {
            font-weight: 700;
            color: #4b362b;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-top: 2px;
        }
        .color-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: -2px;
        }
        .color-btn {
            min-width: 92px;
            border: 2px solid #d8c6bb;
            background: #fff;
            border-radius: 12px;
            padding: 8px 10px;
            font-weight: 700;
            cursor: pointer;
            color: #3f2d23;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        .color-btn:hover {
            border-color: #c27e69;
            background: #fff7f2;
        }
        .color-btn.active {
            border-color: #7a5a48;
            box-shadow: 0 6px 14px rgba(122, 90, 72, 0.22);
            transform: translateY(-1px);
        }
        .color-swatch {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 1px solid rgba(0, 0, 0, 0.14);
            flex: 0 0 auto;
        }
        .selected-variant-info {
            padding: 10px 12px;
            border-radius: 12px;
            background: #fff4e7;
            border: 1px solid #f0dfd3;
            color: #5b4035;
            font-weight: 700;
            line-height: 1.35;
        }
        .size-guide-link {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            min-height: 30px;
            padding: 12px 0.1px;
            border-radius: 14px;
            text-decoration: none;
            font-weight: 800;
            color: #fff;
            background: linear-gradient(135deg, #b7522a 0%, #d86734 100%);
            box-shadow: 0 10px 20px rgba(183, 82, 42, 0.24);
            border: 1px solid rgba(255, 255, 255, 0.35);
            transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .size-guide-link:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 26px rgba(183, 82, 42, 0.3);
            filter: brightness(1.02);
        }
        .modal-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: auto;
            width: 100%;
        }
        .modal-favorite-btn,
        .modal-go-favorites {
            border: none;
            cursor: pointer;
            padding: 11px 16px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 700;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 52px;
            box-sizing: border-box;
        }
        .modal-favorite-btn {
            background: #ff6b9d;
            color: #fff;
        }
        .modal-favorite-btn.active {
            background: #d9487e;
        }
        .modal-go-favorites {
            background: #f2f2f2;
            color: #222;
        }
        @media (max-width: 820px) {
            .product-modal-content {
                grid-template-columns: 1fr;
            }
            .modal-image {
                height: 340px;
            }
        }
        @media (max-width: 560px) {
            #productsContainer .favorite-btn {
                min-height: 48px;
                font-size: 0.95rem;
            }
            .favorites-dock {
                bottom: 10px;
                width: calc(100vw - 16px);
            }
            .favorites-dock-link {
                min-height: 48px;
                font-size: 0.95rem;
            }
        }
    `;
    document.head.appendChild(productsStyle);
}

function ensureProductModal() {
    if (document.getElementById('productModal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'productModal';
    modal.className = 'product-modal';
    modal.innerHTML = `
        <div class="product-modal-content" id="productModalContent">
            <button class="modal-close" id="closeProductModal" aria-label="Закрити">✕</button>
            <img id="modalProductImage" class="modal-image" src="" alt="">
            <div class="modal-details">
                <h2 id="modalProductName" class="modal-title"></h2>
                <div id="modalProductPrice" class="price"></div>
                <div class="modal-size-title">Оберіть розмір:</div>
                <div id="modalSizeOptions" class="size-options"></div>
                <div class="modal-color-title">Оберіть колір:</div>
                <div id="modalColorOptions" class="color-options"></div>
                <div id="modalSelectedVariant" class="selected-variant-info"></div>
                <a href="dodatok.html" class="size-guide-link">Підібрати розмір</a>
                <div class="modal-actions">
                    <button id="modalFavoriteBtn" class="modal-favorite-btn" type="button"></button>
                    <a href="Obrane.html" class="modal-go-favorites">Перейти в обране</a>
                </div>
            </div>
        </div>
    `;

    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeProductModal();
        }
    });

    document.body.appendChild(modal);
    document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
}

function ensureFavoritesDock() {
    if (!document.getElementById('favoritesDock')) {
        const dock = document.createElement('div');
        dock.id = 'favoritesDock';
        dock.className = 'favorites-dock';
        dock.innerHTML = '<a href="Obrane.html" class="favorites-dock-link">Перейти в обране</a>';
        document.body.appendChild(dock);
    }

    document.body.style.paddingBottom = '96px';
}

function openProductModal(productId) {
    const product = allProductsData.find(p => p.id === productId);
    if (!product) {
        return;
    }

    ensureProductModal();

    const modal = document.getElementById('productModal');
    const nameEl = document.getElementById('modalProductName');
    const imgEl = document.getElementById('modalProductImage');
    const priceEl = document.getElementById('modalProductPrice');
    const sizeOptionsEl = document.getElementById('modalSizeOptions');
    const colorOptionsEl = document.getElementById('modalColorOptions');
    const selectedVariantEl = document.getElementById('modalSelectedVariant');
    const favoriteBtn = document.getElementById('modalFavoriteBtn');

    nameEl.textContent = product.name;
    imgEl.src = product.img;
    imgEl.alt = product.name;
    priceEl.textContent = product.price || '';

    const selectedSizes = getSelectedSizes();
    const currentSize = selectedSizes[productId] || 'M';

    sizeOptionsEl.innerHTML = DEFAULT_SIZES.map(size => `
        <button
            class="size-btn ${size === currentSize ? 'active' : ''}"
            type="button"
            data-size="${size}"
        >${size}</button>
    `).join('');

    sizeOptionsEl.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const sizesMap = getSelectedSizes();
            sizesMap[productId] = this.dataset.size;
            setSelectedSizes(sizesMap);

            sizeOptionsEl.querySelectorAll('.size-btn').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const selectedColors = getSelectedColors();
    const productColors = getColorOptions(productId);
    const currentColor = selectedColors[productId] || productColors[0].name;

    colorOptionsEl.innerHTML = productColors.map(color => `
        <button
            class="color-btn ${color.name === currentColor ? 'active' : ''}"
            type="button"
            data-color="${color.name}"
            data-color-value="${color.value}"
        >
            <span class="color-swatch" style="background:${color.value}"></span>
            ${color.name}
        </button>
    `).join('');

    colorOptionsEl.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const colorsMap = getSelectedColors();
            colorsMap[productId] = this.dataset.color;
            setSelectedColors(colorsMap);

            colorOptionsEl.querySelectorAll('.color-btn').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            selectedVariantEl.textContent = 'Обраний колір: ' + this.dataset.color;
        });
    });

    selectedVariantEl.textContent = 'Обраний колір: ' + currentColor;

    favoriteBtn.onclick = function () {
        toggleFavorite(productId);
        updateFavoriteButtonState(favoriteBtn, productId);
    };

    updateFavoriteButtonState(favoriteBtn, productId);
    modal.classList.add('open');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

function updateFavoriteButtonState(btn, productId) {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(productId);

    if (btn) {
        btn.classList.toggle('active', isFavorite);
        btn.textContent = isFavorite ? 'Видалити з обраного' : 'Додати в обране';
    }
}

function updateAllFavoriteButtons() {
    const favorites = getFavorites();
    document.querySelectorAll('.product').forEach(productCard => {
        const id = parseInt(productCard.dataset.id, 10);
        const btn = productCard.querySelector('.favorite-btn');
        if (!btn || Number.isNaN(id)) {
            return;
        }

        const isFavorite = favorites.includes(id);
        btn.classList.toggle('active', isFavorite);
        btn.textContent = isFavorite ? 'В обраному' : 'Додати в обране';
        btn.disabled = false;
    });

    const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');
    const modal = document.getElementById('productModal');
    if (modalFavoriteBtn && modal && modal.classList.contains('open')) {
        const modalTitle = document.getElementById('modalProductName');
        const activeProduct = allProductsData.find(item => item.name === modalTitle.textContent);
        if (activeProduct) {
            updateFavoriteButtonState(modalFavoriteBtn, activeProduct.id);
        }
    }
}

// 2. Спроба завантажити дані з JSON (Перший список)
const productsDataPromise = fetch(`products-data.json?cache-bust=${Date.now()}`)
    .then(response => {
        if (!response.ok) throw new Error(`Ошибка HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data && Array.isArray(data.products)) {
            allProductsData = data.products;
            productsSource = 'products-data.json';
            console.log('Дані завантажено з JSON (Структурований список)');
        }
    })
    .catch(error => {
        console.warn('JSON не знайдено, перевіряємо локальну змінну allProducts (Другий список):', error);
        if (typeof allProducts !== 'undefined') {
            allProductsData = allProducts;
            productsSource = 'products.js';
        }
    })
    .finally(() => {
        productsLoaded = true;
    });

// 3. Основна функція рендерингу
function renderProducts(productIds, containerId = 'productsContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    ensureProductModal();
    ensureFavoritesDock();

    const doRender = () => {
        container.innerHTML = '';

        productIds.forEach(id => {
            const product = allProductsData.find(p => p.id === id);
            
            if (product) {
                // ПЕРЕВІРКА: Якщо ціна окремо (1-й список), беремо її. 
                // Якщо ціни немає (2-й список), вона вже вшита в name.
                const priceHTML = product.price ? `<div class="price">${product.price}</div>` : '';
                
                container.innerHTML += `
                    <div class="product" data-id="${product.id}" onclick="openProductModal(${product.id})">
                        <img src="${product.img}" alt="${product.name}">
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            ${priceHTML}
                        </div>
                        <div class="product-actions">
                            <button class="favorite-btn" onclick="toggleFavorite(${product.id}, this, event)">Додати в обране</button>
                        </div>
                    </div>
                `;
            }
        });

        updateAllFavoriteButtons();
    };

    if (!productsLoaded) {
        productsDataPromise.then(doRender);
    } else {
        doRender();
    }
}

// 4. Функція для обраного (Favorites)
function toggleFavorite(productId, btn, event) {
    if (event) {
        event.stopPropagation();
    }

    let favorites = getFavorites();
    const index = favorites.indexOf(productId);
    
    if (index === -1) {
        favorites.push(productId);
    } else {
        favorites.splice(index, 1);
    }

    setFavorites(favorites);

    if (btn) {
        const isFavorite = favorites.includes(productId);
        btn.classList.toggle('active', isFavorite);
        btn.textContent = isFavorite ? 'В обраному' : 'Додати в обране';
    }

    updateAllFavoriteButtons();
}

// 5. Відновлення стану кнопок
function restoreFavoriteButtons() {
    updateAllFavoriteButtons();
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeProductModal();
    }
});

// Запускаємо відновлення кнопок після завантаження сторінки
document.addEventListener("DOMContentLoaded", restoreFavoriteButtons);

// Експортуємо функції для глобального доступу
window.renderProducts = renderProducts;
window.toggleFavorite = toggleFavorite;
window.openProductModal = openProductModal;