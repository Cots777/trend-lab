// 🎡 Функціонал колеса знижок для TrendLab
// Мінімальна сума для використання: 2000 грн

const DiscountWheel = {
    MIN_AMOUNT: 2000,
    windowStateKey: 'trendlab_wheel_state',
    summaryObserver: null,
    
    // Сегменти (відсоток і вага) — завантажуються з localStorage або встановлюються за замовчуванням
    segments: null,
    
    // Стан колеса
    isSpinning: false,
    currentDiscount: null,
    lastSpinTime: 0,
    spinCooldown: 500, // мінімальна затримка між кліками
    hasSpinThisOrder: false, // прапор: вже один раз крутили в цьому замовленні
    
    /**
     * Ініціалізація колеса
     */
    init: function() {
        const wheel = document.getElementById('discountWheel');
        const spinButton = document.getElementById('spinWheelBtn');
        
        if (!wheel || !spinButton) return;
        
        // Завантажимо збережене стан колеса
        this.loadWheelState();
        
        spinButton.addEventListener('click', () => this.spin());
        // Завантажимо сегменти з localStorage або використовуємо стандартне налаштування знижок та ваг
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
        // Додамо підписи сегментів і плавність
        this.renderLabels();
        this.observeSummaryChanges();
        if (wheel) {
            wheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        this.updateWheelState(this.getItemsTotal());
    },
    
    /**
     * Отримання знижки для поточного замовлення (0 якщо не виграв або ще не крутив)
     */
    getDiscount: function() {
        return this.currentDiscount || 0;
    },
    getActiveDiscount: function(itemsTotal = 0) {
        const total = Number(itemsTotal) || 0;
        if (!this.hasSpinThisOrder || total < this.MIN_AMOUNT) {
            return 0;
        }

        return this.currentDiscount || 0;
    },
    // Отримати поточні сегменти
    getSegments: function() {
        return this.segments || [];
    },
    // Встановити сегменти та зберегти в localStorage
    setSegments: function(segments) {
        this.segments = (segments || []).map(function(s){
            return { percent: Number(s.percent)||0, weight: Number(s.weight)||0 };
        });
        try { localStorage.setItem('trendlab_wheel_segments', JSON.stringify(this.segments)); } catch(e){}
        this.renderLabels();
        this.updateWheelState();
    },
    getItemsTotal: function() {
        const summaryItems = document.getElementById('summaryItems');
        if (!summaryItems) return 0;
        const rawTotal = parseFloat(summaryItems.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
        return isNaN(rawTotal) ? 0 : rawTotal;
    },
    observeSummaryChanges: function() {
        const summaryItems = document.getElementById('summaryItems');
        if (!summaryItems || typeof MutationObserver === 'undefined') return;
        if (this.summaryObserver) return;

        this.summaryObserver = new MutationObserver(() => {
            this.updateWheelState(this.getItemsTotal());
        });

        this.summaryObserver.observe(summaryItems, {
            childList: true,
            characterData: true,
            subtree: true
        });
    },
    readWindowState: function() {
        try {
            const marker = this.windowStateKey + '=';
            const name = String(window.name || '');
            const start = name.indexOf(marker);
            if (start === -1) return null;

            let raw = name.slice(start + marker.length);
            const separator = raw.indexOf(';');
            if (separator !== -1) {
                raw = raw.slice(0, separator);
            }

            const parsed = JSON.parse(decodeURIComponent(raw));
            return {
                hasSpinThisOrder: parsed && parsed.hasSpinThisOrder === true,
                currentDiscount: parsed && parsed.currentDiscount !== '' && parsed.currentDiscount !== null
                    ? parseInt(parsed.currentDiscount, 10)
                    : null
            };
        } catch (e) {
            return null;
        }
    },
    saveWindowState: function() {
        try {
            const marker = this.windowStateKey + '=';
            const stateValue = encodeURIComponent(JSON.stringify({
                hasSpinThisOrder: !!this.hasSpinThisOrder,
                currentDiscount: this.currentDiscount === null ? '' : this.currentDiscount
            }));
            const name = String(window.name || '');
            const parts = name
                .split(';')
                .filter(function(part) {
                    return part && part.indexOf(marker) !== 0;
                });

            parts.push(marker + stateValue);
            window.name = parts.join(';');
        } catch (e) {}
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
     * Збереження стану колеса (чи вже крутили це замовлення)
     */
    saveWheelState: function() {
        try {
            localStorage.setItem('trendlab_wheel_spin_used', this.hasSpinThisOrder ? '1' : '0');
            localStorage.setItem('trendlab_wheel_discount', String(this.currentDiscount || ''));
        } catch(e) {}
        this.saveWindowState();
    },
    
    /**
     * Завантаження стану колеса
     */
    loadWheelState: function() {
        const windowState = this.readWindowState();
        if (windowState) {
            this.hasSpinThisOrder = windowState.hasSpinThisOrder;
            this.currentDiscount = windowState.currentDiscount;
            return;
        }

        try {
            const spinUsed = localStorage.getItem('trendlab_wheel_spin_used');
            const discount = localStorage.getItem('trendlab_wheel_discount');
            
            this.hasSpinThisOrder = spinUsed === '1';
            this.currentDiscount = discount ? parseInt(discount) : null;
        } catch(e) {}
    },
    
    /**
     * Перевірити, чи може користувач крутити колесо
     */
    canSpin: function(itemsTotal) {
        return itemsTotal >= this.MIN_AMOUNT && 
               !this.isSpinning && 
               !this.hasSpinThisOrder && 
               (Date.now() - this.lastSpinTime) > this.spinCooldown;
    },
    
    /**
     * Оновити стан кнопки залежно від суми
     */
    updateWheelState: function(itemsTotal = 0) {
        const spinButton = document.getElementById('spinWheelBtn');
        const wheelHint = document.getElementById('wheelHint');
        const total = itemsTotal > 0 ? itemsTotal : this.getItemsTotal();

        this.observeSummaryChanges();
        
        if (!spinButton || !wheelHint) return;
        
        const canSpinNow = this.canSpin(total);
        
        spinButton.disabled = !canSpinNow;
        spinButton.style.opacity = canSpinNow ? '1' : '0.5';
        spinButton.style.cursor = canSpinNow ? 'pointer' : 'not-allowed';
        
        if (total < this.MIN_AMOUNT && total > 0) {
            wheelHint.textContent = this.hasSpinThisOrder && this.currentDiscount
                ? `Ще ${(this.MIN_AMOUNT - total).toFixed(2)} ₴ до відновлення знижки`
                : `Ще ${(this.MIN_AMOUNT - total).toFixed(2)} ₴ до розблокування колеса`;
            wheelHint.style.color = '#d86734';
        } else if (this.hasSpinThisOrder) {
            wheelHint.textContent = this.currentDiscount 
                ? `✨ Ви виграли ${this.currentDiscount}% знижку! Вітаємо!`
                : '⏸️ Вже крутили колесо для цього замовлення';
            wheelHint.style.color = this.currentDiscount ? '#2ecc71' : '#b7522a';
        } else if (total >= this.MIN_AMOUNT) {
            wheelHint.textContent = '🎡 Крутіть колесо 1 раз для знижки!';
            wheelHint.style.color = '#b7522a';
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
        const itemsTotal = this.getItemsTotal();
        
        if (!this.canSpin(itemsTotal)) {
            console.warn('Не можна крутити колесо зараз');
            return;
        }
        
        this.isSpinning = true;
        this.hasSpinThisOrder = true; // Блокуємо подальше кручення
        this.saveWheelState(); // Зберігаємо в localStorage
        this.lastSpinTime = Date.now();
        
        const wheel = document.getElementById('discountWheel');
        const spinButton = document.getElementById('spinWheelBtn');
        
        spinButton.disabled = true;
        
        // Вибір сегмента зважено за вагою
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
            this.saveWheelState(); // Зберігаємо результат
            this.showWinNotification(selectedDiscount, itemsTotal);
            this.updateWheelState(itemsTotal);
            this.isSpinning = false;
            spinButton.disabled = false;

            // Оновлюємо суму в кошику
            this.recalculateTotal();
        }, 4200); // Тривалість анімації трохи довша
    },

    // Намалювати підписи сегментів прямо на колесі (обертаються з колесом)
    renderLabels: function() {
        const wheel = document.getElementById('discountWheel');
        if (!wheel) return;
        
        // Видалимо старі мітки якщо є
        const oldLabels = wheel.querySelectorAll('.wheel-label');
        oldLabels.forEach(n => n.remove());
        
        // Видалимо старий контейнер якщо є (від попередної версії)
        const oldContainer = document.querySelector('.wheel-labels-container');
        if (oldContainer) oldContainer.remove();

        const segments = this.segments || [];
        const count = segments.length || 1;
        const angleStep = 360 / count;
        const wheelRadius = wheel.clientWidth / 2;
        const labelRadius = Math.max(36, wheelRadius * 0.62);
        
        for (let i = 0; i < count; i++) {
            const perc = (segments[i] && segments[i].percent) || 0;
            const label = document.createElement('div');
            label.className = 'wheel-label';
            label.textContent = perc + '%';
            
            // Кут по центру сегмента
            const centerAngle = i * angleStep + angleStep / 2;
            
            // Позиція мітки відносно фактичного розміру колеса
            const radianAngle = (centerAngle - 90) * (Math.PI / 180);
            const x = Math.cos(radianAngle) * labelRadius;
            const y = Math.sin(radianAngle) * labelRadius;
            
            label.style.position = 'absolute';
            label.style.left = '50%';
            label.style.top = '50%';
            // Переміщуємо на позицію та повертаємо текст за кутом сегмента
            label.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${centerAngle}deg)`;
            label.style.transformOrigin = 'center center';
            label.style.pointerEvents = 'none';
            
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
     * перерахування загальну суму з урахуванням знижки
     */
    recalculateTotal: function() {
        // Виклик існуючої функції оновлення суми
        const itemsTotal = this.getItemsTotal();
        
        if (window.updateSummaryWithDiscount) {
            window.updateSummaryWithDiscount(this.getActiveDiscount(itemsTotal));
        }
    },
    
    /**
     * Скинути скидку (для нового замовлення)
     */
    reset: function() {
        this.currentDiscount = null;
        this.isSpinning = false;
        this.hasSpinThisOrder = false; // Дозволяємо крутити знову для нового замовлення
        this.lastSpinTime = 0;
        this.saveWheelState(); // Очищуємо збережене стан
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
