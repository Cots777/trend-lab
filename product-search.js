(function () {
    const categoryMap = [
        { match: ['аксесуар', 'сереж', 'бант', 'підвіск', 'браслет', 'брошк', 'годинник', 'окуляр'], label: 'Аксесуари', url: 'obr1.html' },
        { match: ['убор', 'кепк', 'панам', 'шапк'], label: 'Головні убори', url: 'obr2.html' },
        { match: ['жіноч', 'girl', 'білизн'], label: 'Жіноча білизна', url: 'obr3.html' },
        { match: ['чоловіч', 'boy', 'білизн'], label: 'Чоловіча білизна', url: 'obr4.html' },
        { match: ['чоловіки', 'men', 'boy'], label: 'Чоловіки', url: 'obr5.html' },
        { match: ['жінки', 'women', 'girl'], label: 'Жінки', url: 'obr6.html' },
        { match: ['джинс'], label: 'Джинси', url: 'obr7.html' },
        { match: ['sport', 'спор'], label: 'Sport для всіх', url: 'obr8.html' }
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
        const searchable = normalizeText(product.name + ' ' + product.img);
        return categoryMap.find(category => category.match.some(token => searchable.includes(token))) || null;
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
            .filter(product => normalizeText(product.name).includes(normalizedQuery) || normalizeText(product.img).includes(normalizedQuery))
            .slice(0, 6);

        if (!matches.length) {
            searchSuggestions.innerHTML = '<button type="button" disabled>Нічого не знайдено</button>';
            searchSuggestions.classList.add('open');
            return;
        }

        searchSuggestions.innerHTML = matches.map(product => {
            const category = inferCategory(product);
            const meta = [product.price || 'ціна не вказана', category ? category.label : 'товар з каталогу'].join(' • ');
            return '<button type="button" data-product-id="' + product.id + '"><span class="search-suggestion-title">' + (product.name || 'Без назви') + '</span><span class="search-suggestion-meta">' + meta + '</span></button>';
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
            ? products.filter(product => normalizeText(product.name).includes(normalizedQuery) || normalizeText(product.img).includes(normalizedQuery))
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

        if (!input || !button) return;

        function openCatalogSearch() {
            const query = input.value.trim();
            const target = options.targetUrl + (query ? '?q=' + encodeURIComponent(query) : '');
            window.location.href = target;
        }

        button.addEventListener('click', openCatalogSearch);
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                openCatalogSearch();
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