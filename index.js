import { 
    eventSource, 
    event_types,
} from '../../../../script.js';
import { 
    getContext 
} from '../../../extensions.js';

const defaultSettings = {
    isEnabled: true,
    chance: 40, 
    showNotifications: true,
    events: [
        "[OOC: You will NOW introduce an unpredictable PLOT TWIST!]",
        "[OOC: You will **NOW** do something **UNPREDICTABLE** that leads to ultimate **CHAOS** and **DRAMA**.]",
        "[OOC: A sudden unexpected event happens that completely changes the current situation!]",
        "[OOC: An external force or character suddenly intervenes in a shocking way!]"
    ]
};

let settings = Object.assign({}, defaultSettings);


function shouldTriggerChaos() {
    if (!settings.isEnabled) return false;

    const context = getContext();
    const chatLog = context.chat;
    
    
    if (!chatLog || chatLog.length < 4) return false;

  
    const roll = Math.floor(Math.random() * 100) + 1;
    return roll <= settings.chance;
}


async function onPromptReady(payload) {
    if (shouldTriggerChaos()) {
        const randomEvent = settings.events[Math.floor(Math.random() * settings.events.length)];
        

        payload.push({
            role: 'system',
            content: `[SYSTEM NOTE: ${randomEvent}]`
        });

    
        if (settings.showNotifications) {
            toastr.warning(
                randomEvent.replace('[OOC: ', '').replace(']', ''), 
                "Chaos Event Triggered!", 
                { 
                    timeOut: 6000, 
                    progressBar: true,
                    closeButton: true 
                }
            );
        }
        
        console.log('--- Chaos Extension Triggered ---');
        console.log('Event injected:', randomEvent);
    }
}


(function initExtension() {
    
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);

    console.log('Chaos Plot Twist Extension loaded.');
})();
