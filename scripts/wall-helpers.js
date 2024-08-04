export default class WallHelpers 
{
    static _getTopLeftPoint(x, y){
        return canvas.grid.grid.getTopLeft(x, y);
    }

    static toggleHighlightWall(wall, on, layername){
        
        if(game.settings.get('impmal-cover-walls','debug')){
            console.log("toogleHighlightWall called with:\n");
            console.log(wall);
            console.log(on);
            console.log(layername);
        }

        let layer = canvas.grid.addHighlightLayer(layername);
        let positions = WallHelpers._getAdjacentWallGridOffsets(wall);

        if(on)
        {
            positions.forEach(p => {
                canvas.grid.grid.highlightGridPosition(layer, { x:p[0], y:p[1] });
            });
        }
        else
        {
            canvas.grid.clearHighlightLayer(layername);
        }
    }
    
    static _getAdjacentWallGridOffsets(wall)
    {                
        if(game.settings.get('impmal-cover-walls','debug')){
            console.log("calculating adjacent positions...\n");
        }
        const points = wall.coords;
        const vector = [points[0]-points[2], points[1]-points[3]]
        const m = vector[1]/vector[0]
        const get_y = (x) => x*m - points[0]*m + points[1];        
        const get_x = (y) => (y - points[1])/m + points[0];

        const grid_size = canvas.grid.size;
        const vector_sideways = [-1*(vector[0]*grid_size/2)/Math.max(vector[0], vector[1]), (vector[1]*grid_size/2)/Math.max(vector[0], vector[1])];
        const p1 = this._getTopLeftPoint(points[0], points[1]);
        const p2 = this._getTopLeftPoint(points[2], points[3]);

        let result = [p1, p2];
        
        const max_x = Math.max(p1[0], p2[0]);
        // iterate over x
        for (let x = Math.min(p1[0], p2[0]); x < max_x; x+=grid_size) {
            const y = get_y(x);
            const variant1 = this._getTopLeftPoint(x+vector_sideways[0], y+vector_sideways[1]);
            if (result.find(p => p[0] == variant1[0] && p[0] == variant1[0]) == undefined)
                result.push(variant1);
            const variant2 = this._getTopLeftPoint(x-vector_sideways[0], y-vector_sideways[1]);
            if (result.find(p => p[0] == variant2[0] && p[1] == variant2[1]) == undefined)
                result.push(variant2);            
            const point = this._getTopLeftPoint(x, y);
            if (result.find(p => p[0] == point[0] && p[1] == point[1]) == undefined)
                result.push(point);            
        }
        
        const max_y = Math.max(p1[1], p2[1]);
        // iterate over y
        for (let y = Math.min(p1[1], p2[1]); y < max_y; y+=grid_size) {
            const x = get_x(y);
            const variant1 = this._getTopLeftPoint(x+vector_sideways[0], y+vector_sideways[1]);
            if (result.find(p => p[0] == variant1[0] && p[0] == variant1[0]) == undefined)
                result.push(variant1);
            const variant2 = this._getTopLeftPoint(x-vector_sideways[0], y-vector_sideways[1]);
            if (result.find(p => p[0] == variant2[0] && p[1] == variant2[1]) == undefined)
                result.push(variant2);            
            const point = this._getTopLeftPoint(x, y);
            if (result.find(p => p[0] == point[0] && p[1] == point[1]) == undefined)
                result.push(point);            
        }

        if(game.settings.get('impmal-cover-walls','debug')){
            console.log(result);
        }
        return result;
    }

    /**
     * When a token is updated, check new position vs old and collect which wall effects
     * to add or remove based on wall-surroundings left and entered. 
     * 
     * @param {Token} token Token being updated
     * @param {Object} update Token update data (new x and y)
     * @param {Array} drawings Array of Drawing instances to check
     */
    static async checkTokenUpdate(token, update, drawings)
    {
        if (!(drawings instanceof Array))
        {
            drawings = [drawings];
        }

        if (update.x || update.y)
        {            
            let preX = [ token.object.center.x, token.object.center.y];
            let postX = [(update.x || token.x) + canvas.grid.size / 2 , 
                (update.y || token.y) + canvas.grid.size / 2];
            
            if(game.settings.get('impmal-cover-walls','debug')){
                console.log(token);
                console.log(preX);
                console.log(postX);
            }
            preX = this._getTopLeftPoint(preX[0], preX[1]);
            postX = this._getTopLeftPoint(postX[0], postX[1]);
            
            if(game.settings.get('impmal-cover-walls','debug')){
                console.log(preX);
                console.log(postX);
            }

            let toAdd = [];
            let toRemove = [];

            let currentZoneEffects = token.actor?.currentZoneEffects || [];

            let entered = [];
            let left = [];            

            for (let drawing of drawings)
            {
                if (!drawing.document.flags?.impmal?.traits)
                    continue;

                const adjacent_points = this._getAdjacentWallGridOffsets(drawing);
                const post_is_adjacent = adjacent_points.find(p => p[0] == postX[0] && p[1] == postX[1]) != undefined;
                const pre_is_adjacent = adjacent_points.find(p => p[0] == preX[0] && p[1] == preX[1]) != undefined;

                if (post_is_adjacent && !pre_is_adjacent) // If entering Wall Zone
                {
                    entered.push(drawing);
                }
                else if (!post_is_adjacent && pre_is_adjacent) // If leaving Wall Zone
                {
                    left.push(drawing);
                }
            }

            if(game.settings.get('impmal-cover-walls','debug')){
                console.log(`left: ${left}`);
                console.log(`entered: ${entered}`);
            }
            

            // Take the drawings the token left, filter through the actor's zone effects to find the ones from those drawings, mark those for removal
            // Note that some effects are denoted as "kept" and are not removed upon leaving the zone
            for(let drawing of left)
            {
                toRemove = toRemove.concat(currentZoneEffects.filter(effect => effect.flags.impmal.fromZone == drawing.document.uuid && !effect.flags.impmal.applicationData?.keep));
            }

            for(let drawing of entered)
            {
                toAdd = toAdd.concat(this.zoneEffects(drawing));
            }


            await token.actor.deleteEmbeddedDocuments("ActiveEffect", toRemove.filter(e => e).map(e => e.id));
            await token.actor.createEmbeddedDocuments("ActiveEffect", toAdd.filter(e => e && e.flags.impmal?.following != token.uuid));
            // Don't re-add following effect to the token that it's following   
        }
    }
    
    /**
     * Return an array of effect data based on Zone Settings
     * 
     * @param {Drawing} drawing Drawing instance
     * @returns 
     */
    static zoneEffects(drawing)
    {
        let traits = [];
        let zoneTraits = drawing.document.flags?.impmal?.traits || {};
        let zoneEffects = drawing.document.flags?.impmal?.effects || [];
        this._combineTraitsFromEffects(zoneEffects, zoneTraits);

        for (let key in zoneTraits)
        {
            if (zoneTraits[key])
            {
                if (typeof zoneTraits[key] == "boolean")
                {
                    traits.push(key); // For boolean properties, the effect key is the property name
                }
                else if (typeof zoneTraits[key] == "string")
                {
                    traits.push(zoneTraits[key]); // For selection properties, the effect key is the value 
                }
            }
        }
        
        // Return trait effects and any other added effects
        return traits.map(i => foundry.utils.deepClone(game.impmal.config.zoneEffects[i]))
            .concat(zoneEffects || [])
            .map(effect => 
            {
            // Designate all zone effects with a flag to easily be distinguished
                setProperty(effect, "flags.impmal.fromZone", drawing.document.uuid);
                setProperty(effect, "flags.impmal.applicationData.zoneType",  "");
                effect.origin = drawing.document.uuid;
                return effect;
            });
    }

    // Zone effects can designate traits to add (e.g. a power making a zone a Minor Hazard)
    // This collects all of them into a single trait object
    static _combineTraitsFromEffects(effects, allTraits={})
    {
        for(let effect of effects)
        {
            let effectTraits = effect.flags.impmal.applicationData?.traits || {};

            for(let key in effectTraits)
            {
                if (effectTraits[key])
                {

                    // If effect trait is a boolean, set collection value to true
                    if (typeof effectTraits[key] == "boolean")
                    {
                        allTraits[key] = true;
                    }
                    // If effect trait is a string, compare and only set if effect trait is greater
                    // e.g. if allTraits has mediumCover, and effect specifies heavyCover, use heavyCover if effect specifies lightCover, don't use (medium is greater)
                    else if (this.isGreaterTrait(effectTraits[key], allTraits[key]))
                    {
                        allTraits[key] = effectTraits[key];
                    }
                }
            }
        }
        return allTraits;
    }
    
    // returns true if trait1 is greater than trait2
    // trait1 = lightCover, trait2 = mediumCover, return false
    // trait1 = heavyCover, trait2 = mediumCover, return true
    static isGreaterTrait(trait1, trait2)
    {
        let effectList = ["lightCover", "mediumCover", "heavyCover", "lightlyObscured", "heavilyObscured", "minorHazard", "majorHazard", "deadlyHazard", "poorlyLit", "dark"];
        return effectList.findIndex(i => i == trait1) > effectList.findIndex(i => i == trait2);
    }
}