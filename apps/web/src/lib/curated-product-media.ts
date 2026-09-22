export type CuratedProductMedia = {
  src: string;
  alt: string;
  sourceUrl: string;
  source: "manufacturer" | "wikimedia";
};

/**
 * Verified catalogue fallbacks for products whose durable ProductImage media
 * has not yet been imported. Database-backed ProductImage rows always win.
 */
export const CURATED_PRODUCT_MEDIA: Readonly<Record<string, CuratedProductMedia>> = {
  "on-cloud-6": {
    src: "https://images.ctfassets.net/hnk2vsx53n6l/2pHLf8aCLrQxrGCjJk26bG/55c4b7f6e1d9c8d9c3fc265c6ce1a173/5e1e876ff3833fccd30a05e41c41ce1acadab687.png?fm=webp",
    alt: "On Cloud 6 lifestyle shoe",
    sourceUrl: "https://www.on.com/en-de/products/cloud-6-m-3mf1007/mens",
    source: "manufacturer",
  },
  "coach-tabby-shoulder-bag-26": {
    src: "https://coach.scene7.com/is/image/Coach/ch857_b4bk_a0",
    alt: "Coach Tabby Shoulder Bag 26 in black",
    sourceUrl: "https://de.coach.com/de_DE/products/tabby-schultertasche-26/CH857.html",
    source: "manufacturer",
  },
  "tumi-alpha-bravo-navigation-backpack": {
    src: "https://de.tumi.com/dw/image/v2/AATF_PRD/on/demandware.static/-/Sites-tumi-product-catalog/default/dw7d3d9998/images/product/142497-1041_03.jpg?sh=1456&sw=1200",
    alt: "TUMI Alpha Bravo Navigation Backpack in black",
    sourceUrl: "https://de.tumi.com/en/alpha-bravo-alpha-bravo-navigation-backpack--black/142497-1041.html",
    source: "manufacturer",
  },
  "samsonite-proxis-spinner-75-cm": {
    src: "https://www.samsonite.de/dw/image/v2/AATF_PRD/on/demandware.static/-/Sites-samsonite-product-catalog/default/dw2ab40516/images/salsify/c1d48177cf9d804d8f954abe939091387bf87b07_s--v81MYLrt--_fl_clip_pg_1_e_trim_c_fit_w_2000_h_3000_u_tcrttuyt8xafi2acibgb_fl_layer_apply_e_make_transparent.png?sh=900&sw=600",
    alt: "Samsonite Proxis Spinner 75 cm suitcase",
    sourceUrl: "https://www.samsonite.de/proxis-spinner-75-28-matt-climbing-ivy/126042-9781.html",
    source: "manufacturer",
  },
  "apple-airpods-5": {
    src: "https://www.apple.com/newsroom/images/2026/09/apple-introduces-airpods-5-with-best-in-class-open-ear-active-noise-cancellation/article/Apple-AirPods-5-hero-260909_big.jpg.large.jpg",
    alt: "Apple AirPods 5 with charging case",
    sourceUrl: "https://www.apple.com/newsroom/2026/09/apple-introduces-airpods-5-with-best-in-class-open-ear-active-noise-cancellation/",
    source: "manufacturer",
  },
  "miele-guard-l1-comfort-titanium-pf": {
    src: "https://media.miele.com/dam/1ff48f01-ca24-4948-822d-b3bb006f62f9/20000214241_HighresDigitalRGB.png",
    alt: "Miele Guard L1 Comfort Titanium-PF vacuum cleaner",
    sourceUrl: "https://www.miele.de/product/12559020/bodenstaubsauger-mit-beutel-guard-l1-comfort-titanium-pf",
    source: "manufacturer",
  },
  "miele-wq-1200-wps-nova-edition": {
    src: "https://media.miele.com/dam/c73fca2f-f44b-4279-a1df-b3bb008aedee/20000217091_HighresDigitalRGB.png",
    alt: "Miele WQ 1200 WPS Nova Edition washing machine",
    sourceUrl: "https://www.miele.de/product/12698680/w2-waschmaschine-frontlader-wq-1200-wps-nova-edition",
    source: "manufacturer",
  },
  "apc-smart-ups-srt3000xli": {
    src: "https://download.se.com/files?default_image=DefaultProductImage.png&p_Doc_Ref=SPD_JPRO-A2MPQW_FL_V&p_File_Type=rendition_369_jpg",
    alt: "APC Smart-UPS SRT3000XLI 3000VA UPS",
    sourceUrl: "https://www.se.com/ae/en/product/SRT3000XLI/apc-smartups-srt-3000va-230v/",
    source: "manufacturer",
  },
  "dji-mini-5-pro": {
    src: "https://se-cdn.djiits.com/tpc/uploads/spu/cover/89bd715bc6795bc6f966bf4d18130e36%40small.png?format=webp",
    alt: "DJI Mini 5 Pro drone",
    sourceUrl: "https://store.dji.com/de/product/dji-mini-5-pro-140w-gan-charging-combo?from=site-nav&set_region=DE&vid=242571",
    source: "manufacturer",
  },
  "epson-workforce-enterprise-am-c550": {
    src: "https://mediaserver.goepson.com/adaptivemedia/rendition?assetDescr=AM-C550_hero-awards-headon_690x460%402x&clid=SAPDAM&id=ff5c23378412464091673a7d4e21bd4ac5cf3e4e&prclid=banner&prid=1200Wx1200H&vid=96d40831d5ab2c4ced0e7520427e9458fbddc350",
    alt: "Epson WorkForce Enterprise AM-C550 multifunction printer",
    sourceUrl: "https://epson.com/For-Work/Printers/Inkjet/WorkForce-Enterprise-AM-C550-A4-Color-Multifunction-Printer/p/C11CJ92201",
    source: "manufacturer",
  },
  "honeywell-ct47-mobile-computer": {
    src: "https://honeywell.scene7.com/is/image/Honeywell65/sps-pss-ct47-primary",
    alt: "Honeywell CT47 handheld mobile computer",
    sourceUrl: "https://automation.honeywell.com/us/en/products/productivity-solutions/mobile-computers/handheld-computers/ct47-handheld-computer",
    source: "manufacturer",
  },
  "wahl-5-star-hi-viz-trimmer": {
    src: "https://www.wahlpro.com/media/catalog/product/3/0/3023699-hi-viz_hero.jpg?quality=85&width=1920",
    alt: "Wahl 5 Star Hi-Viz Trimmer",
    sourceUrl: "https://www.wahlpro.com/shop/hi-viz-trimmer-3023699",
    source: "manufacturer",
  },
  "wahl-5-star-vanish": {
    src: "https://www.wahlpro.com/media/catalog/product/v/a/vanish-shaver-min.jpg?quality=85&width=1920",
    alt: "Wahl 5 Star Vanish Shaver",
    sourceUrl: "https://www.wahlpro.com/shop/vanish-shaver-08173-700",
    source: "manufacturer",
  },
  "wahl-cordless-legend": {
    src: "https://www.wahlpro.com/media/catalog/product/c/o/cordlesslegend-hero-3000x3000-min_1.jpg?quality=85&width=1920",
    alt: "Wahl Cordless Legend clipper",
    sourceUrl: "https://www.wahlpro.com/shop/cordless-legend-08594",
    source: "manufacturer",
  },
  "dyson-supersonic-r-professional": {
    src: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/primary/522238-01.png?%24responsive%24=&fmt=png-alpha",
    alt: "Dyson Supersonic r Professional hair dryer",
    sourceUrl: "https://www.dyson.com/commercial/hair-care/supersonic-r-professional",
    source: "manufacturer",
  },
  "ghd-chronos-max": {
    src: "https://amplience.ghdhair.com/i/ghd/689_PLP_PrimaryImage_ChronosMax_BlackUpright_Global?%24CarouselImageItem%24=&fmt=auto",
    alt: "ghd Chronos Max wide-plate hair straightener",
    sourceUrl: "https://www.ghdhair.com/de/glaetteisen/ghd-chronos-max-glaetteisen-weiss-p-690",
    source: "manufacturer",
  },
  "ghd-duet-blowdry": {
    src: "https://amplience.ghdhair.com/i/ghd/664_DuetBlowdry_PLP_PrimaryImage_White_Global?%24CarouselImageItem%24=&fmt=auto",
    alt: "ghd Duet Blowdry hair dryer brush",
    sourceUrl: "https://www.ghdhair.com/de/foehnbuersten/ghd-duet-blowdry-schwarz-p-663/",
    source: "manufacturer",
  },
  "haas-vf-2": {
    src: "https://www.haascnc.com/content/dam/haascnc/pdp_feed/machines/VF-2.png",
    alt: "Haas VF-2 CNC vertical mill",
    sourceUrl: "https://www.haascnc.com/machines/vertical-mills/vf-series/models/small/vf-2.html",
    source: "manufacturer",
  },
  "hobart-legacy-hl600": {
    src: "https://cdn2.webdamdb.com/1280_cbnmyVNkPjn01QKU.png?1781292805=",
    alt: "Hobart Legacy+ HL600 commercial floor mixer",
    sourceUrl: "https://www.hobartcorp.com/products/food-prep/mixers/legacy-plus-floor-mixers",
    source: "manufacturer",
  },
  "eppendorf-centrifuge-5910-ri": {
    src: "https://www.eppendorf.com/product-media/img/global/966241/Eppendorf_Centrifugation_Centrifuge-5910-Ri_side-view-open_product.jpg?imwidth=540",
    alt: "Eppendorf Centrifuge 5910 Ri",
    sourceUrl: "https://www.eppendorf.com/de-de/Produkte/Zentrifugation/IVD-Produkte/Centrifuge-5910Ri-p-PF-963295",
    source: "manufacturer",
  },
  "hobart-hcm450": {
    src: "https://cdn2.webdamdb.com/1280_QPsLC82Lu9S91Qfa.png?1721775125=",
    alt: "Hobart HCM450 vertical cutter mixer",
    sourceUrl: "https://www.hobartcorp.com/products/food-prep/mixers/cutter-mixers",
    source: "manufacturer",
  },
  "nilfisk-sc250-34c-b-eu-uk": {
    src: "https://www.nilfisk.com/product-images-1920/SC250-masked-ps-Original-ETEEJJ.webp",
    alt: "Nilfisk SC250 34C B scrubber dryer",
    sourceUrl: "https://www.nilfisk.com/global/professional/products/floor-cleaning/scrubber-dryers/walk-behind-scrubber-and-dryers/small/sc250-34c-b-eu-uk%2B9087380020/",
    source: "manufacturer",
  },
  "gardena-smart-water-control-19033-20": {
    src: "https://media.husqvarnagroup.com/image/SS-405844.png?fit=bounds&format=webply&height=520&optimize=low&width=750",
    alt: "GARDENA smart Water Control 19033-20",
    sourceUrl: "https://www.gardena.com/de/produkte/bewaesserung/bewaesserungssteuerung/smart-water-control/970825901.html",
    source: "manufacturer",
  },
  "lg-washtower-wt1210bbf": {
    src: "https://www.lg.com/content/dam/channel/wcms/de/images/washer-dryers/wt1210bbf/gallery/2010-02.jpg/jcr%3Acontent/renditions/thum-1600x1062.jpeg?w=800",
    alt: "LG WashTower WT1210BBF front view",
    sourceUrl: "https://www.lg.com/de/waeschepflege/washtower/wt1210bbf/",
    source: "manufacturer",
  },
  "hp-poly-studio-x70": {
    src: "https://www.hp.com/content/dam/sites/worldwide/poly/video-conferencing/all-in-one/studio-x70/KSP%20Carousel%20-%20Desktop%20%E2%80%93%204%402x.png",
    alt: "HP Poly Studio X70 all-in-one video bar",
    sourceUrl: "https://www.hp.com/us-en/poly/video-conferencing/all-in-one/studio-x70.html",
    source: "manufacturer",
  },
  "zebra-ds9308": {
    src: "https://www.zebra.com/content/dam/zebra_dam/global/zcom-web-production/web-production-photography/web001/ds9300-series-ds9308-sr-upper-front-right-black3x2-3600.jpg",
    alt: "Zebra DS9308 presentation barcode scanner",
    sourceUrl: "https://www.zebra.com/gb/en/products/scanners/general-purpose-hands-free-scanners/ds9300-series/ds9308.html",
    source: "manufacturer",
  },
  "logitech-rally-bar": {
    src: "https://resource.logitech.com/w_692%2Cc_lpad%2Car_4%3A3%2Cq_auto%2Cf_auto%2Cdpr_1.0/d_transparent.gif/content/dam/logitech/en/products/video-conferencing/rally-bar/buy/gallery/rally-bar-graphite-01.png?v=1",
    alt: "Logitech Rally Bar all-in-one video bar",
    sourceUrl: "https://www.logitech.com/de-de/products/video-conferencing/room-solutions/rallybar.html",
    source: "manufacturer",
  },
  "dyson-purifier-big-quiet-formaldehyde-bp04": {
    src: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/primary/410624-01.png?$responsive$=&fmt=png-alpha",
    alt: "Dyson Purifier Big+Quiet Formaldehyde BP04",
    sourceUrl: "https://www.dyson.de/raumklima/luftreiniger/purifier-big-quiet-formaldehyde/nachtblau-gold-bp04",
    source: "manufacturer",
  },
  "bosch-serie-6-kgn49aibt": {
    src: "https://media3.bsh-group.com/Product_Shots/19966825_KGN49AIBT_STP_def.webp",
    alt: "Bosch Serie 6 KGN49AIBT fridge freezer",
    sourceUrl: "https://www.bosch-home.com/de/de/product/kuehlen-gefrieren/kuehl-gefrier-kombinationen/freistehende-kuehl-gefrier-kombinationen-gefrierteil-unten/KGN49AIBT",
    source: "manufacturer",
  },
  "bosch-serie-8-hsg7584b1": {
    src: "https://media3.bsh-group.com/Product_Shots/20123457_HSG7584B1_STP_def.webp",
    alt: "Bosch Serie 8 HSG7584B1 steam oven",
    sourceUrl: "https://www.bosch-home.com/de/de/product/kochen-backen/dampfbackoefen-dampfgarer/dampfbackoefen/HSG7584B1",
    source: "manufacturer",
  },
  "bosch-serie-8-mums8zs00": {
    src: "https://media3.bsh-group.com/Product_Shots/25829289_MUMS8ZS00_STP__def.webp",
    alt: "Bosch Serie 8 MUMS8ZS00 kitchen machine",
    sourceUrl: "https://www.bosch-home.com/de/de/product/kuechenmaschinen/mum-kuechenmaschinen/kuechenmaschinen-serie8/MUMS8ZS00",
    source: "manufacturer",
  },
  "benq-lu935st": {
    src: "https://image.benq.com/is/image/benqco/lu935st-front?$ResponsivePreset$",
    alt: "BenQ LU935ST laser short-throw projector",
    sourceUrl: "https://www.benq.com/en-us/business/projector/lu935st.html",
    source: "manufacturer",
  },
  "brother-ads-4900w": {
    src: "https://assets.brother.com/transform/c3b2618c-ad7e-4730-bcc3-6caaafa0be90/17531_ADS4900W-Spinner-1-846x846-jpg?io=transform%3Afit%2Cwidth%3A1000",
    alt: "Brother ADS-4900W professional desktop scanner",
    sourceUrl: "https://www.brother-usa.com/p/desktop-scanners/ADS4900W",
    source: "manufacturer",
  },
  "apple-ipad-air-m4-series": {
    src: "https://www.apple.com/newsroom/images/2026/03/apple-introduces-the-new-ipad-air-powered-by-m4/tile/Apple-iPad-Air-M4-multitasking-260302-lp.jpg.og.jpg?202608191652",
    alt: "Apple iPad Air with M4",
    sourceUrl: "https://www.apple.com/newsroom/2026/03/apple-introduces-the-new-ipad-air-powered-by-m4/",
    source: "manufacturer",
  },
  "apple-iphone-18-pro-series": {
    src: "https://www.apple.com/newsroom/images/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/tile/Apple-iPhone-18-Pro-2up-260909-lp.jpg.og.jpg?202609212009",
    alt: "Apple iPhone 18 Pro and iPhone 18 Pro Max",
    sourceUrl: "https://www.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/",
    source: "manufacturer",
  },
  "apple-iphone-duo": {
    src: "https://www.apple.com/newsroom/images/2026/09/apple-unveils-iphone-duo/tile/Apple-iPhone-Duo-opening-iPhone-Duo-260909-lp.jpg.og.jpg?202609212008",
    alt: "Apple iPhone Duo",
    sourceUrl: "https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/",
    source: "manufacturer",
  },
  "apple-macbook-pro-m5-pro-m5-max-series": {
    src: "https://www.apple.com/newsroom/images/2026/03/apple-introduces-macbook-pro-with-all-new-m5-pro-and-m5-max/tile/Apple-MacBook-Pro-M5-Pro-and-M5-Max-Capture-One-260303-lp.jpg.og.jpg?202608191802",
    alt: "Apple MacBook Pro with M5 Pro and M5 Max",
    sourceUrl: "https://www.apple.com/newsroom/2026/03/apple-introduces-macbook-pro-with-all-new-m5-pro-and-m5-max/",
    source: "manufacturer",
  },
  "bosch-advancedrotak-44-750": {
    src: "https://www.bosch-diy.com/imagestorage/de-de/advancedrotak-44-750-100057263-hires-png-rgb-oneux-431667_w_800_h_418.png?imgWidth=800&imgHeight=418",
    alt: "Bosch AdvancedRotak 44-750 lawn mower",
    sourceUrl: "https://www.bosch-diy.com/de/de/p/advancedrotak-44-750-06008b9j00",
    source: "manufacturer",
  },
  "bosch-serie-8-wgb256a41": {
    src: "https://media3.bsh-group.com/Product_Shots/25210814_WGB256A41_PGA1_def.webp",
    alt: "Bosch Serie 8 WGB256A41 washing machine",
    sourceUrl: "https://www.bosch-home.com/de/de/product/WGB256A41",
    source: "manufacturer",
  },
  "casio-g-shock-ga-v01-series": {
    src: "https://www.casio.com/content/dam/casio/product-info/locales/de/de/timepiece/product/watch/G/GA/gav/ga-v01-7a/assets/GA-V01-7A.png",
    alt: "Casio G-SHOCK GA-V01 watch",
    sourceUrl: "https://www.casio.com/de/watches/gshock/product.GA-V01-7A/",
    source: "manufacturer",
  },
  "ge-healthcare-vscan-air-sl": {
    src: "https://s7d9.scene7.com/is/image/gehealthcare/vscan-air-sl-product-tile-en?fmt=webp",
    alt: "GE HealthCare Vscan Air SL handheld ultrasound",
    sourceUrl: "https://www.gehealthcare.com/products/ultrasound/handheld-ultrasound/vscan-air-sl",
    source: "manufacturer",
  },
  "husqvarna-automower-450x-nera": {
    src: "https://www-static-nw.husqvarna.com/-/images/aprimo/husqvarna/robotic-mowers/photos/studio/p/pc/pc-350263.jpg?v=441f7a3d152aa71&format=opengraph-cover",
    alt: "Husqvarna Automower 450X NERA",
    sourceUrl: "https://www.husqvarna.com/de/maehroboter/automower-450x-nera/",
    source: "manufacturer",
  },
  "k-rcher-br-30-4-c-bp": {
    src: "https://s1.kaercher-media.com/mam/17832340/mainproduct/172223/d0.jpg",
    alt: "Kärcher BR 30/4 C Bp scrubber dryer",
    sourceUrl: "https://www.kaercher.com/int/professional/floor-scrubbers-scrubber-driers/compact-scrubber-driers/br-30-4-c-bp-17832340.html",
    source: "manufacturer",
  },
  "k-rcher-puzzi-10-1": {
    src: "https://s1.kaercher-media.com/mam/11001300/mainproduct/d306ec1a-1aef-462c-90e9-5a99c134aef9/d0.jpg",
    alt: "Kärcher Puzzi 10/1 spray extraction machine",
    sourceUrl: "https://www.kaercher.com/int/professional/carpet-cleaner/spray-extraction-machines/puzzi-10-1-11001300.html",
    source: "manufacturer",
  },
  "k-rcher-t-11-1-classic-hepa": {
    src: "https://s1.kaercher-media.com/mam/15271990/mainproduct/2d05f606-0146-49f1-902d-9ecc0ce7868c/d0.jpg",
    alt: "Kärcher T 11/1 Classic HEPA vacuum cleaner",
    sourceUrl: "https://www.kaercher.com/int/professional/vacuums/dry-vacuum-cleaners/t-11-1-classic-hepa-15271990.html",
    source: "manufacturer",
  },
  "k-rcher-wv-7-signature-line": {
    src: "https://s1.kaercher-media.com/mam/16337800/mainproduct/211448/d0.jpg",
    alt: "Kärcher WV 7 Signature Line window vacuum",
    sourceUrl: "https://www.kaercher.com/int/home-garden/window-vacs/wv-7-signature-line-16337800.html",
    source: "manufacturer",
  },
  "mindray-benevision-n22": {
    src: "https://www.mindray.com/content/xpace/en/products/patient-monitoring/continuous-patient-monitoring/benevision-n22-n19.thumb.319.319.png",
    alt: "Mindray BeneVision N22 patient monitor",
    sourceUrl: "https://www.mindray.com/en/products/patient-monitoring/continuous-patient-monitoring/benevision-n22-n19",
    source: "manufacturer",
  },
  "philips-intellivue-mx850": {
    src: "https://images.philips.com/is/image/philipsconsumer/7a1df1a54ca4420a9c76aa8b00db4b44",
    alt: "Philips IntelliVue MX850 patient monitor",
    sourceUrl: "https://www.usa.philips.com/healthcare/product/HC866470/intellivue-mx850-bedside-patient-monitor",
    source: "manufacturer",
  },
  "robot-coupe-cl-50": {
    src: "https://www.robot-coupe.com/robot-coupe-global/Products/Coupes-Legumes/CL50/image-thumb__34771__RBC_cover_center_1140_580/CL50-1V%20READY.png",
    alt: "Robot-Coupe CL 50 vegetable preparation machine",
    sourceUrl: "https://www.robot-coupe.com/usa/en_US/p/vegetable-preparation-machines-cl-50-1v/20672",
    source: "manufacturer",
  },
  "robot-coupe-cl-50-ultra": {
    src: "https://www.robot-coupe.com/robot-coupe-global/Products/Coupes-Legumes/image-thumb__20108__RBC_cover_center_1140_580/CL%2050%20Ultra%20photo%20machine.png",
    alt: "Robot-Coupe CL 50 Ultra vegetable preparation machine",
    sourceUrl: "https://www.robot-coupe.com/export/en/p/vegetable-preparation-machines-cl-50-ultra/20673",
    source: "manufacturer",
  },
  "roche-cobas-pure-integrated-solutions": {
    src: "https://pim-media.roche.com/Images/cobas_pure_system.jpg?scl=1",
    alt: "Roche cobas pure integrated solutions analyzer",
    sourceUrl: "https://diagnostics.roche.com/global/en/products/systems/cobas-pure-integrated-solutions-sys-351.html",
    source: "manufacturer",
  },
  "toyota-lifter-lhm230": {
    src: "https://tmhe-media.azureedge.net/published/715_2500x700_toyota%20mh.jpg",
    alt: "Toyota Lifter LHM230 hand pallet truck",
    sourceUrl: "https://toyota-forklifts.eu/premium-trucks/hand-pallet-trucks/",
    source: "manufacturer",
  },
  "zebra-zd421": {
    src: "https://www.zebra.com/content/dam/zebra_dam/global/zcom-web-production/web-production-photography/product-cards/series/zd400-series-1x1.jpg",
    alt: "Zebra ZD421 desktop printer",
    sourceUrl: "https://www.zebra.com/de/de/products/printers/desktop/zd400-series.html",
    source: "manufacturer",
  },
  "google-pixel-11-pro-series": {
    src: "https://lh3.googleusercontent.com/LP4fWGXX_e-7i7cl_8Zs3qlFq6n92rxXO0az_SOV3wc2LP5mP9wxkm0Jjdu8urbOJOLaGdzdoeXWf5CVAvsIeH3xwljO28AUvnlq=w720-h900-rw-nu",
    alt: "Google Pixel 11 Pro official product image",
    sourceUrl: "https://store.google.com/jp/magazine/meet-google-pixel-11-pro?hl=ja",
    source: "manufacturer",
  },
  "apple-macbook-air-m5-series": {
    src: "https://www.apple.com/newsroom/images/2026/03/apple-introduces-the-new-macbook-air-with-m5/article/Apple-MacBook-Air-13-inch-and-15-inch-260303_big.jpg.large.jpg",
    alt: "Apple MacBook Air with M5 13-inch and 15-inch models",
    sourceUrl: "https://www.apple.com/newsroom/2026/03/apple-introduces-the-new-macbook-air-with-m5/",
    source: "manufacturer",
  },
  "abbott-i-stat-alinity": {
    src: "https://www.globalpointofcare.abbott/us/en/product-details/apoc/istat-alinity/_jcr_content/root/container/columncontrol/tab_item_no_1/image.coreimg.jpeg/1777040758041/istat-alinity-pp-imga-375.jpeg",
    alt: "Abbott i-STAT Alinity handheld blood analyzer",
    sourceUrl: "https://www.globalpointofcare.abbott/us/en/product-details/apoc/istat-alinity.html",
    source: "manufacturer",
  },
  "hamilton-c6": {
    src: "https://media.ffycdn.net/eu/hamilton-medical-ag/PQt7kGy8xH6iDpTzdvn8.png?quality=50&width=640",
    alt: "HAMILTON-C6 ICU ventilator",
    sourceUrl: "https://www.hamilton-medical.com/en_US/Products/HAMILTON-C6.html",
    source: "manufacturer",
  },
  "adidas-samba-og": {
    src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Adidas_Samba_OG.jpg",
    alt: "adidas Samba OG shoe",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Adidas_Samba_OG.jpg",
    source: "wikimedia",
  },
};

export function curatedProductMedia(slug: string): CuratedProductMedia | null {
  return CURATED_PRODUCT_MEDIA[slug] ?? null;
}
