// 🎡 Функционал колеса скидок для TrendLab
// Минимальная сумма для использования: 2000 грн

const DiscountWheel = {
    MIN_AMOUNT: 2000,
    
    // Сегменты (процент и вес) — загружаются из localStorage или ставятся по умолчанию
    segments: null,
    
    // Состояние колеса
    isSpinning: false,
    currentDiscount: null,
    lastSpinTime: 0,
    spinCooldown: 5000, // 5 сек между спинами
    
    /**
     * Инициализация колеса
     */
    init: function() {
        const wheel = document.getElementById('discountWheel');
        const spinButton = document.getElementById('spinWheelBtn');
        
        if (!wheel || !spinButton) return;
        
        spinButton.addEventListener('click', () => this.spin());
        // Загрузим сегменты из localStorage или используем дефолт настройка скидок и весов
        this.segments = this.loadSegments() || [
            {percent:5, weight:1},
            {percent:10, weight:1},
            {percent:15, weight:1},
            {percent:20, weight:1},
            {percent:25, weight:1},
            {percent:10, weight:1},
            {percent:30, weight:1},
            {percent:15, weight:1}
        ];
        // Добавим подписи сегментов и плавность
        this.renderLabels();
        if (wheel) {
            wheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        this.updateWheelState();
    },
    
    /**
     * Получить скидку на основе суммы товаров
     */
    getDiscount: function() {
        return this.currentDiscount || 0;
    },
    // Получить текущие сегменты
    getSegments: function() {
        return this.segments || [];
    },
    // Установить сегменты и сохранить в localStorage
    setSegments: function(segments) {
        this.segments = (segments || []).map(function(s){
            return { percent: Number(s.percent)||0, weight: Number(s.weight)||0 };
        });
        try { localStorage.setItem('trendlab_wheel_segments', JSON.stringify(this.segments)); } catch(e){}
        this.renderLabels();
        this.updateWheelState();
    },
    loadSegments: function() {
        try {
            var raw = localStorage.getItem('trendlab_wheel_segments');
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return null;
            return parsed.map(function(s){ return { percent: Number(s.percent)||0, weight: Number(s.weight)||0 }; });
        } catch(e) { return null; }
    },
    
    /**
     * Проверить, может ли пользователь крутить колесо
     */
    canSpin: function(itemsTotal) {
        return itemsTotal >= this.MIN_AMOUNT && 
               !this.isSpinning && 
               (Date.now() - this.lastSpinTime) > this.spinCooldown;
    },
    
    /**
     * Обновить состояние кнопки в зависимости от суммы
     */
    updateWheelState: function(itemsTotal = 0) {
        const spinButton = document.getElementById('spinWheelBtn');
        const wheelHint = document.getElementById('wheelHint');
        
        if (!spinButton || !wheelHint) return;
        
        const canSpinNow = this.canSpin(itemsTotal);
        
        spinButton.disabled = !canSpinNow;
        spinButton.style.opacity = canSpinNow ? '1' : '0.5';
        spinButton.style.cursor = canSpinNow ? 'pointer' : 'not-allowed';
        
        if (itemsTotal < this.MIN_AMOUNT && itemsTotal > 0) {
            wheelHint.textContent = `Ще ${(this.MIN_AMOUNT - itemsTotal).toFixed(2)} ₴ до розблокування колеса`;
            wheelHint.style.color = '#d86734';
        } else if (itemsTotal >= this.MIN_AMOUNT) {
            wheelHint.textContent = this.currentDiscount 
                ? `✨ Ви виграли ${this.currentDiscount}% знижку!`
                : '🎡 Крутіть колесо для скидки!';
            wheelHint.style.color = this.currentDiscount ? '#2ecc71' : '#b7522a';
        } else {
            wheelHint.textContent = 'Додайте товари від 2000 ₴';
            wheelHint.style.color = '#b7522a';
        }
    },
    
    /**
     * Крутнути колесо
     */
    spin: function() {
        if (this.isSpinning) return;
        
        const summaryItems = document.getElementById('summaryItems');
        const itemsTotal = parseFloat(summaryItems.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        
        if (!this.canSpin(itemsTotal)) {
            console.warn('Не можна крутити колесо зараз');
            return;
        }
        
        this.isSpinning = true;
        this.lastSpinTime = Date.now();
        
        const wheel = document.getElementById('discountWheel');
        const spinButton = document.getElementById('spinWheelBtn');
        
        spinButton.disabled = true;
        
        // Выбор сегмента взвешенно по weight
        const segments = this.segments || [];
        const totalWeight = segments.reduce((s, seg) => s + (seg.weight || 0), 0);
        let targetIdx = 0;
        if (segments.length === 0) return;
        if (totalWeight <= 0) {
            targetIdx = Math.floor(Math.random() * segments.length);
        } else {
            let r = Math.random() * totalWeight;
            for (let i = 0; i < segments.length; i++) {
                r -= (segments[i].weight || 0);
                if (r <= 0) { targetIdx = i; break; }
            }
        }
        const selectedDiscount = (segments[targetIdx] && segments[targetIdx].percent) || 0;

        // Розраховуємо кут для обертання — кінець має дивитись на центр сегмента
        const segmentAngle = 360 / segments.length;
        const extraSpins = 4; // повні обороти
        const targetAngle = targetIdx * segmentAngle + segmentAngle / 2;
        const totalRotation = extraSpins * 360 + (360 - targetAngle);

        // Анімація обертання
        wheel.style.transform = `rotate(${totalRotation}deg)`;

        // Після анімації показуємо результат (чуть довше, щоб вмістилося)
        setTimeout(() => {
            this.currentDiscount = selectedDiscount;
            this.showWinNotification(selectedDiscount, itemsTotal);
            this.updateWheelState(itemsTotal);
            this.isSpinning = false;
            spinButton.disabled = false;

            // Оновлюємо суму в кошику
            this.recalculateTotal();
        }, 4200); // Тривалість анімації трохи довша
    },

    // Отрисовать подписи сегментов вокруг колеса
    renderLabels: function() {
        const wheel = document.getElementById('discountWheel');
        if (!wheel) return;
        // Удалим предыдущие, если есть
        const existing = wheel.querySelectorAll('.wheel-label');
        existing.forEach(n => n.remove());

        const segments = this.segments || [];
        const count = segments.length || 1;
        const angleStep = 360 / count;
        for (let i = 0; i < count; i++) {
            const perc = (segments[i] && segments[i].percent) || 0;
            const label = document.createElement('div');
            label.className = 'wheel-label';
            label.textContent = perc + '%';
            // Расположим по кругу: повернем контейнер, сдвинем вверх и компенсируем поворот текста
            const angle = i * angleStep;
            label.style.position = 'absolute';
            label.style.left = '50%';
            label.style.top = '50%';
            label.style.transform = `rotate(${angle}deg) translate(0, -72px) rotate(-${angle}deg)`;
            label.style.transformOrigin = 'center center';
            label.style.fontSize = '0.8rem';
            label.style.color = '#fff';
            label.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
            wheel.appendChild(label);
        }
    },
    
    /**
     * Показати повідомлення про виграш
     */
    showWinNotification: function(discount, itemsTotal) {
        const notification = document.getElementById('wheelNotification');
        if (!notification) return;
        
        const discountAmount = itemsTotal * discount / 100;
        
        notification.innerHTML = `
            <div style="text-align: center; padding: 16px;">
                <div style="font-size: 2rem; margin-bottom: 8px;">🎉</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #2ecc71; margin-bottom: 8px;">
                    Вітаємо! Ви виграли ${discount}% знижку!
                </div>
                <div style="color: #666; font-size: 0.95rem;">
                    Економія: ${discountAmount.toFixed(2)} ₴
                </div>
            </div>
        `;
        
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    },
    
    /**
     * Пересчитати загальну суму з урахуванням скидки
     */
    recalculateTotal: function() {
        // Виклик існуючої функції оновлення суми
        const deliveryType = document.getElementById('deliveryType').value;
        const summaryItems = document.getElementById('summaryItems');
        
        if (summaryItems && window.updateSummaryWithDiscount) {
            window.updateSummaryWithDiscount(this.currentDiscount);
        }
    },
    
    /**
     * Скинути скидку (для нового замовлення)
     */
    reset: function() {
        this.currentDiscount = null;
        this.isSpinning = false;
        this.lastSpinTime = 0;
        const wheel = document.getElementById('discountWheel');
        if (wheel) {
            wheel.style.transform = 'rotate(0deg)';
        }
    }
};

// Експортуємо для використання в HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscountWheel;
}
