import ZoneHelpers from "../../impmal/src/system/zone-helpers"

export default class WallHelpers 
{
    static _getTopLeftPoint(p){        
        //const coords = canvas.grid.getCenterPoint({x: p.x, y: p.y});
        //const cube = canvas.grid.getCube(coords);
        //const offset = canvas.grid.getOffset(cube);
        const offset = {x: p.x, y: p.y};
        return canvas.grid.getTopLeftPoint(offset);
    }
    
    static _getAdjacentWallGridOffsets(wall)
    {
        if (!(drawing instanceof Wall))
            return [];
        
        const points = wall.coords;
        const vector = {x:points[0]-points[2], y:points[1]-points[3]}
        const m = vector.y/vector.x
        const get_y = (x) => x*m - points[0]*m + points[1];        
        const get_x = (y) => (y - points[1])/m + points[0];

        const grid_size = canvas.grid.size;
        const vector_sideways = {x: -1*(vector.x*grid_size/2)/Math.max(vector.x, vector.y), y:(vector.y*grid_size/2)/Math.max(vector.x, vector.y)}
        const p1 = _getTopLeftPoint({x:points[0], y:points[1]});
        const p2 = _getTopLeftPoint({x:points[2], y:points[3]});

        let result = [p1, p2];
        
        const max_x = Math.max(p1.x, p2.x);
        // iterate over x
        for (let x = Math.min(p1.x, p2.x); x < max_x; x+=grid_size) {
            const y = get_y(x);
            result.push(_getTopLeftPoint({x:x+vector_sideways.x, y:y+vector_sideways.y}));
            result.push(_getTopLeftPoint({x:x-vector_sideways.x, y:y-vector_sideways.y}));
            result.push(_getTopLeftPoint({x:x, y:y}));
        }
        
        const max_y = Math.max(p1.y, p2.y);
        // iterate over y
        for (let y = Math.min(p1.y, p2.y); y < max_y; y+=grid_size) {
            const x = get_x(y);
            result.push(_getTopLeftPoint({x:x+vector_sideways.x, y:y+vector_sideways.y}));
            result.push(_getTopLeftPoint({x:x-vector_sideways.x, y:y-vector_sideways.y}));
            result.push(_getTopLeftPoint({x:x, y:y}));
        }
        return [...new Set(result)];
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
            let preX = {x : token.object.center.x, y: token.object.center.y};
            let postX = {
                x :(update.x || token.x) + canvas.grid.size / 2 , 
                y: (update.y || token.y) + canvas.grid.size / 2
            };

            let toAdd = [];
            let toRemove = [];

            let currentZoneEffects = token.actor?.currentZoneEffects || [];

            let entered = [];
            let left = [];
            for (let drawing of drawings)
            {
                if (!(drawing instanceof Wall) || !drawing.document.flags?.impmal?.traits)
                    continue;

                const adjacent_points = this._getAdjacentWallGridOffsets(drawing);
                const post_is_adjacent = adjacent_points.includes(this._getTopLeftPoint(postX));
                const pre_is_adjacent = adjacent_points.includes(this._getTopLeftPoint(preX));

                if (post_is_adjacent && !pre_is_adjacent) // If entering Wall Zone
                {
                    entered.push(drawing);
                }
                else if (!post_is_adjacent && pre_is_adjacent) // If leaving Wall Zone
                {
                    left.push(drawing);
                }
            }

            // Take the drawings the token left, filter through the actor's zone effects to find the ones from those drawings, mark those for removal
            // Note that some effects are denoted as "kept" and are not removed upon leaving the zone
            for(let drawing of left)
            {
                toRemove = toRemove.concat(currentZoneEffects.filter(effect => effect.flags.impmal.fromZone == drawing.document.uuid && !effect.flags.impmal.applicationData?.keep));
            }

            for(let drawing of entered)
            {
                toAdd = toAdd.concat(ZoneHelpers.zoneEffects(drawing));
            }


            await token.actor.deleteEmbeddedDocuments("ActiveEffect", toRemove.filter(e => e).map(e => e.id));
            await token.actor.createEmbeddedDocuments("ActiveEffect", toAdd.filter(e => e && e.flags.impmal?.following != token.uuid));
            // Don't re-add following effect to the token that it's following   
        }
    }
}