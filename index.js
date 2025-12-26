import { 
    eventSource, 
    event_types 
} from '../../../../script.js';
import { 
    getContext 
} from '../../../extensions.js';

// Настройки по умолчанию
let settings = {
    chance: 0.1, // 10% шанс на ивент при каждом сообщении
    events: [
        "[OOC: You will NOW introduce an unpredictable PLOT TWIST!]",
        "[OOC: You will **NOW** do something **UNPREDICTABLE** that leads to ultimate **CHAOS** and **DRAMA**.]",
        "[OOC: A sudden environmental disaster occurs right now!]",
        "[OOC: An unexpected NPC enters the scene with shocking news!]"
    ]
};

/**
 * Функция анализа сцены (упрощенная)
 * Можно проверять длину чата или ключевые слова, чтобы не вбрасывать хаос слишком рано
 */
function shouldTriggerChaos() {
    const context = getContext();
    const chatLog = context.chat;
    
    // Например, не запускать, если в чате меньше 5 сообщений
    if (chatLog.length < 5) return false;

    // Рандомная проверка шанса
    return Math.random() < settings.chance;
}

/**
 * Хук, который срабатывает перед отправкой промпта в AI
 */
async function onPromptReady(payload) {
    if (shouldTriggerChaos()) {
        const randomEvent = settings.events[Math.floor(Math.random() * settings.events.length)];
        
        // Добавляем инструкцию в конец промпта как скрытое системное сообщение или вставку
        // В SillyTavern payload.prompt - это массив объектов сообщений
        payload.push({
            role: 'system',
            content: `[IMPORTANT INSTRUCTION: ${randomEvent}]`
        });
        
        console.log('Chaos Event Triggered:', randomEvent);
    }
}

// Инициализация расширения
(function() {
    // Слушаем событие готовности промпта (самое эффективное для инъекций)
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
    
    console.log('Chaos Plot Twist Extension Loaded');
})();