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
    console.log('[Chaos Twist] Setting up input button...');
    
    // Стили для кнопки и выпадающего меню
    const styles = `
        <style id="chaos_twist_styles">
            #chaos_input_container {
                position: relative;
                display: inline-flex;
                margin: 0 3px;
                vertical-align: middle;
            }
            
            .chaos-input-btn {
                cursor: pointer;
                padding: 3px 8px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                transition: all 0.2s ease;
                position: relative;
                background: var(--SmartThemeBlurTintColor, #333);
                border: 1px solid var(--SmartThemeBorderColor, #555);
                color: var(--SmartThemeBodyColor, #eee);
                height: 26px;
                box-sizing: border-box;
            }
            
            .chaos-input-btn:hover {
                filter: brightness(1.2);
            }
            
            .chaos-input-btn.active {
                background: #e67e22;
                border-color: #d35400;
                color: white;
            }
            
            .chaos-input-btn .chaos-icon {
                font-size: 14px;
            }
            
            .chaos-input-btn .chaos-chance-badge {
                background: rgba(255,255,255,0.2);
                padding: 1px 5px;
                border-radius: 3px;
                font-weight: bold;
                min-width: 28px;
                text-align: center;
                font-size: 11px;
            }
            
            .chaos-dropdown {
                display: none;
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                margin-bottom: 8px;
                background: var(--SmartThemeBlurTintColor, #2a2a2a);
                border: 1px solid var(--SmartThemeBorderColor, #555);
                border-radius: 8px;
                padding: 10px;
                z-index: 99999;
                min-width: 200px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            }
            
            .chaos-dropdown.show {
                display: block;
                animation: chaosFadeIn 0.15s ease;
            }
            
            @keyframes chaosFadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(5px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            
            .chaos-dropdown-title {
                font-weight: bold;
                margin-bottom: 8px;
                text-align: center;
                color: var(--SmartThemeBodyColor, #eee);
                font-size: 12px;
            }
            
            .chaos-quick-buttons {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
                justify-content: center;
                margin-bottom: 10px;
            }
            
            .chaos-quick-btn {
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                background: var(--SmartThemeBlurTintColor, #333);
                border: 1px solid var(--SmartThemeBorderColor, #555);
                color: var(--SmartThemeBodyColor, #eee);
                transition: all 0.15s ease;
            }
            
            .chaos-quick-btn:hover {
                filter: brightness(1.3);
            }
            
            .chaos-quick-btn.selected {
                background: #e67e22;
                border-color: #d35400;
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
                cursor: pointer;
            }
            
            .chaos-slider-value {
                min-width: 35px;
                text-align: center;
                font-weight: bold;
                font-size: 12px;
                color: var(--SmartThemeBodyColor, #eee);
            }
        </style>
    `;
    
    // Удаляем старые стили если есть
    $('#chaos_twist_styles').remove();
    $('#chaos_input_container').remove();
    
    // Добавляем стили
    $('head').append(styles);
    
    // HTML кнопки
    const buttonHtml = `
        <div id="chaos_input_container">
            <div class="chaos-input-btn ${settings.isEnabled ? 'active' : ''}" id="chaos_toggle_btn" title="Chaos Events - Click to set chance">
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
    
    // Список селекторов для попытки вставки (в порядке приоритета)
    const insertionPoints = [
        // Рядом с иконками действий в форме отправки
        { selector: '#leftSendForm', method: 'append' },
        { selector: '#send_but_sheld', method: 'before' },
        { selector: '#send_button', method: 'before' },
        { selector: '#mes_send', method: 'before' },
        { selector: '#send_form > div:first-child', method: 'append' },
        { selector: '#send_form', method: 'prepend' },
        { selector: '#form_sheld', method: 'prepend' },
        { selector: '.send_form', method: 'prepend' },
        // Рядом с другими кнопками расширений
        { selector: '#data_bank_wand', method: 'before' },
        { selector: '#option_regenerate', method: 'after' },
        { selector: '#options_button', method: 'before' },
    ];
    
    let inserted = false;
    
    for (const point of insertionPoints) {
        const $target = $(point.selector);
        if ($target.length > 0) {
            console.log(`[Chaos Twist] Found target: ${point.selector}, using method: ${point.method}`);
            
            if (point.method === 'append') {
                $target.append(buttonHtml);
            } else if (point.method === 'prepend') {
                $target.prepend(buttonHtml);
            } else if (point.method === 'before') {
                $target.before(buttonHtml);
            } else if (point.method === 'after') {
                $target.after(buttonHtml);
            }
            
            inserted = true;
            break;
        }
    }
    
    if (!inserted) {
        console.warn('[Chaos Twist] Could not find suitable insertion point! Adding fixed button...');
        // Последняя попытка - добавить фиксированную кнопку
        const fixedButton = `
            <div id="chaos_input_container" style="position: fixed; bottom: 80px; right: 20px; z-index: 99999;">
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
        $('body').append(fixedButton);
        console.log('[Chaos Twist] Added fixed button to body');
    }
    
    // Проверяем что кнопка создалась
    if ($('#chaos_toggle_btn').length) {
        console.log('[Chaos Twist] Button successfully created!');
        setupInputButtonEvents();
    } else {
        console.error('[Chaos Twist] Failed to create button!');
    }
}

/**
 * Настройка событий кнопки
 */
function setupInputButtonEvents() {
    const $btn = $('#chaos_toggle_btn');
    const $dropdown = $('#chaos_dropdown');
    const $badge = $('#chaos_badge');
    
    // Клик по кнопке - показать/скрыть меню
    $btn.off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $dropdown.toggleClass('show');
        updateQuickButtonSelection();
    });
    
    // Быстрые кнопки выбора шанса
    $(document).off('click', '.chaos-quick-btn').on('click', '.chaos-quick-btn', function(e) {
        e.preventDefault();
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
        
        $('#chaos_input_slider').val(chance);
        $('#chaos_slider_value').text(chance + '%');
        
        syncSettingsPanel();
        saveSettingsDebounced();
        updateQuickButtonSelection();
        
        console.log(`[Chaos Twist] Chance set to: ${chance}%`);
    });
    
    // Слайдер
    $(document).off('input', '#chaos_input_slider').on('input', '#chaos_input_slider', function(e) {
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
    $(document).off('click.chaosDropdown').on('click.chaosDropdown', function(e) {
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
        const $exactMatch = $(`.chaos-quick-btn[data-chance="${settings.chance}"]`);
        if ($exactMatch.length) {
            $exactMatch.addClass('selected');
        }
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
    
    if (!$btn.length) return;
    
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
                        <small>💡 Look for the ⚡ button near the input field!</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    extensionContainer.append(html);

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
        
        console.log('[Chaos Twist] Event triggered:', randomEvent);
    }
}

// Запуск
jQuery(async () => {
    console.log('[Chaos Twist] Extension loading...');
    
    setupUI();
    
    // Несколько попыток с разными задержками
    const delays = [500, 1500, 3000, 5000];
    
    for (const delay of delays) {
        setTimeout(() => {
            if (!$('#chaos_toggle_btn').length) {
                console.log(`[Chaos Twist] Attempting button setup after ${delay}ms...`);
                setupInputButton();
            }
        }, delay);
    }
    
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    
    console.log('[Chaos Twist] Extension loaded!');
});
