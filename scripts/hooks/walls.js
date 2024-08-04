import WallHelpers from "../wall-helpers";

export default function() 
{
    if(game.settings.get('impmal-cover-walls','debug')){
        Hooks.on("hoverWall", async (wall, hover) => 
        {
            let positions = WallHelpers._getAdjacentWallGridOffsets(wall);
            if(hover)
            {
                positions.forEach(p => {
                    canvas.interface.grid.highlightPosition("impmal-cover-walls.WallProximity", { x:p[0], y:p[1] });
                });
            }
            else
            {
                canvas.interface.grid.destroyHighlightLayer("impmal-cover-walls.WallProximity");
            }
        });
    }  
    
    Hooks.on("renderWallConfig", async (app, [html], style) => 
    {
        const traits = app.document.flags?.impmal?.traits ?? {cover:'', barrier: false}
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
        html.querySelector('.window-content').insertAdjacentHTML('beforeend', extra_html)
    });
}
