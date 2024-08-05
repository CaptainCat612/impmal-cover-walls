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

    static _filterDuplicates(posList){
        return posList.filter((pos, index) =>
            posList.findIndex(p => p[0] ==pos[0] && p[1] == pos[1]) == index);
    }
    
    static _getLineCandidates(point1, point2)
    {
        const vector = [point1[0]-point2[0], point1[1]-point2[1]];
        const m = vector[1]/vector[0];
        const get_y = (x) => x*m - point1[0]*m + point1[1];        
        const get_x = (y) => (y - point1[1])/m + point1[0];

        const grid_size = canvas.grid.size;
        const p1 = this._getTopLeftPoint(point1[0], point1[1]);
        const p2 = this._getTopLeftPoint(point2[0], point2[1]);
        
        let candidates = [];
        const max_x = Math.max(p1[0], p2[0]);
        // iterate over x
        for (let x = Math.min(p1[0], p2[0])+grid_size; x < max_x; x+=grid_size) {
            const y = get_y(x);     
            candidates.push([x,y]);            
        }
        
        const max_y = Math.max(p1[1], p2[1]);
        // iterate over y
        for (let y = Math.min(p1[1], p2[1])+grid_size; y < max_y; y+=grid_size) {
            const x = get_x(y); 
            candidates.push([x,y]);           
        }

        if(game.settings.get('impmal-cover-walls','debug')){
            console.log("Candidates for Line:");
            console.log(candidates);
        }
        return this._filterDuplicates(candidates);
    }

    static _getSidewaysVector(point1, point2){
        
        let sideways = [point2[0]-point1[0], point2[1]- point1[1]];
        
        const length = Math.sqrt(Math.pow(sideways[0],2) + Math.pow(sideways[1],2));
        sideways = [sideways[0]/length, sideways[1]/length];
        
        const radians = 90* Math.PI/180;
        sideways = [
            sideways[0]*Math.cos(radians)-sideways[1]*Math.sin(radians), 
            sideways[0]*Math.sin(radians)+sideways[1]*Math.cos(radians)
        ];

        
        const size = canvas.grid.size/2;
        sideways = [Math.round(sideways[0]*size), Math.round(sideways[1]*size)];
        return sideways;
    }

    static _getAdjacentWallGridOffsets(wall)
    {                
        if(game.settings.get('impmal-cover-walls','debug')){
            console.log("calculating adjacent positions...\n");
        }
        const point1 = [wall.coords[0], wall.coords[1]];        
        const point2 = [wall.coords[2], wall.coords[3]];

        const sideways = this._getSidewaysVector(point1, point2);
        const candidates = [
            ...this._getLineCandidates(point1, point2),
            [point1[0]- sideways[0], point1[1]- sideways[1]],
            [point2[0]- sideways[0], point2[1]- sideways[1]],
            ...this._getLineCandidates([point1[0]- sideways[0], point1[1]- sideways[1]],
                [point2[0]- sideways[0], point2[1]- sideways[1]]),
            [point1[0]+ sideways[0], point1[1]+ sideways[1]],
            [point2[0]+ sideways[0], point2[1]+ sideways[1]],
            ...this._getLineCandidates([point1[0]+ sideways[0], point1[1]+ sideways[1]],
                    [point2[0]+ sideways[0], point2[1]+ sideways[1]])
        ];

        let result = candidates.map(pos => this._getTopLeftPoint(pos[0], pos[1]));
        const p1 = this._getTopLeftPoint(point1[0], point1[1]);
        const p2 = this._getTopLeftPoint(point2[0], point2[1]);
        const maxP = (p1[0] >= p2[0] && p1[1] >= p2[1])? p1 : p2;

        result = this._filterDuplicates(result);
        result = result.filter(pos => pos[0] <= maxP[0] | pos[1] <= maxP[0]);
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