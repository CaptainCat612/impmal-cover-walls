import WallHelpers from "../wall-helpers.js";

export default function() 
{
    Hooks.on("preUpdateToken", async (token, data) => 
    {
        WallHelpers.checkTokenUpdate(token, data, canvas.drawings.placeables);
    });
}
