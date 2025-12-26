import { 
    eventSource, 
    event_types,
    saveSettingsDebounced,
    setExtensionPrompt,
    extension_prompt_types
} from '../../../../script.js';
import { 
    extension_settings,
    getContext
} from '../../../extensions.js';

const extensionName = "chaos_twist";


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
    return `Chaos: ${s.chance}%`;
}


async function showChancePopup() {
    const s = getSettings();
    
    const html = `
        <div class="chaos-popup-content">
            <h3 style="margin-top: 0;">⚡ Chaos Plot Twist</h3>
            
            <div style="margin-bottom: 15px;">
                <label class="checkbox_label" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="chaos_popup_enabled" ${s.isEnabled ? 'checked' : ''}>
                    <span>Enable Chaos Events</span>
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    Trigger Chance: <strong id="chaos_popup_value">${s.chance}%</strong>
                </label>
                <input type="range" id="chaos_popup_slider" min="0" max="100" step="5" value="${s.chance}" 
                       style="width: 100%;">
            </div>
            
            <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 15px;">
                <button class="chaos-preset-btn menu_button" data-value="0">OFF</button>
                <button class="chaos-preset-btn menu_button" data-value="5">5%</button>
                <button class="chaos-preset-btn menu_button" data-value="10">10%</button>
                <button class="chaos-preset-btn menu_button" data-value="25">25%</button>
                <button class="chaos-preset-btn menu_button" data-value="50">50%</button>
                <button class="chaos-preset-btn menu_button" data-value="100">100%</button>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label class="checkbox_label" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="chaos_popup_notify" ${s.showNotifications ? 'checked' : ''}>
                    <span>Show Notifications</span>
                </label>
            </div>
            
            <p style="font-size: 0.85em; opacity: 0.7; margin-bottom: 0;">
                Randomly injects OOC plot twist commands into the prompt.
            </p>
        </div>
    `;
    
    const { Popup, POPUP_TYPE } = SillyTavern.getContext();
    
    const popup = new Popup(html, POPUP_TYPE.TEXT, '', {
        okButton: 'Save',
        cancelButton: 'Cancel',
        wide: false,
        large: false,
    });
    
    popup.show();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const slider = document.getElementById('chaos_popup_slider');
    const valueDisplay = document.getElementById('chaos_popup_value');
    const enabledCheckbox = document.getElementById('chaos_popup_enabled');
    const notifyCheckbox = document.getElementById('chaos_popup_notify');
    
    if (slider) {
        slider.addEventListener('input', () => {
            valueDisplay.textContent = `${slider.value}%`;
        });
    }
    
    document.querySelectorAll('.chaos-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value);
            if (slider) slider.value = value;
            if (valueDisplay) valueDisplay.textContent = `${value}%`;
            if (enabledCheckbox) enabledCheckbox.checked = value > 0;
        });
    });
    
    const result = await popup.promise;
    
    if (result) {
        const s = getSettings();
        s.isEnabled = enabledCheckbox?.checked ?? s.isEnabled;
        s.chance = parseInt(slider?.value ?? s.chance);
        s.showNotifications = notifyCheckbox?.checked ?? s.showNotifications;
        
        if (s.chance === 0) {
            s.isEnabled = false;
        }
        
        saveSettingsDebounced();
        updateMenuButton();
        
        toastr.success(`Chaos: ${s.isEnabled ? s.chance + '%' : 'OFF'}`, 'Settings saved');
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


function addMenuButton() {
    const optionsMenu = document.getElementById('options');
    
    if (!optionsMenu) {
        console.warn('[Chaos Twist] Options menu not found');
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
        <i class="fa-solid fa-bolt"></i>
        <span>${getMenuButtonText()}</span>
    `;
    
    menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const optionsButton = document.getElementById('options_button');
        if (optionsButton) optionsButton.click();
        showChancePopup();
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
                            <strong id="chaos_ext_value">${getSettings().chance}%</strong>
                        </label>
                        <input type="range" id="chaos_ext_slider" min="0" max="100" step="1" 
                               value="${getSettings().chance}" class="neo-range-slider">
                    </div>
                    
                    <div class="flex-container">
                        <label class="checkbox_label">
                            <input type="checkbox" id="chaos_ext_notify">
                            <span>Show Notifications</span>
                        </label>
                    </div>
                    
                    <small class="flex-container">
                        💡 Also available in Options menu (☰)
                    </small>
                </div>
            </div>
        </div>
    `;
    
    $('#extensions_settings').append(settingsHtml);
    
    $('#chaos_ext_enabled').prop('checked', getSettings().isEnabled);
    $('#chaos_ext_notify').prop('checked', getSettings().showNotifications);
    $('#chaos_ext_slider').val(getSettings().chance);
    $('#chaos_ext_value').text(`${getSettings().chance}%`);
    
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
        const value = $(this).val();
        getSettings().chance = parseInt(value);
        $('#chaos_ext_value').text(`${value}%`);
        saveSettingsDebounced();
        updateMenuButton();
    });
}


function onGenerationStarted() {
    const s = getSettings();
    

    setExtensionPrompt(extensionName, '', extension_prompt_types.IN_CHAT, 0);
    
    if (!s.isEnabled) {
        console.log('[Chaos Twist] Disabled, skipping');
        return;
    }

    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`[Chaos Twist] Roll: ${roll}, Need: ${s.chance} or less`);
    
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
            toastr.warning(randomEvent, "⚡ Chaos Event!");
        }
        
        console.log('[Chaos Twist] ✓ Event triggered:', randomEvent);
    } else {
        console.log('[Chaos Twist] No event this time');
    }
}


function onGenerationEnded() {

    setExtensionPrompt(extensionName, '', extension_prompt_types.IN_CHAT, 0);
}


jQuery(async () => {
    console.log('[Chaos Twist] Loading...');
    
    loadSettings();
    setupExtensionPanel();
    
    const tryAddButton = () => {
        if (!addMenuButton()) {
            setTimeout(tryAddButton, 1000);
        }
    };
    setTimeout(tryAddButton, 500);
    

    eventSource.on(event_types.GENERATION_STARTED, onGenerationStarted);
    eventSource.on(event_types.GENERATION_ENDED, onGenerationEnded);
    eventSource.on(event_types.GENERATION_STOPPED, onGenerationEnded);
    
    console.log('[Chaos Twist] Loaded! Events subscribed.');
});
