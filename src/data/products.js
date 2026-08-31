const products = [
  {
    id: "air-jordan",
    name: "air jordan",
    displayName: "Air Jordan",
    price: 650,
    currency: "L.E",
    image: "/ascets/clothes/Air jordan.jpeg",
    category: "streetwear",
    type: "hoodie",
    colors: ["Black", "White"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["sports", "graphic", "jordan"]
  },
  {
    id: "cr7",
    name: "cr7",
    displayName: "Cr7",
    price: 650,
    currency: "L.E",
    image: "/ascets/clothes/Cr7.jpeg",
    category: "streetwear",
    type: "t-shirt",
    colors: ["Black", "White"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["football", "graphic", "sports"]
  },
  {
    id: "earth",
    name: "earth",
    displayName: "Earth",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/earth.jpeg",
    category: "limited",
    type: "hoodie",
    colors: ["Black", "Green"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["nature", "premium", "graphic"]
  },
  {
    id: "easy",
    name: "easy",
    displayName: "Easy",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/Easy.jpeg",
    category: "essentials",
    type: "sweatshirt",
    colors: ["Beige", "Black"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["minimal", "comfort", "daily"]
  },
  {
    id: "killer-boy",
    name: "killer boy",
    displayName: "Killer Boy",
    price: 650,
    currency: "L.E",
    image: "/ascets/clothes/killer boy.jpeg",
    category: "streetwear",
    type: "t-shirt",
    colors: ["Black", "Red"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["graphic", "bold", "street"]
  },
  {
    id: "like-me",
    name: "like me",
    displayName: "Like Me",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/Like me.jpeg",
    category: "essentials",
    type: "hoodie",
    colors: ["Grey", "Black"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["daily", "graphic", "comfort"]
  },
  {
    id: "marsello",
    name: "marsello",
    displayName: "Marsello",
    price: 650,
    currency: "L.E",
    image: "/ascets/clothes/Marsello.jpeg",
    category: "streetwear",
    type: "t-shirt",
    colors: ["White", "Black"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["football", "graphic", "sports"]
  },
  {
    id: "neymar",
    name: "neymar",
    displayName: "Neymar",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/Neymar.jpeg",
    category: "limited",
    type: "hoodie",
    colors: ["Black", "Blue"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["football", "premium", "sports"]
  },
  {
    id: "no-worled",
    name: "no worled",
    displayName: "No Worled",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/No worled.jpeg",
    category: "limited",
    type: "sweatshirt",
    colors: ["Black", "White"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["statement", "graphic", "premium"]
  },
  {
    id: "one-man",
    name: "one man",
    displayName: "One Man",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/one man.jpeg",
    category: "essentials",
    type: "hoodie",
    colors: ["Black", "Grey"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["minimal", "comfort", "daily"]
  },
  {
    id: "pelastine-1",
    name: "pelastine 1",
    displayName: "Pelastine 1",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/pelastine 1.jpeg",
    category: "limited",
    type: "hoodie",
    colors: ["Black", "Green"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["statement", "heritage", "premium"]
  },
  {
    id: "pelastine-2",
    name: "pelastine 2",
    displayName: "Pelastine 2",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/pelastine 2.jpeg",
    category: "limited",
    type: "hoodie",
    colors: ["White", "Green"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["statement", "heritage", "premium"]
  },
  {
    id: "say-no",
    name: "say no",
    displayName: "Say No",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/say no.jpeg",
    category: "streetwear",
    type: "sweatshirt",
    colors: ["Black", "Red"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["statement", "graphic", "street"]
  },
  {
    id: "say-yes",
    name: "say yes",
    displayName: "Say Yes",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/say yes.jpeg",
    category: "essentials",
    type: "sweatshirt",
    colors: ["White", "Black"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["statement", "daily", "graphic"]
  },
  {
    id: "siuuuu",
    name: "siuuuu",
    displayName: "Siuuuu",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/Siuuuu.jpeg",
    category: "limited",
    type: "hoodie",
    colors: ["Black", "Yellow"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["football", "premium", "sports"]
  },
  {
    id: "star",
    name: "star",
    displayName: "Star",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/star.jpeg",
    category: "essentials",
    type: "hoodie",
    colors: ["Black", "White"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["minimal", "daily", "graphic"]
  },
  {
    id: "the-goat",
    name: "the goat",
    displayName: "The Goat",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/The goat.jpeg",
    category: "limited",
    type: "hoodie",
    colors: ["Black", "Gold"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["football", "premium", "sports"]
  },
  {
    id: "the-main-men",
    name: "the main men",
    displayName: "The Main Men",
    price: 1300,
    currency: "L.E",
    image: "/ascets/clothes/The main men.jpeg",
    category: "streetwear",
    type: "sweatshirt",
    colors: ["Black", "Grey"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["statement", "street", "graphic"]
  },
  {
    id: "trap-star",
    name: "trap star",
    displayName: "Trap Star",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/trap star.jpeg",
    category: "streetwear",
    type: "hoodie",
    colors: ["Black", "White"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["street", "graphic", "premium"]
  },
  {
    id: "worked-hared",
    name: "worked hared",
    displayName: "Worked Hared",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/worked hared.jpeg",
    category: "essentials",
    type: "sweatshirt",
    colors: ["Grey", "Black"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["daily", "statement", "comfort"]
  },
  {
    id: "your-hand",
    name: "your hand",
    displayName: "Your Hand",
    price: 800,
    currency: "L.E",
    image: "/ascets/clothes/your hand.jpeg",
    category: "essentials",
    type: "hoodie",
    colors: ["White", "Black"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["daily", "graphic", "comfort"]
  },
  {
    id: "your-name1",
    name: "your name1",
    displayName: "Your Name1",
    price: 650,
    currency: "L.E",
    image: "/ascets/clothes/Your name1.jpeg",
    category: "essentials",
    type: "t-shirt",
    colors: ["White", "Black"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["custom", "daily", "graphic"]
  },
  {
    id: "your-name2",
    name: "your name2",
    displayName: "Your Name2",
    price: 650,
    currency: "L.E",
    image: "/ascets/clothes/Your Name2.jpeg",
    category: "essentials",
    type: "t-shirt",
    colors: ["Black", "White"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["custom", "daily", "graphic"]
  },
  {
    id: "your-name3",
    name: "your name3",
    displayName: "Your Name3",
    price: 650,
    currency: "L.E",
    image: "/ascets/clothes/Your Name3.jpeg",
    category: "essentials",
    type: "t-shirt",
    colors: ["White", "Grey"],
    sizes: ["M", "L", "XL","XXL","S"],
    tags: ["custom", "daily", "graphic"]
  }
];

function getProducts() {
  return products.map((product) => ({ ...product }));
}

function findProductById(productId) {
  return products.find((product) => product.id === productId) || null;
}

function normalizeFilterValue(value) {
  return String(value || "").trim().toLowerCase();
}

function filterProducts(filters = {}) {
  const query = normalizeFilterValue(filters.q);
  const category = normalizeFilterValue(filters.category);
  const type = normalizeFilterValue(filters.type);
  const color = normalizeFilterValue(filters.color);
  const size = normalizeFilterValue(filters.size);
  const maxPrice = Number(filters.maxPrice);

  return products.filter((product) => {
    const searchableText = [
      product.name,
      product.displayName,
      product.category,
      product.type,
      ...product.colors,
      ...product.sizes,
      ...product.tags
    ].join(" ").toLowerCase();

    if (query && !searchableText.includes(query)) {
      return false;
    }

    if (category && category !== "all" && product.category !== category) {
      return false;
    }

    if (type && type !== "all" && product.type !== type) {
      return false;
    }

    if (color && color !== "all" && !product.colors.some((entry) => normalizeFilterValue(entry) === color)) {
      return false;
    }

    if (size && size !== "all" && !product.sizes.some((entry) => normalizeFilterValue(entry) === size)) {
      return false;
    }

    if (Number.isFinite(maxPrice) && product.price > maxPrice) {
      return false;
    }

    return true;
  });
}

function getFilterOptions() {
  const collect = (key) => Array.from(new Set(products.flatMap((product) => product[key]))).sort();
  const prices = products.map((product) => product.price);

  return {
    categories: Array.from(new Set(products.map((product) => product.category))).sort(),
    types: Array.from(new Set(products.map((product) => product.type))).sort(),
    colors: collect("colors"),
    sizes: collect("sizes"),
    price: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  };
}

function getRelatedProducts(productId, limit = 4) {
  const product = findProductById(productId);

  if (!product) {
    return [];
  }

  return products
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      const tagMatches = candidate.tags.filter((tag) => product.tags.includes(tag)).length;
      const categoryMatch = candidate.category === product.category ? 3 : 0;
      const typeMatch = candidate.type === product.type ? 2 : 0;
      const colorMatches = candidate.colors.filter((color) => product.colors.includes(color)).length;

      return {
        product: candidate,
        score: tagMatches + categoryMatch + typeMatch + colorMatches
      };
    })
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, limit)
    .map(({ product: candidate }) => ({ ...candidate }));
}

module.exports = {
  getProducts,
  findProductById,
  filterProducts,
  getFilterOptions,
  getRelatedProducts
};
