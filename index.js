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
                    </div>
                </div>
            </div>
        </div>
    `;

    extensionContainer.append(html);

    // Слушатели событий интерфейса
    $('#chaos_enabled').on('change', function() {
        settings.isEnabled = !!$(this).prop('checked');
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
                "Chaos Event Triggered!"
            );
        }
    }
}

// Запуск
$(document).ready(function() {
    setupUI();
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
});
