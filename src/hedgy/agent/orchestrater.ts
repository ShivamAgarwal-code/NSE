import { Library } from "../framework/library";
import { Orchestrater } from "../framework/orchestrater";
import { CHOOSE_UI_BLOCK_ACTION } from "./actions";
import { DOCS_READ_ORACLE, GET_ASSET_PRICE_ORACLE, GET_ASSET_PRICES, LISTED_ASSETS_ORACLE, PRESS_RELEASE_ORACLE_GENERAL, PRESS_RELEASE_ORACLE_SPECIFIC } from "./oracles";


const library = Library.define()

library
.AddAction(CHOOSE_UI_BLOCK_ACTION)
.AddOracle(PRESS_RELEASE_ORACLE_SPECIFIC)
.AddOracle(PRESS_RELEASE_ORACLE_GENERAL)
.AddOracle(GET_ASSET_PRICE_ORACLE)
.AddOracle(GET_ASSET_PRICES)
    .AddOracle(DOCS_READ_ORACLE)
    .AddOracle(LISTED_ASSETS_ORACLE)

export const orchestrator = new Orchestrater(
    library,
    `I'm an AI that helps humans gain understanding about securities trading on the Nairobi Stock Exchange (NSE)
    by providing them with information about the assets they are curious about, I also enable them to interact with the Hedgehog protocol, which enables them to trade on-chain versions of these assets.
    I can get for them data from press releases, and I can also get them the price of a specific asset, or even all the assets in the NSE.
    After I have collected relevant information, I also choose the UI components to display the information to the user.
    If the user's request includes an action word like buy, I need to provide them with a UI block to complete this action as well as the a summary of any financial information regarding the asset.
    Every query for an explanation should be assumed to be ending with the words on hedgehog that is in the context of hedgehog.
    `
)


