import registerHooks from "./scripts/hooks.js";

Hooks.on("init", () => {
    game.settings.register('impmal-cover-walls', 'debug', {
        name: 'IMPMAL-COVER-WALLS.SETTINGS.debug',
        hint: 'IMPMAL-COVER-WALLS.SETTINGS.debugHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    
    game.settings.register('impmal-cover-walls', 'highlight', {
        name: 'IMPMAL-COVER-WALLS.SETTINGS.highlight',
        hint: 'IMPMAL-COVER-WALLS.SETTINGS.highlightHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
});

registerHooks();