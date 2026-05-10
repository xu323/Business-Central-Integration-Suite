/**
 * Front-end stub data for VendorLookupDialog / ItemLookupDialog.
 * Replaced by `/api/vendors/search` and `/api/items/search` once the backend
 * exposes them (TODO Phase 5+).
 */

export interface VendorRow {
  no: string;
  name: string;
  contact: string;
  country: string;
  lastTxn: string;
}

export interface ItemRow {
  no: string;
  name: string;
  uom: string;
  unitPrice: number;
  category: string;
}

export const VENDORS: VendorRow[] = [
  { no: "V-50001", name: "台灣三井倉儲股份有限公司",  contact: "陳俊宏", country: "TW", lastTxn: "2026-04-12" },
  { no: "V-50002", name: "Sanritz Corporation",         contact: "Hiroshi Tanaka", country: "JP", lastTxn: "2026-03-30" },
  { no: "V-50003", name: "先鋒科技股份有限公司",       contact: "林筱涵", country: "TW", lastTxn: "2026-04-22" },
  { no: "V-50004", name: "Northwind Hardware Asia",     contact: "Daniel Park", country: "KR", lastTxn: "2026-02-19" },
  { no: "V-50005", name: "Itoki Office Solutions",      contact: "Yuki Saito", country: "JP", lastTxn: "2026-04-05" },
  { no: "V-50006", name: "群創光電股份有限公司",       contact: "蘇建華", country: "TW", lastTxn: "2026-01-11" },
  { no: "V-50007", name: "Renaissance Logistics",       contact: "Karen Wu", country: "SG", lastTxn: "2026-04-18" },
  { no: "V-50008", name: "EventPro Inc.",                contact: "Daisy Lin", country: "TW", lastTxn: "2026-03-02" },
  { no: "V-50009", name: "TPV Display Components",      contact: "Andrew Cheng", country: "TW", lastTxn: "2026-04-08" },
  { no: "V-50010", name: "Toppan Printing Co., Ltd.",    contact: "Ren Yamamoto", country: "JP", lastTxn: "2026-03-25" },
  { no: "V-50011", name: "ASE Group",                    contact: "Carol Wu", country: "TW", lastTxn: "2026-04-02" },
  { no: "V-50012", name: "Mizuho Trading Group",         contact: "Kenji Shimada", country: "JP", lastTxn: "2026-02-27" },
];

export const ITEMS: ItemRow[] = [
  { no: "ITEM-LAPTOP-13",  name: "13\" 商務筆電",         uom: "PCS", unitPrice: 38000, category: "IT" },
  { no: "ITEM-LAPTOP-14",  name: "14\" 開發筆電",         uom: "PCS", unitPrice: 52000, category: "IT" },
  { no: "ITEM-MON-27",     name: "27\" 4K 顯示器",        uom: "PCS", unitPrice: 12500, category: "IT" },
  { no: "ITEM-SVR-RACK",   name: "機架式伺服器",          uom: "PCS", unitPrice: 95000, category: "Infra" },
  { no: "ITEM-PAPER-A4",   name: "A4 影印紙 (5 包/箱)",   uom: "BOX", unitPrice: 380,   category: "Office" },
  { no: "ITEM-PEN-BLU",    name: "藍色原子筆 (12 支/盒)", uom: "BOX", unitPrice: 180,   category: "Office" },
  { no: "ITEM-CHAIR-ERG",  name: "人體工學辦公椅",        uom: "PCS", unitPrice: 8800,  category: "Office" },
  { no: "ITEM-DESK-ELEC",  name: "電動升降桌",            uom: "PCS", unitPrice: 16500, category: "Office" },
  { no: "ITEM-CAB-CAT6A",  name: "Cat6A 網路線 305m",     uom: "ROLL", unitPrice: 4200, category: "Infra" },
  { no: "ITEM-NAS-12TB",   name: "NAS 12TB",              uom: "PCS", unitPrice: 28000, category: "Infra" },
  { no: "SVC-EVENT",        name: "活動贊助 / 攤位",       uom: "JOB", unitPrice: 250000, category: "Marketing" },
  { no: "SVC-LICENSE-MS",  name: "Microsoft 365 商務年費", uom: "LIC", unitPrice: 4800, category: "License" },
];

export const DEPARTMENTS = ["資訊部", "行政部", "財務部", "業務部", "行銷部", "研發部", "倉儲部"];
export const CURRENCIES = [
  { code: "TWD", name: "新台幣" },
  { code: "USD", name: "美元" },
  { code: "JPY", name: "日圓" },
  { code: "CNY", name: "人民幣" },
  { code: "EUR", name: "歐元" },
];
export const UOMS = ["PCS", "BOX", "JOB", "LIC", "ROLL", "SET", "M", "KG"];
