import { 
    eventSource, 
    event_types,
    saveSettingsDebounced
} from '../../../../script.js';
import { 
    extension_settings,
    getContext
} from '../../../extensions.js';

const extensionName = "chaos_twist";
const extensionContainer = $('#extensions_settings');

// Дефолтные настройки
const defaultSettings = {
    isEnabled: true,
    chance: 10,
    showNotifications: true,
    events: [
        "[OOC: You will NOW introduce an unpredictable PLOT TWIST!]",
        "[OOC: You will **NOW** do something **UNPREDICTABLE** that leads to ultimate **CHAOS** and **DRAMA**.]",
        "[OOC: A sudden environmental disaster occurs right now!]",
        "[OOC: An unexpected NPC enters the scene with shocking news!]"
    ]
};

// Инициализация настроек в объекте расширений ST
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = defaultSettings;
}
const settings = extension_settings[extensionName];

/**
 * Создание кнопки в области ввода сообщения
 */
function setupInputButton() {
    // Стили для кнопки и выпадающего меню
    const styles = `
        <style id="chaos_twist_styles">
            .chaos-input-btn {
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                transition: all 0.2s ease;
                position: relative;
                background: var(--SmartThemeBlurTintColor);
                border: 1px solid var(--SmartThemeBorderColor);
                color: var(--SmartThemeBodyColor);
            }
            
            .chaos-input-btn:hover {
                filter: brightness(1.2);
            }
            
            .chaos-input-btn.active {
                background: var(--SmartThemeQuoteColor);
                color: white;
            }
            
            .chaos-input-btn .chaos-icon {
                font-size: 14px;
            }
            
            .chaos-input-btn .chaos-chance-badge {
                background: rgba(255,255,255,0.2);
                padding: 2px 6px;
                border-radius: 3px;
                font-weight: bold;
                min-width: 32px;
                text-align: center;
            }
            
            .chaos-dropdown {
                display: none;
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                margin-bottom: 8px;
                background: var(--SmartThemeBlurTintColor);
                border: 1px solid var(--SmartThemeBorderColor);
                border-radius: 8px;
                padding: 10px;
                z-index: 9999;
                min-width: 180px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            
            .chaos-dropdown.show {
                display: block;
                animation: fadeIn 0.15s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(5px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            .chaos-dropdown-title {
                font-weight: bold;
                margin-bottom: 8px;
                text-align: center;
                color: var(--SmartThemeBodyColor);
                font-size: 12px;
            }
            
            .chaos-quick-buttons {
                display: flex;
                gap: 5px;
                flex-wrap: wrap;
                justify-content: center;
                margin-bottom: 10px;
            }
            
            .chaos-quick-btn {
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
                background: var(--SmartThemeBlurTintColor);
                border: 1px solid var(--SmartThemeBorderColor);
                color: var(--SmartThemeBodyColor);
                transition: all 0.15s ease;
            }
            
            .chaos-quick-btn:hover {
                filter: brightness(1.3);
            }
            
            .chaos-quick-btn.selected {
                background: var(--SmartThemeQuoteColor);
                color: white;
            }
            
            .chaos-slider-container {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .chaos-slider-container input[type="range"] {
                flex: 1;
                height: 6px;
            }
            
            .chaos-slider-value {
                min-width: 35px;
                text-align: center;
                font-weight: bold;
                font-size: 12px;
            }
            
            .chaos-toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid var(--SmartThemeBorderColor);
                font-size: 11px;
            }
        </style>
    `;
    
    // Добавляем стили
    $('head').append(styles);
    
    // HTML кнопки
    const buttonHtml = `
        <div id="chaos_input_container" style="position: relative; display: inline-flex;">
            <div class="chaos-input-btn ${settings.isEnabled ? 'active' : ''}" id="chaos_toggle_btn" title="Chaos Events">
                <span class="chaos-icon">⚡</span>
                <span class="chaos-chance-badge" id="chaos_badge">${settings.isEnabled ? settings.chance + '%' : 'OFF'}</span>
            </div>
            <div class="chaos-dropdown" id="chaos_dropdown">
                <div class="chaos-dropdown-title">🎲 Chaos Chance</div>
                <div class="chaos-quick-buttons">
                    <div class="chaos-quick-btn" data-chance="0">OFF</div>
                    <div class="chaos-quick-btn" data-chance="5">5%</div>
                    <div class="chaos-quick-btn" data-chance="10">10%</div>
                    <div class="chaos-quick-btn" data-chance="25">25%</div>
                    <div class="chaos-quick-btn" data-chance="50">50%</div>
                    <div class="chaos-quick-btn" data-chance="100">100%</div>
                </div>
                <div class="chaos-slider-container">
                    <input type="range" id="chaos_input_slider" min="0" max="100" step="1" value="${settings.chance}">
                    <span class="chaos-slider-value" id="chaos_slider_value">${settings.chance}%</span>
                </div>
            </div>
        </div>
    `;
    
    // Находим панель с кнопками ввода и добавляем нашу кнопку
    // Пробуем разные селекторы для совместимости
    const targetSelectors = [
        '#leftSendForm',           // Левая часть формы отправки
        '#send_form .send_form_inner', 
        '#send_form',
        '.send_form_inner',
        '#data_bank_wand'          // Рядом с другими кнопками расширений
    ];
    
    let inserted = false;
    
    // Пробуем вставить рядом с кнопкой расширений или в начало формы
    const extensionsButton = $('#data_bank_wand, #extensionsMenuButton, .drawer-icon.fa-cubes').first();
    if (extensionsButton.length) {
        extensionsButton.before(buttonHtml);
        inserted = true;
    }
    
    // Если не нашли кнопку расширений, пробуем другие места
    if (!inserted) {
        for (const selector of targetSelectors) {
            const target = $(selector);
            if (target.length) {
                target.prepend(buttonHtml);
                inserted = true;
                break;
            }
        }
    }
    
    // Обработчики событий
    setupInputButtonEvents();
}

/**
 * Настройка событий кнопки
 */
function setupInputButtonEvents() {
    const $btn = $('#chaos_toggle_btn');
    const $dropdown = $('#chaos_dropdown');
    const $badge = $('#chaos_badge');
    
    // Клик по кнопке - показать/скрыть меню
    $btn.on('click', function(e) {
        e.stopPropagation();
        $dropdown.toggleClass('show');
        updateQuickButtonSelection();
    });
    
    // Быстрые кнопки выбора шанса
    $('.chaos-quick-btn').on('click', function(e) {
        e.stopPropagation();
        const chance = parseInt($(this).data('chance'));
        
        if (chance === 0) {
            settings.isEnabled = false;
            $btn.removeClass('active');
            $badge.text('OFF');
        } else {
            settings.isEnabled = true;
            settings.chance = chance;
            $btn.addClass('active');
            $badge.text(chance + '%');
        }
        
        // Обновляем слайдер
        $('#chaos_input_slider').val(chance);
        $('#chaos_slider_value').text(chance + '%');
        
        // Синхронизируем с панелью настроек
        syncSettingsPanel();
        saveSettingsDebounced();
        
        updateQuickButtonSelection();
    });
    
    // Слайдер
    $('#chaos_input_slider').on('input', function(e) {
        e.stopPropagation();
        const value = parseInt($(this).val());
        
        if (value === 0) {
            settings.isEnabled = false;
            $btn.removeClass('active');
            $badge.text('OFF');
        } else {
            settings.isEnabled = true;
            settings.chance = value;
            $btn.addClass('active');
            $badge.text(value + '%');
        }
        
        $('#chaos_slider_value').text(value + '%');
        
        syncSettingsPanel();
        saveSettingsDebounced();
        updateQuickButtonSelection();
    });
    
    // Закрытие при клике вне меню
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#chaos_input_container').length) {
            $dropdown.removeClass('show');
        }
    });
}

/**
 * Обновление выделения быстрых кнопок
 */
function updateQuickButtonSelection() {
    $('.chaos-quick-btn').removeClass('selected');
    
    if (!settings.isEnabled) {
        $('.chaos-quick-btn[data-chance="0"]').addClass('selected');
    } else {
        $(`.chaos-quick-btn[data-chance="${settings.chance}"]`).addClass('selected');
    }
}

/**
 * Синхронизация с панелью настроек расширений
 */
function syncSettingsPanel() {
    $('#chaos_enabled').prop('checked', settings.isEnabled);
    $('#chaos_chance').val(settings.chance);
    $('#chaos_chance_display').text(`${settings.chance}%`);
}

/**
 * Синхронизация кнопки с панелью настроек
 */
function syncInputButton() {
    const $btn = $('#chaos_toggle_btn');
    const $badge = $('#chaos_badge');
    
    if (settings.isEnabled) {
        $btn.addClass('active');
        $badge.text(settings.chance + '%');
    } else {
        $btn.removeClass('active');
        $badge.text('OFF');
    }
    
    $('#chaos_input_slider').val(settings.chance);
    $('#chaos_slider_value').text(settings.chance + '%');
}

/**
 * Создание UI в панели расширений
 */
function setupUI() {
    // Создаем основной контейнер расширения
    const html = `
        <div class="chaos_twist_settings extension_container">
            <div class="inline-drawer">
                <div class="inline-drawer-header">
                    <div class="inline-drawer-icon fa-solid fa-bolt"></div>
                    <div class="inline-drawer-title">Chaos Plot Twist</div>
                    <div class="inline-drawer-icon fa-solid fa-chevron-down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="setup_item">
                        <label class="checkbox_label" for="chaos_enabled">
                            <input type="checkbox" id="chaos_enabled" ${settings.isEnabled ? 'checked' : ''}>
                            Enable Chaos Events
                        </label>
                    </div>

                    <div class="setup_item">
                        <div class="flex-container">
                            <span>Trigger Chance:</span>
                            <span id="chaos_chance_display">${settings.chance}%</span>
                        </div>
                        <input type="range" id="chaos_chance" min="1" max="100" step="1" value="${settings.chance}">
                    </div>

                    <div class="setup_item">
                        <label class="checkbox_label" for="chaos_notify">
                            <input type="checkbox" id="chaos_notify" ${settings.showNotifications ? 'checked' : ''}>
                            Show Notifications
                        </label>
                    </div>
                    
                    <div class="setup_item">
                        <small>Injects unpredictable OOC commands into the prompt.</small>
                        <br>
                        <small>💡 Use the ⚡ button near input field for quick access!</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    extensionContainer.append(html);

    // Слушатели событий интерфейса
    $('#chaos_enabled').on('change', function() {
        settings.isEnabled = !!$(this).prop('checked');
        syncInputButton();
        saveSettingsDebounced();
    });

    $('#chaos_notify').on('change', function() {
        settings.showNotifications = !!$(this).prop('checked');
        saveSettingsDebounced();
    });

    $('#chaos_chance').on('input', function() {
        const value = $(this).val();
        settings.chance = parseInt(value);
        $('#chaos_chance_display').text(`${value}%`);
        syncInputButton();
        saveSettingsDebounced();
    });
}

/**
 * Логика обработки промпта
 */
async function onPromptReady(payload) {
    if (!settings.isEnabled) return;

    const roll = Math.floor(Math.random() * 100) + 1;
    
    if (roll <= settings.chance) {
        const randomEvent = settings.events[Math.floor(Math.random() * settings.events.length)];
        
        payload.push({
            role: 'system',
            content: `[IMPORTANT INSTRUCTION: ${randomEvent}]`
        });

        if (settings.showNotifications) {
            toastr.warning(
                randomEvent.replace('[OOC: ', '').replace(']', ''), 
                "⚡ Chaos Event Triggered!"
            );
        }
    }
}

// Запуск
$(document).ready(function() {
    setupUI();
    
    // Небольшая задержка для загрузки интерфейса ST
    setTimeout(() => {
        setupInputButton();
    }, 1000);
    
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
});
