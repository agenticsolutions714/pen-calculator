export type Brand = "Standard" | "Aura";

export const BRANDS: Brand[] = ["Standard", "Aura"];

export type Product = {
  brand: Brand;
  sku: string;
  product: string;
  strength: number | null;
  strengthUnit: string;
  vialSize: number;
  vialUnit: string;
  vialsPerPack: number;
  noMoq: number | null;
  moq50: number | null;
  // Optional merchandising metadata. Used by the Aura line (captured from the
  // supplier label sheet); Standard products leave these undefined.
  category?: string;
  subtitle?: string;
  // For Aura products: the Standard SKU this item is sourced/relabeled from.
  // Populated at resolution time (see resolveAuraProduct); Aura's strength and
  // cost tiers are derived from this source unless overridden.
  sourceSku?: string | null;
};

export const standardProducts: Product[] = [
  { brand: "Standard", sku: "CJC5", product: "CJC-1295 (without DAC)", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 106, moq50: 77 },
  { brand: "Standard", sku: "CJC10", product: "CJC-1295 (without DAC)", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 173, moq50: 126 },
  { brand: "Standard", sku: "CJCD2", product: "CJC-1295 (with DAC)", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 165, moq50: 120 },
  { brand: "Standard", sku: "CJCD5", product: "CJC-1295 (with DAC)", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 261, moq50: 190 },
  { brand: "Standard", sku: "CP10", product: "CJC-1295 (without DAC) +", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 134, moq50: 97 },
  { brand: "Standard", sku: "CARD20", product: "Cardiogen", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 181, moq50: 132 },
  { brand: "Standard", sku: "CART20", product: "Cartalax", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 181, moq50: 132 },
  { brand: "Standard", sku: "HGH6", product: "Somatropin", strength: 6, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 82, moq50: 59 },
  { brand: "Standard", sku: "HGH8", product: "Somatropin", strength: 8, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 84, moq50: 61 },
  { brand: "Standard", sku: "HGH10", product: "Somatropin", strength: 10, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 102, moq50: 74 },
  { brand: "Standard", sku: "HGH12", product: "Somatropin", strength: 12, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 118, moq50: 86 },
  { brand: "Standard", sku: "HGH15", product: "Somatropin", strength: 15, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 146, moq50: 106 },
  { brand: "Standard", sku: "HGH24", product: "Somatropin", strength: 24, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 205, moq50: 149 },
  { brand: "Standard", sku: "HGH36", product: "Somatropin", strength: 36, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 281, moq50: 204 },
  { brand: "Standard", sku: "HGH40", product: "Somatropin", strength: 40, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 385, moq50: 280 },
  { brand: "Standard", sku: "HCG1000", product: "HCG", strength: 1000, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 54 },
  { brand: "Standard", sku: "HCG2000", product: "HCG", strength: 2000, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 102, moq50: 74 },
  { brand: "Standard", sku: "HCG5000", product: "HCG", strength: 5000, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 181, moq50: 132 },
  { brand: "Standard", sku: "HCG10000", product: "HCG", strength: 10000, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 333, moq50: 242 },
  { brand: "Standard", sku: "LEMON10", product: "Lemon Bottle", strength: null, strengthUnit: "", vialSize: 10, vialUnit: "mL", vialsPerPack: 10, noMoq: 98, moq50: 71 },
  { brand: "Standard", sku: "BAC3", product: "Benzyl Alcohol", strength: 0.9, strengthUnit: "%", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 28, moq50: 20 },
  { brand: "Standard", sku: "BAC10", product: "Benzyl Alcohol", strength: 0.9, strengthUnit: "%", vialSize: 10, vialUnit: "mL", vialsPerPack: 10, noMoq: 30, moq50: 22 },
  { brand: "Standard", sku: "WAC3", product: "BAC Water", strength: null, strengthUnit: "", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 25, moq50: 20 },
  { brand: "Standard", sku: "WAC10", product: "BAC Water", strength: null, strengthUnit: "", vialSize: 10, vialUnit: "mL", vialsPerPack: 10, noMoq: 27, moq50: 22 },
  { brand: "Standard", sku: "AA3", product: "Acetic Acid Solution", strength: 0.6, strengthUnit: "%", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 28, moq50: 20 },
  { brand: "Standard", sku: "B12", product: "B-12", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 38, moq50: 33 },
  { brand: "Standard", sku: "AD10", product: "Adamax", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 209, moq50: 152 },
  { brand: "Standard", sku: "AP2", product: "Adipotide/FTTP", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 126, moq50: 91 },
  { brand: "Standard", sku: "AP5", product: "Adipotide/FTTP", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 261, moq50: 190 },
  { brand: "Standard", sku: "AP10", product: "Adipotide/FTTP", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 393, moq50: 286 },
  { brand: "Standard", sku: "ARA10", product: "ARA290 (Cibinetide)", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 138, moq50: 100 },
  { brand: "Standard", sku: "ARA16", product: "ARA290 (Cibinetide)", strength: 16, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 193, moq50: 141 },
  { brand: "Standard", sku: "AC1", product: "ACE-031", strength: 1, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 54 },
  { brand: "Standard", sku: "AHK20", product: "AHK-Cu", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 82, moq50: 59 },
  { brand: "Standard", sku: "AHK50", product: "AHK-Cu", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 102, moq50: 74 },
  { brand: "Standard", sku: "AA3CN", product: "Acetic Acid", strength: null, strengthUnit: "", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 42, moq50: 30 },
  { brand: "Standard", sku: "AA5", product: "Acetic Acid", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 42, moq50: 30 },
  { brand: "Standard", sku: "AA10ML", product: "Acetic Acid", strength: null, strengthUnit: "", vialSize: 10, vialUnit: "mL", vialsPerPack: 10, noMoq: 46, moq50: 33 },
  { brand: "Standard", sku: "BRON20", product: "Bronchogen", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 189, moq50: 138 },
  { brand: "Standard", sku: "CGL2", product: "Cagrilintide", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 154, moq50: 112 },
  { brand: "Standard", sku: "CGL5", product: "Cagrilintide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 217, moq50: 158 },
  { brand: "Standard", sku: "CGL10", product: "Cagrilintide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 385, moq50: 280 },
  { brand: "Standard", sku: "CS5", product: "Cagrilintide + Semaglutide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 138, moq50: 100 },
  { brand: "Standard", sku: "CS10", product: "Cagrilintide + Semaglutide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 217, moq50: 158 },
  { brand: "Standard", sku: "CS20", product: "Cagrilintide + Semaglutide", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 385, moq50: 280 },
  { brand: "Standard", sku: "CBL60", product: "Cerebrolysin", strength: 60, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 122, moq50: 88 },
  { brand: "Standard", sku: "CORT20", product: "Cortagen", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 193, moq50: 141 },
  { brand: "Standard", sku: "CRYS20", product: "Crystagen", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 126, moq50: 91 },
  { brand: "Standard", sku: "DR2", product: "Dermorphin", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 54, moq50: 39 },
  { brand: "Standard", sku: "DR10", product: "Dermorphin", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 130, moq50: 94 },
  { brand: "Standard", sku: "DULA5", product: "Dulaglutide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 281, moq50: 204 },
  { brand: "Standard", sku: "DULA10", product: "Dulaglutide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 492, moq50: 358 },
  { brand: "Standard", sku: "EPO3000", product: "EPO", strength: 3000, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 124, moq50: 90 },
  { brand: "Standard", sku: "FOX2", product: "FOXO4-DRI", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 185, moq50: 135 },
  { brand: "Standard", sku: "FOX10", product: "FOXO4-DRI", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 540, moq50: 393 },
  { brand: "Standard", sku: "HMG75", product: "HMG", strength: 75, strengthUnit: "iu", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 102, moq50: 74 },
  { brand: "Standard", sku: "FRAG1", product: "HGH Fragment 176-191", strength: 1, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "FRAG2", product: "HGH Fragment 176-191", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 82, moq50: 59 },
  { brand: "Standard", sku: "FRAG5", product: "HGH Fragment 176-191", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 154, moq50: 112 },
  { brand: "Standard", sku: "FRAG10", product: "HGH Fragment 176-191", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 265, moq50: 193 },
  { brand: "Standard", sku: "FRAG12", product: "HGH Fragment 176-191", strength: 12, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 309, moq50: 225 },
  { brand: "Standard", sku: "FRAG15", product: "HGH Fragment 176-191", strength: 15, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 385, moq50: 280 },
  { brand: "Standard", sku: "HX2", product: "Hexarelin Acetate", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 82, moq50: 59 },
  { brand: "Standard", sku: "HX5", product: "Hexarelin Acetate", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 181, moq50: 132 },
  { brand: "Standard", sku: "HUM10", product: "Humanin", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 464, moq50: 338 },
  { brand: "Standard", sku: "LIRA5", product: "Liraglutide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 146, moq50: 106 },
  { brand: "Standard", sku: "LIRA10", product: "Liraglutide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 265, moq50: 193 },
  { brand: "Standard", sku: "LIRA30", product: "Liraglutide", strength: 30, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 779, moq50: 567 },
  { brand: "Standard", sku: "LL37", product: "LL-37", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 185, moq50: 135 },
  { brand: "Standard", sku: "LC600", product: "L-Carnitine", strength: 600, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 98, moq50: 71 },
  { brand: "Standard", sku: "LC1200", product: "L-Carnitine", strength: 1200, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 106, moq50: 77 },
  { brand: "Standard", sku: "LIPOC10", product: "Lipo-C", strength: 10, strengthUnit: "mg", vialSize: 10, vialUnit: "mL", vialsPerPack: 10, noMoq: 98, moq50: 71 },
  { brand: "Standard", sku: "MX10", product: "Matrixyl", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "MAZ10", product: "Mazdutide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 421, moq50: 306 },
  { brand: "Standard", sku: "MICLC216", product: "MIC + L-Carnitine + B12", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 189, moq50: 138 },
  { brand: "Standard", sku: "MGF2", product: "MGF", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 124, moq50: 90 },
  { brand: "Standard", sku: "PMGF2", product: "PEG-MGF", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 146, moq50: 106 },
  { brand: "Standard", sku: "PE10A", product: "PE-22-28", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 134, moq50: 97 },
  { brand: "Standard", sku: "PNC5", product: "PNC-27", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 161, moq50: 117 },
  { brand: "Standard", sku: "P215", product: "P21", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 560, moq50: 407 },
  { brand: "Standard", sku: "PE5", product: "PE-22-28", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 66, moq50: 48 },
  { brand: "Standard", sku: "PE10", product: "PE-22-28", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 134, moq50: 97 },
  { brand: "Standard", sku: "PIN5", product: "Pinealon", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "PIN10", product: "Pinealon", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 102, moq50: 74 },
  { brand: "Standard", sku: "TBF2", product: "TBF", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 54 },
  { brand: "Standard", sku: "TBF5", product: "TBF", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "TBF10", product: "TBF", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 142, moq50: 103 },
  { brand: "Standard", sku: "TI15", product: "Tesamorelin + Ipamorelin", strength: 15, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 440, moq50: 320 },
  { brand: "Standard", sku: "TY10", product: "Thymalin / Thymulin", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 120, moq50: 87 },
  { brand: "Standard", sku: "VP5", product: "VIP", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 134, moq50: 97 },
  { brand: "Standard", sku: "5AM", product: "5-AMINO-1MQ", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 50, moq50: 36 },
  { brand: "Standard", sku: "10AM", product: "5-AMINO-1MQ", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 58, moq50: 42 },
  { brand: "Standard", sku: "RT5", product: "Retatrutide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "RT10", product: "Retatrutide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "RT15", product: "Retatrutide", strength: 15, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 126, moq50: 91 },
  { brand: "Standard", sku: "RT20", product: "Retatrutide", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 158, moq50: 115 },
  { brand: "Standard", sku: "RT30", product: "Retatrutide", strength: 30, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 213, moq50: 155 },
  { brand: "Standard", sku: "RT40", product: "Retatrutide", strength: 40, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 269, moq50: 196 },
  { brand: "Standard", sku: "RT50", product: "Retatrutide", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 325, moq50: 236 },
  { brand: "Standard", sku: "RT60", product: "Retatrutide", strength: 60, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 357, moq50: 259 },
  { brand: "Standard", sku: "RT20TR40", product: "Retatrutide + Tirzepatide", strength: 60, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 429, moq50: 312 },
  { brand: "Standard", sku: "SM5", product: "Semaglutide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 50, moq50: 36 },
  { brand: "Standard", sku: "SM10", product: "Semaglutide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 66, moq50: 48 },
  { brand: "Standard", sku: "SM15", product: "Semaglutide", strength: 15, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 78, moq50: 57 },
  { brand: "Standard", sku: "SM20", product: "Semaglutide", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "SM30", product: "Semaglutide", strength: 30, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 142, moq50: 103 },
  { brand: "Standard", sku: "TR2", product: "Tirzepatide", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 70, moq50: 51 },
  { brand: "Standard", sku: "TR5", product: "Tirzepatide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 54, moq50: 39 },
  { brand: "Standard", sku: "TR10", product: "Tirzepatide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 54 },
  { brand: "Standard", sku: "TR15", product: "Tirzepatide", strength: 15, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "TR20", product: "Tirzepatide", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 110, moq50: 80 },
  { brand: "Standard", sku: "TR30", product: "Tirzepatide", strength: 30, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 138, moq50: 100 },
  { brand: "Standard", sku: "TR40", product: "Tirzepatide", strength: 40, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 169, moq50: 123 },
  { brand: "Standard", sku: "TR50", product: "Tirzepatide", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 205, moq50: 149 },
  { brand: "Standard", sku: "TR60", product: "Tirzepatide", strength: 60, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 253, moq50: 184 },
  { brand: "Standard", sku: "TR100", product: "Tirzepatide", strength: 100, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 361, moq50: 262 },
  { brand: "Standard", sku: "TR120", product: "Tirzepatide", strength: 120, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 452, moq50: 329 },
  { brand: "Standard", sku: "CU50", product: "GHK-Cu", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 46, moq50: 33 },
  { brand: "Standard", sku: "CU100", product: "GHK-Cu", strength: 100, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 58, moq50: 42 },
  { brand: "Standard", sku: "NJ100", product: "NAD+", strength: 100, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 50, moq50: 36 },
  { brand: "Standard", sku: "NJ500", product: "NAD+", strength: 500, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 66, moq50: 48 },
  { brand: "Standard", sku: "NJ1000", product: "NAD+", strength: 1000, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 90, moq50: 65 },
  { brand: "Standard", sku: "BC2", product: "BPC-157", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 52, moq50: 38 },
  { brand: "Standard", sku: "BC5", product: "BPC-157", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "BC10", product: "BPC-157", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 82, moq50: 59 },
  { brand: "Standard", sku: "KPV5", product: "KPV", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 58, moq50: 42 },
  { brand: "Standard", sku: "KPV10", product: "KPV", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 82, moq50: 59 },
  { brand: "Standard", sku: "SK5", product: "Selank", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "SK10", product: "Selank", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "SX5", product: "Semax", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "SX10", product: "Semax", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "SS10", product: "SS-31", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 142, moq50: 103 },
  { brand: "Standard", sku: "SS50", product: "SS-31", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 421, moq50: 306 },
  { brand: "Standard", sku: "SUR10", product: "Survodutide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 460, moq50: 335 },
  { brand: "Standard", sku: "PT141", product: "PT-141", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 98, moq50: 71 },
  { brand: "Standard", sku: "IPA5", product: "Ipamorelin", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 72, moq50: 52 },
  { brand: "Standard", sku: "IPA10", product: "Ipamorelin", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 90, moq50: 65 },
  { brand: "Standard", sku: "AOD5", product: "AOD-9604", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 142, moq50: 103 },
  { brand: "Standard", sku: "AOD10", product: "AOD-9604", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 245, moq50: 178 },
  { brand: "Standard", sku: "TA5", product: "Thymosin alpha 1", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 132, moq50: 117 },
  { brand: "Standard", sku: "TA10", product: "Thymosin alpha 1", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 220, moq50: 196 },
  { brand: "Standard", sku: "NP810", product: "Snap-8", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 54 },
  { brand: "Standard", sku: "NP8100", product: "Snap-8", strength: 100, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 393, moq50: 286 },
  { brand: "Standard", sku: "EPI10", product: "Epithalon", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 62 },
  { brand: "Standard", sku: "EPI50", product: "Epithalon", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 184, moq50: 184 },
  { brand: "Standard", sku: "AIC50", product: "AICAR", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 102, moq50: 74 },
  { brand: "Standard", sku: "KS5", product: "Kisspeptin-10", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 78, moq50: 57 },
  { brand: "Standard", sku: "KS10", product: "Kisspeptin-10", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 118, moq50: 86 },
  { brand: "Standard", sku: "MS10", product: "MOTS-c", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 83, moq50: 74 },
  { brand: "Standard", sku: "MS20", product: "MOTS-c", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 142, moq50: 126 },
  { brand: "Standard", sku: "MS40", product: "MOTS-c", strength: 40, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 243, moq50: 216 },
  { brand: "Standard", sku: "TB2", product: "TB-500", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 59, moq50: 59 },
  { brand: "Standard", sku: "TB5", product: "TB-500", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 97, moq50: 97 },
  { brand: "Standard", sku: "TB10", product: "TB-500", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 161, moq50: 161 },
  { brand: "Standard", sku: "TSM2", product: "Tesamorelin", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 74 },
  { brand: "Standard", sku: "TSM5", product: "Tesamorelin", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 129, moq50: 115 },
  { brand: "Standard", sku: "TSM10", product: "Tesamorelin", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 220, moq50: 196 },
  { brand: "Standard", sku: "TSM20", product: "Tesamorelin", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 352, moq50: 352 },
  { brand: "Standard", sku: "DS5", product: "DSIP", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 86, moq50: 62 },
  { brand: "Standard", sku: "DS10", product: "DSIP", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 142, moq50: 103 },
  { brand: "Standard", sku: "MT1", product: "Melanotan I", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 110, moq50: 80 },
  { brand: "Standard", sku: "MT2", product: "Melanotan II", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "BB10", product: "BPC-157 + TB-500", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 122, moq50: 109 },
  { brand: "Standard", sku: "BB20", product: "BPC-157 + TB-500", strength: 20, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 214, moq50: 190 },
  { brand: "Standard", sku: "BB30", product: "BPC-157 + TB-500", strength: 30, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 455, moq50: 404 },
  { brand: "Standard", sku: "IGF1", product: "IGF-1 LR3", strength: 1, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 266, moq50: 213 },
  { brand: "Standard", sku: "IGF100MCG", product: "IGF-1 LR3", strength: 100, strengthUnit: "mcg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 70, moq50: 51 },
  { brand: "Standard", sku: "OT2", product: "Oxytocin Acetate", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 52, moq50: 38 },
  { brand: "Standard", sku: "OT5", product: "Oxytocin Acetate", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 62, moq50: 45 },
  { brand: "Standard", sku: "OT10", product: "Oxytocin Acetate", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 86, moq50: 62 },
  { brand: "Standard", sku: "CGL5B", product: "Cagrilintide", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 158, moq50: 115 },
  { brand: "Standard", sku: "CGL10B", product: "Cagrilintide", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 285, moq50: 207 },
  { brand: "Standard", sku: "VP10", product: "VIP", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 245, moq50: 178 },
  { brand: "Standard", sku: "G2-5", product: "GHRP-2 Acetate", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 54 },
  { brand: "Standard", sku: "G2-10", product: "GHRP-2 Acetate", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "G2-15", product: "GHRP-2 Acetate", strength: 15, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 11, noMoq: 117, moq50: 85 },
  { brand: "Standard", sku: "G6-5", product: "GHRP-6 Acetate", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 74, moq50: 54 },
  { brand: "Standard", sku: "G6-10", product: "GHRP-6 Acetate", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 94, moq50: 68 },
  { brand: "Standard", sku: "SERM2", product: "Sermorelin Acetate", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 72, moq50: 53 },
  { brand: "Standard", sku: "SERM5", product: "Sermorelin Acetate", strength: 5, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 126, moq50: 91 },
  { brand: "Standard", sku: "SERM10", product: "Sermorelin Acetate", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 221, moq50: 161 },
  { brand: "Standard", sku: "GLOW70", product: "BPC-157 + GHK-Cu + TB-5", strength: 70, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 230, moq50: 204 },
  { brand: "Standard", sku: "KLOW80", product: "KPV + BPC-157 + GHK-Cu + TB-5", strength: 80, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 253, moq50: 225 },
  { brand: "Standard", sku: "CJC2", product: "CJC-1295 (without DAC)", strength: 2, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: 70, moq50: 51 },

];

// --- Aura Labs (supplier brand) ---------------------------------------------
// Product line captured from Aura Labs' label sheet (aura.all.labels.pdf),
// grouped into the five color-coded categories printed on the labels.
// Commercial data is not yet available: noMoq / moq50 are left null until a
// supplier price list is entered, so these are skipped by buildPriceSheet and
// never produce a fabricated price. Vial spec defaults to the house standard
// (3 mL, 10 vials/pack). Strengths for compounds shared with the Standard line
// use the Standard-catalog value; six labels printed a placeholder "1000MG"
// and were corrected. Dihexa has no Standard reference — strength left null (TBD).
export const auraProducts: Product[] = [
  // Healing & Recovery
  { brand: "Aura", sku: "A-CU70", product: "GHK-Cu", strength: 50, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Healing & Recovery", subtitle: "Copper Peptide" },
  { brand: "Aura", sku: "A-GLOW70", product: "GLOW", strength: 70, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Healing & Recovery", subtitle: "GHK-Cu + BPC-157 + TB-500" },
  { brand: "Aura", sku: "A-BPC10", product: "BPC-157", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Healing & Recovery", subtitle: "Body Protection Compound 157" },
  { brand: "Aura", sku: "A-TB10", product: "TB-500", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Healing & Recovery", subtitle: "Thymosin Beta-4" },
  { brand: "Aura", sku: "A-KLOW80", product: "KLOW", strength: 80, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Healing & Recovery", subtitle: "KPV + GHK-Cu + BPC-157 + TB-500" },
  { brand: "Aura", sku: "A-KPV10", product: "KPV", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Healing & Recovery", subtitle: "Lysine-Proline-Valine Tripeptide" },

  // Weight Loss
  { brand: "Aura", sku: "A-GLP1S", product: "GLP-1 S", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Weight Loss", subtitle: "Semaglutide · single agonist (GLP-1)" },
  { brand: "Aura", sku: "A-GLP2TZ", product: "GLP-2 TZ", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Weight Loss", subtitle: "Tirzepatide · dual agonist (GIP/GLP-1)" },
  { brand: "Aura", sku: "A-GLP3R", product: "GLP-3 R", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Weight Loss", subtitle: "Retatrutide · triple agonist (GIP/GLP-1/glucagon)" },
  { brand: "Aura", sku: "A-MOTS10", product: "MOTS-c", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Weight Loss", subtitle: "Mitochondrial ORF of the 12S rRNA-c" },
  { brand: "Aura", sku: "A-AOD10", product: "AOD-9604", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Weight Loss", subtitle: "Fragment 176-191" },

  // Anti-Aging
  { brand: "Aura", sku: "A-EPI10", product: "Epithalon", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Anti-Aging", subtitle: "Pineal Tetrapeptide" },
  { brand: "Aura", sku: "A-NAD1000", product: "NAD+", strength: 1000, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Anti-Aging", subtitle: "Nicotinamide Adenine Dinucleotide" },
  // No Standard-sheet equivalent, so no strength to inherit — left null (TBD).
  { brand: "Aura", sku: "A-GLUT1000", product: "Glutathione", strength: null, strengthUnit: "", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Anti-Aging", subtitle: "Glutamine / Glycine / Cysteine" },

  // Cognitive
  { brand: "Aura", sku: "A-SEMAX10", product: "Semax", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Cognitive", subtitle: "Heptapeptide analog of ACTH(4-7)" },
  { brand: "Aura", sku: "A-SELANK10", product: "Selank", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Cognitive", subtitle: "Nootropic anxiolytic peptide" },
  { brand: "Aura", sku: "A-DIHEXA", product: "Dihexa", strength: null, strengthUnit: "", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Cognitive", subtitle: "N-hexanoic-Tyr-Ile-(6) aminohexanoic amide" },

  // Sexual Health
  { brand: "Aura", sku: "A-KISS10", product: "Kisspeptin-10", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Sexual Health", subtitle: "10-amino-acid peptide" },
  { brand: "Aura", sku: "A-MT2", product: "Melanotan II", strength: 10, strengthUnit: "mg", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Sexual Health", subtitle: "Heptapeptide analogue of α-MSH" },

  // Supplies — ordered from Standard and relabeled under Aura.
  { brand: "Aura", sku: "A-WAC3", product: "BAC Water", strength: null, strengthUnit: "", vialSize: 3, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Supplies", subtitle: "Bacteriostatic Water" },
  { brand: "Aura", sku: "A-WAC10", product: "BAC Water", strength: null, strengthUnit: "", vialSize: 10, vialUnit: "mL", vialsPerPack: 10, noMoq: null, moq50: null, category: "Supplies", subtitle: "Bacteriostatic Water" },
];

export const AURA_CATEGORIES = [
  "Healing & Recovery",
  "Weight Loss",
  "Anti-Aging",
  "Cognitive",
  "Sexual Health",
  "Supplies",
] as const;

// Each Aura SKU is sourced from (relabeled from) a Standard SKU. This mapping
// is the single source of truth for Aura strength + cost: resolveAuraProduct
// pulls the matched Standard product's strength and cost tiers onto the Aura
// item. SKUs with no Standard equivalent (Glutathione, Dihexa) map to null and
// keep their authored strength with null cost until sourced elsewhere.
export const AURA_SOURCE: Record<string, string | null> = {
  "A-CU70": "CU50",
  "A-GLOW70": "GLOW70",
  "A-BPC10": "BC10",
  "A-TB10": "TB10",
  "A-KLOW80": "KLOW80",
  "A-KPV10": "KPV10",
  "A-GLP1S": "SM10",
  "A-GLP2TZ": "TR10",
  "A-GLP3R": "RT10",
  "A-MOTS10": "MS10",
  "A-AOD10": "AOD10",
  "A-EPI10": "EPI10",
  "A-NAD1000": "NJ1000",
  "A-GLUT1000": null,
  "A-SEMAX10": "SX10",
  "A-SELANK10": "SK10",
  "A-DIHEXA": null,
  "A-KISS10": "KS10",
  "A-MT2": "MT2",
  "A-WAC3": "WAC3",
  "A-WAC10": "WAC10",
};

export const standardBySku: Map<string, Product> = new Map(
  standardProducts.map((p) => [p.sku, p]),
);

// Optional per-SKU override applied on top of the default source mapping.
export type AuraResolveOverride = {
  // Change which Standard SKU this Aura item is sourced from. null = unsourced.
  sourceSku?: string | null;
  // Manually pin the strength instead of inheriting it from the source.
  strength?: number | null;
};

// Resolve one Aura product into its effective form: strength + cost tiers are
// pulled from the (optionally overridden) Standard source; sourceSku is stamped
// on so downstream consumers (editor, restock PO) can trace it back.
export function resolveAuraProduct(
  p: Product,
  override?: AuraResolveOverride,
): Product {
  if (p.brand !== "Aura") return p;
  // Default source: the static mapping for built-in SKUs, or the product's own
  // sourceSku for user-added SKUs (which aren't in AURA_SOURCE).
  const defaultSource =
    p.sku in AURA_SOURCE ? AURA_SOURCE[p.sku] : p.sourceSku ?? null;
  const sourceSku =
    override?.sourceSku !== undefined ? override.sourceSku : defaultSource;
  const source = sourceSku ? standardBySku.get(sourceSku) ?? null : null;
  const strength =
    override?.strength !== undefined
      ? override.strength
      : source?.strength ?? p.strength;
  return {
    ...p,
    sourceSku,
    strength,
    strengthUnit: strength == null ? "" : source?.strengthUnit ?? p.strengthUnit,
    noMoq: source ? source.noMoq : p.noMoq,
    moq50: source ? source.moq50 : p.moq50,
  };
}

// Aura catalog with the default source mapping applied (no user overrides).
export const resolvedAuraProducts: Product[] = auraProducts.map((p) =>
  resolveAuraProduct(p),
);

// Full catalog exposed to the rest of the app: Standard + source-resolved Aura.
export const products: Product[] = [
  ...standardProducts,
  ...resolvedAuraProducts,
];
