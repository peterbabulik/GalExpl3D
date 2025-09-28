// npc-traders.ts
import type { 
    NpcTraderData, 
    CorporationData,
    StationMarketData, 
    StationInfo, 
    TradeRoute, 
    AnyItem, 
    StorageLocation,
    Ship
} from './types';
import { getItemData, SHIP_DATA } from './constants';

// --- Market Logic (shared with Business Map) ---

const STATION_BUY_MARGIN = 1.05;
const STATION_SELL_MARGIN = 0.95;
const CORP_TAX_RATE = 0.20; // 20% tax

// These constants define the price elasticity.
const PRICE_RANGE_MULTIPLIER = 0.5; // Price can vary +/- 50% from base
const SATURATION_QUANTITY_MULTIPLIER = 4; // At 4x baseline, price hits its minimum

export const calculatePrice = (basePrice: number, quantity: number): number => {
    // BASELINE_QUANTITY is the amount where price should equal basePrice.
    const BASELINE_QUANTITY = 50000; 

    const minPrice = basePrice * (1 - PRICE_RANGE_MULTIPLIER);
    const maxPrice = basePrice * (1 + PRICE_RANGE_MULTIPLIER);
    const saturationQuantity = BASELINE_QUANTITY * SATURATION_QUANTITY_MULTIPLIER;

    let dynamicPrice;

    if (quantity <= 0) {
        dynamicPrice = maxPrice;
    } else if (quantity < BASELINE_QUANTITY) {
        // Linearly interpolate between maxPrice (at 0) and basePrice (at BASELINE_QUANTITY)
        const t = quantity / BASELINE_QUANTITY;
        dynamicPrice = maxPrice - (maxPrice - basePrice) * t;
    } else if (quantity < saturationQuantity) {
        // Linearly interpolate between basePrice (at BASELINE_QUANTITY) and minPrice (at saturationQuantity)
        const t = (quantity - BASELINE_QUANTITY) / (saturationQuantity - BASELINE_QUANTITY);
        dynamicPrice = basePrice - (basePrice - minPrice) * t;
    } else { // quantity >= saturationQuantity
        dynamicPrice = minPrice;
    }
    
    // Ensure price never drops below a minimum value (e.g., 1 ISK)
    return Math.max(1.0, dynamicPrice);
};


export const findBestTradeRouteForItem = (
    itemId: string,
    stationMarketData: StationMarketData,
    allStations: StationInfo[]
): TradeRoute | null => {
    const itemData = getItemData(itemId);
    if (!itemData || !itemData.basePrice || itemData.basePrice <= 0) {
        return null;
    }

    let bestBuy = { station: null as StationInfo | null, price: Infinity };
    let bestSell = { station: null as StationInfo | null, price: -1 };

    for (const station of allStations) {
        const stationInventory = stationMarketData[station.id] || {};
        const quantity = stationInventory[itemId] || 0;
        const dynamicPrice = calculatePrice(itemData.basePrice, quantity);
        
        if (quantity > 0) {
            const buyPrice = dynamicPrice * STATION_BUY_MARGIN;
            if (buyPrice < bestBuy.price) {
                bestBuy = { station, price: buyPrice };
            }
        }
        
        const sellPrice = dynamicPrice * STATION_SELL_MARGIN;
        if (sellPrice > bestSell.price) {
            bestSell = { station, price: sellPrice };
        }
    }
    
    if (bestBuy.station && bestSell.station && bestSell.price > bestBuy.price) {
        const profitPerUnit = bestSell.price - bestBuy.price;
        const profitPerM3 = itemData.volume ? profitPerUnit / itemData.volume : 0;
        return {
            itemId,
            buyStation: bestBuy.station,
            sellStation: bestSell.station,
            buyPrice: bestBuy.price,
            sellPrice: bestSell.price,
            profitPerUnit,
            profitPerM3,
        };
    }

    return null;
};

// --- NPC Trader Simulation ---

const getCargoVolume = (cargo: StorageLocation): number => {
    let volume = 0;
    Object.entries(cargo.materials).forEach(([id, qty]) => {
        volume += (getItemData(id)?.volume || 0.1) * qty;
    });
    return volume;
};

const getTimerForState = (state: NpcTraderData['state']): number => {
    switch (state) {
        case 'IDLE': return 5; // Reduced idle time
        case 'ANALYZING_MARKET': return 10;
        case 'TRAVELING_TO_BUY': return 30;
        case 'BUYING': return 5;
        case 'TRAVELING_TO_SELL': return 30;
        case 'SELLING': return 5;
        default: return 60;
    }
};

export function updateNpcTraders(
    currentTraders: Record<string, NpcTraderData>,
    currentCorporations: Record<string, CorporationData>,
    currentMarketData: StationMarketData,
    allStations: StationInfo[],
    tickInterval: number
): {
    updatedTraders: Record<string, NpcTraderData>,
    updatedCorporations: Record<string, CorporationData>,
    updatedMarketData: StationMarketData
} {
    const updatedTraders: Record<string, NpcTraderData> = JSON.parse(JSON.stringify(currentTraders));
    const updatedCorporations: Record<string, CorporationData> = JSON.parse(JSON.stringify(currentCorporations));
    const updatedMarketData: StationMarketData = JSON.parse(JSON.stringify(currentMarketData));

    for (const uuid in updatedTraders) {
        const trader = updatedTraders[uuid];
        
        trader.stateTimer -= tickInterval;

        if (trader.stateTimer <= 0) {
            switch (trader.state) {
                case 'IDLE':
                    trader.state = 'ANALYZING_MARKET';
                    break;
                
                case 'ANALYZING_MARKET':
                    const allItemIds = new Set<string>();
                    Object.values(currentMarketData).forEach(inv => Object.keys(inv).forEach(id => allItemIds.add(id)));

                    const allProfitableRoutes: TradeRoute[] = [];
                    
                    for (const itemId of allItemIds) {
                        const route = findBestTradeRouteForItem(itemId, currentMarketData, allStations);
                        if (route && route.profitPerM3 > 0) {
                            allProfitableRoutes.push(route);
                        }
                    }

                    if (allProfitableRoutes.length > 0) {
                        // Sort by best profit per m3 and take top 3
                        allProfitableRoutes.sort((a, b) => b.profitPerM3 - a.profitPerM3);
                        const topRoutes = allProfitableRoutes.slice(0, 3);
                        
                        // Randomly select one of the top routes for this trader
                        const chosenRoute = topRoutes[Math.floor(Math.random() * topRoutes.length)];
                        
                        trader.currentRoute = chosenRoute;
                        trader.state = 'TRAVELING_TO_BUY';
                    } else {
                        trader.state = 'IDLE'; // No profitable routes found, wait a bit.
                    }
                    break;

                case 'TRAVELING_TO_BUY':
                    if (trader.currentRoute) {
                        trader.currentSystemId = trader.currentRoute.buyStation.systemId;
                        trader.currentLocationId = trader.currentRoute.buyStation.id;
                        trader.state = 'BUYING';
                    } else {
                        trader.state = 'IDLE';
                    }
                    break;

                case 'BUYING':
                    if (trader.currentRoute) {
                        const route = trader.currentRoute;
                        const ship = SHIP_DATA[trader.shipId] as Ship;
                        const item = getItemData(route.itemId);
                        const stationStock = updatedMarketData[route.buyStation.id]?.[route.itemId] || 0;

                        if (ship && item && item.volume && stationStock > 0) {
                            const maxCanAfford = Math.floor(trader.isk / route.buyPrice);
                            const maxCanFit = Math.floor(ship.attributes.cargoCapacity / item.volume);
                            const quantityToBuy = Math.min(maxCanAfford, maxCanFit, stationStock);

                            if (quantityToBuy > 0) {
                                const totalCost = quantityToBuy * route.buyPrice;
                                trader.isk -= totalCost;
                                // Trader pays from their own wallet, not corp's
                                trader.cargo.materials[route.itemId] = (trader.cargo.materials[route.itemId] || 0) + quantityToBuy;
                                updatedMarketData[route.buyStation.id][route.itemId] -= quantityToBuy;
                                
                                trader.state = 'TRAVELING_TO_SELL';
                            } else {
                                trader.state = 'IDLE'; // Can't afford/fit any, reset
                            }
                        } else {
                            trader.state = 'IDLE';
                        }
                    } else {
                        trader.state = 'IDLE';
                    }
                    break;
                
                case 'TRAVELING_TO_SELL':
                     if (trader.currentRoute) {
                        trader.currentSystemId = trader.currentRoute.sellStation.systemId;
                        trader.currentLocationId = trader.currentRoute.sellStation.id;
                        trader.state = 'SELLING';
                    } else {
                        trader.state = 'IDLE';
                    }
                    break;

                case 'SELLING':
                    if (trader.currentRoute) {
                        const route = trader.currentRoute;
                        const quantityToSell = trader.cargo.materials[route.itemId] || 0;
                        
                        if (quantityToSell > 0) {
                            const totalSale = quantityToSell * route.sellPrice;
                            const totalCost = quantityToSell * route.buyPrice;
                            const totalProfit = totalSale - totalCost;

                            if (totalProfit > 0) {
                                const corpTax = totalProfit * CORP_TAX_RATE;
                                const traderProfit = totalProfit - corpTax;

                                updatedCorporations[trader.corporationId].isk += corpTax;
                                trader.isk += totalSale - corpTax; // Trader gets the sale money minus their tax
                            } else {
                                trader.isk += totalSale; // No profit, no tax
                            }
                            
                            delete trader.cargo.materials[route.itemId];
                            
                            const marketInv = updatedMarketData[route.sellStation.id] || {};
                            marketInv[route.itemId] = (marketInv[route.itemId] || 0) + quantityToSell;
                            updatedMarketData[route.sellStation.id] = marketInv;
                        }
                        trader.currentRoute = null;
                        trader.state = 'IDLE';
                    } else {
                        trader.state = 'IDLE';
                    }
                    break;
            }
            trader.stateTimer = getTimerForState(trader.state);
        }
    }

    return { updatedTraders, updatedCorporations, updatedMarketData };
}