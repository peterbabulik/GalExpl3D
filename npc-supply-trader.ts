// npc-supply-trader.ts
import type { 
    NpcSupplyTraderData, 
    CorporationData,
    StationMarketData, 
    StationInfo, 
    AnyItem, 
    StorageLocation,
    Ship
} from './types';
import { getItemData, SHIP_DATA } from './constants';
import { calculatePrice } from './npc-traders';

const STATION_BUY_MARGIN = 1.05;

const getTimerForState = (state: NpcSupplyTraderData['state']): number => {
    switch (state) {
        case 'IDLE': return 10;
        case 'CHECKING_ORDERS': return 5;
        case 'TRAVELING_TO_BUY': return 30;
        case 'BUYING': return 5;
        case 'TRAVELING_TO_DELIVER': return 30;
        case 'DELIVERING': return 5;
        default: return 60;
    }
};

const findBestSourceForItem = (
    materialId: string,
    stationMarketData: StationMarketData,
    allStations: StationInfo[]
): { stationId: string; price: number; available: number } | null => {
    const itemData = getItemData(materialId);
    if (!itemData || !itemData.basePrice) return null;

    let bestOption = null;
    let lowestPrice = Infinity;

    for (const station of allStations) {
        const stationInventory = stationMarketData[station.id] || {};
        const availableQuantity = stationInventory[materialId] || 0;
        
        if (availableQuantity > 0) {
            const price = calculatePrice(itemData.basePrice, availableQuantity) * STATION_BUY_MARGIN;
            if (price < lowestPrice) {
                lowestPrice = price;
                bestOption = { stationId: station.id, price, available: availableQuantity };
            }
        }
    }
    return bestOption;
};


export function updateNpcSupplyTraders(
    currentTraders: Record<string, NpcSupplyTraderData>,
    currentCorporations: Record<string, CorporationData>,
    currentMarketData: StationMarketData,
    allStations: StationInfo[],
    tickInterval: number
): {
    updatedTraders: Record<string, NpcSupplyTraderData>,
    updatedCorporations: Record<string, CorporationData>,
    updatedMarketData: StationMarketData
} {
    const updatedTraders: Record<string, NpcSupplyTraderData> = JSON.parse(JSON.stringify(currentTraders));
    const updatedCorporations: Record<string, CorporationData> = JSON.parse(JSON.stringify(currentCorporations));
    const updatedMarketData: StationMarketData = JSON.parse(JSON.stringify(currentMarketData));

    for (const uuid in updatedTraders) {
        const trader = updatedTraders[uuid];
        const corporation = updatedCorporations[trader.corporationId];
        if (!corporation) continue;

        trader.stateTimer -= tickInterval;

        if (trader.stateTimer <= 0) {
            switch (trader.state) {
                case 'IDLE':
                    trader.state = 'CHECKING_ORDERS';
                    break;
                
                case 'CHECKING_ORDERS':
                    const buyOrders = corporation.buyOrders || {};
                    const materialsNeeded = Object.keys(buyOrders);
                    
                    if (materialsNeeded.length > 0) {
                        const materialToGet = materialsNeeded[0];
                        const quantityNeeded = buyOrders[materialToGet];
                        
                        const source = findBestSourceForItem(materialToGet, currentMarketData, allStations);
                        
                        if (source) {
                            const ship = SHIP_DATA[trader.shipId] as Ship;
                            const item = getItemData(materialToGet);
                            
                            if (ship && item && item.volume) {
                                const maxCanAfford = Math.floor(corporation.isk / source.price);
                                const maxCanFit = Math.floor(ship.attributes.cargoCapacity / item.volume);
                                const quantityToBuy = Math.min(quantityNeeded, maxCanAfford, maxCanFit, source.available);

                                if (quantityToBuy > 0) {
                                    trader.currentTarget = {
                                        materialId: materialToGet,
                                        quantity: quantityToBuy,
                                        buyStationId: source.stationId
                                    };
                                    trader.state = 'TRAVELING_TO_BUY';
                                } else {
                                    trader.state = 'IDLE'; // Can't afford/fit any, wait a bit.
                                }
                            } else {
                                trader.state = 'IDLE';
                            }
                        } else {
                            trader.state = 'IDLE'; // No one is selling, wait
                        }
                    } else {
                        trader.state = 'IDLE'; // No orders, wait
                    }
                    break;

                case 'TRAVELING_TO_BUY':
                    if (trader.currentTarget) {
                        const systemId = parseInt(trader.currentTarget.buyStationId.split('_')[1], 10);
                        trader.currentSystemId = systemId;
                        trader.currentLocationId = trader.currentTarget.buyStationId;
                        trader.state = 'BUYING';
                    } else {
                        trader.state = 'IDLE';
                    }
                    break;

                case 'BUYING':
                    if (trader.currentTarget) {
                        const target = trader.currentTarget;
                        const itemData = getItemData(target.materialId);
                        const sourceStationInfo = allStations.find(s => s.id === target.buyStationId);

                        if (itemData?.basePrice && sourceStationInfo) {
                            const currentStock = updatedMarketData[sourceStationInfo.id]?.[target.materialId] || 0;
                            const price = calculatePrice(itemData.basePrice, currentStock) * STATION_BUY_MARGIN;
                            const totalCost = target.quantity * price;

                            if (corporation.isk >= totalCost && currentStock >= target.quantity) {
                                corporation.isk -= totalCost;
                                trader.cargo.materials[target.materialId] = (trader.cargo.materials[target.materialId] || 0) + target.quantity;
                                updatedMarketData[sourceStationInfo.id][target.materialId] -= target.quantity;
                                trader.state = 'TRAVELING_TO_DELIVER';
                            } else {
                                // Conditions changed (price, stock, or isk), re-evaluate
                                trader.state = 'IDLE';
                                trader.currentTarget = null;
                            }
                        } else {
                            trader.state = 'IDLE';
                        }
                    } else {
                        trader.state = 'IDLE';
                    }
                    break;
                
                case 'TRAVELING_TO_DELIVER':
                    const homeSystemId = parseInt(corporation.homeStationId.split('_')[1], 10);
                    trader.currentSystemId = homeSystemId;
                    trader.currentLocationId = corporation.homeStationId;
                    trader.state = 'DELIVERING';
                    break;

                case 'DELIVERING':
                    if (trader.currentTarget) {
                        const materialId = trader.currentTarget.materialId;
                        const deliveredQty = trader.cargo.materials[materialId] || 0;

                        if (deliveredQty > 0) {
                            corporation.assetHangar.materials[materialId] = (corporation.assetHangar.materials[materialId] || 0) + deliveredQty;
                            if (corporation.buyOrders) {
                                corporation.buyOrders[materialId] = (corporation.buyOrders[materialId] || 0) - deliveredQty;
                                if (corporation.buyOrders[materialId] <= 0) {
                                    delete corporation.buyOrders[materialId];
                                }
                            }
                            delete trader.cargo.materials[materialId];
                        }
                    }
                    trader.currentTarget = null;
                    trader.state = 'IDLE';
                    break;
            }
            trader.stateTimer = getTimerForState(trader.state);
        }
    }

    return { updatedTraders, updatedCorporations, updatedMarketData };
}
