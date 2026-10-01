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
    { src: "assets/komuso.jpg", focus: "50% 30%" },
  ],

  // The three collections. Ids are fixed; text and cover photo are editable.
  collections: [
    {
      id: "edo",
      kicker: "Edo & Meiji period",
      title: "Edo Shakuhachi",
      text: "Old flutes with lacquer, binding and decoration, chosen for their history as much as their sound. Each one is unique.",
      cta: "Explore the old flutes",
      image: "assets/edo-cover.jpg",
    },
    {
      id: "jinashi",
      kicker: "Natural bore",
      title: "Jinashi Shakuhachi",
      text: "Bamboo left as it grew, without paste in the bore. Breathy and earthy, for honkyoku and meditation.",
      cta: "Choose your sound",
      image: "assets/jinashi-bound.jpg",
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
  // Sample listings to show the layout. sample: true adds a "Sample" label; delete them in admin.html.
  {
    id: "sample-edo-antique",
    name: "Antique Edo Period Shakuhachi",
    maker: "Unknown",
    length: "1.8",
    collection: "edo",
    price: 1200,
    status: "available",
    images: ["assets/edo-antique.jpg", "assets/edo-antique-2.jpg", "assets/edo-antique-3.jpg", "assets/edo-antique-4.jpg"],
    youtube: "https://www.youtube.com/watch?v=ksansOKZkDo",
    description: "Sample listing. Replace with a real flute from the shop.\nAn old flute with a deep, warm patina and a metal band at the joint, shown on a display stand.\nThe video is a recording of the honkyoku Kyorei for reference.",
    sample: true,
    sort: 2,
  },
  {
    id: "sample-edo-komuso",
    name: "Old Plain Shakuhachi",
    maker: "Unknown",
    length: "1.8",
    collection: "edo",
    price: 950,
    status: "sold",
    images: ["assets/edo-met.jpg", "assets/edo-met-2.jpg", "assets/edo-met-3.jpg"],
    youtube: "",
    description: "Sample listing. Replace with a real flute from the shop.\nA plain old flute with thread binding near the mouthpiece and a separate end cap.",
    sample: true,
    sort: 3,
  },
  {
    id: "sample-jinashi-18",
    name: "1.8 Jinashi Shakuhachi",
    maker: "Unknown",
    length: "1.8",
    collection: "jinashi",
    price: 480,
    status: "available",
    images: ["assets/jinashi.jpg", "assets/jinashi-2.jpg", "assets/jinashi-3.jpg"],
    youtube: "https://www.youtube.com/watch?v=DOoWrAKQ_2Y",
    description: "Sample listing. Replace with a real flute from the shop.\nNatural bore, light honey-coloured bamboo with root end and binding at the nodes.\nThe video is a recording of Shika no Tōne for reference.",
    sample: true,
    sort: 4,
  },
  {
    id: "sample-jinashi-24",
    name: "2.4 Jinashi Shakuhachi",
    maker: "Unknown",
    length: "2.4",
    collection: "jinashi",
    price: 650,
    status: "reserved",
    images: ["assets/jinashi-bound.jpg", "assets/jinashi-bound-2.jpg", "assets/jinashi-bound-3.jpg"],
    youtube: "https://www.youtube.com/watch?v=4jzH55i5a4U",
    description: "Sample listing. Replace with a real flute from the shop.\nA long, dark bamboo flute with rattan binding along its length. Deep and slow to speak.",
    sample: true,
    sort: 5,
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
