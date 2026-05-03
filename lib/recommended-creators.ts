export type RecommendedCreator = {
  name: string;
  url: string;
  image?: string;
  note?: string;
};

export type Industry = {
  id: string;
  label: string;
  description: string;
  creators: RecommendedCreator[];
};

export const INDUSTRIES: Industry[] = [
  {
    id: "linkedin-content",
    label: "LinkedIn Content & Personal Branding",
    description: "Top creators for content marketing, copywriting, ghostwriting, and personal brand on LinkedIn.",
    creators: [
      { name: "Jacob Pegs", url: "https://www.linkedin.com/in/jacob-pegs/", image: "/creators/jacob-pegs.jpg" },
      { name: "Lara Acosta", url: "https://www.linkedin.com/in/laraacostar/", image: "/creators/laraacostar.jpg" },
      { name: "Jasmin Alic", url: "https://www.linkedin.com/in/alicjasmin/", image: "/creators/alicjasmin.jpg" },
      { name: "Luke Shalom", url: "https://www.linkedin.com/in/lukeshalom/", image: "/creators/lukeshalom.jpg" },
      { name: "Marina Panova", url: "https://www.linkedin.com/in/marina-panova-74b940166/", image: "/creators/marina-panova-74b940166.jpg" },
      { name: "Tima Elhajj", url: "https://www.linkedin.com/in/timaelhajj/", image: "/creators/timaelhajj.jpg" },
      { name: "Justin Welsh", url: "https://www.linkedin.com/in/justinwelsh/", image: "/creators/justinwelsh.jpg" },
      { name: "Paolo Trivellato", url: "https://www.linkedin.com/in/leadgenwiz/", image: "/creators/leadgenwiz.jpg" },
    ],
  },
  {
    id: "gtm-outbound",
    label: "GTM / Outbound",
    description: "Operators sharing real outbound, signal-based GTM, and AI sales tooling.",
    creators: [
      { name: "Michel Lieben", url: "https://www.linkedin.com/in/michel-lieben/", image: "/creators/michel-lieben.jpg" },
      { name: "Alex Vacca", url: "https://www.linkedin.com/in/alex-vacca/", image: "/creators/alex-vacca.jpg" },
      { name: "Shawn Tenam", url: "https://www.linkedin.com/in/shawntenam/", image: "/creators/shawntenam.jpg" },
      { name: "Matteo Tittarelli", url: "https://www.linkedin.com/in/matteo-titta/", image: "/creators/matteo-titta.jpg" },
      { name: "Varun Anand", url: "https://www.linkedin.com/in/vaanand/", image: "/creators/vaanand.jpg" },
      { name: "Othmane Khadri", url: "https://www.linkedin.com/in/othmane-khadri-b48162236/", image: "/creators/othmane-khadri-b48162236.jpg" },
      { name: "Charles Tenot", url: "https://www.linkedin.com/in/charlestenot/", image: "/creators/charlestenot.jpg" },
      { name: "Adam Robinson", url: "https://www.linkedin.com/in/retentionadam/", image: "/creators/retentionadam.jpg" },
      { name: "Erwan Gauthier", url: "https://www.linkedin.com/in/erwan-gauthier-b2783280/", image: "/creators/erwan-gauthier-b2783280.jpg" },
    ],
  },
  {
    id: "saas-founders",
    label: "SaaS Founders",
    description: "B2B SaaS founders and product/marketing leaders who post regularly on LinkedIn.",
    creators: [
      { name: "Arvid Kahl", url: "https://www.linkedin.com/in/arvidkahl/", image: "/creators/arvidkahl.jpg" },
      { name: "Rob Walling", url: "https://www.linkedin.com/in/robwalling/", image: "/creators/robwalling.jpg" },
      { name: "Kieran Flanagan", url: "https://www.linkedin.com/in/kieranjflanagan/", image: "/creators/kieranjflanagan.jpg" },
      { name: "Charles Tenot", url: "https://www.linkedin.com/in/charlestenot/", image: "/creators/charlestenot.jpg" },
      { name: "Lenny Rachitsky", url: "https://www.linkedin.com/in/lennyrachitsky/", image: "/creators/lennyrachitsky.jpg" },
      { name: "Wes Bush", url: "https://www.linkedin.com/in/wesbush/", image: "/creators/wesbush.jpg" },
      { name: "Hiten Shah", url: "https://www.linkedin.com/in/hnshah/", image: "/creators/hnshah.jpg" },
      { name: "Dave Gerhardt", url: "https://www.linkedin.com/in/davegerhardt/", image: "/creators/davegerhardt.jpg" },
      { name: "Anthony Pierri", url: "https://www.linkedin.com/in/anthonypierri/", image: "/creators/anthonypierri.jpg" },
      { name: "April Dunford", url: "https://www.linkedin.com/in/aprildunford/", image: "/creators/aprildunford.jpg" },
    ],
  },
  {
    id: "agency-owners",
    label: "Agency Owners",
    description: "Agency operators and consultants sharing client acquisition and scaling playbooks.",
    creators: [
      { name: "Charlie Morgan", url: "https://www.linkedin.com/in/charliemorganuk/", image: "/creators/charliemorganuk.jpg" },
      { name: "Sam Ovens", url: "https://www.linkedin.com/in/samovens/", image: "/creators/samovens.jpg" },
      { name: "Robb Bailey", url: "https://www.linkedin.com/in/robbbailey/", image: "/creators/robbbailey.jpg" },
      { name: "Joel Kaplan", url: "https://www.linkedin.com/in/joelbkaplan/", image: "/creators/joelbkaplan.jpg" },
      { name: "Alex Berman", url: "https://www.linkedin.com/in/alexanderberman/", image: "/creators/alexanderberman.jpg" },
      { name: "Eddie Shleyner", url: "https://www.linkedin.com/in/eshleyner/", image: "/creators/eshleyner.jpg" },
      { name: "Daniel Murray", url: "https://www.linkedin.com/in/daniel-murray-marketing/", image: "/creators/daniel-murray-marketing.jpg" },
      { name: "Joey Yak", url: "https://www.linkedin.com/in/joeyyak/", image: "/creators/joeyyak.jpg" },
    ],
  },
  {
    id: "solopreneurs",
    label: "Solopreneurs / Freelancers",
    description: "Solo creators and one-person businesses sharing income, systems, and writing.",
    creators: [
      { name: "Justin Welsh", url: "https://www.linkedin.com/in/justinwelsh/", image: "/creators/justinwelsh.jpg" },
      { name: "Dickie Bush", url: "https://www.linkedin.com/in/dickiebush/", image: "/creators/dickiebush.jpg" },
      { name: "Nicolas Cole", url: "https://www.linkedin.com/in/nicolascole/", image: "/creators/nicolascole.jpg" },
      { name: "Ali Abdaal", url: "https://www.linkedin.com/in/ali-abdaal/", image: "/creators/ali-abdaal.jpg" },
      { name: "Khe Hy", url: "https://www.linkedin.com/in/khehy/", image: "/creators/khehy.jpg" },
      { name: "Sahil Bloom", url: "https://www.linkedin.com/in/sahilbloom/", image: "/creators/sahilbloom.jpg" },
      { name: "Codie Sanchez", url: "https://www.linkedin.com/in/codiesanchez/", image: "/creators/codiesanchez.jpg" },
      { name: "Pat Walls", url: "https://www.linkedin.com/in/patrickwalls/", image: "/creators/patrickwalls.jpg" },
      { name: "Greg Isenberg", url: "https://www.linkedin.com/in/gisenberg/", image: "/creators/gisenberg.jpg" },
      { name: "Sam Parr", url: "https://www.linkedin.com/in/parrsam/", image: "/creators/parrsam.jpg" },
    ],
  },
  {
    id: "ai-builders",
    label: "AI / ML Builders",
    description: "AI and ML practitioners sharing research, frameworks, and applied work on LinkedIn.",
    creators: [
      { name: "Logan Kilpatrick", url: "https://www.linkedin.com/in/logankilpatrick/", image: "/creators/logankilpatrick.jpg" },
      { name: "Yann LeCun", url: "https://www.linkedin.com/in/yann-lecun/", image: "/creators/yann-lecun.jpg" },
      { name: "Andrew Ng", url: "https://www.linkedin.com/in/andrewyng/", image: "/creators/andrewyng.jpg" },
      { name: "Allie K Miller", url: "https://www.linkedin.com/in/alliekmiller/", image: "/creators/alliekmiller.jpg" },
      { name: "Pavan Belagatti", url: "https://www.linkedin.com/in/pavan-belagatti/", image: "/creators/pavan-belagatti.jpg" },
      { name: "Aleksa Gordić", url: "https://www.linkedin.com/in/aleksagordic/", image: "/creators/aleksagordic.jpg" },
      { name: "Bojan Tunguz", url: "https://www.linkedin.com/in/tunguz/", image: "/creators/tunguz.jpg" },
      { name: "Cassie Kozyrkov", url: "https://www.linkedin.com/in/kozyrkov/", image: "/creators/kozyrkov.jpg" },
      { name: "Tom Yeh", url: "https://www.linkedin.com/in/tom-yeh/", image: "/creators/tom-yeh.jpg" },
      { name: "Yannic Kilcher", url: "https://www.linkedin.com/in/ykilcher/", image: "/creators/ykilcher.jpg" },
    ],
  },
];

export const MAX_CREATORS_PER_USER = 4;

export function findIndustry(id: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

const PHOTO_BY_NAME: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const industry of INDUSTRIES) {
    for (const c of industry.creators) {
      if (c.image && !map[c.name]) map[c.name] = c.image;
    }
  }
  return map;
})();

export function getCreatorPhoto(name: string): string | undefined {
  return PHOTO_BY_NAME[name];
}
