-- StrainVerse — full strain encyclopedia seed (~100 cultivars)
-- Run in Supabase SQL Editor after sql/complete-schema.sql
-- For 500+ more: run sql/seed-strains-extended.sql
-- Safe to re-run: ON CONFLICT (name) DO UPDATE refreshes metadata

insert into "StrainVerse".strains
  (name, type, description, thc_min, thc_max, cbd_min, cbd_max, effects, flavors, genetics)
values

-- ═══ CLASSICS & LEGENDS ═══
('Blue Dream', 'Hybrid',
 'A potent cross between Blueberry and Haze. Balances full-body relaxation with gentle cerebral invigoration.',
 17, 24, 0, 2, '["creative", "energetic", "happy", "relaxed"]', '["berry", "sweet", "earthy"]', 'Blueberry x Haze'),

('Sour Diesel', 'Sativa',
 'Fast-acting, energizing cerebral effects with a pungent diesel aroma. A true East Coast legend.',
 19, 25, 0, 1, '["energetic", "creative", "happy", "uplifted"]', '["diesel", "citrus", "earthy"]', 'Chemdawg x Super Skunk'),

('OG Kush', 'Hybrid',
 'Legendary fuel-skunk-spice aroma with a mixed head-and-body high. Parent to countless modern hybrids.',
 19, 26, 0, 1, '["relaxed", "happy", "euphoric", "hungry"]', '["earthy", "pine", "woody", "diesel"]', 'Chemdawg x Lemon Thai x Hindu Kush'),

('Granddaddy Purple', 'Indica',
 'California indica staple with grape and berry aroma. Deep body relaxation and sleepy vibes.',
 17, 23, 0, 1, '["sleepy", "relaxed", "hungry", "happy"]', '["grape", "berry", "sweet"]', 'Mendo Purps x Skunk x Afghanistan'),

('Pineapple Express', 'Hybrid',
 'Sativa-dominant hybrid with tropical sweetness. Long-lasting energetic buzz for creative afternoons.',
 19, 25, 0, 1, '["energetic", "uplifted", "creative", "happy"]', '["pineapple", "sweet", "tropical", "citrus"]', 'Trainwreck x Hawaiian'),

('White Widow', 'Hybrid',
 'Dutch-bred balanced hybrid. Euphoric burst of energy that sparks conversation and creativity.',
 18, 25, 0, 1, '["happy", "energetic", "creative", "euphoric"]', '["earthy", "woody", "spicy", "herbal"]', 'Brazilian Sativa x South Indian Indica'),

('Jack Herer', 'Sativa',
 'Named for the cannabis activist. Clear-headed, blissful, creative sativa with pine and spice.',
 18, 24, 0, 1, '["happy", "uplifted", "energetic", "creative"]', '["pine", "earthy", "woody", "spicy"]', 'Haze x Northern Lights #5 x Shiva Skunk'),

('Northern Lights', 'Indica',
 'Pure indica classic. Resinous buds, sweet spicy aroma, and deeply relaxing effects.',
 16, 21, 0, 1, '["sleepy", "relaxed", "happy", "euphoric"]', '["spicy", "herbal", "earthy", "sweet"]', 'Afghani x Thai'),

('GSC', 'Hybrid',
 'Formerly Girl Scout Cookies. Sweet earthy punch with euphoric full-body effects.',
 19, 28, 0, 1, '["happy", "relaxed", "euphoric", "hungry"]', '["sweet", "earthy", "pungent", "mint"]', 'OG Kush x Durban Poison'),

('Girl Scout Cookies', 'Hybrid',
 'Same lineage as GSC — sweet, earthy, and euphoric. A modern hybrid icon.',
 19, 28, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["sweet", "earthy", "mint", "cherry"]', 'OG Kush x Durban Poison'),

-- ═══ SATIVAS ═══
('Durban Poison', 'Sativa',
 'Pure South African landrace sativa. Sweet anise aroma with clear, uplifting, energetic effects.',
 15, 25, 0, 1, '["energetic", "uplifted", "creative", "focused"]', '["sweet", "anise", "earthy", "citrus"]', 'South African Landrace'),

('Green Crack', 'Sativa',
 'Sharp energy and focus. Mango-forward flavor with a buzz that keeps you going all day.',
 15, 25, 0, 1, '["energetic", "focused", "uplifted", "happy"]', '["mango", "citrus", "sweet", "tropical"]', 'Skunk #1 x Unknown Indica'),

('Super Lemon Haze', 'Sativa',
 'Award-winning sativa with zesty lemon flavor. Uplifting, energetic, and mood-brightening.',
 18, 25, 0, 1, '["energetic", "uplifted", "happy", "creative"]', '["lemon", "citrus", "sweet", "tropical"]', 'Lemon Skunk x Super Silver Haze'),

('Strawberry Cough', 'Sativa',
 'Famous for its sweet strawberry scent and smooth smoke. Social, uplifting, anxiety-friendly sativa.',
 15, 20, 0, 1, '["uplifted", "happy", "energetic", "creative"]', '["strawberry", "sweet", "berry", "earthy"]', 'Strawberry Fields x Haze'),

('Amnesia Haze', 'Sativa',
 'Potent Amsterdam sativa. Earthy citrus haze with long-lasting euphoric cerebral effects.',
 20, 25, 0, 1, '["euphoric", "energetic", "creative", "uplifted"]', '["citrus", "earthy", "lemon", "spicy"]', 'Jamaican x South Asian Landraces'),

('Trainwreck', 'Sativa',
 'Mind-bending sativa with lemon-pine spice. Euphoric rush followed by deep relaxation.',
 18, 25, 0, 1, '["euphoric", "happy", "relaxed", "creative"]', '["lemon", "pine", "spicy", "earthy"]', 'Mexican x Thai x Afghani'),

('Maui Wowie', 'Sativa',
 'Hawaiian landrace sativa. Tropical pineapple flavor with light, creative, stress-melting effects.',
 10, 20, 0, 1, '["happy", "uplifted", "creative", "relaxed"]', '["pineapple", "tropical", "citrus", "sweet"]', 'Hawaiian Landrace'),

('Acapulco Gold', 'Sativa',
 'Legendary Mexican landrace. Golden buds with toasty honey flavor and motivating euphoria.',
 15, 23, 0, 1, '["euphoric", "energetic", "happy", "uplifted"]', '["earthy", "sweet", "coffee", "honey"]', 'Mexican Landrace'),

('Panama Red', 'Sativa',
 'Historic Central American sativa. Reddish buds, energetic cerebral high, and earthy spice.',
 14, 20, 0, 1, '["energetic", "creative", "uplifted", "happy"]', '["earthy", "spicy", "woody", "herbal"]', 'Panama Landrace'),

('Cinderella 99', 'Sativa',
 'Tropical fruit punch sativa with dreamy, euphoric effects. Great for daytime creativity.',
 18, 22, 0, 1, '["happy", "energetic", "creative", "uplifted"]', '["tropical", "citrus", "pineapple", "grapefruit"]', 'Jack Herer phenotype'),

('Tangie', 'Sativa',
 'California Orange lineage reborn. Explosive tangerine aroma with uplifting happy effects.',
 19, 22, 0, 1, '["uplifted", "happy", "energetic", "creative"]', '["citrus", "orange", "tangerine", "sweet"]', 'California Orange x Skunk'),

('Chocolope', 'Sativa',
 '95% sativa with coffee and chocolate aroma. Motivating, dreamy, and great for morning sessions.',
 18, 21, 0, 1, '["energetic", "euphoric", "creative", "uplifted"]', '["coffee", "chocolate", "earthy", "sweet"]', 'Chocolate Thai x Cannalope Haze'),

('Willie Nelson', 'Sativa',
 'Award-winning sativa named for the outlaw country icon. Spicy aromatics with soaring cerebral effects.',
 18, 26, 0, 1, '["energetic", "creative", "uplifted", "happy"]', '["spicy", "earthy", "pine", "herbal"]', 'Vietnamese x Highland Nepalese x South American'),

-- ═══ INDICAS ═══
('Afghan Kush', 'Indica',
 'Pure indica landrace from the Hindu Kush mountains. Heavy sedation and earthy hash flavor.',
 17, 21, 0, 1, '["sleepy", "relaxed", "hungry", "happy"]', '["earthy", "woody", "pungent", "sweet"]', 'Afghan Landrace'),

('Bubba Kush', 'Indica',
 'Stocky indica with coffee-chocolate notes. Heavy tranquilizing body effects for evening use.',
 14, 22, 0, 1, '["sleepy", "relaxed", "hungry", "happy"]', '["coffee", "chocolate", "earthy", "sweet"]', 'OG Kush x Unknown Indica'),

('Purple Kush', 'Indica',
 'West Coast indica with grape and earthy aroma. Deep physical relaxation and sleep support.',
 17, 27, 0, 1, '["sleepy", "relaxed", "hungry", "euphoric"]', '["grape", "earthy", "sweet", "berry"]', 'Hindu Kush x Purple Afghani'),

('Hindu Kush', 'Indica',
 'Ancient landrace from the Pakistan-Afghanistan border. Sweet sandalwood and heavy stone.',
 15, 20, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["earthy", "sweet", "woody", "pungent"]', 'Hindu Kush Landrace'),

('LA Confidential', 'Indica',
 'OG LA Affie phenotype. Smooth pine and skunk with fast-acting calming body effects.',
 16, 24, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["pine", "skunk", "earthy", "pungent"]', 'OG LA Affie x Unknown'),

('Master Kush', 'Indica',
 'Amsterdam classic bred from Hindu Kush. Citrus and incense with full-body bliss.',
 20, 24, 0, 1, '["relaxed", "happy", "sleepy", "euphoric"]', '["citrus", "earthy", "incense", "woody"]', 'Hindu Kush x Skunk'),

('Skywalker OG', 'Indica',
 'OG Kush crossed with Skywalker. Spicy herbal aroma with powerful sedating body effects.',
 20, 26, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["spicy", "herbal", "earthy", "diesel"]', 'OG Kush x Skywalker'),

('Grape Ape', 'Indica',
 'Mendocino Purps x Skunk x Afghani. Grape candy flavor with deep couch-lock relaxation.',
 18, 21, 0, 1, '["relaxed", "sleepy", "happy", "hungry"]', '["grape", "berry", "sweet", "earthy"]', 'Mendocino Purps x Skunk x Afghani'),

('Blueberry', 'Indica',
 'DJ Short classic. True blueberry flavor with peaceful, lasting euphoria and body ease.',
 16, 24, 0, 1, '["relaxed", "happy", "sleepy", "euphoric"]', '["blueberry", "berry", "sweet", "earthy"]', 'Purple Thai x Thai x Afghani'),

('Death Star', 'Indica',
 'Sour Diesel x Sensi Star. Pungent diesel and skunk with knockout indica body effects.',
 18, 27, 0, 1, '["relaxed", "sleepy", "euphoric", "hungry"]', '["diesel", "skunk", "earthy", "pungent"]', 'Sour Diesel x Sensi Star'),

('9 Pound Hammer', 'Indica',
 'Gooberry x Hells OG x Jack the Ripper. Sweet grape and lime with heavy sedating effects.',
 18, 21, 0, 1, '["sleepy", "relaxed", "happy", "hungry"]', '["grape", "lime", "sweet", "berry"]', 'Gooberry x Hells OG x Jack the Ripper'),

('Blackberry Kush', 'Indica',
 'Afghani x Blackberry. Berry and jet fuel aroma with calming full-body effects.',
 18, 20, 0, 1, '["relaxed", "sleepy", "happy", "hungry"]', '["berry", "diesel", "sweet", "earthy"]', 'Afghani x Blackberry'),

-- ═══ HYBRIDS ═══
('Gorilla Glue #4', 'Hybrid',
 'Also known as GG4. Sticky resin, diesel-chocolate-coffee aroma, and heavy euphoric relaxation.',
 18, 28, 0, 1, '["relaxed", "euphoric", "happy", "hungry"]', '["diesel", "chocolate", "coffee", "earthy"]', 'Chem Sis x Sour Dubb x Chocolate Diesel'),

('Wedding Cake', 'Hybrid',
 'Also Pink Cookies. Rich vanilla and earthy pepper with relaxing euphoric effects.',
 18, 25, 0, 1, '["relaxed", "happy", "euphoric", "hungry"]', '["vanilla", "earthy", "pepper", "sweet"]', 'Triangle Kush x Animal Mints'),

('Gelato', 'Hybrid',
 'Sunset Sherbet x Thin Mint GSC. Dessert-like sweetness with balanced euphoria and relaxation.',
 20, 25, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["sweet", "berry", "citrus", "lavender"]', 'Sunset Sherbet x Thin Mint GSC'),

('Zkittlez', 'Hybrid',
 'Grape Ape x Grapefruit. Candy-sweet tropical fruit flavor with calm, focused happiness.',
 15, 23, 0, 1, '["relaxed", "happy", "focused", "euphoric"]', '["sweet", "tropical", "berry", "grape"]', 'Grape Ape x Grapefruit'),

('Runtz', 'Hybrid',
 'Zkittlez x Gelato. Candy shop sweetness with giggly, euphoric balanced effects.',
 19, 29, 0, 1, '["happy", "euphoric", "relaxed", "creative"]', '["sweet", "fruity", "tropical", "berry"]', 'Zkittlez x Gelato'),

('Ice Cream Cake', 'Hybrid',
 'Wedding Cake x Gelato #33. Creamy vanilla and sugary dough with sedating bliss.',
 20, 25, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["vanilla", "sweet", "cream", "nutty"]', 'Wedding Cake x Gelato #33'),

('Dosidos', 'Hybrid',
 'Also Do-Si-Dos. OG Kush Breath x Girl Scout Cookies. Lime and earthy with heavy body calm.',
 20, 30, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["lime", "earthy", "sweet", "floral"]', 'OG Kush Breath x GSC'),

('Cherry Pie', 'Hybrid',
 'Granddaddy Purple x Durban Poison. Cherry and earthy bakery aroma with balanced happy effects.',
 16, 24, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["cherry", "sweet", "earthy", "berry"]', 'Granddaddy Purple x Durban Poison'),

('Sunset Sherbet', 'Hybrid',
 'GSC x Pink Panties. Sweet fruity dessert flavor with full-body calm and cerebral lift.',
 15, 19, 0, 1, '["relaxed", "happy", "euphoric", "creative"]', '["sweet", "berry", "citrus", "tropical"]', 'GSC x Pink Panties'),

('Purple Punch', 'Hybrid',
 'Larry OG x Granddaddy Purple. Grape candy slushie flavor with sedating happy effects.',
 18, 25, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["grape", "berry", "sweet", "vanilla"]', 'Larry OG x Granddaddy Purple'),

('MAC', 'Hybrid',
 'Miracle Alien Cookies. Frosted buds with sour citrus and diesel. Balanced creative euphoria.',
 21, 26, 0, 1, '["happy", "euphoric", "creative", "relaxed"]', '["citrus", "diesel", "sweet", "floral"]', 'Alien Cookies x Colombian x Starfighter'),

('Animal Cookies', 'Hybrid',
 'GSC x Fire OG. Sweet and sour dough aroma with powerful relaxing body effects.',
 19, 27, 0, 1, '["relaxed", "happy", "euphoric", "hungry"]', '["sweet", "earthy", "pungent", "sour"]', 'GSC x Fire OG'),

('Forbidden Fruit', 'Hybrid',
 'Cherry Pie x Tangie. Deep purple buds with tropical citrus and lazy relaxed euphoria.',
 20, 26, 0, 1, '["relaxed", "happy", "sleepy", "euphoric"]', '["tropical", "citrus", "berry", "pineapple"]', 'Cherry Pie x Tangie'),

('Bruce Banner', 'Hybrid',
 'OG Kush x Strawberry Diesel. Named for the Hulk. Diesel and sweet berry with strong euphoria.',
 20, 30, 0, 1, '["euphoric", "creative", "happy", "relaxed"]', '["diesel", "berry", "sweet", "earthy"]', 'OG Kush x Strawberry Diesel'),

('Chemdawg', 'Hybrid',
 'Mysterious origins, legendary status. Diesel and chemical funk with cerebral potency.',
 18, 26, 0, 1, '["euphoric", "creative", "relaxed", "happy"]', '["diesel", "chemical", "earthy", "pungent"]', 'Unknown'),

('Headband', 'Hybrid',
 'OG Kush x Sour Diesel. Lemon-diesel crown pressure with euphoric creative relaxation.',
 20, 27, 0, 1, '["euphoric", "creative", "relaxed", "happy"]', '["lemon", "diesel", "earthy", "citrus"]', 'OG Kush x Sour Diesel'),

('Super Silver Haze', 'Hybrid',
 'Skunk x Northern Lights x Haze. Award-winning sativa-leaning hybrid with spicy citrus haze.',
 18, 23, 0, 1, '["energetic", "euphoric", "creative", "uplifted"]', '["citrus", "spicy", "earthy", "skunk"]', 'Skunk x Northern Lights x Haze'),

('AK-47', 'Hybrid',
 'Colombian x Mexican x Thai x Afghani. Long-lasting cerebral buzz with sour earthy notes.',
 15, 20, 0, 1, '["happy", "relaxed", "uplifted", "creative"]', '["earthy", "sour", "sweet", "floral"]', 'Colombian x Mexican x Thai x Afghani'),

('Critical Mass', 'Indica',
 'Afghani x Skunk #1. Dense buds with citrus-sweet skunk and heavy body sedation.',
 19, 22, 0, 1, '["relaxed", "sleepy", "happy", "hungry"]', '["citrus", "sweet", "skunk", "earthy"]', 'Afghani x Skunk #1'),

('Platinum OG', 'Hybrid',
 'Master Kush x OG Kush x Unknown. Coffee and diesel with potent sedating euphoria.',
 20, 24, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["coffee", "diesel", "earthy", "pine"]', 'Master Kush x OG Kush'),

('Fire OG', 'Hybrid',
 'OG Kush phenotype. Lemon-pine fuel with intense euphoric relaxation.',
 19, 25, 0, 1, '["relaxed", "euphoric", "happy", "hungry"]', '["lemon", "pine", "diesel", "earthy"]', 'OG Kush phenotype'),

('Thin Mint GSC', 'Hybrid',
 'GSC phenotype. Minty sweet cookies aroma with balanced euphoric body effects.',
 20, 28, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["mint", "sweet", "earthy", "chocolate"]', 'GSC phenotype'),

('Mimosa', 'Hybrid',
 'Clementine x Purple Punch. Champagne brunch vibes — citrus and berry with uplifting calm.',
 19, 27, 0, 1, '["happy", "uplifted", "relaxed", "focused"]', '["citrus", "orange", "berry", "tropical"]', 'Clementine x Purple Punch'),

('Cereal Milk', 'Hybrid',
 'Y Life x Snowman. Creamy fruity cereal milk flavor with balanced happy relaxation.',
 18, 23, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["sweet", "cream", "fruity", "berry"]', 'Y Life x Snowman'),

('London Pound Cake', 'Hybrid',
 'Sunset Sherbet x Unknown. Sweet berry and grape with heavy relaxing effects.',
 20, 29, 0, 1, '["relaxed", "happy", "sleepy", "euphoric"]', '["berry", "grape", "sweet", "lemon"]', 'Sunset Sherbet x Unknown'),

('Gary Payton', 'Hybrid',
 'The Y x Snowman. Named for the NBA legend. Gassy dessert aroma with balanced euphoria.',
 20, 25, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["diesel", "sweet", "pepper", "earthy"]', 'The Y x Snowman'),

('Jealousy', 'Hybrid',
 'Gelato 41 x Sherb BX1. Grape candy and gas with potent balanced effects.',
 20, 30, 0, 1, '["relaxed", "happy", "euphoric", "creative"]', '["grape", "diesel", "sweet", "earthy"]', 'Gelato 41 x Sherb BX1'),

('Biscotti', 'Hybrid',
 'Gelato 25 x Sour Florida OG. Cookie-dough coffee aroma with relaxing cerebral calm.',
 19, 25, 0, 1, '["relaxed", "happy", "euphoric", "creative"]', '["coffee", "sweet", "earthy", "nutty"]', 'Gelato 25 x Sour Florida OG'),

('Apple Fritter', 'Hybrid',
 'Sour Apple x Animal Cookies. Sweet apple pastry flavor with potent relaxing euphoria.',
 20, 28, 0, 1, '["relaxed", "happy", "euphoric", "hungry"]', '["apple", "sweet", "earthy", "vanilla"]', 'Sour Apple x Animal Cookies'),

('Papaya', 'Indica',
 'Citral #13 x Ice #2. Tropical papaya mango flavor with calming happy sedation.',
 14, 25, 0, 1, '["relaxed", "happy", "sleepy", "hungry"]', '["tropical", "mango", "papaya", "sweet"]', 'Citral #13 x Ice #2'),

('Slurricane', 'Indica',
 'Do-Si-Dos x Purple Punch. Sweet berry cream with powerful couch-lock effects.',
 20, 28, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["berry", "sweet", "cream", "grape"]', 'Do-Si-Dos x Purple Punch'),

('Banana OG', 'Hybrid',
 'OG Kush x Banana. Tropical banana sweetness with mellow euphoric relaxation.',
 18, 24, 0, 1, '["relaxed", "happy", "euphoric", "hungry"]', '["banana", "tropical", "sweet", "earthy"]', 'OG Kush x Banana'),

('Lemon Haze', 'Sativa',
 'Silver Haze x Lemon Skunk. Bright lemon zest with energetic uplifting effects.',
 17, 25, 0, 1, '["energetic", "uplifted", "happy", "creative"]', '["lemon", "citrus", "sweet", "earthy"]', 'Silver Haze x Lemon Skunk'),

('SFV OG', 'Hybrid',
 'San Fernando Valley OG Kush cut. Classic OG fuel and pine with fast-hitting relaxation.',
 17, 22, 0, 1, '["relaxed", "happy", "euphoric", "hungry"]', '["pine", "diesel", "earthy", "lemon"]', 'OG Kush phenotype'),

('Tropicana Cookies', 'Hybrid',
 'Girl Scout Cookies x Tangie. Orange citrus cookies with uplifting creative euphoria.',
 21, 28, 0, 1, '["happy", "energetic", "creative", "uplifted"]', '["citrus", "orange", "sweet", "earthy"]', 'GSC x Tangie'),

('Kush Mints', 'Hybrid',
 'Animal Mints x Bubba Kush. Minty kush with heavy relaxing euphoric body effects.',
 20, 28, 0, 1, '["relaxed", "happy", "euphoric", "sleepy"]', '["mint", "earthy", "pine", "diesel"]', 'Animal Mints x Bubba Kush'),

-- ═══ EXOTIC & MODERN CULTIVARS ═══
('Permanent Marker', 'Exotic',
 'Biscotti x Jealousy x Sherb BX. Pungent marker ink and candy gas. Potent modern exotic.',
 25, 34, 0, 1, '["relaxed", "euphoric", "happy", "creative"]', '["diesel", "floral", "sweet", "pungent"]', 'Biscotti x Jealousy x Sherb BX'),

('Zaza', 'Exotic',
 'Catch-all term for exotic designer flower. Loud terps, colorful buds, heavy potency.',
 22, 32, 0, 1, '["euphoric", "relaxed", "happy", "creative"]', '["sweet", "gas", "fruity", "pungent"]', 'Various exotic crosses'),

('Moonbow', 'Exotic',
 'Purple Space Cookies x Do-Si-Dos. Colorful candy gas with intense euphoric relaxation.',
 24, 31, 0, 1, '["relaxed", "euphoric", "happy", "sleepy"]', '["sweet", "berry", "diesel", "floral"]', 'Purple Space Cookies x Do-Si-Dos'),

('Truffle', 'Exotic',
 'Gelato phenotype. Rich earthy chocolate and gas with luxurious full-body effects.',
 22, 30, 0, 1, '["relaxed", "euphoric", "happy", "hungry"]', '["chocolate", "earthy", "diesel", "sweet"]', 'Gelato phenotype'),

('White Runtz', 'Exotic',
 'Runtz phenotype. White-frosted candy buds with creamy sweet euphoric effects.',
 23, 29, 0, 1, '["happy", "euphoric", "relaxed", "creative"]', '["sweet", "fruity", "cream", "citrus"]', 'Runtz phenotype'),

('Pink Runtz', 'Exotic',
 'Rainbow Sherbet x Runtz. Pink candy sweetness with giggly uplifting euphoria.',
 23, 28, 0, 1, '["happy", "euphoric", "relaxed", "creative"]', '["sweet", "berry", "tropical", "cream"]', 'Rainbow Sherbet x Runtz'),

('Georgia Pie', 'Exotic',
 'Gelatti x Kush Mints. Peach cobbler and gas with potent balanced effects.',
 20, 25, 0, 1, '["relaxed", "happy", "euphoric", "hungry"]', '["peach", "sweet", "earthy", "diesel"]', 'Gelatti x Kush Mints'),

('Cap Junky', 'Exotic',
 'Alien Cookies x Kush Mints #11. MAC and mint gas with heavy euphoric potency.',
 25, 35, 0, 1, '["euphoric", "relaxed", "happy", "creative"]', '["diesel", "mint", "sweet", "pungent"]', 'Alien Cookies x Kush Mints #11'),

('Super Boof', 'Exotic',
 'Black Cherry Punch x Tropicana Cookies. Cherry citrus fizzy candy with happy calm.',
 22, 28, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["cherry", "citrus", "sweet", "tropical"]', 'Black Cherry Punch x Tropicana Cookies'),

('Blue Zushi', 'Exotic',
 'ZKittlez x Kush Mints. Blue candy gas with balanced relaxing euphoria.',
 21, 27, 0, 1, '["relaxed", "happy", "euphoric", "creative"]', '["berry", "sweet", "diesel", "mint"]', 'ZKittlez x Kush Mints'),

('Lemon Cherry Gelato', 'Exotic',
 'Sunset Sherbet x Girl Scout Cookies x Unknown. Citrus cherry dessert with heavy potency.',
 24, 30, 0, 1, '["relaxed", "euphoric", "happy", "creative"]', '["lemon", "cherry", "sweet", "citrus"]', 'Sunset Sherbet x GSC'),

('Oreoz', 'Exotic',
 'Cookies and Cream x Secret Weapon. Chocolate cookie dough and diesel with sedating bliss.',
 22, 31, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["chocolate", "sweet", "cream", "diesel"]', 'Cookies and Cream x Secret Weapon'),

('Gushers', 'Exotic',
 'Triangle Kush x Jungle Boys Gelato. Fruit candy gusher flavor with euphoric relaxation.',
 20, 25, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["fruity", "sweet", "tropical", "berry"]', 'Triangle Kush x Gelato'),

('Rainbow Belts', 'Exotic',
 'Zkittlez x Moonbow. Rainbow candy belt terps with uplifting happy effects.',
 22, 29, 0, 1, '["happy", "euphoric", "relaxed", "creative"]', '["sweet", "fruity", "citrus", "berry"]', 'Zkittlez x Moonbow'),

('Atomic Apple', 'Exotic',
 'Triangle Kush x Apple Fritter. Sour apple gas with potent euphoric body effects.',
 21, 27, 0, 1, '["relaxed", "euphoric", "happy", "hungry"]', '["apple", "diesel", "sweet", "earthy"]', 'Triangle Kush x Apple Fritter'),

('Garlic Breath', 'Exotic',
 'GMO x Mendo Breath. Savory garlic and diesel funk with heavy sedating effects.',
 24, 32, 0, 1, '["relaxed", "sleepy", "happy", "euphoric"]', '["garlic", "diesel", "earthy", "pungent"]', 'GMO x Mendo Breath'),

('GMO Cookies', 'Exotic',
 'Also Garlic Cookies. Chemdawg x GSC. Savory garlic mushroom onion gas. Extremely potent.',
 25, 33, 0, 1, '["relaxed", "sleepy", "euphoric", "hungry"]', '["garlic", "diesel", "earthy", "pungent"]', 'Chemdawg x GSC'),

('Ice Cream Man', 'Exotic',
 'Gelato x Sherbanger. Creamy gelato sweetness with heavy relaxing euphoria.',
 22, 28, 0, 1, '["relaxed", "happy", "euphoric", "sleepy"]', '["sweet", "cream", "vanilla", "berry"]', 'Gelato x Sherbanger'),

('Peanut Butter Breath', 'Hybrid',
 'Do-Si-Dos x Mendo Breath. Nutty chocolate peanut butter with calming body effects.',
 18, 28, 0, 1, '["relaxed", "happy", "euphoric", "sleepy"]', '["nutty", "earthy", "sweet", "herbal"]', 'Do-Si-Dos x Mendo Breath'),

('Sherblato', 'Hybrid',
 'Sunset Sherbet x Gelato. Creamy citrus sherbet with balanced happy relaxation.',
 20, 26, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["citrus", "sweet", "cream", "berry"]', 'Sunset Sherbet x Gelato'),

('Candyland', 'Sativa',
 'Granddaddy Purple x Bay Platinum Cookies. Sweet candy grape with uplifting euphoria.',
 18, 24, 0, 1, '["happy", "uplifted", "energetic", "creative"]', '["sweet", "grape", "berry", "earthy"]', 'Granddaddy Purple x Bay Platinum Cookies'),

('Purple Haze', 'Sativa',
 'Haze x Purple Thai. Jimi Hendrix legend. Sweet berry haze with psychedelic cerebral lift.',
 15, 20, 0, 1, '["euphoric", "creative", "energetic", "happy"]', '["berry", "sweet", "earthy", "spicy"]', 'Haze x Purple Thai'),

('Cheese', 'Hybrid',
 'Skunk #1 phenotype. Sharp cheddar aroma. Euphoric, relaxed, and famously pungent.',
 15, 20, 0, 1, '["happy", "relaxed", "euphoric", "hungry"]', '["cheese", "earthy", "skunk", "pungent"]', 'Skunk #1 phenotype'),

('Skunk #1', 'Hybrid',
 'The original hybrid. Afghani x Acapulco Gold x Colombian Gold. Skunky, balanced, iconic.',
 15, 20, 0, 1, '["happy", "relaxed", "euphoric", "creative"]', '["skunk", "earthy", "sweet", "pungent"]', 'Afghani x Acapulco Gold x Colombian Gold'),

('Harlequin', 'Hybrid',
 'High-CBD medicinal strain. Clear-headed, alert relaxation without heavy intoxication.',
 7, 15, 8, 16, '["relaxed", "focused", "happy", "uplifted"]', '["earthy", "mango", "citrus", "sweet"]', 'Colombian Gold x Thai x Swiss x Nepali'),

('Charlottes Web', 'Hybrid',
 'High-CBD hemp cultivar named for Charlotte Figi. Minimal high, therapeutic calm.',
 0, 1, 12, 20, '["relaxed", "focused", "happy", "calm"]', '["earthy", "pine", "sweet", "floral"]', 'Hemp cultivar'),

('ACDC', 'Hybrid',
 'High-CBD phenotype of Cannatonic. Clear-headed wellness strain with almost no intoxication.',
 1, 6, 14, 24, '["relaxed", "focused", "happy", "calm"]', '["earthy", "woody", "sweet", "citrus"]', 'Cannatonic phenotype'),

('Cannatonic', 'Hybrid',
 'MK Ultra x G13 Haze. Renowned high-CBD strain for therapeutic use with mild euphoria.',
 6, 17, 7, 15, '["relaxed", "happy", "focused", "calm"]', '["earthy", "citrus", "woody", "sweet"]', 'MK Ultra x G13 Haze'),

('Pennywise', 'Hybrid',
 'Harlequin x Jack the Ripper. Balanced THC:CBD ratio. Calm, clear, and therapeutic.',
 8, 15, 8, 15, '["relaxed", "happy", "focused", "calm"]', '["earthy", "coffee", "pepper", "herbal"]', 'Harlequin x Jack the Ripper')

on conflict (name) do update set
  type = excluded.type,
  description = excluded.description,
  thc_min = excluded.thc_min,
  thc_max = excluded.thc_max,
  cbd_min = excluded.cbd_min,
  cbd_max = excluded.cbd_max,
  effects = excluded.effects,
  flavors = excluded.flavors,
  genetics = excluded.genetics;

-- Verify
select type, count(*) as count
from "StrainVerse".strains
group by type
order by type;

select count(*) as total_strains from "StrainVerse".strains;
