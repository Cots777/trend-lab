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
        }
        .product {
            cursor: pointer;
        }
        .price {
            font-size: 1.2rem;
            color: #ff6b9d;
            font-weight: bold;
            margin-top: 10px;
        }
        .product-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            padding: 0 10px 15px 10px;
        }
        .quick-favorites-btn {
            margin: 0;
            background: #fff7fa;
            border: 2px solid #ffc5da;
            cursor: pointer;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: bold;
            color: #d84a7f;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .quick-favorites-btn:hover {
            background: #ffd9e8;
            transform: scale(1.04);
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
        }
        .modal-title {
            margin: 0;
            font-size: 1.6rem;
            color: #2b2b2b;
        }
        .modal-size-title {
            font-weight: 700;
            color: #2b2b2b;
        }
        .size-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .size-btn {
            min-width: 52px;
            border: 2px solid #ddd;
            background: #fff;
            border-radius: 8px;
            padding: 8px 10px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .size-btn:hover {
            border-color: #ff8db6;
        }
        .size-btn.active {
            border-color: #ff6b9d;
            background: #ff6b9d;
            color: #fff;
        }
        .modal-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: auto;
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
        btn.textContent = isFavorite ? '❤️ Видалити з обраного' : '❤️ Додати в обране';
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
        btn.textContent = isFavorite ? '❤️ В обраному' : '❤️ В обране';
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
                            <button class="favorite-btn" onclick="toggleFavorite(${product.id}, this, event)">❤️ В обране</button>
                            <a href="Obrane.html" class="quick-favorites-btn" onclick="event.stopPropagation()">До обраного</a>
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
        btn.textContent = isFavorite ? '❤️ В обраному' : '❤️ В обране';
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