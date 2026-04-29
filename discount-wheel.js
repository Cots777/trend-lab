// 🎡 Функционал колеса скидок для TrendLab
// Минимальная сумма для использования: 2000 грн

const DiscountWheel = {
    MIN_AMOUNT: 2000,
    
    // Варианты скидок (%)
    discounts: [5, 10, 15, 20, 25, 10, 30, 15],
    
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
        this.updateWheelState();
    },
    
    /**
     * Получить скидку на основе суммы товаров
     */
    getDiscount: function() {
        return this.currentDiscount || 0;
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
        
        // Генеруємо випадкову скидку
        const randomIndex = Math.floor(Math.random() * this.discounts.length);
        const selectedDiscount = this.discounts[randomIndex];
        
        // Розраховуємо кут для обертання (кожен сегмент ~ 45 градусів)
        const segmentAngle = 360 / this.discounts.length;
        const baseRotation = randomIndex * segmentAngle;
        const extraSpins = 3; // 3 повні обороти
        const totalRotation = extraSpins * 360 + baseRotation;
        
        // Анімація обертання
        wheel.style.transform = `rotate(${totalRotation}deg)`;
        
        // Після анімації показуємо результат
        setTimeout(() => {
            this.currentDiscount = selectedDiscount;
            this.showWinNotification(selectedDiscount, itemsTotal);
            this.updateWheelState(itemsTotal);
            this.isSpinning = false;
            spinButton.disabled = false;
            
            // Оновлюємо суму в кошику
            this.recalculateTotal();
        }, 2000); // Тривалість анімації
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
