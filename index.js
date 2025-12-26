import { 
    eventSource, 
    event_types,
    saveSettingsDebounced
} from '../../../../script.js';
import { 
    getContext,
    extension_settings
} from '../../../extensions.js';


const extensionName = "chaos_twist";
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


if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = defaultSettings;
}
const settings = extension_settings[extensionName];


function createSettingsUI() {
    const settingsHtml = `
        <div class="chaos-twist-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-header">
                    <b>Chaos Plot Twist</b>
                </div>
                <div class="inline-drawer-content">
                    <div class="setup_item">
                        <label class="checkbox_label">
                            <input type="checkbox" id="chaos_twist_enabled" ${settings.isEnabled ? 'checked' : ''}>
                            Enable Chaos Events
                        </label>
                    </div>
                    
                    <div class="setup_item">
                        <label for="chaos_twist_chance">Trigger Chance: <span id="chaos_twist_chance_val">${settings.chance}</span>%</label>
                        <input type="range" id="chaos_twist_chance" min="1" max="100" step="1" value="${settings.chance}">
                    </div>

                    <div class="setup_item">
                        <label class="checkbox_label">
                            <input type="checkbox" id="chaos_twist_notify" ${settings.showNotifications ? 'checked' : ''}>
                            Show Notifications (Toasts)
                        </label>
                    </div>
                    
                    <small>Events are injected as system OOC notes during generation.</small>
                </div>
            </div>
        </div>
    `;

    
    $('#extensions_settings').append(settingsHtml);

    
    $('#chaos_twist_enabled').on('change', function() {
        settings.isEnabled = !!$(this).prop('checked');
        saveSettingsDebounced();
    });

    $('#chaos_twist_notify').on('change', function() {
        settings.showNotifications = !!$(this).prop('checked');
        saveSettingsDebounced();
    });

    $('#chaos_twist_chance').on('input', function() {
        const val = $(this).val();
        settings.chance = parseInt(val);
        $('#chaos_twist_chance_val').text(val);
        saveSettingsDebounced();
    });
}


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
                "Chaos Triggered!", 
                { timeOut: 5000, progressBar: true }
            );
        }
        
        console.log('Chaos Twist active:', randomEvent);
    }
}

(function init() {
    createSettingsUI();
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    console.log("Chaos Twist extension initialized.");
})();
