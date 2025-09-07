/**
 * @file This file contains the schema for inventory and storage data.
 * This is not executable code, but a representation of the data structure.
 * The keys in some objects are dynamic and are represented by comments.
 */

export const StorageLocationSchema = {
    items: ['String'], // An array of item IDs. For unique items, these would be instance IDs.
    materials: {
        // <material_id>: <Number> (quantity)
    }
};

export const PlayerAssetSchema = {
    assetHangar: 'StorageLocationSchema', // Items not located in any specific station.
    stationHangars: {
        // <station_id>: 'StorageLocationSchema'
    }
};

// A unified schema for any item that can be stored.
export const ItemDataSchema = {
    id: 'String',
    name: 'String',
    category: 'String', // e.g., 'ship', 'module', 'material', 'blueprint'
    volume: 'Number', // in m3, for future capacity checks
    description: 'String',
    // ...other properties specific to the category
};
