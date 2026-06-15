const sampleListings = [
  {
    title: "Overwater Villa in Maldives",
    description:
      "Wake up to crystal-clear turquoise waters in this luxurious overwater bungalow. Includes private infinity pool, glass-floor viewing panel, and direct ocean access. Premium all-inclusive dining with sunset champagne service.",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1920&q=80",
    price: 45000,
    location: "Baa Atoll",
    country: "Maldives",
  },
  {
    title: "Cliffside Retreat in Santorini",
    description:
      "Iconic whitewashed cave villa perched on the caldera cliffs of Oia. Breathtaking sunset views, private plunge pool, and Mediterranean fine dining. The most photographed destination in Greece.",
    image:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1920&q=80",
    price: 35000,
    location: "Oia, Santorini",
    country: "Greece",
  },
  {
    title: "Royal Heritage Haveli in Jaipur",
    description:
      "Step into Rajasthani royalty at this 300-year-old restored haveli. Hand-painted frescoes, marble courtyards, rooftop dining overlooking Amber Fort, and traditional Rajasthani hospitality.",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1920&q=80",
    price: 8500,
    location: "Jaipur, Rajasthan",
    country: "India",
  },
  {
    title: "Tropical Beachfront Villa in Bali",
    description:
      "Private beachfront villa surrounded by lush tropical gardens in Seminyak. Features infinity pool, open-air bathroom, Balinese spa, and personal chef preparing authentic Indonesian cuisine.",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80",
    price: 15000,
    location: "Seminyak, Bali",
    country: "Indonesia",
  },
  {
    title: "Houseboat Cruise in Kerala",
    description:
      "Drift through the serene backwaters of Alleppey on a luxury kettuvallam houseboat. Includes full-board meals of Kerala cuisine, Ayurvedic massage, and views of coconut-fringed canals and paddy fields.",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=80",
    price: 6500,
    location: "Alleppey, Kerala",
    country: "India",
  },
  {
    title: "Alpine Chalet in Swiss Alps",
    description:
      "Cozy luxury chalet nestled in the Swiss Alps with panoramic mountain views. Features private hot tub, fireplace lounge, ski-in/ski-out access, and fondue dining under the stars.",
    image:
      "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1920&q=80",
    price: 40000,
    location: "Zermatt",
    country: "Switzerland",
  },
  {
    title: "Beach Shack Paradise in Goa",
    description:
      "Bohemian-chic beach shack steps from Palolem's crescent beach. Wake to the sound of waves, enjoy fresh seafood barbecue, sunset yoga sessions, and vibrant nightlife nearby.",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1920&q=80",
    price: 3500,
    location: "Palolem, Goa",
    country: "India",
  },
  {
    title: "Treehouse Hideaway in Munnar",
    description:
      "Elevated treehouse amidst rolling tea plantations of Munnar. Misty mountain mornings, guided tea estate tours, campfire evenings, and panoramic views of the Western Ghats.",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80",
    price: 5500,
    location: "Munnar, Kerala",
    country: "India",
  },
  {
    title: "Desert Glamping in Jaisalmer",
    description:
      "Luxury desert camp under a billion stars in the Thar Desert. Swiss tents with en-suite bathrooms, camel safari at sunset, folk music performances, and authentic Rajasthani thali dinner.",
    image:
      "https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=1920&q=80",
    price: 4500,
    location: "Sam Sand Dunes, Jaisalmer",
    country: "India",
  },
  {
    title: "Floating Market Stay in Bangkok",
    description:
      "Riverside boutique hotel overlooking the iconic Chao Phraya River. Rooftop infinity pool, authentic Thai cooking classes, private long-tail boat tours, and proximity to the Grand Palace.",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1920&q=80",
    price: 9000,
    location: "Bangkok",
    country: "Thailand",
  },
  {
    title: "Himalayan Lodge in Manali",
    description:
      "Charming wooden lodge in Old Manali with views of snow-capped Himalayan peaks. Apple orchard gardens, bonfire nights, river rafting, and treks to hidden waterfalls.",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1920&q=80",
    price: 4000,
    location: "Old Manali, Himachal Pradesh",
    country: "India",
  },
  {
    title: "Lakeside Villa in Udaipur",
    description:
      "Palatial lakeside villa on the banks of Lake Pichola. Views of the City Palace and Jag Mandir, private boat rides, rooftop candlelight dinners, and traditional Mewari architecture.",
    image:
      "https://images.unsplash.com/photo-1585116938581-07b9de3bd685?auto=format&fit=crop&w=1920&q=80",
    price: 12000,
    location: "Udaipur, Rajasthan",
    country: "India",
  },
  {
    title: "Jungle Safari Lodge in Chitwan",
    description:
      "Eco-luxury lodge at the edge of Chitwan National Park. Guided jungle safaris to spot one-horned rhinos and Bengal tigers, canoe rides, and Tharu cultural dance performances.",
    image:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1920&q=80",
    price: 7000,
    location: "Chitwan",
    country: "Nepal",
  },
  {
    title: "Oceanview Suite in Sri Lanka",
    description:
      "Colonial-era boutique hotel on the ramparts of Galle Fort. Ocean-facing suites, private beach access, whale-watching excursions, and sunset cocktails on the ancient fortifications.",
    image:
      "https://images.unsplash.com/photo-1586523969720-2dae04a47664?auto=format&fit=crop&w=1920&q=80",
    price: 10000,
    location: "Galle Fort",
    country: "Sri Lanka",
  },
  {
    title: "Valley Cottage in Rishikesh",
    description:
      "Peaceful riverside cottage overlooking the Ganges with the Himalayan foothills as backdrop. Morning yoga, white-water rafting, meditation sessions, and organic vegetarian cuisine.",
    image:
      "https://images.unsplash.com/photo-1580289143186-41dbe95607b1?auto=format&fit=crop&w=1920&q=80",
    price: 3000,
    location: "Rishikesh, Uttarakhand",
    country: "India",
  },
  {
    title: "Heritage Fort Stay in Jodhpur",
    description:
      "Stay inside a restored 15th-century fort overlooking the Blue City. Turret rooms with antique furnishings, zip-lining over the fort walls, and views of the mighty Mehrangarh Fort.",
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1920&q=80",
    price: 9500,
    location: "Jodhpur, Rajasthan",
    country: "India",
  },
];

module.exports = { data: sampleListings };
