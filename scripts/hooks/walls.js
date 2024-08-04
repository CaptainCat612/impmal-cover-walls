import WallHelpers from "../wall-helpers.js";

export default function() 
{
    Hooks.on("hoverWall", async (wall, hover) => 
    {
        if(game.settings.get('impmal-cover-walls','highlight'))
            WallHelpers.toggleHighlightWall(wall, hover, "impmal-cover-walls.hoverWall");
    });

    Hooks.on("controlWall", async (wall, hover) => 
    {
        if(game.settings.get('impmal-cover-walls','highlight'))
            WallHelpers.toggleHighlightWall(wall, hover, "impmal-cover-walls.controlWall");
    });
    
    Hooks.on("renderWallConfig", async (app, [html], style) => 
    {
        const traits = app.document.flags?.impmal?.traits ?? {cover:'', barrier: false}
        
        if(game.settings.get('impmal-cover-walls','debug'))
            console.log(`Wall Traits: ${traits}`);
        let extra_html = `
        <div class="form-group">
            <label>${game.i18n.localize("IMPMAL.Barrier")}</label>
            <div class="form-fields">
                <input type="checkbox" name="flags.impmal.traits.barrier" ${traits.barrier? "checked" : ""}>
            </div>
        </div>
        <div class="form-group">
            <label>${game.i18n.localize("IMPMAL.Cover")}</label>
                <div class="form-fields">
                    <select name="flags.impmal.traits.cover">
                    <option value="" ${traits.cover == ""? "selected" : ""}></option>
                    <option value="lightCover" ${traits.cover == "lightCover"? "selected" : ""}>${game.i18n.localize("IMPMAL.LightCover")}</option>
                    <option value="mediumCover" ${traits.cover == "mediumCover"? "selected" : ""}>${game.i18n.localize("IMPMAL.MediumCover")}</option>
                    <option value="heavyCover" ${traits.cover == "heavyCover"? "selected" : ""}>${game.i18n.localize("IMPMAL.HeavyCover")}</option>
                </select>
            </div>
        </div>`;
        html.querySelector('.form-footer ').insertAdjacentHTML('beforebegin', extra_html);
    });
}
