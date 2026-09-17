# High-priority product media queue

Updated 2026-09-17. This is a local planning/acquisition queue, not a database snapshot or a claim that imagery exists. No images were acquired/generated, no imports were run, and no catalogue records/categories were changed. No exact current models were researched or declared verified in this queue update.

## Active files

- [250 ranked existing generic products](../almahbub-beta-media-runner/beta-product-media-manifest.json)
- [30 exact-product research briefs](current-product-research.json)
- [All 14 owner-requested groups and taxonomy gaps](priority-media-requested-coverage.json)

## Selection and routing

The previous active beta queue contained 100 entries, including two POS terminals and ten fabric entries. The new first wave contains neither. It favors recognizable products and useful category diversity rather than alphabetical rows. Editorial criteria are weighted in the requested order: visual attractiveness 7, commercial relevance 6, current-market appeal 5, category coverage 4, buyer attraction 3, recognizability 2, promotion suitability 1. Scores are editorial judgments, not measured demand or verified current-market research. Category saturation and repeat-family penalties distribute the order; at most four existing variants of a family are selected. Slugs break residual ties deterministically.

Every selected row retains its existing name, slug and category. Generic imagery uses clean modern ecommerce presentation, realistic product identity, no fake logos/text/watermarks, and full outfits when the actual product is a set. Existing uniform/scrub sets must not be represented as senator sets, dresses or consumer fashion they are not. Ambiguous machinery identity must be clarified before generation. Exact branded/model products always leave the generic workflow for current_product_research.

`generation_ready` means a generic brief can be prepared, subject to identity confirmation and visual/provenance review. It is not generated, approved or import-ready media. The acquisition runner remains a source-photo acquisition tool. Research tasks are separate from its products list so they cannot be imported as invented products.

## Existing-product allocation

| Existing category | First-wave identities |
|---|---:|
| iphones-gadgets | 50 |
| office-business | 30 |
| home-appliances | 40 |
| home-garden-wares | 30 |
| machineries | 30 |
| fashion-textiles | 15 |
| beauty-spa-salon | 26 |
| medical-equipments | 25 |
| retail-store-setup | 4 |
| **Total** | **250** |

General Procurement bundles are deferred from this wave. Retail retains only four label-printer identities in their existing category. Office machines take priority over checkout equipment. Branded current phones/laptops/earbuds/watches/footwear are research tasks, not fabricated model listings.

## Coverage still blocked by real catalogue gaps

The existing 250-product selection is executable as a generic-media plan, but the full requested consumer mix is NOT complete. Resolve these gaps before claiming ready-made fashion, shoes, watches, earbuds, kitchen utensils or mechanical-parts coverage. Do not fill reserved priorities with additional obscure inventory.

- **Ready-made fashion**: Existing rows focus on fabrics, uniforms, scrub sets, polo/T-shirt lots and work footwear. Native/senator/kaftan sets, trousers, suits, dresses, abayas, jilbabs and the requested consumer outfit mix need real product identity definitions before mapping. Do not substitute uniform photographs for them.
- **Consumer footwear, watches and bags**: Sneakers, heels, sandals, slides, flats, consumer watches, handbags, wallets, belts and sunglasses lack matching rows in this package. Work boots and safety shoes do not fill those identities. Smart watches require identity-based review against Electronics/Wearables.
- **Audio and small digital accessories**: Earbuds, charging-case earbuds, wireless chargers, smart watches/displays, dedicated microphones and consumer headphones need identity matching/new genuine records. Existing headsets are not automatically earbuds or exact branded headphones.
- **Office machines**: No matching document scanner, paper cutter, large-format printer/plotter, safe, cash/document counter or attendance-terminal rows. Existing multifunction printers/projectors/networking are in Electronics; label printers are in Retail. Flag category review, do not move them silently or equate access-control systems with attendance terminals.
- **Kitchen equipment**: No standalone Kitchen category. Existing appliances cover ovens, ranges, blenders and coffee machines, but cookware, knives, cutlery, dinnerware, food containers, racks/trolleys, commercial sinks/worktables and mixers require genuine product/category mapping. Do not label assorted appliances as cookware coverage.
- **Mechanical parts**: No bearings, pulleys, gears, shafts, couplings, motors, gear motors, valves, industrial hoses, hydraulic parts or pneumatic component rows. Keep these requested priorities blocked on identity definition, not fabricated entries.
- **Additional home, garden and medical priorities**: Washer-dryers, portable ACs, air coolers, induction cookers, air fryers, garment steamers, accent/coffee/bedside tables, TV stands, wheelbarrows, irrigation accessories, examination couches, instrument trolleys, medical cabinets, thermometers and laboratory glassware/balances need product-level matching; near names are not interchangeable.

A dedicated Kitchen category does not currently exist. Watches/wearables also need identity-based placement in the current taxonomy. Existing multifunction printers/projectors/networking in Electronics and label printers in Retail remain there; reclassification requires explicit review. No automatic DB-category changes are part of this work.

## Verification

- 250 unique existing slugs; names and categories match the authoritative local catalogue.
- Global priorities are contiguous 1?250; all targets match existing primary-image media-plan filenames.
- Zero POS/point-of-sale and zero fabric products in the active first wave.
- All 30 research tasks remain unverified, have no invented product slug/model, and prohibit generation.
- All 14 requested product groups are retained in the coverage brief.
- Deterministic regeneration produced identical manifest bytes.
- Historical provenance/import mappings/review output are preserved; no acquisition/import/database command ran.

## Ranked existing-product first wave

| Rank | Existing product | Existing category | Route |
|---:|---|---|---|
| 1 | Colour Photocopier | office-business | generation_ready |
| 2 | Silent Diesel Generator | machineries | generation_ready |
| 3 | Premium Smartphone | iphones-gadgets | generation_ready |
| 4 | Sectional Sofa | home-garden-wares | generation_ready |
| 5 | Premium Salon Styling Chair | beauty-spa-salon | generation_ready |
| 6 | Side-by-side Household Refrigerator | home-appliances | generation_ready |
| 7 | LED Examination Light | medical-equipments | generation_ready |
| 8 | Inverter Petrol Generator | machineries | generation_ready |
| 9 | All-in-one Desktop Computer | iphones-gadgets | generation_ready |
| 10 | 4K Conference Camera | office-business | generation_ready |
| 11 | Inverter Air Conditioner | home-appliances | generation_ready |
| 12 | LED Salon Mirror Station | beauty-spa-salon | generation_ready |
| 13 | Digital Blood Pressure Monitor | medical-equipments | generation_ready |
| 14 | Ultrawide Monitor | iphones-gadgets | generation_ready |
| 15 | Rotary-screw Air Compressor | machineries | generation_ready |
| 16 | Front-load Washing Machine | home-appliances | generation_ready |
| 17 | Inverter Welding Machine | machineries | generation_ready |
| 18 | Wireless Headset | iphones-gadgets | generation_ready |
| 19 | Digital Facial Steamer | beauty-spa-salon | generation_ready |
| 20 | Digital Microscope | medical-equipments | generation_ready |
| 21 | Digital Microwave Oven | home-appliances | generation_ready |
| 22 | Digital Hair Steamer | beauty-spa-salon | generation_ready |
| 23 | Outdoor Wireless Access Point | iphones-gadgets | generation_ready |
| 24 | French-door Household Refrigerator | home-appliances | generation_ready |
| 25 | Wireless Keyboard | iphones-gadgets | generation_ready |
| 26 | Cordless Hair Clipper | beauty-spa-salon | generation_ready |
| 27 | Wireless Computer Mouse | iphones-gadgets | generation_ready |
| 28 | Cordless Electric Iron | home-appliances | generation_ready |
| 29 | Digital Wax Heater | beauty-spa-salon | generation_ready |
| 30 | High-refresh Monitor | iphones-gadgets | generation_ready |
| 31 | 4K Webcam | iphones-gadgets | generation_ready |
| 32 | LED Nail Lamp | beauty-spa-salon | generation_ready |
| 33 | Mesh Wireless Access Point | iphones-gadgets | generation_ready |
| 34 | Thermal Label Printer | retail-store-setup | generation_ready |
| 35 | Performance Polo Shirt Lot | fashion-textiles | generation_ready |
| 36 | Six-seat Dining Table | home-garden-wares | generation_ready |
| 37 | Mobile-stand Interactive Display | office-business | generation_ready |
| 38 | V-neck T-Shirt Lot | fashion-textiles | generation_ready |
| 39 | Single Bed Frame | home-garden-wares | generation_ready |
| 40 | Semi-electric Hospital Bed | medical-equipments | generation_ready |
| 41 | Personal Document Shredder | office-business | generation_ready |
| 42 | Two-door Wardrobe | home-garden-wares | generation_ready |
| 43 | Medium Chest Freezer | home-appliances | generation_ready |
| 44 | Office Corporate Uniform Set | fashion-textiles | generation_ready |
| 45 | Transfer Patient Trolley | medical-equipments | generation_ready |
| 46 | Roll Laminating Machine | office-business | generation_ready |
| 47 | Surface Water Pump | machineries | generation_ready |
| 48 | Wall-mounted Shelving Unit | home-garden-wares | generation_ready |
| 49 | Single-door Upright Freezer | home-appliances | generation_ready |
| 50 | Tablet | iphones-gadgets | generation_ready |
| 51 | Wheelchair Medical Scale | medical-equipments | generation_ready |
| 52 | Women’s Medical Scrub Set | fashion-textiles | generation_ready |
| 53 | Ultrabook Laptop | iphones-gadgets | generation_ready |
| 54 | Reclining Shampoo Station | beauty-spa-salon | generation_ready |
| 55 | Laptop Backpack | fashion-textiles | generation_ready |
| 56 | Ventilated Manicure Table | beauty-spa-salon | generation_ready |
| 57 | UV Towel Warmer | beauty-spa-salon | generation_ready |
| 58 | Indoor Wireless Access Point | iphones-gadgets | generation_ready |
| 59 | Wire Binding Machine | office-business | generation_ready |
| 60 | Variable-speed Drill Press | machineries | generation_ready |
| 61 | Wooden Outdoor Chair | home-garden-wares | generation_ready |
| 62 | Vented Clothes Dryer | home-appliances | generation_ready |
| 63 | Rackmount Uninterruptible Power Supply | office-business | generation_ready |
| 64 | Vertical Milling Machine | machineries | generation_ready |
| 65 | Round Garden Table | home-garden-wares | generation_ready |
| 66 | Large-capacity Dishwasher | home-appliances | generation_ready |
| 67 | Paediatric Pulse Oximeter | medical-equipments | generation_ready |
| 68 | Thermal Receipt Printer | office-business | generation_ready |
| 69 | Tool-and-cutter Grinding Machine | machineries | generation_ready |
| 70 | Self-propelled Lawn Mower | home-garden-wares | generation_ready |
| 71 | Portable Audio Speaker | iphones-gadgets | generation_ready |
| 72 | Double Electric Oven | home-appliances | generation_ready |
| 73 | Plasma Metal Cutting Machine | machineries | generation_ready |
| 74 | Petrol Hedge Trimmer | home-garden-wares | generation_ready |
| 75 | Refrigerated Laboratory Centrifuge | medical-equipments | generation_ready |
| 76 | Solar-assisted Power Bank | iphones-gadgets | generation_ready |
| 77 | Network Label Printer | retail-store-setup | generation_ready |
| 78 | Gas Cooking Range | home-appliances | generation_ready |
| 79 | Monochrome Photocopier | office-business | generation_ready |
| 80 | Portable External SSD | iphones-gadgets | generation_ready |
| 81 | Executive Briefcase | fashion-textiles | generation_ready |
| 82 | Vacuum Sealing Machine | machineries | generation_ready |
| 83 | Portable Pressure Washer | home-garden-wares | generation_ready |
| 84 | Vaccine-storage Medical Refrigerator | medical-equipments | generation_ready |
| 85 | Personal Blender | home-appliances | generation_ready |
| 86 | Short-throw Projector | iphones-gadgets | generation_ready |
| 87 | 86-inch Interactive Display | office-business | generation_ready |
| 88 | Large Chest Freezer | home-appliances | generation_ready |
| 89 | Wrapping Packaging Machine | machineries | generation_ready |
| 90 | Two-seater Sofa | home-garden-wares | generation_ready |
| 91 | Wi-Fi 7 Network Router | iphones-gadgets | generation_ready |
| 92 | Vertical Autoclave | medical-equipments | generation_ready |
| 93 | Rolling Salon Trolley | beauty-spa-salon | generation_ready |
| 94 | Travel Duffel Bag | fashion-textiles | generation_ready |
| 95 | Wide-angle Conference Camera | office-business | generation_ready |
| 96 | Smartphone | iphones-gadgets | generation_ready |
| 97 | Espresso Coffee Maker | home-appliances | generation_ready |
| 98 | Three-phase Diesel Generator | machineries | generation_ready |
| 99 | Petrol Brush Cutter | home-garden-wares | generation_ready |
| 100 | Rugged Tablet | iphones-gadgets | generation_ready |
| 101 | Temperature-control Electric Kettle | home-appliances | generation_ready |
| 102 | Office Document Shredder | office-business | generation_ready |
| 103 | Platform Medical Scale | medical-equipments | generation_ready |
| 104 | Portable Petrol Generator | machineries | generation_ready |
| 105 | Outdoor Dining Table | home-garden-wares | generation_ready |
| 106 | Mobile Workstation Laptop | iphones-gadgets | generation_ready |
| 107 | Double-door Upright Freezer | home-appliances | generation_ready |
| 108 | Reclining Salon Styling Chair | beauty-spa-salon | generation_ready |
| 109 | Document Bag | fashion-textiles | generation_ready |
| 110 | Paediatric Hospital Bed | medical-equipments | generation_ready |
| 111 | Pouch Laminating Machine | office-business | generation_ready |
| 112 | Mechanical Workshop Tool Set | machineries | generation_ready |
| 113 | Workstation Desktop Computer | iphones-gadgets | generation_ready |
| 114 | Queen Bed Frame | home-garden-wares | generation_ready |
| 115 | Window Air Conditioner | home-appliances | generation_ready |
| 116 | Wall-mounted Beauty Storage Cabinet | beauty-spa-salon | generation_ready |
| 117 | Top-load Water Dispenser | home-appliances | generation_ready |
| 118 | Trolley Agricultural Sprayer | machineries | generation_ready |
| 119 | Hydraulic Patient Trolley | medical-equipments | generation_ready |
| 120 | USB-C USB Hub | iphones-gadgets | generation_ready |
| 121 | Three-door Wardrobe | home-garden-wares | generation_ready |
| 122 | Water-resistant Work Boot | fashion-textiles | generation_ready |
| 123 | Portable Shampoo Station | beauty-spa-salon | generation_ready |
| 124 | Wet-and-dry Vacuum Cleaner | home-appliances | generation_ready |
| 125 | Portable Air Compressor | machineries | generation_ready |
| 126 | Portable External Hard Drive | iphones-gadgets | generation_ready |
| 127 | Wall-mounted Examination Light | medical-equipments | generation_ready |
| 128 | Heavy-duty Shelving Unit | home-garden-wares | generation_ready |
| 129 | Twin-tub Washing Machine | home-appliances | generation_ready |
| 130 | Multifunction Printer | iphones-gadgets | generation_ready |
| 131 | Storage Manicure Table | beauty-spa-salon | generation_ready |
| 132 | TIG Welding Machine | machineries | generation_ready |
| 133 | Slip-on Safety Shoe | fashion-textiles | generation_ready |
| 134 | Storage Water Heater | home-appliances | generation_ready |
| 135 | Transport Wheelchair | medical-equipments | generation_ready |
| 136 | Wall-mounted Salon Mirror Station | beauty-spa-salon | generation_ready |
| 137 | Submersible Water Pump | machineries | generation_ready |
| 138 | Smart Air Purifier | home-appliances | generation_ready |
| 139 | Upper-arm Blood Pressure Monitor | medical-equipments | generation_ready |
| 140 | Professional Towel Warmer | beauty-spa-salon | generation_ready |
| 141 | Event Polo Shirt Lot | fashion-textiles | generation_ready |
| 142 | Round-neck T-Shirt Lot | fashion-textiles | generation_ready |
| 143 | Industrial Corporate Uniform Set | fashion-textiles | generation_ready |
| 144 | High-density Wireless Access Point | iphones-gadgets | generation_ready |
| 145 | Unisex Medical Scrub Set | fashion-textiles | generation_ready |
| 146 | Thermal Binding Machine | office-business | generation_ready |
| 147 | Online Uninterruptible Power Supply | office-business | generation_ready |
| 148 | Wired Headset | iphones-gadgets | generation_ready |
| 149 | Portable Receipt Printer | office-business | generation_ready |
| 150 | Stackable Outdoor Chair | home-garden-wares | generation_ready |
| 151 | PA Audio Speaker | iphones-gadgets | generation_ready |
| 152 | Industrial Label Printer | retail-store-setup | generation_ready |
| 153 | Heat-pump Clothes Dryer | home-appliances | generation_ready |
| 154 | Resin Garden Table | home-garden-wares | generation_ready |
| 155 | High-capacity Power Bank | iphones-gadgets | generation_ready |
| 156 | High-volume Photocopier | office-business | generation_ready |
| 157 | Magnetic Drill Press | machineries | generation_ready |
| 158 | Freestanding Dishwasher | home-appliances | generation_ready |
| 159 | Push Lawn Mower | home-garden-wares | generation_ready |
| 160 | Portable Projector | iphones-gadgets | generation_ready |
| 161 | 75-inch Interactive Display | office-business | generation_ready |
| 162 | Handheld Pulse Oximeter | medical-equipments | generation_ready |
| 163 | Universal Milling Machine | machineries | generation_ready |
| 164 | Countertop Electric Oven | home-appliances | generation_ready |
| 165 | Tabletop Facial Steamer | beauty-spa-salon | generation_ready |
| 166 | Wi-Fi 6 Network Router | iphones-gadgets | generation_ready |
| 167 | Long-reach Hedge Trimmer | home-garden-wares | generation_ready |
| 168 | Rugged Smartphone | iphones-gadgets | generation_ready |
| 169 | Room-system Conference Camera | office-business | generation_ready |
| 170 | Freestanding Cooking Range | home-appliances | generation_ready |
| 171 | Surface Grinding Machine | machineries | generation_ready |
| 172 | Trinocular Microscope | medical-equipments | generation_ready |
| 173 | Tabletop Hair Steamer | beauty-spa-salon | generation_ready |
| 174 | Large-screen Tablet | iphones-gadgets | generation_ready |
| 175 | Hot-water Pressure Washer | home-garden-wares | generation_ready |
| 176 | Solo Microwave Oven | home-appliances | generation_ready |
| 177 | Micro-cut Document Shredder | office-business | generation_ready |
| 178 | Cut-off Metal Cutting Machine | machineries | generation_ready |
| 179 | Wired Keyboard | iphones-gadgets | generation_ready |
| 180 | Microhaematocrit Laboratory Centrifuge | medical-equipments | generation_ready |
| 181 | Lockable Salon Trolley | beauty-spa-salon | generation_ready |
| 182 | Three-seater Sofa | home-garden-wares | generation_ready |
| 183 | Household Blender | home-appliances | generation_ready |
| 184 | Laptop-capable Power Bank | iphones-gadgets | generation_ready |
| 185 | Heavy-duty Laminating Machine | office-business | generation_ready |
| 186 | Induction Sealing Machine | machineries | generation_ready |
| 187 | Glass-top Chest Freezer | home-appliances | generation_ready |
| 188 | Wired Computer Mouse | iphones-gadgets | generation_ready |
| 189 | Heavy-duty Brush Cutter | home-garden-wares | generation_ready |
| 190 | Undercounter Medical Refrigerator | medical-equipments | generation_ready |
| 191 | Professional Hair Clipper | beauty-spa-salon | generation_ready |
| 192 | Mini Desktop Computer | iphones-gadgets | generation_ready |
| 193 | Household Refrigerator | home-appliances | generation_ready |
| 194 | Vacuum Packaging Machine | machineries | generation_ready |
| 195 | Four-seat Dining Table | home-garden-wares | generation_ready |
| 196 | Touchscreen Monitor | iphones-gadgets | generation_ready |
| 197 | Drip Coffee Maker | home-appliances | generation_ready |
| 198 | Tabletop Autoclave | medical-equipments | generation_ready |
| 199 | Single-pot Wax Heater | beauty-spa-salon | generation_ready |
| 200 | Open-frame Diesel Generator | machineries | generation_ready |
| 201 | HD Webcam | iphones-gadgets | generation_ready |
| 202 | King Bed Frame | home-garden-wares | generation_ready |
| 203 | Standard Electric Kettle | home-appliances | generation_ready |
| 204 | Powered USB Hub | iphones-gadgets | generation_ready |
| 205 | Manual Hospital Bed | medical-equipments | generation_ready |
| 206 | Open-frame Petrol Generator | machineries | generation_ready |
| 207 | UV Nail Lamp | beauty-spa-salon | generation_ready |
| 208 | Display Upright Freezer | home-appliances | generation_ready |
| 209 | Desktop External Hard Drive | iphones-gadgets | generation_ready |
| 210 | Sliding-door Wardrobe | home-garden-wares | generation_ready |
| 211 | Maintenance Workshop Tool Set | machineries | generation_ready |
| 212 | Height-and-weight Medical Scale | medical-equipments | generation_ready |
| 213 | Tabletop Water Dispenser | home-appliances | generation_ready |
| 214 | Hydraulic Salon Styling Chair | beauty-spa-salon | generation_ready |
| 215 | Split Air Conditioner | home-appliances | generation_ready |
| 216 | Freestanding Shelving Unit | home-garden-wares | generation_ready |
| 217 | Mid-calf Work Boot | fashion-textiles | generation_ready |
| 218 | Piston Air Compressor | machineries | generation_ready |
| 219 | Heavy-duty Patient Trolley | medical-equipments | generation_ready |
| 220 | Mobile Beauty Storage Cabinet | beauty-spa-salon | generation_ready |
| 221 | Upright Vacuum Cleaner | home-appliances | generation_ready |
| 222 | Motorised Agricultural Sprayer | machineries | generation_ready |
| 223 | Top-load Washing Machine | home-appliances | generation_ready |
| 224 | Complete Shampoo Station | beauty-spa-salon | generation_ready |
| 225 | Procedure Examination Light | medical-equipments | generation_ready |
| 226 | Multi-process Welding Machine | machineries | generation_ready |
| 227 | Travel Electric Iron | home-appliances | generation_ready |
| 228 | Solar-assisted Water Heater | home-appliances | generation_ready |
| 229 | Spiral Binding Machine | office-business | generation_ready |
| 230 | Line-interactive Uninterruptible Power Supply | office-business | generation_ready |
| 231 | Network Receipt Printer | office-business | generation_ready |
| 232 | Desktop Label Printer | retail-store-setup | generation_ready |
| 233 | Noise-cancelling Headset | iphones-gadgets | generation_ready |
| 234 | Outdoor Audio Speaker | iphones-gadgets | generation_ready |
| 235 | A4 Photocopier | office-business | generation_ready |
| 236 | Fast-charge Power Bank | iphones-gadgets | generation_ready |
| 237 | 65-inch Interactive Display | office-business | generation_ready |
| 238 | Reclining Outdoor Chair | home-garden-wares | generation_ready |
| 239 | Laser Projector | iphones-gadgets | generation_ready |
| 240 | PTZ Conference Camera | office-business | generation_ready |
| 241 | Rectangular Garden Table | home-garden-wares | generation_ready |
| 242 | Home-office Network Router | iphones-gadgets | generation_ready |
| 243 | Enterprise Smartphone | iphones-gadgets | generation_ready |
| 244 | High-capacity Document Shredder | office-business | generation_ready |
| 245 | Petrol Lawn Mower | home-garden-wares | generation_ready |
| 246 | Education Tablet | iphones-gadgets | generation_ready |
| 247 | A4 Laminating Machine | office-business | generation_ready |
| 248 | Mechanical Keyboard | iphones-gadgets | generation_ready |
| 249 | High-performance Laptop | iphones-gadgets | generation_ready |
| 250 | Heavy-duty Binding Machine | office-business | generation_ready |
