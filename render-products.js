let allProductsData = [];
let productsLoaded = false;
let productsSource = 'unknown';

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
        .price {
            font-size: 1.2rem;
            color: #ff6b9d;
            font-weight: bold;
            margin-top: 10px;
        }
    `;
    document.head.appendChild(productsStyle);
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

    const doRender = () => {
        container.innerHTML = '';

        productIds.forEach(id => {
            const product = allProductsData.find(p => p.id === id);
            
            if (product) {
                // ПЕРЕВІРКА: Якщо ціна окремо (1-й список), беремо її. 
                // Якщо ціни немає (2-й список), вона вже вшита в name.
                const priceHTML = product.price ? `<div class="price">${product.price}</div>` : '';
                
                container.innerHTML += `
                    <div class="product" data-id="${product.id}">
                        <img src="${product.img}" alt="${product.name}">
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            ${priceHTML}
                        </div>
                        <button class="favorite-btn" onclick="toggleFavorite(${product.id}, this)">
                            ❤️ В обране
                        </button>
                    </div>
                `;
            }
        });

        restoreFavoriteButtons();
    };

    if (!productsLoaded) {
        productsDataPromise.then(doRender);
    } else {
        doRender();
    }
}

// 4. Функція для обраного (Favorites)
function toggleFavorite(productId, btn) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const index = favorites.indexOf(productId);
    
    if (index === -1) {
        favorites.push(productId);
        btn.classList.add('active');
        btn.textContent = "❤️ В обраному";
    } else {
        favorites.splice(index, 1);
        btn.classList.remove('active');
        btn.textContent = "❤️ В обране";
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

// 5. Відновлення стану кнопок
function restoreFavoriteButtons() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    document.querySelectorAll(".product").forEach(product => {
        const id = parseInt(product.dataset.id);
        if (favorites.includes(id)) {
            const btn = product.querySelector(".favorite-btn");
            if (btn) {
                btn.classList.add("active");
                btn.textContent = "❤️ В обраному";
            }
        }
    });
}

// Запускаємо відновлення кнопок після завантаження сторінки
document.addEventListener("DOMContentLoaded", restoreFavoriteButtons);

// Експортуємо функції для глобального доступу
window.renderProducts = renderProducts;
window.toggleFavorite = toggleFavorite;