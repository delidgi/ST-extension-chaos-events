import { 
    eventSource, 
    event_types,
    saveSettingsDebounced,
    setExtensionPrompt,
    extension_prompt_types
} from '../../../../script.js';
import { 
    extension_settings
} from '../../../extensions.js';

const extensionName = "chaos_twist";

// Дефолтные настройки
const defaultSettings = {
    isEnabled: true,
    chance: 10,
    showNotifications: true,
    events: [
        "You will NOW introduce an unpredictable PLOT TWIST!",
        "You will **NOW** do something **UNPREDICTABLE** that leads to ultimate **CHAOS** and **DRAMA**.",
        "A hidden secret is suddenly revealed!",
        "Something goes terribly wrong in an unexpected way!"
    ]
};

function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = structuredClone(defaultSettings);
    }
    
    for (const key in defaultSettings) {
        if (extension_settings[extensionName][key] === undefined) {
            extension_settings[extensionName][key] = defaultSettings[key];
        }
    }
}

function getSettings() {
    return extension_settings[extensionName];
}

function getMenuButtonText() {
    const s = getSettings();
    if (!s.isEnabled) {
        return '⚡ Chaos: OFF';
    }
    return `⚡ Chaos: ${s.chance}%`;
}

function updateMenuButton() {
    const menuItem = document.getElementById('chaos_menu_item');
    if (menuItem) {
        const span = menuItem.querySelector('span');
        if (span) {
            span.textContent = getMenuButtonText();
        }
    }
}

function syncExtensionPanel() {
    const s = getSettings();
    const enabled = document.getElementById('chaos_ext_enabled');
    const notify = document.getElementById('chaos_ext_notify');
    const slider = document.getElementById('chaos_ext_slider');
    const value = document.getElementById('chaos_ext_value');
    
    if (enabled) enabled.checked = s.isEnabled;
    if (notify) notify.checked = s.showNotifications;
    if (slider) slider.value = s.chance;
    if (value) value.textContent = `${s.chance}%`;
}

/**
 * Показать popup настроек - работает и из бургер меню и из панели
 */
function showSettingsPopup() {
    const s = getSettings();
    
    // Удаляем старый popup если есть
    document.getElementById('chaos_overlay')?.remove();
    document.getElementById('chaos_popup')?.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'chaos_overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 99999;';
    
    const popup = document.createElement('div');
    popup.id = 'chaos_popup';
    popup.style.cssText = `
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        background: var(--SmartThemeBlurTintColor, #1e1e1e); 
        border: 1px solid var(--SmartThemeBorderColor, #444); 
        border-radius: 10px; 
        z-index: 100000; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        padding: 20px;
        min-width: 300px;
        color: var(--SmartThemeBodyColor, #eee);
    `;
    
    popup.innerHTML = `
        <h3 style="margin: 0 0 15px 0;">⚡ Chaos Plot Twist</h3>
        
        <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="chaos_pop_enabled" ${s.isEnabled ? 'checked' : ''}>
                <span>Enable Chaos Events</span>
            </label>
        </div>
        
        <div style="margin-bottom: 15px;">
            <div style="margin-bottom: 5px;">
                Trigger Chance: <strong id="chaos_pop_value">${s.chance}%</strong>
            </div>
            <input type="range" id="chaos_pop_slider" min="0" max="100" step="5" value="${s.chance}" style="width: 100%;">
        </div>
        
        <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 15px;">
            <button class="menu_button chaos_preset" data-val="0">OFF</button>
            <button class="menu_button chaos_preset" data-val="5">5%</button>
            <button class="menu_button chaos_preset" data-val="10">10%</button>
            <button class="menu_button chaos_preset" data-val="25">25%</button>
            <button class="menu_button chaos_preset" data-val="50">50%</button>
            <button class="menu_button chaos_preset" data-val="100">100%</button>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="chaos_pop_notify" ${s.showNotifications ? 'checked' : ''}>
                <span>Show Notifications</span>
            </label>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="menu_button" id="chaos_pop_cancel">Cancel</button>
            <button class="menu_button" id="chaos_pop_save" style="background: #e67e22; color: white;">Save</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // Слайдер
    const slider = document.getElementById('chaos_pop_slider');
    const valueDisplay = document.getElementById('chaos_pop_value');
    const enabledCb = document.getElementById('chaos_pop_enabled');
    
    slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value + '%';
    });
    
    // Пресеты
    popup.querySelectorAll('.chaos_preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.val);
            slider.value = val;
            valueDisplay.textContent = val + '%';
            if (val === 0) enabledCb.checked = false;
        });
    });
    
    // Закрыть
    const closePopup = () => {
        overlay.remove();
        popup.remove();
    };
    
    overlay.addEventListener('click', closePopup);
    document.getElementById('chaos_pop_cancel').addEventListener('click', closePopup);
    
    // Сохранить
    document.getElementById('chaos_pop_save').addEventListener('click', () => {
        const s = getSettings();
        s.chance = parseInt(slider.value);
        s.isEnabled = s.chance > 0 ? enabledCb.checked : false;
        s.showNotifications = document.getElementById('chaos_pop_notify').checked;
        
        saveSettingsDebounced();
        updateMenuButton();
        syncExtensionPanel();
        
        toastr.success(`Chaos: ${s.isEnabled ? s.chance + '%' : 'OFF'}`, 'Saved!');
        closePopup();
    });
}

/**
 * Добавить кнопку в бургер-меню
 */
function addMenuButton() {
    const optionsMenu = document.getElementById('options');
    
    if (!optionsMenu) {
        return false;
    }
    
    if (document.getElementById('chaos_menu_item')) {
        return true;
    }
    
    const menuItem = document.createElement('a');
    menuItem.id = 'chaos_menu_item';
    menuItem.classList.add('list-group-item', 'flex-container', 'flexGap5');
    menuItem.style.cursor = 'pointer';
    menuItem.innerHTML = `
        <i class="fa-solid fa-bolt" style="color: #e67e22;"></i>
        <span>${getMenuButtonText()}</span>
    `;
    
    // Важно: используем onclick напрямую
    menuItem.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Закрываем бургер-меню
        const optionsBtn = document.getElementById('options_button');
        if (optionsBtn) {
            optionsBtn.click();
        }
        
        // Показываем popup с небольшой задержкой
        setTimeout(showSettingsPopup, 150);
        
        return false;
    };
    
    const firstItem = optionsMenu.querySelector('.list-group-item');
    if (firstItem) {
        optionsMenu.insertBefore(menuItem, firstItem);
    } else {
        optionsMenu.appendChild(menuItem);
    }
    
    console.log('[Chaos Twist] Menu button added');
    return true;
}

/**
 * Панель расширений
 */
function setupExtensionPanel() {
    const settingsHtml = `
        <div class="chaos_twist_settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Chaos Plot Twist</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="flex-container">
                        <label class="checkbox_label">
                            <input type="checkbox" id="chaos_ext_enabled">
                            <span>Enable Chaos Events</span>
                        </label>
                    </div>
                    
                    <div class="flex-container flexFlowColumn">
                        <label>
                            <span>Trigger Chance: </span>
                            <strong id="chaos_ext_value">10%</strong>
                        </label>
                        <input type="range" id="chaos_ext_slider" min="0" max="100" step="1" class="neo-range-slider">
                    </div>
                    
                    <div class="flex-container">
                        <label class="checkbox_label">
                            <input type="checkbox" id="chaos_ext_notify">
                            <span>Show Notifications</span>
                        </label>
                    </div>
                    
                    <small style="opacity: 0.7;">
                        💡 Event triggers after bot responds
                    </small>
                </div>
            </div>
        </div>
    `;
    
    $('#extensions_settings').append(settingsHtml);
    
    syncExtensionPanel();
    
    $('#chaos_ext_enabled').on('change', function() {
        getSettings().isEnabled = this.checked;
        saveSettingsDebounced();
        updateMenuButton();
    });
    
    $('#chaos_ext_notify').on('change', function() {
        getSettings().showNotifications = this.checked;
        saveSettingsDebounced();
    });
    
    $('#chaos_ext_slider').on('input', function() {
        const value = parseInt(this.value);
        getSettings().chance = value;
        document.getElementById('chaos_ext_value').textContent = `${value}%`;
        saveSettingsDebounced();
        updateMenuButton();
    });
}

/**
 * Срабатывает ПОСЛЕ того как бот ответил - перед твоим следующим сообщением
 */
function onBotMessageReceived() {
    const s = getSettings();
    
    // Очищаем предыдущий ивент
    setExtensionPrompt(extensionName, '', extension_prompt_types.IN_CHAT, 0);
    
    if (!s.isEnabled) {
        return;
    }

    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`[Chaos Twist] Roll: ${roll}, Need: ≤${s.chance}`);
    
    if (roll <= s.chance) {
        const randomEvent = s.events[Math.floor(Math.random() * s.events.length)];
        
        // Устанавливаем промпт который будет применён к следующему сообщению
        setExtensionPrompt(
            extensionName,
            `[OOC: ${randomEvent}]`,
            extension_prompt_types.IN_CHAT,
            0
        );

        if (s.showNotifications) {
            toastr.warning(randomEvent, "⚡ Chaos Event!", { timeOut: 8000 });
        }
        
        console.log('[Chaos Twist] ✓ Event set for next message:', randomEvent);
    } else {
        console.log('[Chaos Twist] ✗ No event');
    }
}

// Инициализация
jQuery(async () => {
    console.log('[Chaos Twist] Loading...');
    
    loadSettings();
    setupExtensionPanel();
    
    // Добавляем кнопку в бургер-меню
    const tryAddButton = () => {
        if (!addMenuButton()) {
            setTimeout(tryAddButton, 1000);
        }
    };
    setTimeout(tryAddButton, 500);
    
    // MESSAGE_RECEIVED - когда бот закончил отвечать
    eventSource.on(event_types.MESSAGE_RECEIVED, onBotMessageReceived);
    
    console.log('[Chaos Twist] Ready! Event triggers after bot responds.');
});
