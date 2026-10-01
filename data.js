// Default content. Once Supabase is connected, everything here except JIARI_LENGTHS and PITCH
// is edited from admin.html; these values are only the starting point and the demo-mode seed.
const DEFAULTS = {
  contact: {
    facebook: "https://www.facebook.com/trancaoshakuhachi.com.vn",
    messenger: "https://m.me/trancaoshakuhachi.com.vn",
    reviews: "https://www.facebook.com/trancaoshakuhachi.com.vn/reviews",
  },

  // Full-screen photos on the home page. Several photos cross-fade every few seconds.
  hero: [
    { src: "assets/hero.jpg", focus: "50% 42%" },
  ],

  // The three collections. Ids are fixed; text and cover photo are editable.
  collections: [
    {
      id: "edo",
      kicker: "Edo & Meiji period",
      title: "Edo Shakuhachi",
      text: "Old flutes with lacquer, binding and decoration, chosen for their history as much as their sound. Each one is unique.",
      cta: "Explore the old flutes",
      image: "assets/hero.jpg",
    },
    {
      id: "jinashi",
      kicker: "Natural bore",
      title: "Jinashi Shakuhachi",
      text: "Bamboo left as it grew, without paste in the bore. Breathy and earthy, for honkyoku and meditation.",
      cta: "Choose your sound",
      image: "",
    },
    {
      id: "jiari",
      kicker: "Contemporary",
      title: "Jiari Shakuhachi",
      text: "Tuned-bore flutes for Kinko, Tozan and modern playing. Stable pitch, strong voice, ready for lessons and the stage.",
      cta: "Browse by length",
      image: "assets/seien.jpg",
    },
  ],

  // Summary from the Facebook reviews tab, plus a few favourite reviews to quote.
  reviewSummary: { recommend: "100%", count: 14 },
  reviews: [
    {
      name: "Josel A.N. Gaston",
      date: "December 2025",
      text: "Sensei Tran responded patiently and kindly to all my newbie questions. He knows the Shakuhachi and the Nan Xiao masterfully.",
    },
  ],
};

// Starting inventory. status: available | reserved | sold.
// youtube: any YouTube link (watch, youtu.be, shorts) or a bare video id.
// description: paragraphs separated by line breaks.
const SEED_FLUTES = [
  {
    id: "seien-19",
    name: "1.9 Seien Shakuhachi",
    maker: "Seien",
    length: "1.9",
    collection: "jiari",
    price: 350,
    status: "available",
    images: ["assets/seien.jpg"],
    youtube: "",
    description: "A 1.9 Seien shakuhachi for sale.\nThe utaguchi insert was missing when it came in, so it has been replaced with bull bone.\nThe sound is beautiful. Please watch the video for your reference.\nAsking price is 350 USD plus shipping.",
    sort: 1,
  },
];

// Sub-categories of Jiari, by length in shaku.
const JIARI_LENGTHS = [
  { id: "short", title: "Shorter lengths", match: (l) => l < 1.6 },
  ...["1.6", "1.7", "1.8", "1.9", "2.0", "2.1", "2.2", "2.3"].map((l) => ({
    id: l, title: `${l} Shakuhachi`, match: (x) => x.toFixed(1) === l,
  })),
  { id: "long", title: "Longer lengths", match: (l) => l > 2.3 },
];

// Approximate fundamental pitch for common lengths.
const PITCH = {
  "1.3": "G", "1.4": "F#", "1.5": "F", "1.6": "E", "1.7": "D#", "1.8": "D",
  "1.9": "C#", "2.0": "C", "2.1": "B", "2.4": "A",
};
