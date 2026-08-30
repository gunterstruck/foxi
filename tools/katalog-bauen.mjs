/**
 * Erzeugt `src/daten/katalog.json` aus der Liste weiter unten.
 *
 * Warum ein Generator und nicht die JSON-Datei von Hand?
 * Die Kennungen (`id`) müssen eindeutig und stabil sein – sie sind der
 * Schlüssel, an dem `letzteKaeufe` hängt. Von Hand vergeben hält das keine
 * 400 Zeilen durch. Hier steht pro Artikel nur „Name|Emoji"; die Kennung
 * entsteht aus dem Namen, und doppelte Kennungen brechen den Lauf ab.
 *
 * Aufruf:  node tools/katalog-bauen.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));

/* Reihenfolge = Standard-Laufweg durch einen deutschen Supermarkt.
   Sie ist nur der Anfangswert; im Expertenmodus zieht man sie sich zurecht. */
const KATEGORIEN = [
    ['obst',        'Obst & Gemüse',            '🥕'],
    ['backwaren',   'Brot & Backwaren',         '🥖'],
    ['molkerei',    'Milch, Käse & Eier',       '🧀'],
    ['fleisch',     'Fleisch & Wurst',          '🥩'],
    ['fisch',       'Fisch',                    '🐟'],
    ['vegan',       'Vegetarisch & Vegan',      '🌱'],
    ['trocken',     'Nudeln, Reis & Vorrat',    '🍝'],
    ['konserven',   'Konserven & Fertiges',     '🥫'],
    ['gewuerze',    'Gewürze, Öl & Backen',     '🧂'],
    ['fruehstueck', 'Frühstück & Aufstrich',    '🍯'],
    ['suess',       'Süßes & Snacks',           '🍫'],
    ['tiefkuehl',   'Tiefkühl',                 '❄️'],
    ['getraenke',   'Getränke',                 '🧃'],
    ['haushalt',    'Haushalt & Reinigung',     '🧽'],
    ['drogerie',    'Drogerie & Hygiene',       '🧴'],
    ['baby',        'Baby & Kind',              '🍼'],
    ['tier',        'Tierbedarf',               '🐾'],
    /* Bleibt leer und damit unsichtbar, bis jemand einen eigenen Artikel
       anlegt. Ohne diese Kategorie landete alles Selbstangelegte in der
       ersten Kategorie – und die Liste sortierte Batterien zwischen die
       Äpfel. */
    ['sonstiges',   'Sonstiges',                '🛒']
];

const ARTIKEL = {
obst: `
Äpfel|🍎
Birnen|🍐
Bananen|🍌
Orangen|🍊
Mandarinen|🍊
Zitronen|🍋
Limetten|🍋
Weintrauben|🍇
Erdbeeren|🍓
Himbeeren|🫐
Heidelbeeren|🫐
Brombeeren|🫐
Kirschen|🍒
Pfirsiche|🍑
Nektarinen|🍑
Pflaumen|🍑
Aprikosen|🍑
Ananas|🍍
Mango|🥭
Kiwi|🥝
Wassermelone|🍉
Honigmelone|🍈
Avocado|🥑
Datteln|🌴
Feigen|🍈
Granatapfel|🍎
Tomaten|🍅
Cherrytomaten|🍅
Gurke|🥒
Paprika|🫑
Zucchini|🥒
Aubergine|🍆
Karotten|🥕
Kartoffeln|🥔
Süßkartoffeln|🍠
Zwiebeln|🧅
Rote Zwiebeln|🧅
Frühlingszwiebeln|🧅
Knoblauch|🧄
Ingwer|🫚
Lauch|🥬
Staudensellerie|🥬
Brokkoli|🥦
Blumenkohl|🥦
Rosenkohl|🥬
Weißkohl|🥬
Rotkohl|🥬
Spitzkohl|🥬
Wirsing|🥬
Grünkohl|🥬
Spinat|🥬
Feldsalat|🥬
Kopfsalat|🥬
Eisbergsalat|🥬
Rucola|🥬
Radieschen|🥕
Rote Bete|🥕
Kürbis|🎃
Champignons|🍄
Kräuterseitlinge|🍄
Zuckermais|🌽
Zuckerschoten|🫛
Grüne Bohnen|🫛
Spargel|🥬
Fenchel|🥬
Pastinaken|🥕
Petersilie|🌿
Schnittlauch|🌿
Basilikum|🌿
Koriander|🌿
Minze|🌿
Dill|🌿
Rosmarin|🌿
Thymian|🌿
`,
backwaren: `
Brot|🍞
Vollkornbrot|🍞
Roggenbrot|🍞
Dinkelbrot|🍞
Toastbrot|🍞
Baguette|🥖
Brötchen|🥐
Vollkornbrötchen|🥐
Laugenbrezel|🥨
Laugenstangen|🥨
Croissants|🥐
Ciabatta|🥖
Fladenbrot|🫓
Pita-Brot|🫓
Tortilla-Wraps|🌯
Knäckebrot|🍘
Zwieback|🍘
Semmelbrösel|🍞
Kuchen|🍰
Muffins|🧁
Donuts|🍩
Berliner|🍩
Bagels|🥯
Hefezopf|🍞
`,
molkerei: `
Milch|🥛
H-Milch|🥛
Laktosefreie Milch|🥛
Hafermilch|🥛
Mandelmilch|🥛
Sojamilch|🥛
Sahne|🥛
Schlagsahne|🥛
Saure Sahne|🥛
Schmand|🥛
Crème fraîche|🥛
Naturjoghurt|🥣
Fruchtjoghurt|🥣
Griechischer Joghurt|🥣
Skyr|🥣
Quark|🥣
Buttermilch|🥛
Kefir|🥛
Ayran|🥛
Frischkäse|🧀
Hüttenkäse|🧀
Butter|🧈
Margarine|🧈
Gouda|🧀
Emmentaler|🧀
Bergkäse|🧀
Camembert|🧀
Brie|🧀
Mozzarella|🧀
Feta|🧀
Parmesan|🧀
Reibekäse|🧀
Scheibenkäse|🧀
Ziegenkäse|🧀
Halloumi|🧀
Mascarpone|🧀
Ricotta|🧀
Eier|🥚
Bio-Eier|🥚
Pudding|🍮
Milchreis|🍚
`,
fleisch: `
Hähnchenbrust|🍗
Hähnchenschenkel|🍗
Ganzes Hähnchen|🍗
Putenbrust|🍗
Hackfleisch|🥩
Rinderhackfleisch|🥩
Rindersteak|🥩
Rinderbraten|🥩
Gulasch|🥩
Rouladen|🥩
Schweineschnitzel|🥩
Schweinefilet|🥩
Schweinebraten|🥩
Kasseler|🥩
Lammfleisch|🥩
Entenbrust|🦆
Bauchspeck|🥓
Frühstücksspeck|🥓
Bratwurst|🌭
Wiener Würstchen|🌭
Currywurst|🌭
Leberkäse|🥩
Salami|🍕
Schinken|🥓
Kochschinken|🥓
Serrano-Schinken|🥓
Mortadella|🥓
Fleischwurst|🌭
Leberwurst|🥫
Teewurst|🥫
Aufschnitt|🥓
Gyros|🥙
`,
fisch: `
Lachs|🐟
Räucherlachs|🐟
Forelle|🐟
Kabeljau|🐟
Seelachs|🐟
Zander|🐟
Pangasius|🐟
Thunfisch|🐟
Matjes|🐟
Hering|🐟
Makrele|🐟
Sardinen|🐟
Sardellenpaste|🐟
Garnelen|🦐
Scampi|🦐
Miesmuscheln|🦪
Tintenfischringe|🦑
Surimi|🍥
`,
vegan: `
Tofu|🌱
Räuchertofu|🌱
Tempeh|🌱
Seitan|🌱
Veggie-Schnitzel|🌱
Veggie-Burger|🍔
Veggie-Hack|🌱
Veggie-Würstchen|🌭
Falafel|🧆
Hummus|🫘
Sojajoghurt|🥣
Veganer Käse|🧀
Linsenaufstrich|🫘
`,
trocken: `
Spaghetti|🍝
Penne|🍝
Fusilli|🍝
Bandnudeln|🍝
Lasagneplatten|🍝
Tortellini|🍝
Gnocchi|🥔
Vollkornnudeln|🍝
Spätzle|🍝
Reis|🍚
Basmatireis|🍚
Risottoreis|🍚
Sushireis|🍚
Couscous|🌾
Bulgur|🌾
Quinoa|🌾
Hirse|🌾
Polenta|🌽
Linsen|🫘
Rote Linsen|🫘
Kichererbsen|🫘
Kidneybohnen|🫘
Weiße Bohnen|🫘
Haferflocken|🌾
Mehl|🌾
Vollkornmehl|🌾
Dinkelmehl|🌾
Hartweizengrieß|🌾
Kartoffelpüree|🥔
Semmelknödel|🥔
`,
konserven: `
Tomaten aus der Dose|🥫
Passierte Tomaten|🥫
Tomatenmark|🥫
Mais aus der Dose|🥫
Erbsen aus der Dose|🥫
Bohnen aus der Dose|🥫
Sauerkraut|🥫
Rotkohl aus dem Glas|🥫
Gewürzgurken|🫙
Oliven|🫒
Kapern|🫙
Ananas aus der Dose|🥫
Pfirsiche aus der Dose|🥫
Apfelmus|🍎
Ravioli aus der Dose|🥫
Suppe aus der Dose|🥫
Gemüsebrühe|🥣
Hühnerbrühe|🥣
Fertigsoße|🥫
Pesto|🌿
Tomatensoße|🥫
Currysoße|🥫
Kokosmilch|🥥
Instantnudeln|🍜
`,
gewuerze: `
Salz|🧂
Pfeffer|🧂
Zucker|🧁
Brauner Zucker|🧁
Puderzucker|🧁
Vanillezucker|🧁
Backpulver|🧁
Trockenhefe|🧁
Natron|🧁
Speisestärke|🌾
Olivenöl|🫒
Sonnenblumenöl|🌻
Rapsöl|🌻
Kokosöl|🥥
Essig|🧴
Balsamico|🧴
Apfelessig|🧴
Senf|🌭
Ketchup|🍅
Mayonnaise|🥚
Sojasoße|🍶
Sriracha|🌶️
Chiliflocken|🌶️
Paprikapulver|🌶️
Currypulver|🍛
Kurkuma|🟡
Kreuzkümmel|🌿
Zimt|🌰
Muskatnuss|🌰
Oregano|🌿
Getrockneter Thymian|🌿
Getrockneter Rosmarin|🌿
Lorbeerblätter|🌿
Italienische Kräuter|🌿
Knoblauchpulver|🧄
Kakaopulver|🍫
Vanilleextrakt|🧁
Gelatine|🧁
Marzipan|🧁
Rosinen|🍇
`,
fruehstueck: `
Müsli|🥣
Cornflakes|🥣
Granola|🥣
Porridge|🥣
Marmelade|🍓
Erdbeermarmelade|🍓
Aprikosenmarmelade|🍑
Honig|🍯
Nuss-Nougat-Creme|🍫
Erdnussbutter|🥜
Mandelmus|🥜
Ahornsirup|🍁
Agavendicksaft|🍯
Rübenkraut|🍯
Streichwurst|🥫
Frühstücksei|🥚
`,
suess: `
Vollmilchschokolade|🍫
Zartbitterschokolade|🍫
Nussschokolade|🍫
Weiße Schokolade|🍫
Pralinen|🍫
Schokoriegel|🍫
Müsliriegel|🍫
Gummibärchen|🍬
Bonbons|🍬
Lakritz|🍬
Kaugummi|🍬
Butterkekse|🍪
Schokokekse|🍪
Waffeln|🧇
Eiscreme|🍨
Kartoffelchips|🥔
Erdnussflips|🥜
Salzstangen|🥨
Cracker|🍘
Popcorn|🍿
Erdnüsse|🥜
Cashewkerne|🥜
Mandeln|🥜
Walnüsse|🥜
Haselnüsse|🥜
Pistazien|🥜
Sonnenblumenkerne|🌻
Kürbiskerne|🎃
Studentenfutter|🥜
Trockenobst|🍇
`,
tiefkuehl: `
Tiefkühlpizza|🍕
Pommes frites|🍟
Kroketten|🥔
Rösti|🥔
Fischstäbchen|🐟
Backfisch|🐟
Chicken Nuggets|🍗
Tiefkühlgemüse|🥦
Erbsen tiefgekühlt|🫛
Blattspinat tiefgekühlt|🥬
Rahmspinat|🥬
Beeren tiefgekühlt|🫐
Blätterteig|🥐
Pizzateig|🍕
Eis am Stiel|🍦
Frühlingsrollen|🥟
Baguette zum Aufbacken|🥖
Brötchen zum Aufbacken|🥐
Kräuterbutter|🧈
Fertiggericht|🍱
`,
getraenke: `
Mineralwasser|💧
Stilles Wasser|💧
Sprudelwasser|💧
Apfelsaft|🧃
Orangensaft|🧃
Multivitaminsaft|🧃
Traubensaft|🧃
Tomatensaft|🧃
Apfelschorle|🧃
Limonade|🥤
Cola|🥤
Eistee|🧋
Energydrink|🥤
Bier|🍺
Weizenbier|🍺
Pils|🍺
Alkoholfreies Bier|🍺
Radler|🍺
Rotwein|🍷
Weißwein|🍷
Roséwein|🍷
Sekt|🥂
Prosecco|🥂
Wodka|🍸
Gin|🍸
Rum|🥃
Whisky|🥃
Aperitif|🍹
Kaffee|☕
Kaffeebohnen|☕
Kaffeepads|☕
Espresso|☕
Schwarztee|🍵
Grüntee|🍵
Kräutertee|🍵
Früchtetee|🍵
Kakaopulver zum Trinken|🥛
Getränkesirup|🍹
`,
haushalt: `
Spülmittel|🧼
Spülmaschinentabs|🧼
Klarspüler|🧼
Spülmaschinensalz|🧂
Waschmittel|🧺
Weichspüler|🧺
Fleckenentferner|🧺
Allzweckreiniger|🧽
Badreiniger|🚿
WC-Reiniger|🚽
Glasreiniger|🪟
Scheuermilch|🧽
Essigreiniger|🧴
Schwämme|🧽
Spültücher|🧽
Putzlappen|🧽
Müllbeutel|🗑️
Gefrierbeutel|🧊
Frischhaltefolie|📦
Alufolie|📦
Backpapier|📄
Küchenrolle|🧻
Toilettenpapier|🧻
Taschentücher|🤧
Servietten|🧻
Batterien|🔋
Glühbirnen|💡
Streichhölzer|🔥
Kerzen|🕯️
`,
drogerie: `
Zahnpasta|🪥
Zahnbürste|🪥
Zahnseide|🪥
Mundspülung|🪥
Duschgel|🧴
Shampoo|🧴
Haarspülung|🧴
Handseife|🧼
Handcreme|🧴
Bodylotion|🧴
Gesichtscreme|🧴
Sonnencreme|🧴
Deo|🧴
Rasierschaum|🪒
Rasierklingen|🪒
Wattestäbchen|🧴
Wattepads|🧴
Damenbinden|🩸
Tampons|🩸
Kondome|🛡️
Pflaster|🩹
Desinfektionsmittel|🧴
Schmerztabletten|💊
Nasenspray|💊
Vitamintabletten|💊
Lippenpflege|💄
`,
baby: `
Windeln|🍼
Feuchttücher|🍼
Babynahrung|🍼
Milchpulver|🍼
Babybrei|🍼
Babyöl|🍼
Wundschutzcreme|🍼
Schnuller|🍼
Babyshampoo|🍼
Quetschie|🍼
Kindersnack|🍼
`,
tier: `
Trockenfutter Hund|🐕
Nassfutter Hund|🐕
Hundeleckerli|🦴
Kaustangen|🦴
Trockenfutter Katze|🐈
Nassfutter Katze|🐈
Katzenleckerli|🐈
Katzenstreu|🐈
Vogelfutter|🐦
Kleintierfutter|🐹
`
};

function kennung(name) {
    return name
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const kategorien = KATEGORIEN.map(([id, name, icon], position) => ({ id, name, icon, position }));
const bekannt = new Set();
const artikel = [];

for (const [kategorieId, block] of Object.entries(ARTIKEL)) {
    if (!kategorien.some((k) => k.id === kategorieId)) {
        throw new Error(`Unbekannte Kategorie: ${kategorieId}`);
    }
    for (const zeile of block.trim().split('\n')) {
        const [name, icon] = zeile.split('|');
        const id = kennung(name);
        if (bekannt.has(id)) throw new Error(`Doppelte Kennung: ${id} (${name})`);
        bekannt.add(id);
        artikel.push({ id, name, kategorieId, icon: icon || '🛒' });
    }
}

const ziel = join(hier, '..', 'src', 'daten', 'katalog.json');
const inhalt = {
    version: 1,
    hinweis: 'Erzeugt von tools/katalog-bauen.mjs – nicht von Hand bearbeiten.',
    kategorien,
    artikel
};
writeFileSync(ziel, JSON.stringify(inhalt, null, 0).replace(/\},\{/g, '},\n{') + '\n', 'utf8');
console.log(`${artikel.length} Artikel in ${kategorien.length} Kategorien → ${ziel}`);
