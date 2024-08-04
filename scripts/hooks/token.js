import WallHelpers from "../wall-helpers";

export default function() 
{
    Hooks.on("preUpdateToken", async (token, data) => 
    {
        WallHelpers.checkTokenUpdate(token, data, canvas.drawings.placeables);
    });
}
