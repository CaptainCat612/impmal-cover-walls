import WallHelpers from "../wall-helpers.js";

export default function() 
{
    if(game.settings.get('impmal-cover-walls','highlight')){
        Hooks.on("hoverWall", async (wall, hover) => 
        {
            let positions = WallHelpers._getAdjacentWallGridOffsets(wall);
            
            if(game.settings.get('impmal-cover-walls','debug'))
                console.log(positions);
            if(hover)
            {
                positions.forEach(p => {
                    canvas.interface.grid.highlightPosition("impmal-cover-walls.hoverWall", { x:p[0], y:p[1] });
                });
            }
            else
            {
                canvas.interface.grid.destroyHighlightLayer("impmal-cover-walls.hoverWall");
            }
        });

        Hooks.on("controlWall", async (wall, hover) => 
        {
            let positions = WallHelpers._getAdjacentWallGridOffsets(wall);  
            
            if(game.settings.get('impmal-cover-walls','debug'))          
                console.log(positions);
            
            if(hover)
            {
                positions.forEach(p => {
                    canvas.interface.grid.highlightPosition("impmal-cover-walls.controlWall", { x:p[0], y:p[1] });
                });
            }
            else
            {
                canvas.interface.grid.destroyHighlightLayer("impmal-cover-walls.controlWall");
            }
        });
    }  
    
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
        html.querySelector('.window-content .form-footer').insertAdjacentHTML('beforebegin', extra_html)
    });
}
