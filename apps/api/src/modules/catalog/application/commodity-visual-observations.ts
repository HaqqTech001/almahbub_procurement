export const commodityVisualObservations: Readonly<
  Record<
    string,
    {
      slug: string;
      status: string;
      note: string;
      checkedAt: string;
      method: string;
    }
  >
> = {
  "7663317f533977a6adb70673491bc230c3fcfc689c4e62531f157d5742166f6c": {
    slug: "cashew",
    status: "rejected",
    note: "Mixed nuts and dried-fruit mixture, not isolated cashew kernels. Misleading hero for this commodity.",
    checkedAt: "2026-09-18",
    method:
      "Visual inspection of the stored local binary; not a licensing or botanical certification",
  },
  "73ab79a9f94d4b46016ddcf0cb4bb2bfde9ec30ee30ad1600808aa55d4f2892a": {
    slug: "cocoa",
    status: "rejected",
    note: "Image renders with severe dark/red blocks and does not provide a clear cocoa subject. Replace after source and decoder review.",
    checkedAt: "2026-09-18",
    method:
      "Visual inspection of the stored local binary; not a licensing or botanical certification",
  },
  ff22f612d50d848ef45f758d5e8e456374982af62741c2bc07ae3276c8e1b383: {
    slug: "ginger",
    status: "visually_consistent",
    note: "Fresh ginger rhizomes are clearly visible; description permits fresh or dried form.",
    checkedAt: "2026-09-18",
    method:
      "Visual inspection of the stored local binary; not a licensing or botanical certification",
  },
  "3a9cd3e7eaed767be476020a685677091aa8ee7f60c18d4ff52d9a267e2bd8a6": {
    slug: "hibiscus",
    status: "visually_consistent",
    note: "Red calyces and harvested stems visible; title and description refer to hibiscus. Cleaner commodity-focused image recommended.",
    checkedAt: "2026-09-18",
    method:
      "Visual inspection of the stored local binary; not a licensing or botanical certification",
  },
  "1aff38d9e0dca8f5706fc851bfd1398c29ec22d238487c608ea1f2244b89c05b": {
    slug: "sesame-seeds",
    status: "visually_consistent",
    note: "Small pale sesame seeds on a spoon are consistent with the commodity and seed description.",
    checkedAt: "2026-09-18",
    method:
      "Visual inspection of the stored local binary; not a licensing or botanical certification",
  },
  bc4f913a7c75454d552769bf3e71c1668ad641f3d91e23b530716b0fd5c59449: {
    slug: "shea",
    status: "manual_review",
    note: "Reddish nuts with dark fibrous patches; botanical identity is not confidently confirmed as shea. Require verified source identification.",
    checkedAt: "2026-09-18",
    method:
      "Visual inspection of the stored local binary; not a licensing or botanical certification",
  },
  e79d0c377d8caee5ec0be179b528039b5dd147d90e70ed7adbe8717c9e37a9d9: {
    slug: "soybean",
    status: "visually_consistent",
    note: "Pale rounded seeds with visible hilum are consistent with soybean imagery and seed description.",
    checkedAt: "2026-09-18",
    method:
      "Visual inspection of the stored local binary; not a licensing or botanical certification",
  },
};
