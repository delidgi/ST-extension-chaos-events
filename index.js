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

let pendingEvent = null;

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

function showChaosNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'chaos-notification';
    notification.innerHTML = `
        <div class="chaos-notification-icon">⚡</div>
        <div class="chaos-notification-content">
            <div class="chaos-notification-title">Chaos Event!</div>
            <div class="chaos-notification-message">${message}</div>
        </div>
        <div class="chaos-notification-close">×</div>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.classList.add('chaos-notification-show');
    });
    
    const close = () => {
        notification.classList.remove('chaos-notification-show');
        notification.classList.add('chaos-notification-hide');
        setTimeout(() => notification.remove(), 300);
    };
    
    notification.querySelector('.chaos-notification-close').addEventListener('click', close);
    setTimeout(close, 8000);
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
    });
}


function onBotMessageReceived() {
    const s = getSettings();
    
    if (pendingEvent) {
        if (s.showNotifications) {
            showChaosNotification(pendingEvent);
        }
        console.log('[Chaos Twist] ✓ Event applied, notification shown:', pendingEvent);
        pendingEvent = null;
    }

    setExtensionPrompt(extensionName, '', extension_prompt_types.IN_CHAT, 0);
    
    if (!s.isEnabled) {
        return;
    }

    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`[Chaos Twist] Roll: ${roll}, Need: ≤${s.chance}`);
    
    if (roll <= s.chance) {
        const randomEvent = s.events[Math.floor(Math.random() * s.events.length)];
        
        setExtensionPrompt(
            extensionName,
            `[OOC: ${randomEvent}]`,
            extension_prompt_types.IN_CHAT,
            0
        );

        pendingEvent = randomEvent;
        
        console.log('[Chaos Twist] ✓ Event set for next message:', randomEvent);
    } else {
        console.log('[Chaos Twist] ✗ No event');
    }
}


jQuery(async () => {
    console.log('[Chaos Twist] Loading...');
    
    loadSettings();
    setupExtensionPanel();
    

    eventSource.on(event_types.MESSAGE_RECEIVED, onBotMessageReceived);
    
    console.log('[Chaos Twist] Ready! Event triggers after bot responds.');
});
