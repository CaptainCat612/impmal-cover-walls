import registerHooks from "./scripts/hooks";

registerHooks();

Hooks.on("init", () => {
    game.settings.register('impmal-cover-walls', 'debug', {
        name: 'IMPMAL-COVER-WALLS.SETTINGS.debug',
        hint: 'IMPMAL-COVER-WALLS.SETTINGS.debugHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });
});