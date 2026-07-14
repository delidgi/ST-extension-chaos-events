import {
    eventSource,
    event_types,
    saveSettingsDebounced,
    setExtensionPrompt,
    extension_prompt_types,
} from '../../../../script.js';
import {
    extension_settings,
} from '../../../extensions.js';

const extensionName = "chaos_twist";
const intimateSceneGuard = "DO NOT APPLY THE EVENT IF THE SCENE IS INTIMATE OR ABOUT TO BECOME INTIMATE.";

let pendingNotification = null;

const defaultCategories = {
    plot_twist: {
        label: "Plot Twist",
        icon: "fa-solid fa-masks-theater",
        enabled: true,
        events: [
            "You will NOW introduce an unpredictable PLOT TWIST!",
        ],
    },
    chaos_drama: {
        label: "Chaos & Drama",
        icon: "fa-solid fa-bolt",
        enabled: true,
        events: [
            "You will **NOW** do something **UNPREDICTABLE** that leads to ultimate **CHAOS** and **DRAMA**.",
        ],
    },
    secret: {
        label: "Hidden Secret",
        icon: "fa-solid fa-lock",
        enabled: true,
        events: [
            "A hidden secret is suddenly revealed!",
        ],
    },
    wrong: {
        label: "Something Goes Wrong",
        icon: "fa-solid fa-triangle-exclamation",
        enabled: true,
        events: [
            "Something goes terribly wrong in an unexpected way!",
        ],
    },
    npc: {
        label: "NPC Appears",
        icon: "fa-solid fa-user-plus",
        enabled: true,
        events: [
            "An unexpected NPC suddenly appears and interacts with the scene in a meaningful way!",
        ],
    },
    custom: {
        label: "Custom",
        icon: "fa-solid fa-wand-magic-sparkles",
        enabled: true,
        events: [],
    },
};

const defaultSettings = {
    isEnabled: true,
    chance: 10,
    showNotifications: true,
    avoidIntimateScenes: false,
    categories: structuredClone(defaultCategories),
    events: null,
};

function loadSettings() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = structuredClone(defaultSettings);
    }

    const s = extension_settings[extensionName];

    for (const key in defaultSettings) {
        if (s[key] === undefined) {
            s[key] = structuredClone(defaultSettings[key]);
        }
    }

    if (Array.isArray(s.events) && s.events.length > 0) {
        if (!s.categories || typeof s.categories !== 'object') {
            s.categories = structuredClone(defaultCategories);
        }
        const defaultPhrases = new Set();
        for (const cat of Object.values(defaultCategories)) {
            for (const ev of cat.events) defaultPhrases.add(ev);
        }
        const customEvents = s.events.filter(ev => !defaultPhrases.has(ev));
        if (customEvents.length > 0) {
            if (!s.categories.custom) s.categories.custom = structuredClone(defaultCategories.custom);
            s.categories.custom.events.push(...customEvents);
        }
    }

    if (!s.categories || typeof s.categories !== 'object') {
        s.categories = structuredClone(defaultCategories);
    }
    for (const key in defaultCategories) {
        if (!s.categories[key]) {
            s.categories[key] = structuredClone(defaultCategories[key]);
        } else {
            const cat = s.categories[key];
            const def = defaultCategories[key];
            if (cat.label === undefined) cat.label = def.label;
            if (cat.icon === undefined || !cat.icon.startsWith('fa-')) cat.icon = def.icon;
            if (cat.enabled === undefined) cat.enabled = def.enabled;
            if (!Array.isArray(cat.events)) cat.events = structuredClone(def.events);
        }
    }

    s.events = null;
}

function getSettings() {
    return extension_settings[extensionName];
}

function syncExtensionPanel() {
    const s = getSettings();
    const enabled = document.getElementById('chaos_ext_enabled');
    const notify = document.getElementById('chaos_ext_notify');
    const nsfwGuard = document.getElementById('chaos_ext_nsfw_guard');
    const slider = document.getElementById('chaos_ext_slider');
    const value = document.getElementById('chaos_ext_value');

    if (enabled) enabled.checked = s.isEnabled;
    if (notify) notify.checked = s.showNotifications;
    if (nsfwGuard) nsfwGuard.checked = s.avoidIntimateScenes;
    if (slider) slider.value = s.chance;
    if (value) value.textContent = `${s.chance}%`;

    for (const key in s.categories) {
        const cb = document.getElementById(`chaos_cat_${key}`);
        if (cb) cb.checked = !!s.categories[key].enabled;
        const count = document.getElementById(`chaos_cat_count_${key}`);
        if (count) count.textContent = `${s.categories[key].events.length}`;
    }
}

function showChaosNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'chaos-notification';
    notification.innerHTML = `
        <div class="chaos-notification-icon"><i class="fa-solid fa-bolt"></i></div>
        <div class="chaos-notification-content">
            <div class="chaos-notification-title">Chaos Event</div>
            <div class="chaos-notification-message"></div>
        </div>
        <div class="chaos-notification-close"><i class="fa-solid fa-xmark"></i></div>
    `;
    notification.querySelector('.chaos-notification-message').textContent = message;

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

function openCategoryEditor(catKey) {
    if (document.getElementById('chaos_editor_overlay')) return;
    const s = getSettings();
    const cat = s.categories[catKey];
    if (!cat) return;

    const overlay = document.createElement('div');
    overlay.id = 'chaos_editor_overlay';
    overlay.className = 'chaos-editor-overlay';

    overlay.innerHTML = `
        <div class="chaos-editor-popup">
            <div class="chaos-editor-header">
                <div class="chaos-editor-title">
                    <i class="${cat.icon}"></i>
                    <span>${cat.label}</span>
                </div>
                <div class="chaos-editor-close" title="Close"><i class="fa-solid fa-xmark"></i></div>
            </div>

            <div class="chaos-editor-hint">
                One event per line. Empty lines are ignored.
            </div>

            <textarea id="chaos_editor_textarea" class="text_pole chaos-editor-textarea"
                placeholder="One event per line..."
                rows="12"></textarea>

            <div class="chaos-editor-footer">
                <div class="chaos-editor-count">
                    <span id="chaos_editor_count">0</span> event(s)
                </div>
                <div class="chaos-editor-buttons">
                    <input type="button" class="menu_button" id="chaos_editor_reset" value="Reset" />
                    <input type="button" class="menu_button" id="chaos_editor_cancel" value="Cancel" />
                    <input type="button" class="menu_button chaos-editor-save-btn" id="chaos_editor_save" value="Save" />
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const textarea = overlay.querySelector('#chaos_editor_textarea');
    const countEl = overlay.querySelector('#chaos_editor_count');
    textarea.value = cat.events.join('\n');

    const updateCount = () => {
        const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        countEl.textContent = `${lines.length}`;
    };
    updateCount();
    textarea.addEventListener('input', updateCount);

    const close = () => {
        overlay.classList.add('chaos-editor-hide');
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    overlay.querySelector('.chaos-editor-close').addEventListener('click', close);
    overlay.querySelector('#chaos_editor_cancel').addEventListener('click', close);

    overlay.querySelector('#chaos_editor_save').addEventListener('click', () => {
        const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        cat.events = lines;
        saveSettingsDebounced();
        const countSpan = document.getElementById(`chaos_cat_count_${catKey}`);
        if (countSpan) countSpan.textContent = `${lines.length}`;
        close();
    });

    overlay.querySelector('#chaos_editor_reset').addEventListener('click', () => {
        const def = defaultCategories[catKey];
        if (!def) return;
        textarea.value = def.events.join('\n');
        updateCount();
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    requestAnimationFrame(() => overlay.classList.add('chaos-editor-show'));
    if (window.matchMedia('(min-width: 601px)').matches) {
        setTimeout(() => textarea.focus(), 100);
    }
}

function setupExtensionPanel() {
    const s = getSettings();

    const categoriesHtml = Object.entries(s.categories).map(([key, cat]) => `
        <div class="chaos-cat-row" data-cat="${key}">
            <label class="checkbox_label chaos-cat-label-wrap">
                <input type="checkbox" id="chaos_cat_${key}" data-cat="${key}">
                <i class="chaos-cat-icon ${cat.icon}"></i>
                <span class="chaos-cat-name">${cat.label}</span>
            </label>
            <span class="chaos-cat-count" id="chaos_cat_count_${key}">${cat.events.length}</span>
            <div class="chaos-cat-edit-btn" data-cat="${key}" title="Edit events">
                <i class="fa-solid fa-pen-to-square"></i>
            </div>
        </div>
    `).join('');

    const settingsHtml = `
        <div class="chaos_twist_settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Chaos Plot Twist</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="chaos-settings-content">
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

                        <div class="flex-container">
                            <label class="checkbox_label" title="Skip chaos events during intimate or nearly intimate scenes">
                                <input type="checkbox" id="chaos_ext_nsfw_guard">
                                <span>NSFW protection</span>
                            </label>
                        </div>

                        <div class="chaos-categories-block">
                            <div class="chaos-categories-title">Event categories</div>
                            <div class="chaos-categories-list">
                                ${categoriesHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#extensions_settings').append(settingsHtml);

    syncExtensionPanel();

    $('#chaos_ext_enabled').on('change', function () {
        getSettings().isEnabled = this.checked;
        saveSettingsDebounced();
    });

    $('#chaos_ext_notify').on('change', function () {
        getSettings().showNotifications = this.checked;
        saveSettingsDebounced();
    });

    $('#chaos_ext_nsfw_guard').on('change', function () {
        getSettings().avoidIntimateScenes = this.checked;
        saveSettingsDebounced();
    });

    $('#chaos_ext_slider').on('input', function () {
        const value = parseInt(this.value);
        getSettings().chance = value;
        document.getElementById('chaos_ext_value').textContent = `${value}%`;
        saveSettingsDebounced();
    });

    document.querySelectorAll('#extensions_settings input[id^="chaos_cat_"]').forEach((cb) => {
        cb.addEventListener('change', () => {
            const key = cb.dataset.cat;
            const cat = getSettings().categories[key];
            if (cat) {
                cat.enabled = cb.checked;
                saveSettingsDebounced();
            }
        });
    });

    document.querySelectorAll('#extensions_settings .chaos-cat-edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            openCategoryEditor(btn.dataset.cat);
        });
    });
}

function pickRandomEventFromEnabledCategories() {
    const s = getSettings();
    const pool = [];
    for (const key in s.categories) {
        const cat = s.categories[key];
        if (cat.enabled && Array.isArray(cat.events)) {
            for (const ev of cat.events) {
                if (ev && ev.trim()) pool.push(ev);
            }
        }
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function onUserMessageSent() {
    const s = getSettings();

    if (pendingNotification && s.showNotifications) {
        showChaosNotification(pendingNotification);
    }
    pendingNotification = null;
}

function onBotMessageReceived() {
    const s = getSettings();

    setExtensionPrompt(extensionName, '', extension_prompt_types.IN_CHAT, 0);

    if (!s.isEnabled) {
        return;
    }

    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= s.chance) {
        const randomEvent = pickRandomEventFromEnabledCategories();
        if (!randomEvent) return;
        const eventPrompt = s.avoidIntimateScenes
            ? `${intimateSceneGuard}\n\n${randomEvent}`
            : randomEvent;

        setExtensionPrompt(
            extensionName,
            `[OOC: ${eventPrompt}]`,
            extension_prompt_types.IN_CHAT,
            0,
        );

        pendingNotification = randomEvent;
    }
}

jQuery(async () => {
    loadSettings();
    setupExtensionPanel();

    eventSource.on(event_types.MESSAGE_SENT, onUserMessageSent);
    eventSource.on(event_types.MESSAGE_RECEIVED, onBotMessageReceived);
});
