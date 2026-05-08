(function () {
    const categoryMap = [
        { ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], label: 'Аксесуари', url: 'obr1.html', aliases: ['аксесуар', 'аксесуари', 'accessory', 'аксе'] },
        { ids: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], label: 'Головні убори', url: 'obr2.html', aliases: ['убор', 'кепк', 'панам', 'шапк', 'hat'] },
        { ids: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48], label: 'Чоловіча білизна', url: 'obr4.html', aliases: ['чоловіч', 'male underwear', 'mens underwear', 'білизн'] },
        { ids: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60], label: 'Чоловіки', url: 'obr5.html', aliases: ['чоловіки', 'men', 'boy', 'чол'] },
        { ids: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72], label: 'Жінки', url: 'obr6.html', aliases: ['жінки', 'women', 'girl', 'жін'] },
        { ids: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84], label: 'Джинси', url: 'obr7.html', aliases: ['джинс', 'jeans', 'denim'] },
        { ids: [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96], label: 'Sport для всіх', url: 'obr8.html', aliases: ['sport', 'спор', 'спорт', 'спортив', 'sports'] }
    ];

    function normalizeText(value) {
        return (value || '')
            .toString()
            .toLowerCase()
            .replace(/[<>"'()]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function inferCategory(product) {
        return categoryMap.find(category => category.ids.includes(product.id)) || null;
    }

    function getSearchableText(product) {
        const category = inferCategory(product);
        const categoryText = category ? category.label + ' ' + category.aliases.join(' ') : '';
        return normalizeText(product.name + ' ' + product.img + ' ' + categoryText);
    }

    function matchesQuery(product, query) {
        const normalizedQuery = normalizeText(query);
        if (!normalizedQuery) return false;
        return getSearchableText(product).includes(normalizedQuery);
    }

    function fetchProducts() {
        return fetch('products-data.json?search-cache-bust=' + Date.now())
            .then(response => response.ok ? response.json() : Promise.reject(new Error('Не вдалося завантажити каталог')))
            .then(data => Array.isArray(data.products) ? data.products : [])
            .catch(() => []);
    }

    function renderSuggestions(searchSuggestions, products, query, onPick) {
        const normalizedQuery = normalizeText(query);
        if (!normalizedQuery) {
            searchSuggestions.classList.remove('open');
            searchSuggestions.innerHTML = '';
            return;
        }

        const matches = products
            .filter(product => matchesQuery(product, normalizedQuery))
            .slice(0, 6);

        if (!matches.length) {
            searchSuggestions.innerHTML = '<button type="button" disabled>Нічого не знайдено</button>';
            searchSuggestions.classList.add('open');
            return;
        }

        searchSuggestions.innerHTML = matches.map(product => {
            const category = inferCategory(product);
            const meta = [product.price || 'ціна не вказана', category ? category.label : 'товар з каталогу'].join(' • ');
            const imgSrc = product.img || 'photo_all/category/photo_1_2025-05-25_0012-13-46.jpg';
            return '<button type="button" data-product-id="' + product.id + '"><img class="search-suggestion-image" src="' + imgSrc + '" alt="' + (product.name || 'Товар') + '"><div class="search-suggestion-content"><span class="search-suggestion-title">' + (product.name || 'Без назви') + '</span><span class="search-suggestion-meta">' + meta + '</span></div></button>';
        }).join('');

        searchSuggestions.classList.add('open');

        searchSuggestions.onclick = event => {
            const button = event.target.closest('button[data-product-id]');
            if (!button) return;
            const productId = Number(button.getAttribute('data-product-id'));
            const selectedProduct = products.find(product => product.id === productId);
            if (selectedProduct) {
                onPick(selectedProduct);
            }
        };
    }

    function renderResults(searchResults, searchHint, products, query) {
        const normalizedQuery = normalizeText(query);
        const scopedProducts = normalizedQuery
            ? products.filter(product => matchesQuery(product, normalizedQuery))
            : products.filter(product => product.name);

        searchResults.innerHTML = '';

        if (!scopedProducts.length) {
            searchResults.innerHTML = '<div class="search-empty">За запитом нічого не знайдено. Спробуйте іншу назву або категорію.</div>';
            searchHint.textContent = 'Підказка: введіть іншу частину назви, наприклад «комплект», «окуляри» або «джинси».';
            return;
        }

        searchHint.textContent = normalizedQuery
            ? 'Знайдено ' + scopedProducts.length + ' результат(ів) за запитом «' + query + '». Нижче показані найбільш релевантні товари.'
            : 'Показані товари, які вже є в каталозі. Почніть вводити запит, щоб звузити список.';

        searchResults.innerHTML = scopedProducts.slice(0, 24).map(product => {
            const category = inferCategory(product);
            const destination = category ? category.url : '#';
            const extra = category ? 'Категорія: ' + category.label : 'Товар каталогу';
            return '<article class="search-card"><img src="' + (product.img || 'photo_all/category/photo_1_2025-05-25_0012-13-46.jpg') + '" alt="' + (product.name || 'Товар') + '"><div class="search-card-body"><h3 class="search-card-name">' + (product.name || 'Без назви') + '</h3><div class="search-card-meta">' + (product.price || 'Ціна не вказана') + ' • ' + extra + '</div>' + (category ? '<a class="search-card-link" href="' + destination + '">Відкрити категорію</a>' : '') + '</div></article>';
        }).join('');
    }

    function initHomepageSearch(options) {
        const input = document.getElementById(options.inputId);
        const button = document.getElementById(options.buttonId);
        const searchSuggestions = options.suggestionsId ? document.getElementById(options.suggestionsId) : null;

        if (!input || !button) return;

        function openProductPage(product) {
            const category = inferCategory(product);
            if (category) {
                window.location.href = category.url + '?productId=' + product.id;
            } else {
                window.location.href = options.targetUrl + '?q=' + encodeURIComponent(product.name);
            }
        }

        function openCatalogSearch(queryOverride) {
            const query = (queryOverride !== undefined ? queryOverride : input.value).trim();
            const target = options.targetUrl + (query ? '?q=' + encodeURIComponent(query) : '');
            window.location.href = target;
        }

        function refreshHomepageSuggestions(products) {
            if (!searchSuggestions) return;
            renderSuggestions(searchSuggestions, products, input.value.trim(), selectedProduct => {
                openProductPage(selectedProduct);
            });
        }

        fetchProducts().then(products => {
            const update = () => refreshHomepageSuggestions(products);

            input.addEventListener('input', update);
            input.addEventListener('focus', update);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    openCatalogSearch();
                }
            });

            button.addEventListener('click', () => openCatalogSearch());

            if (searchSuggestions) {
                searchSuggestions.addEventListener('click', event => {
                    const buttonElement = event.target.closest('button[data-product-id]');
                    if (!buttonElement) return;
                    const productId = Number(buttonElement.getAttribute('data-product-id'));
                    const selectedProduct = products.find(product => product.id === productId);
                    if (selectedProduct) {
                        openProductPage(selectedProduct);
                    }
                });

                document.addEventListener('click', event => {
                    const root = document.getElementById(options.rootId || 'homepageSearchBox');
                    if (root && !root.contains(event.target)) {
                        searchSuggestions.classList.remove('open');
                    }
                });

                update();
            }
        });
    }

    function initCatalogSearch(options) {
        const input = document.getElementById(options.inputId);
        const button = document.getElementById(options.buttonId);
        const searchSuggestions = document.getElementById(options.suggestionsId);
        const searchResults = document.getElementById(options.resultsId);
        const searchHint = document.getElementById(options.hintId);

        if (!input || !button || !searchSuggestions || !searchResults || !searchHint) return;

        const initialQuery = options.initialQuery || '';

        fetchProducts().then(products => {
            function runSearch() {
                const query = input.value.trim();
                renderSuggestions(searchSuggestions, products, query, selectedProduct => {
                    input.value = selectedProduct.name;
                    runSearch();
                });
                renderResults(searchResults, searchHint, products, query);
            }

            if (initialQuery) {
                input.value = initialQuery;
            }

            renderSuggestions(searchSuggestions, products, initialQuery, selectedProduct => {
                input.value = selectedProduct.name;
                runSearch();
            });
            renderResults(searchResults, searchHint, products, initialQuery);

            input.addEventListener('input', runSearch);
            input.addEventListener('focus', () => renderSuggestions(searchSuggestions, products, input.value.trim(), selectedProduct => {
                input.value = selectedProduct.name;
                runSearch();
            }));
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    runSearch();
                }
            });

            button.addEventListener('click', runSearch);

            document.addEventListener('click', event => {
                const root = document.getElementById(options.rootId || 'headerSearchBox');
                if (root && !root.contains(event.target)) {
                    searchSuggestions.classList.remove('open');
                }
            });
        });
    }

    window.TrendLabSearch = {
        initHomepageSearch,
        initCatalogSearch
    };
})();