# Game Manual

Welcome to the official game manual. This document contains detailed specifications for ores, ships, modules, and blueprints available in the game (For Code Name Orca Version/Current).

### Table of Contents
- [Ore Specifications and Reprocessing Yields](#ore-specifications)
- [Ship Specifications](#ship-specifications)
- [Module Specifications](#module-specifications)
    - [High Slot Modules](#high-slot-modules)
    - [Medium Slot Modules](#medium-slot-modules)
    - [Low Slot Modules](#low-slot-modules)
    - [Rig Slot Modules](#rig-slot-modules)
- [Blueprint Specifications](#blueprint-specifications)
    - [Ship Blueprints](#ship-blueprints)
    - [Module Blueprints](#module-blueprints)
    - [Other Blueprints](#other-blueprints)

---

### <a name="ore-specifications"></a>Ore Specifications and Reprocessing Yields
This table details the properties of each ore and the amount of each mineral you can obtain by reprocessing a single unit.

| Icon | Ore Name | Volume (m³) | Base Price | Rarity | Max Security | Description | Reprocessing Yield |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| ⛏️ | Veldspar | 0.1 | 10 | Common | 1.0 | The most common ore in the galaxy. Contains massive amounts of Tritanium. | **Tritanium:** 415 |
| ⛏️ | Scordite | 0.15 | 15 | Common | 1.0 | Common ore containing both Tritanium and Pyerite. | **Tritanium:** 346<br>**Pyerite:** 173 |
| ⛏️ | Pyroxeres | 0.3 | 25 | Common | 0.9 | Complex ore with traces of Nocxium. | **Tritanium:** 351<br>**Pyerite:** 25<br>**Mexallon:** 50<br>**Nocxium:** 5 |
| 💎 | Plagioclase | 0.35 | 40 | Uncommon | 0.7 | Valuable ore rich in Pyerite and Mexallon. | **Tritanium:** 107<br>**Pyerite:** 213<br>**Mexallon:** 107 |
| 💎 | Omber | 0.6 | 50 | Uncommon | 0.7 | Dense ore with good yields of Pyerite and Isogen. | **Tritanium:** 85<br>**Pyerite:** 34<br>**Isogen:** 85 |
| 💎 | Kernite | 1.2 | 60 | Uncommon | 0.7 | Fairly rare ore with excellent Mexallon content. | **Tritanium:** 134<br>**Mexallon:** 267<br>**Isogen:** 134 |
| 🔷 | Jaspet | 2.0 | 100 | Rare | 0.4 | Valuable ore with diverse mineral content. | **Tritanium:** 72<br>**Pyerite:** 121<br>**Mexallon:** 144<br>**Nocxium:** 72<br>**Zydrine:** 3 |
| 🔷 | Hemorphite | 3.0 | 120 | Rare | 0.2 | Rare ore with good Isogen and Nocxium yields. | **Tritanium:** 180<br>**Pyerite:** 72<br>**Mexallon:** 17<br>**Isogen:** 59<br>**Nocxium:** 118<br>**Zydrine:** 8 |
| 🔷 | Hedbergite | 3.0 | 140 | Rare | 0.2 | Valuable ore rich in Pyerite and Isogen. | **Pyerite:** 343<br>**Isogen:** 196<br>**Nocxium:** 98<br>**Zydrine:** 19 |
| ⭐ | Arkonor | 16.0 | 300 | Exceptional | 0.0 | One of the rarest ores, rich in Megacyte. | **Tritanium:** 6905<br>**Mexallon:** 1278<br>**Megacyte:** 230 |
| ⭐ | Bistot | 16.0 | 350 | Exceptional | 0.0 | Extremely valuable ore with high Zydrine content. | **Pyerite:** 3200<br>**Mexallon:** 1280<br>**Zydrine:** 256<br>**Megacyte:** 128 |
| ⭐ | Crokite | 16.0 | 400 | Exceptional | 0.0 | The most valuable ore, exceptionally rich in Nocxium. | **Tritanium:** 10171<br>**Nocxium:** 760<br>**Zydrine:** 127<br>**Megacyte:** 254 |
| 🧊 | Blue Ice | 1000.0 | 500 | Rare | 0.5 | Frozen isotope used for capital ship fuel. | **Heavy Water:** 50<br>**Liquid Ozone:** 25<br>**Strontium Clathrates:** 1<br>**Oxygen Isotopes:** 300 |
| 🌙 | Spodumain | 16.0 | 250 | Rare | 0.0 | Moon-mined ore with exceptional Tritanium yields. | **Tritanium:** 39221<br>**Pyerite:** 4972<br>**Mexallon:** 78<br>**Isogen:** 245 |

[Back to Top](#table-of-contents)

---

### <a name="ship-specifications"></a>Ship Specifications
| Ship Name | Class | Race | Base Price | Description | Defenses (Hull/Armor/Shield) | Slots (H/M/L/R) | Bonuses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rookie Ship** | Frigate | Civilian | 0 | Basic civilian vessel provided free by insurance. | 350 / 350 / 350 | 2 / 2 / 1 / 0 | *None* |
| **Rifter** | Frigate | Minmatar | 500,000 | Fast attack frigate with excellent speed and agility. | 450 / 400 / 450 | 4 / 3 / 3 / 3 | 5% Projectile Damage per skill level.<br>7.5% Projectile Tracking per skill level. |
| **Merlin** | Frigate | Caldari | 500,000 | Shield-tanked frigate with strong defensive capabilities. | 400 / 350 / 600 | 3 / 4 / 2 / 3 | 5% Hybrid Damage per skill level.<br>4% Shield Resistance per skill level. |
| **Incursus** | Frigate | Gallente | 500,000 | Armor-tanked brawler with drone capabilities. | 450 / 550 / 400 | 3 / 3 / 4 / 3 | 5% Hybrid Damage per skill level.<br>7.5% Armor Repair Amount per skill level. |
| **Punisher** | Frigate | Amarr | 500,000 | Heavy armor tank frigate with laser weapons. | 500 / 600 / 350 | 4 / 2 / 4 / 3 | 5% Laser Damage per skill level.<br>-10% Laser Capacitor Use per skill level. |
| **Venture** | Mining Frigate | ORE | 750,000 | Specialized mining frigate with ore hold. | 500 / 400 / 500 | 3 / 3 / 1 / 3 | 100% Mining Yield (flat role bonus).<br>100% Gas Harvesting Yield (flat role bonus). |
| **Thrasher** | Destroyer | Minmatar | 1,500,000 | Glass cannon destroyer with high damage output. | 750 / 700 / 800 | 8 / 3 / 3 / 3 | 10% Projectile Damage per skill level.<br>10% Projectile Tracking per skill level. |
| **Stabber** | Cruiser | Minmatar | 10,000,000 | Fast attack cruiser, excellent for hit-and-run tactics. | 2000 / 1800 / 2200 | 6 / 4 / 4 / 3 | 5% Projectile Damage per skill level.<br>5% Ship Velocity per skill level. |
| **Vexor** | Cruiser | Gallente | 11,000,000 | Drone-focused cruiser with strong versatility. | 2200 / 2400 / 2000 | 4 / 4 / 5 / 3 | 10% Drone Damage per skill level.<br>10% Drone Hitpoints per skill level. |
| **Retriever** | Mining Barge | ORE | 25,000,000 | Specialized mining barge with large ore hold. | 3500 / 2000 / 3000 | 2 / 4 / 2 / 3 | 200% Mining Yield (flat role bonus).<br>-2% Strip Miner Duration per skill level. |
| **Hurricane** | Battlecruiser | Minmatar | 45,000,000 | Versatile battlecruiser with balanced offense and defense. | 5500 / 5000 / 6000 | 8 / 4 / 6 / 3 | 5% Projectile Damage per skill level.<br>5% Projectile Rate of Fire per skill level. |
| **Tempest** | Battleship | Minmatar | 150,000,000 | Fast battleship with powerful artillery capabilities. | 8000 / 7500 / 9000 | 8 / 5 / 6 / 3 | 5% Projectile Damage per skill level.<br>7.5% Projectile Rate of Fire per skill level. |
| **Dominix** | Battleship | Gallente | 160,000,000 | Drone-focused battleship with massive drone bay. | 9000 / 10000 / 7500 | 6 / 5 / 7 / 3 | 10% Drone Damage per skill level.<br>10% Drone Hitpoints per skill level. |
| **Badger** | Industrial | Caldari | 1,000,000 | Basic cargo hauler for transporting goods. | 2500 / 1500 / 3000 | 2 / 4 / 3 / 3 | 5% Cargo Capacity per skill level. |
| **Orca** | Industrial Command Ship | ORE | 800,000,000 | Mining command ship with fleet support capabilities. | 150000 / 10000 / 15000 | 3 / 5 / 3 / 3 | 3% Mining Foreman burst strength per skill level.<br>5% Cargo Capacity per skill level.<br>250% Tractor Beam Range (flat role bonus). |

[Back to Top](#table-of-contents)

---

### <a name="module-specifications"></a>Module Specifications
#### <a name="high-slot-modules"></a>High Slot Modules
| Module Name | Size | Base Price | Description | Key Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **125mm Gatling AutoCannon I** | Small | 50,000 | Small projectile turret with high rate of fire. | **DPS:** ~3.56<br>**Range (Optimal+Falloff):** 1km + 5km |
| **280mm Howitzer Artillery I** | Small | 75,000 | Small artillery cannon with long range. | **DPS:** ~3.33<br>**Range (Optimal+Falloff):** 12km + 9km |
| **125mm Railgun I** | Small | 60,000 | Small railgun for long-range engagements. | **DPS:** 4.0<br>**Range (Optimal+Falloff):** 18km + 6km |
| **Light Electron Blaster I** | Small | 55,000 | Short-range blaster with high damage. | **DPS:** 4.0<br>**Range (Optimal+Falloff):** 1.5km + 2km |
| **Small Focused Pulse Laser I** | Small | 65,000 | Pulse laser with good damage and tracking. | **DPS:** ~2.86<br>**Range (Optimal+Falloff):** 4.5km + 2km |
| **Rocket Launcher I** | Small | 45,000 | Launches unguided rockets at close range. | **DPS:** 3.75 |
| **Light Missile Launcher I** | Small | 55,000 | Launches guided light missiles. | **DPS:** ~4.17 |
| **Miner I** | Small | 30,000 | Basic mining laser for asteroid mining. | **Mining Yield:** 40 m³/cycle<br>**Range:** 10km |
| **Miner II** | Small | 500,000 | Advanced mining laser with improved yield. | **Mining Yield:** 60 m³/cycle<br>**Range:** 12km |
| **Strip Miner I** | Medium | 5,000,000 | Industrial-scale mining laser for barges. | **Mining Yield:** 540 m³/cycle<br>**Range:** 15km |

---
#### <a name="medium-slot-modules"></a>Medium Slot Modules
| Module Name | Size | Base Price | Description | Key Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **Small Shield Extender I** | Small | 40,000 | Increases maximum shield capacity. | **Shield HP Bonus:** +200 |
| **Small Shield Booster I** | Small | 50,000 | Active shield repair module. | **Shield Boost:** 25 HP / 3s |
| **Adaptive Invulnerability Field I** | All | 100,000 | Increases shield resistances across all damage types. | **Shield Resistances:** +25% to all |
| **1MN Afterburner I** | Small | 35,000 | Increases ship velocity. | **Velocity Bonus:** +50% |
| **1MN Microwarpdrive I** | Small | 150,000 | Greatly increases velocity but increases signature. | **Velocity Bonus:** +400%<br>**Signature Penalty:** +400% |
| **Warp Scrambler I** | All | 80,000 | Prevents target from warping. | **Strength:** 2 points<br>**Range:** 7.5km |
| **Stasis Webifier I** | All | 60,000 | Reduces target velocity. | **Velocity Reduction:** -50%<br>**Range:** 10km |

---
#### <a name="low-slot-modules"></a>Low Slot Modules
| Module Name | Size | Base Price | Description | Key Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **Small Drone Launching Bay** | All | 250,000 | A bay that allows for the deployment and control of small drones. | Enables drone control. |
| **200mm Steel Plates I** | Small | 30,000 | Increases armor hit points. | **Armor HP Bonus:** +300 |
| **Small Armor Repairer I** | Small | 45,000 | Repairs armor damage. | **Armor Repair:** 30 HP / 5s |
| **Adaptive Nano Plating I** | All | 70,000 | Increases armor resistances. | **Armor Resistances:** +15% to all |
| **Gyrostabilizer I** | All | 50,000 | Increases projectile weapon damage and rate of fire. | **Projectile Damage:** +10%<br>**Projectile Rate of Fire:** +5% |
| **Magnetic Field Stabilizer I**| All | 50,000 | Increases hybrid weapon damage and rate of fire. | **Hybrid Damage:** +10%<br>**Hybrid Rate of Fire:** +5% |
| **Heat Sink I** | All | 50,000 | Increases energy weapon damage and rate of fire. | **Energy Damage:** +10%<br>**Energy Rate of Fire:** +5% |
| **Ballistic Control System I** | All | 55,000 | Increases missile damage and rate of fire. | **Missile Damage:** +10%<br>**Missile Rate of Fire:** +5% |
| **Power Diagnostic System I** | All | 40,000 | Increases powergrid, CPU, capacitor, and shields. | **All Stats:** +5% (PG, CPU, Cap, Shield) |
| **Capacitor Power Relay I** | All | 35,000 | Increases capacitor recharge rate. | **Capacitor Recharge:** +20% |
| **Mining Laser Upgrade I** | All | 100,000 | Increases mining laser yield. | **Mining Yield:** +5% |

---
#### <a name="rig-slot-modules"></a>Rig Slot Modules
| Module Name | Size | Base Price | Description | Key Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **Small Core Defense Field Extender I** | Small | 500,000 | Increases shield hit points. | **Shield HP Bonus:** +15%<br>**Penalty:** +10% Signature Radius |
| **Small Trimark Armor Pump I** | Small | 500,000 | Increases armor hit points. | **Armor HP Bonus:** +15%<br>**Penalty:** -10% Velocity |
| **Small Auxiliary Thrusters I** | Small | 400,000 | Increases ship velocity. | **Velocity Bonus:** +10%<br>**Penalty:** -10% Armor HP |

[Back to Top](#table-of-contents)

---

### <a name="blueprint-specifications"></a>Blueprint Specifications
#### <a name="ship-blueprints"></a>Ship Blueprints
| Blueprint Name | Output Ship | Mfg. Time | BP Price | Required Materials |
| :--- | :--- | :--- | :--- | :--- |
| **Rookie Ship Blueprint** | Rookie Ship | 10 minutes | 10,000 | **Tritanium:** 5,000<br>**Pyerite:** 1,000 |
| **Rifter Blueprint** | Rifter | 1 hour | 1,000,000 | **Tritanium:** 28,000<br>**Pyerite:** 7,000<br>**Mexallon:** 1,750<br>**Isogen:** 350<br>**Nocxium:** 35 |
| **Merlin Blueprint** | Merlin | 1 hour | 1,000,000 | **Tritanium:** 30,000<br>**Pyerite:** 6,000<br>**Mexallon:** 2,000<br>**Isogen:** 400<br>**Nocxium:** 40 |
| **Incursus Blueprint**| Incursus | 1 hour | 1,000,000 | **Tritanium:** 29,000<br>**Pyerite:** 6,500<br>**Mexallon:** 1,800<br>**Isogen:** 370<br>**Nocxium:** 38 |
| **Punisher Blueprint**| Punisher | 1 hour | 1,000,000 | **Tritanium:** 31,000<br>**Pyerite:** 5,500<br>**Mexallon:** 1,600<br>**Isogen:** 390<br>**Nocxium:** 42 |
| **Venture Blueprint**| Venture | 1.25 hours | 1,500,000 | **Tritanium:** 35,000<br>**Pyerite:** 8,000<br>**Mexallon:** 3,000<br>**Isogen:** 500<br>**Nocxium:** 50<br>**Zydrine:** 10 |
| **Thrasher Blueprint**| Thrasher | 2 hours | 3,000,000 | **Tritanium:** 120,000<br>**Pyerite:** 30,000<br>**Mexallon:** 7,500<br>**Isogen:** 1,500<br>**Nocxium:** 150<br>**Zydrine:** 50 |
| **Stabber Blueprint**| Stabber | 3 hours | 20,000,000 | **Tritanium:** 1,800,000<br>**Pyerite:** 450,000<br>**Mexallon:** 112,500<br>**Isogen:** 22,500<br>**Nocxium:** 5,625<br>**Zydrine:** 1,125<br>**Megacyte:** 450 |
| **Vexor Blueprint** | Vexor | 3 hours | 22,000,000 | **Tritanium:** 2,000,000<br>**Pyerite:** 400,000<br>**Mexallon:** 125,000<br>**Isogen:** 25,000<br>**Nocxium:** 6,000<br>**Zydrine:** 1,200<br>**Megacyte:** 500 |
| **Retriever Blueprint**| Retriever | 4 hours | 50,000,000 | **Tritanium:** 3,000,000<br>**Pyerite:** 600,000<br>**Mexallon:** 200,000<br>**Isogen:** 40,000<br>**Nocxium:** 10,000<br>**Zydrine:** 2,000<br>**Megacyte:** 800 |
| **Hurricane Blueprint**| Hurricane | 6 hours | 40,000,000 | **Tritanium:** 5,000,000<br>**Pyerite:** 1,200,000<br>**Mexallon:** 300,000<br>**Isogen:** 60,000<br>**Nocxium:** 15,000<br>**Zydrine:** 3,000<br>**Megacyte:** 1,200 |
| **Tempest Blueprint**| Tempest | 10 hours | 100,000,000 | **Tritanium:** 7,000,000<br>**Pyerite:** 1,800,000<br>**Mexallon:** 450,000<br>**Isogen:** 90,000<br>**Nocxium:** 22,500<br>**Zydrine:** 4,500<br>**Megacyte:** 1,800 |
| **Dominix Blueprint**| Dominix | 10 hours | 110,000,000 | **Tritanium:** 7,500,000<br>**Pyerite:** 1,600,000<br>**Mexallon:** 500,000<br>**Isogen:** 100,000<br>**Nocxium:** 25,000<br>**Zydrine:** 5,000<br>**Megacyte:** 2,000 |
| **Badger Blueprint**| Badger | 1.5 hours | 2,000,000 | **Tritanium:** 90,000<br>**Pyerite:** 25,000<br>**Mexallon:** 6,000<br>**Isogen:** 1,200 |
| **Orca Blueprint** | Orca | 48 hours | 500,000,000 | **Tritanium:** 40,000,000<br>**Pyerite:** 8,000,000<br>**Mexallon:** 2,000,000<br>**Isogen:** 400,000<br>**Nocxium:** 100,000<br>**Zydrine:** 20,000<br>**Megacyte:** 8,000 |

---
#### <a name="module-blueprints"></a>Module Blueprints
| Blueprint Name | Output Module | Mfg. Time | BP Price | Required Materials |
| :--- | :--- | :--- | :--- | :--- |
| **125mm Gatling AutoCannon I BP**| 125mm Gatling AutoCannon I| 10 minutes | 100,000 | **Tritanium:** 2,000<br>**Pyerite:** 500<br>**Mexallon:** 125 |
| **280mm Howitzer Artillery I BP**| 280mm Howitzer Artillery I| 11.7 minutes | 150,000 | **Tritanium:** 2,500<br>**Pyerite:** 600<br>**Mexallon:** 150<br>**Isogen:** 20 |
| **125mm Railgun I BP**| 125mm Railgun I | 10.8 minutes | 120,000 | **Tritanium:** 2,200<br>**Pyerite:** 550<br>**Mexallon:** 140<br>**Isogen:** 25 |
| **Light Electron Blaster I BP**| Light Electron Blaster I| 10 minutes | 110,000 | **Tritanium:** 2,100<br>**Pyerite:** 520<br>**Mexallon:** 130<br>**Isogen:** 20 |
| **Small Focused Pulse Laser I BP**| Small Focused Pulse Laser I| 10.8 minutes | 130,000 | **Tritanium:** 2,300<br>**Pyerite:** 580<br>**Mexallon:** 150<br>**Nocxium:** 10 |
| **Rocket Launcher I BP**| Rocket Launcher I | 9.2 minutes | 90,000 | **Tritanium:** 1,800<br>**Pyerite:** 450<br>**Mexallon:** 110 |
| **Light Missile Launcher I BP**| Light Missile Launcher I| 10 minutes | 110,000 | **Tritanium:** 2,200<br>**Pyerite:** 550<br>**Mexallon:** 140<br>**Isogen:** 20 |
| **Miner I Blueprint**| Miner I | 5 minutes | 60,000 | **Tritanium:** 1,500<br>**Pyerite:** 300<br>**Mexallon:** 75 |
| **Miner II Blueprint**| Miner II | 20 minutes | 1,000,000 | **Tritanium:** 10,000<br>**Pyerite:** 2,500<br>**Mexallon:** 600<br>**Isogen:** 120<br>**Nocxium:** 30 |
| **Strip Miner I Blueprint**| Strip Miner I | 30 minutes | 10,000,000| **Tritanium:** 100,000<br>**Pyerite:** 20,000<br>**Mexallon:** 5,000<br>**Isogen:** 1,000<br>**Nocxium:** 250 |
| **Small Shield Extender I BP**| Small Shield Extender I| 7.5 minutes | 80,000 | **Tritanium:** 1,800<br>**Pyerite:** 400<br>**Mexallon:** 100<br>**Isogen:** 15 |
| **Small Shield Booster I BP**| Small Shield Booster I| 7.5 minutes | 100,000 | **Tritanium:** 2,000<br>**Pyerite:** 450<br>**Mexallon:** 110<br>**Isogen:** 20<br>**Nocxium:** 5 |
| **Adaptive Invuln. Field I BP**| Adaptive Invuln. Field I| 13.3 minutes | 200,000 | **Tritanium:** 3,000<br>**Pyerite:** 750<br>**Mexallon:** 200<br>**Isogen:** 40<br>**Nocxium:** 10 |
| **1MN Afterburner I BP**| 1MN Afterburner I | 6.7 minutes | 70,000 | **Tritanium:** 1,600<br>**Pyerite:** 350<br>**Mexallon:** 90<br>**Isogen:** 10 |
| **1MN Microwarpdrive I BP**| 1MN Microwarpdrive I | 10 minutes | 300,000 | **Tritanium:** 5,000<br>**Pyerite:** 1,000<br>**Mexallon:** 250<br>**Isogen:** 50<br>**Nocxium:** 10 |
| **Warp Scrambler I BP**| Warp Scrambler I | 12.5 minutes | 160,000 | **Tritanium:** 2,500<br>**Pyerite:** 600<br>**Mexallon:** 150<br>**Isogen:** 30<br>**Nocxium:** 5 |
| **Stasis Webifier I BP**| Stasis Webifier I | 11.7 minutes | 120,000 | **Tritanium:** 2,200<br>**Pyerite:** 550<br>**Mexallon:** 140<br>**Isogen:** 25 |
| **Small Drone Launching Bay BP**| Small Drone Launching Bay| 15 minutes | 500,000 | **Tritanium:** 8,000<br>**Pyerite:** 2,000<br>**Mexallon:** 500<br>**Isogen:** 100 |
| **200mm Steel Plates I BP**| 200mm Steel Plates I | 6.7 minutes | 60,000 | **Tritanium:** 1,500<br>**Pyerite:** 350<br>**Mexallon:** 80 |
| **Small Armor Repairer I BP**| Small Armor Repairer I| 8.3 minutes | 90,000 | **Tritanium:** 1,800<br>**Pyerite:** 450<br>**Mexallon:** 110<br>**Isogen:** 10 |
| **Adaptive Nano Plating I BP**| Adaptive Nano Plating I| 10 minutes | 140,000 | **Tritanium:** 2,200<br>**Pyerite:** 550<br>**Mexallon:** 140<br>**Isogen:** 30<br>**Nocxium:** 5 |
| **Gyrostabilizer I BP**| Gyrostabilizer I | 9.2 minutes | 100,000 | **Tritanium:** 2,000<br>**Pyerite:** 500<br>**Mexallon:** 125 |
| **Mag. Field Stabilizer I BP**| Magnetic Field Stabilizer I| 9.2 minutes | 100,000 | **Tritanium:** 2,000<br>**Pyerite:** 500<br>**Mexallon:** 125<br>**Isogen:** 10 |
| **Heat Sink I Blueprint**| Heat Sink I | 9.2 minutes | 100,000 | **Tritanium:** 2,000<br>**Pyerite:** 500<br>**Mexallon:** 125<br>**Nocxium:** 5 |
| **Ballistic Control System I BP**| Ballistic Control System I| 10 minutes | 110,000 | **Tritanium:** 2,100<br>**Pyerite:** 520<br>**Mexallon:** 130<br>**Isogen:** 15 |
| **Power Diagnostic System I BP**| Power Diagnostic System I| 7.5 minutes | 80,000 | **Tritanium:** 1,700<br>**Pyerite:** 400<br>**Mexallon:** 100<br>**Isogen:** 10 |
| **Capacitor Power Relay I BP**| Capacitor Power Relay I| 6.7 minutes | 70,000 | **Tritanium:** 1,600<br>**Pyerite:** 380<br>**Mexallon:** 90 |
| **Mining Laser Upgrade I BP**| Mining Laser Upgrade I| 11.7 minutes | 200,000 | **Tritanium:** 3,000<br>**Pyerite:** 750<br>**Mexallon:** 200<br>**Isogen:** 20<br>**Nocxium:** 5 |
| **Small Core Defense Field Extender I BP** | Small Core Defense Field Extender I | 30 minutes | 1,000,000 | **Tritanium:** 25,000<br>**Pyerite:** 6,000<br>**Mexallon:** 1,500<br>**Isogen:** 300<br>**Nocxium:** 75 |
| **Small Trimark Armor Pump I BP** | Small Trimark Armor Pump I | 30 minutes | 1,000,000 | **Tritanium:** 28,000<br>**Pyerite:** 7,000<br>**Mexallon:** 1,800<br>**Isogen:** 50 |
| **Small Auxiliary Thrusters I BP** | Small Auxiliary Thrusters I | 26.7 minutes | 800,000 | **Tritanium:** 22,000<br>**Pyerite:** 5,500<br>**Mexallon:** 1,400<br>**Isogen:** 250 |

---
#### <a name="other-blueprints"></a>Other Blueprints
| Blueprint Name | Output Item | Qty | Mfg. Time | BP Price | Required Materials |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fusion S Blueprint** | Fusion S | 100 | 1 minute | 10,000 | **Tritanium:** 100<br>**Pyerite:** 20 |
| **Antimatter Charge S BP**| Antimatter Charge S | 100 | 1.5 minutes | 20,000 | **Tritanium:** 150<br>**Pyerite:** 30<br>**Mexallon:** 5 |
| **Scourge Rocket Blueprint**| Scourge Rocket | 100 | 2 minutes | 15,000 | **Tritanium:** 120<br>**Pyerite:** 25<br>**Mexallon:** 8<br>**Isogen:** 2 |
| **Small Combat Drone I BP**| Small Combat Drone I | 5 | 20 minutes | 150,000 | **Tritanium:** 10,000<br>**Pyerite:** 2,500<br>**Mexallon:** 600<br>**Isogen:** 120<br>**Nocxium:** 30 |
| **Mining Drone I BP**| Mining Drone I | 5 | 25 minutes | 200,000 | **Tritanium:** 12,000<br>**Pyerite:** 3,000<br>**Mexallon:** 500<br>**Isogen:** 150<br>**Nocxium:** 25 |
| **Construction Blocks BP**| Construction Blocks | 10 | 30 minutes | 1,000,000 | **Tritanium:** 50,000<br>**Pyerite:** 10,000<br>**Mexallon:** 2,500 |
| **Nanite Repair Paste BP**| Nanite Repair Paste | 50 | 15 minutes | 500,000 | **Tritanium:** 5,000<br>**Pyerite:** 1,000<br>**Mexallon:** 250<br>**Nocxium:** 50 |
| **Mining Platform BP**| Mining Platform | 1 | 12 hours | 50,000,000 | **Tritanium:** 5,000,000<br>**Pyerite:** 1,000,000<br>**Mexallon:** 250,000<br>**Isogen:** 50,000<br>**Nocxium:** 12,500<br>**Zydrine:** 2,500 |
| **Small Station BP**| Small Station | 1 | 24 hours | 100,000,000 | **Tritanium:** 10,000,000<br>**Pyerite:** 2,000,000<br>**Mexallon:** 500,000<br>**Isogen:** 100,000<br>**Nocxium:** 25,000<br>**Zydrine:** 5,000<br>**Megacyte:** 2,000 |

[Back to Top](#table-of-contents)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/peterbabulik/GalExpl3D/blob/main/Pictures/WeWantYou9.gif" />
</div>