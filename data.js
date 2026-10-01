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

  // The collections, in menu order. Ids are fixed; text and cover photo are editable.
  collections: [
    {
      id: "edo",
      kicker: "Edo period",
      title: "Edo Shakuhachi",
      text: "Old Shakuhachi were made and played by monks during the Edo period. Each one has a unique sound.",
      cta: "Explore the old Shakuhachi",
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
      text: "Tuned-bore Shakuhachi for Kinko, Tozan and modern playing. Stable pitch, strong voice, ready for lessons and the stage.",
      cta: "Browse by length",
      image: "assets/seien.jpg",
    },
    {
      id: "wood",
      kicker: "Wood & resin",
      title: "Wood and Yuu Shakuhachi",
      text: "Wooden Shakuhachi and the resin Yuu: stable, affordable instruments for beginners, travel and practice.",
      cta: "See wood and Yuu",
      image: "",
    },
    {
      id: "bamboo",
      kicker: "For makers",
      title: "Bamboo for Shakuhachi making",
      text: "Selected madake bamboo with the root end, ready for making your own Shakuhachi.",
      cta: "See the bamboo",
      image: "",
    },
  ],

  // Summary from the Facebook reviews tab, plus reviews copied word for word from the page.
  reviewSummary: { recommend: "100%", count: 14 },
  reviews: [
    { name: "Josel A.N. Gaston", date: "December 2025", text: "Sensei Tran responded patiently and kindly to all my newbie questions. He knows the Shakuhachi and the Nan Xiao masterfully. Beneath his youthful appearance is a sage master’s spirit who has seen these instruments survive history’s chapters.\nI got my first F Nan Xiao from him and it feels and sounds like a calm old soul singing even if the air came from a newbie like myself. I have a feeling of certainty the 2.0 Shakuhachi arriving next week will feel and sound as amazing having been tested by maestro Tran who is an accomplished musician himself.\nIf you’re planning to get your first flutes without breaking the bank, do yourself a favour and get them from Tran." },
    { name: "Giancarlo Mazzù", date: "November 2025", text: "I highly recommend this shakuhachi shop. The seller is very attentive and willing to meet your requests, and the shipping is flawless. I received a shakuhachi in perfect conditions, the sound is balanced and well in tune. Thank you dear Cao, great instruments and great seller!" },
    { name: "Shinzan Shinzan", date: "September 2025", text: "I highly recommend old shakuhachi shop. The seller is attentive to your desires and very good advice. He is a shakuhachi lover who leads his activity out of passion. The prices are affordable and I love my new shakuhachi which corresponds in every way to what I wanted. Thank you Old shakuhachi shop!!!" },
    { name: "Tyler Drake Smith", date: "May 2025", text: "I've purchased three flutes from Tran, all of which have been great quality and seemingly authentic. Great guy and seller. I've been told the best respect you can afford to a Shakuhachi is to play it, so I encourage everyone to buy one from his collection so it can be played! He ships fast and the flutes are well protected in transit." },
    { name: "Kamil Sebastian Kaees", date: "May 2025", text: "I really recommend the service, knowledge and quality I get from the Old Shakuhachi Shop. I also appreciate the advices, professional attitude and quick contact as well as very quick shipping even for the other part of the world." },
    { name: "Jesse Wright", date: "April 2025", text: "I received the most amazing Shakuhachi flute!\nWas a pleasure doing business. Easy, clear, honest!\nI’m looking forward to many hours with this flute. I’ll definitely contact Trăn again when im ready for another Shakuhachi.\nThank you." },
    { name: "Christopher Matthew Ardagna", date: "April 2025", text: "This is a sincere note of respect and appreciation for Cao Trần at Old Shakuhachi Shop where I purchased my first wooden shakuhachi. Tran is extremely helpful in assisting beginners, and I will absolutely be returning to his shop many times in the future." },
    { name: "Gerardo Pavone", date: "March 2025", text: "I live in USA. I was looking for a good shakuhachi but not too expensive. The Old Shakuhachi Shop gave me different options, and for each option sent me not only photos but also a detailed video. I finally choose a 1.9 made of wood. The price was incredible and the instrument arrived in 6 days. It is beautiful, easy to play and very well made. I couldn't be happier and I will do business again." },
    { name: "Kevin Chen", date: "March 2025", text: "Over the last several years, I have purchased several flutes from this seller. He is very knowledgeable and trustworthy. I highly recommend this shop to all shakuhachi enthusiasts!" },
    { name: "Zen Blues shakuhachi and blues harp", date: "November 2024", text: "tran cao is very good at repairing I was surprised by the quality of is work totally reccomend it. serious honest and kind" },
    { name: "Daniele Varelli", date: "August 2024", text: "I bought two shakuhachi and I am 100% satisfied. Friendly and competent seller, excellent international service and quality guaranteed, at a very reasonable price." },
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
    description: "Sample listing. Replace with a real Shakuhachi from the shop.\nAn old Shakuhachi with a deep, warm patina and a metal band at the joint, shown on a display stand.\nThe video is a recording of the honkyoku Kyorei for reference.",
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
    description: "Sample listing. Replace with a real Shakuhachi from the shop.\nA plain old Shakuhachi with thread binding near the mouthpiece and a separate end cap.",
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
    description: "Sample listing. Replace with a real Shakuhachi from the shop.\nNatural bore, light honey-coloured bamboo with root end and binding at the nodes.\nThe video is a recording of Shika no Tōne for reference.",
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
    description: "Sample listing. Replace with a real Shakuhachi from the shop.\nA long, dark bamboo Shakuhachi with rattan binding along its length. Deep and slow to speak.",
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
