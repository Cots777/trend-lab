// Автоматично прокручує та виділяє товар, якщо в URL є параметр ?productId=XXX
(function() {
    function highlightProduct() {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('productId');
        
        if (!productId) return;
        
        // Чекаємо, щоб DOM був готовий та товари були відрендерені
        const checkAndHighlight = () => {
            const productElement = document.querySelector(`[data-id="${productId}"]`);
            
            if (!productElement) {
                // Спробуємо ще раз через 100ms
                setTimeout(checkAndHighlight, 100);
                return;
            }
            
            // Прокручуємо до елемента
            productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Додаємо клас для виділення
            productElement.classList.add('product-highlighted');
            
            // Піддіймаємо на верх (z-index)
            productElement.style.position = 'relative';
            productElement.style.zIndex = '10';
            
            // Убираємо виділення через 3 секунди
            setTimeout(() => {
                productElement.classList.remove('product-highlighted');
                productElement.style.zIndex = '';
            }, 3000);
        };
        
        checkAndHighlight();
    }
    
    // Запускаємо коли сторінка завантажена або коли DOM готовий
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', highlightProduct);
    } else {
        highlightProduct();
    }
})();
