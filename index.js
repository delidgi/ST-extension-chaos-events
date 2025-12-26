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

// Инициализация настроек
function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = structuredClone(defaultSettings);
    }
    
    for (const key in defaultSettings) {
        if (extension_settings[extensionName][key] === undefined) {
            extension_settings[extensionName][key] = defaultSettings[key];
        }
    }
    
    console.log('[Chaos Twist] Settings loaded:', extension_settings[extensionName]);
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

/**
 * Показать popup для выбора шанса - полностью переписан
 */
async function showChancePopup() {
    const s = getSettings();
    
    // Используем callPopup который проще и надёжнее
    const popupHtml = `
        <div style="padding: 10px;">
            <h3 style="margin-top: 0; margin-bottom: 15px;">⚡ Chaos Plot Twist</h3>
            
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="chaos_popup_enabled" ${s.isEnabled ? 'checked' : ''}>
                    <span>Enable Chaos Events</span>
                </label>
            </div>
            
            <div style="margin-bottom: 12px;">
                <div style="margin-bottom: 5px;">
                    Trigger Chance: <strong id="chaos_popup_value">${s.chance}%</strong>
                </div>
                <input type="range" id="chaos_popup_slider" min="0" max="100" step="5" value="${s.chance}" style="width: 100%;">
            </div>
            
            <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px;">
                <button class="menu_button" onclick="document.getElementById('chaos_popup_slider').value=0; document.getElementById('chaos_popup_value').textContent='0%'; document.getElementById('chaos_popup_enabled').checked=false;">OFF</button>
                <button class="menu_button" onclick="document.getElementById('chaos_popup_slider').value=5; document.getElementById('chaos_popup_value').textContent='5%';">5%</button>
                <button class="menu_button" onclick="document.getElementById('chaos_popup_slider').value=10; document.getElementById('chaos_popup_value').textContent='10%';">10%</button>
                <button class="menu_button" onclick="document.getElementById('chaos_popup_slider').value=25; document.getElementById('chaos_popup_value').textContent='25%';">25%</button>
                <button class="menu_button" onclick="document.getElementById('chaos_popup_slider').value=50; document.getElementById('chaos_popup_value').textContent='50%';">50%</button>
                <button class="menu_button" onclick="document.getElementById('chaos_popup_slider').value=100; document.getElementById('chaos_popup_value').textContent='100%';">100%</button>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="chaos_popup_notify" ${s.showNotifications ? 'checked' : ''}>
                    <span>Show Notifications</span>
                </label>
            </div>
            
            <p style="font-size: 0.85em; opacity: 0.7; margin: 0;">
                Triggers when you send a message.
            </p>
        </div>
    `;
    
    // Добавляем обработчик для слайдера
    setTimeout(() => {
        const slider = document.getElementById('chaos_popup_slider');
        const display = document.getElementById('chaos_popup_value');
        if (slider && display) {
            slider.oninput = () => {
                display.textContent = slider.value + '%';
            };
        }
    }, 50);
    
    const result = await callPopup(popupHtml, 'confirm');
    
    if (result) {
        const slider = document.getElementById('chaos_popup_slider');
        const enabledCb = document.getElementById('chaos_popup_enabled');
        const notifyCb = document.getElementById('chaos_popup_notify');
        
        const newChance = slider ? parseInt(slider.value) : s.chance;
        const newEnabled = enabledCb ? enabledCb.checked : s.isEnabled;
        const newNotify = notifyCb ? notifyCb.checked : s.showNotifications;
        
        s.chance = newChance;
        s.isEnabled = newChance > 0 ? newEnabled : false;
        s.showNotifications = newNotify;
        
        saveSettingsDebounced();
        updateMenuButton();
        syncExtensionPanel();
        
        toastr.success(`Chaos: ${s.isEnabled ? s.chance + '%' : 'OFF'}`, 'Saved!');
        console.log('[Chaos Twist] Saved:', s);
    }
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
    $('#chaos_ext_enabled').prop('checked', s.isEnabled);
    $('#chaos_ext_notify').prop('checked', s.showNotifications);
    $('#chaos_ext_slider').val(s.chance);
    $('#chaos_ext_value').text(`${s.chance}%`);
}

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
    menuItem.title = 'Configure Chaos Plot Twist';
    menuItem.innerHTML = `
        <i class="fa-solid fa-bolt" style="color: #e67e22;"></i>
        <span>${getMenuButtonText()}</span>
    `;
    
    menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Закрываем меню
        document.getElementById('options_button')?.click();
        // Показываем popup
        setTimeout(() => showChancePopup(), 100);
    });
    
    const firstItem = optionsMenu.querySelector('.list-group-item');
    if (firstItem) {
        optionsMenu.insertBefore(menuItem, firstItem);
    } else {
        optionsMenu.appendChild(menuItem);
    }
    
    console.log('[Chaos Twist] Menu button added');
    return true;
}

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
                    
                    <small class="flex-container">
                        💡 Also in Options menu (☰)
                    </small>
                </div>
            </div>
        </div>
    `;
    
    $('#extensions_settings').append(settingsHtml);
    
    // Загружаем значения
    syncExtensionPanel();
    
    // Обработчики
    $('#chaos_ext_enabled').on('change', function() {
        getSettings().isEnabled = $(this).prop('checked');
        saveSettingsDebounced();
        updateMenuButton();
    });
    
    $('#chaos_ext_notify').on('change', function() {
        getSettings().showNotifications = $(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#chaos_ext_slider').on('input', function() {
        const value = parseInt($(this).val());
        getSettings().chance = value;
        $('#chaos_ext_value').text(`${value}%`);
        saveSettingsDebounced();
        updateMenuButton();
    });
}

/**
 * Срабатывает когда ПОЛЬЗОВАТЕЛЬ отправляет сообщение
 */
function onUserMessageSent() {
    const s = getSettings();
    
    // Очищаем предыдущий промпт
    setExtensionPrompt(extensionName, '', extension_prompt_types.IN_CHAT, 0);
    
    if (!s.isEnabled) {
        return;
    }

    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`[Chaos Twist] Roll: ${roll}, Need: ≤${s.chance}`);
    
    if (roll <= s.chance) {
        const randomEvent = s.events[Math.floor(Math.random() * s.events.length)];
        const injectionText = `[OOC: ${randomEvent}]`;
        
        setExtensionPrompt(
            extensionName,
            injectionText,
            extension_prompt_types.IN_CHAT,
            0
        );

        if (s.showNotifications) {
            toastr.warning(randomEvent, "⚡ Chaos!");
        }
        
        console.log('[Chaos Twist] ✓ Triggered:', randomEvent);
    } else {
        console.log('[Chaos Twist] ✗ No event');
    }
}

/**
 * Очистка после генерации
 */
function onGenerationEnded() {
    setExtensionPrompt(extensionName, '', extension_prompt_types.IN_CHAT, 0);
}

// Инициализация
jQuery(async () => {
    console.log('[Chaos Twist] Loading...');
    
    loadSettings();
    setupExtensionPanel();
    
    // Добавляем кнопку в меню
    const tryAddButton = () => {
        if (!addMenuButton()) {
            setTimeout(tryAddButton, 1000);
        }
    };
    setTimeout(tryAddButton, 500);
    
    // MESSAGE_SENT - когда пользователь отправил сообщение
    eventSource.on(event_types.MESSAGE_SENT, onUserMessageSent);
    
    // Очистка после генерации
    eventSource.on(event_types.GENERATION_ENDED, onGenerationEnded);
    eventSource.on(event_types.GENERATION_STOPPED, onGenerationEnded);
    
    console.log('[Chaos Twist] Ready!');
});
