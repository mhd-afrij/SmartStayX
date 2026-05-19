const destinationsData = [
  {
    name: 'Paris', continent: 'Europe',
    image: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?q=80&w=600&auto=format&fit=crop',
    description: 'City of Light — romance, art, and world-class cuisine.',
    attractions: [
      { name: 'Eiffel Tower', desc: 'Iconic iron lattice tower on the Champ de Mars' },
      { name: 'Louvre Museum', desc: 'World\'s largest art museum with the Mona Lisa' },
      { name: 'Sacré-Cœur', desc: 'Basilica atop Montmartre with panoramic views' },
    ],
    restaurants: [
      { name: 'Le Cinq', desc: 'Four Michelin-starred French cuisine' },
      { name: 'L\'Ambroisie', desc: 'Classic French dining at Place des Vosges' },
    ],
  },
  {
    name: 'London', continent: 'Europe',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=600&auto=format&fit=crop',
    description: 'Historic landmarks, royal palaces, and a vibrant cultural scene.',
    attractions: [
      { name: 'Big Ben', desc: 'Iconic clock tower at the Palace of Westminster' },
      { name: 'Tower of London', desc: 'Historic castle housing the Crown Jewels' },
      { name: 'British Museum', desc: 'World-renowned museum of human history' },
    ],
    restaurants: [
      { name: 'The Ledbury', desc: 'Two Michelin-starred modern European' },
      { name: 'Dinner by Heston', desc: 'Historic British gastronomy' },
    ],
  },
  {
    name: 'Rome', continent: 'Europe',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600&auto=format&fit=crop',
    description: 'The Eternal City — ancient history around every corner.',
    attractions: [
      { name: 'Colosseum', desc: 'Ancient Roman amphitheater' },
      { name: 'Vatican Museums', desc: 'Sistine Chapel and Raphael Rooms' },
      { name: 'Trevi Fountain', desc: 'Baroque fountain, toss a coin to return' },
    ],
    restaurants: [
      { name: 'La Pergola', desc: 'Three Michelin-starred Roman cuisine' },
      { name: 'Roscioli', desc: 'Authentic Roman pasta and wine' },
    ],
  },
  {
    name: 'Santorini', continent: 'Europe',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=600&auto=format&fit=crop',
    description: 'White-washed villages, blue domes, and unforgettable sunsets.',
    attractions: [
      { name: 'Oia Sunset', desc: 'World-famous sunset viewpoint' },
      { name: 'Red Beach', desc: 'Striking red volcanic sand beach' },
      { name: 'Akrotiri Ruins', desc: 'Ancient Minoan city preserved in ash' },
    ],
    restaurants: [
      { name: 'Selene', desc: 'Fine dining with volcanic island flavors' },
      { name: 'Metsovo', desc: 'Traditional Greek taverna with caldera view' },
    ],
  },
  {
    name: 'Amsterdam', continent: 'Europe',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?q=80&w=600&auto=format&fit=crop',
    description: 'Canals, cycling culture, and world-class museums.',
    attractions: [
      { name: 'Rijksmuseum', desc: 'Dutch Golden Age masterpieces' },
      { name: 'Anne Frank House', desc: 'Powerful WWII historical museum' },
      { name: 'Canal Cruise', desc: 'Scenic boat tour through Amsterdam canals' },
    ],
    restaurants: [
      { name: 'De Librije', desc: 'Three Michelin-starred Dutch cuisine' },
      { name: 'Ciel Bleu', desc: 'Panoramic fine dining on the 23rd floor' },
    ],
  },
  {
    name: 'Tokyo', continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=600&auto=format&fit=crop',
    description: 'Neon-lit futurism meets ancient temples and world-best dining.',
    attractions: [
      { name: 'Shibuya Crossing', desc: 'World\'s busiest pedestrian crossing' },
      { name: 'Meiji Shrine', desc: 'Peaceful Shinto shrine in a forest' },
      { name: 'Tsukiji Market', desc: 'Famous outer market with fresh sushi' },
    ],
    restaurants: [
      { name: 'Sukiyabashi Jiro', desc: 'Legendary three-star Michelin sushi' },
      { name: 'Narisawa', desc: 'Innovative Japanese-eco cuisine' },
    ],
  },
  {
    name: 'Kyoto', continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop',
    description: 'Ancient temples, bamboo groves, and traditional tea culture.',
    attractions: [
      { name: 'Fushimi Inari', desc: 'Thousands of vermilion torii gates' },
      { name: 'Bamboo Grove', desc: 'Towering bamboo path in Arashiyama' },
      { name: 'Kinkaku-ji', desc: 'Golden Pavilion covered in gold leaf' },
    ],
    restaurants: [
      { name: 'Kikunoi', desc: 'Traditional kaiseki multi-course dining' },
      { name: 'Gion Karyo', desc: 'Kyoto-style haute cuisine' },
    ],
  },
  {
    name: 'Bangkok', continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=600&auto=format&fit=crop',
    description: 'Vibrant street life, ornate temples, and electrifying energy.',
    attractions: [
      { name: 'Grand Palace', desc: 'Exquisite royal palace and Wat Phra Kaew' },
      { name: 'Wat Arun', desc: 'Temple of Dawn along the Chao Phraya' },
      { name: 'Chatuchak Market', desc: 'One of the world\'s largest weekend markets' },
    ],
    restaurants: [
      { name: 'Gaggan', desc: 'Progressive Indian with 25-course tasting' },
      { name: 'Sorn', desc: 'Michelin-starred Southern Thai cuisine' },
    ],
  },
  {
    name: 'Bali', continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=600&auto=format&fit=crop',
    description: 'Island of Gods — rice terraces, temples, and surf breaks.',
    attractions: [
      { name: 'Tegallalang Rice Terraces', desc: 'Iconic emerald-green rice paddies' },
      { name: 'Uluwatu Temple', desc: 'Clifftop temple with Kecak dance at sunset' },
      { name: 'Ubud Monkey Forest', desc: 'Sacred sanctuary with playful macaques' },
    ],
    restaurants: [
      { name: 'Locavore', desc: 'Fine dining using only local ingredients' },
      { name: 'Mozaic', desc: 'Contemporary Balinese gastronomy' },
    ],
  },
  {
    name: 'Seoul', continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=600&auto=format&fit=crop',
    description: 'K-pop, palaces, street food, and cutting-edge tech.',
    attractions: [
      { name: 'Gyeongbokgung Palace', desc: 'Grandest of the Five Grand Palaces' },
      { name: 'Bukchon Hanok Village', desc: 'Traditional Korean houses in hills' },
      { name: 'Myeongdong', desc: 'Shopping and street food paradise' },
    ],
    restaurants: [
      { name: 'Mingles', desc: 'Two Michelin-starred Korean fusion' },
      { name: 'Jungsik', desc: 'Innovative Korean fine dining' },
    ],
  },
  {
    name: 'New York', continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600&auto=format&fit=crop',
    description: 'The city that never sleeps — culture, cuisine, and skyline.',
    attractions: [
      { name: 'Statue of Liberty', desc: 'America\'s iconic symbol of freedom' },
      { name: 'Central Park', desc: 'Sprawling urban oasis in Manhattan' },
      { name: 'Broadway', desc: 'World-famous theater district' },
    ],
    restaurants: [
      { name: 'Eleven Madison Park', desc: 'Three Michelin-starred plant-based tasting' },
      { name: 'Le Bernardin', desc: 'Legendary French seafood' },
    ],
  },
  {
    name: 'Cancun', continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?q=80&w=600&auto=format&fit=crop',
    description: 'Turquoise Caribbean waters and ancient Mayan ruins.',
    attractions: [
      { name: 'Chichén Itzá', desc: 'One of the New Seven Wonders of the World' },
      { name: 'Isla Mujeres', desc: 'Beautiful island with pristine beaches' },
      { name: 'Cenote Ik Kil', desc: 'Stunning open-air sinkhole for swimming' },
    ],
    restaurants: [
      { name: 'Le Chique', desc: 'Latin America\'s 50 Best restaurant' },
      { name: 'Lorena\'s', desc: 'Authentic Yucatecan cuisine' },
    ],
  },
  {
    name: 'Rio de Janeiro', continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=600&auto=format&fit=crop',
    description: 'Christ the Redeemer, Copacabana, and Carnival energy.',
    attractions: [
      { name: 'Christ the Redeemer', desc: 'Iconic Art Deco statue atop Corcovado' },
      { name: 'Sugarloaf Mountain', desc: 'Cable car ride with breathtaking views' },
      { name: 'Copacabana Beach', desc: 'World-famous crescent-shaped beach' },
    ],
    restaurants: [
      { name: 'Oro', desc: 'Michelin-starred contemporary Brazilian' },
      { name: 'Confeitaria Colombo', desc: 'Historic belle époque café' },
    ],
  },
  {
    name: 'Marrakech', continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=600&auto=format&fit=crop',
    description: 'Medina maze, spice markets, and stunning riad architecture.',
    attractions: [
      { name: 'Jemaa el-Fnaa', desc: 'Vibrant main square with storytellers and food' },
      { name: 'Bahia Palace', desc: '19th-century palace with stunning gardens' },
      { name: 'Majorelle Garden', desc: 'Bold blue botanical garden by Yves Saint Laurent' },
    ],
    restaurants: [
      { name: 'Dar Yacout', desc: 'Luxurious traditional Moroccan dining' },
      { name: 'Le Foundouk', desc: 'Rooftop Moroccan-Mediterranean fusion' },
    ],
  },
  {
    name: 'Cape Town', continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?q=80&w=600&auto=format&fit=crop',
    description: 'Table Mountain, penguins, and stunning coastal drives.',
    attractions: [
      { name: 'Table Mountain', desc: 'Flat-topped mountain with cable car views' },
      { name: 'Boulders Beach', desc: 'Home to a colony of African penguins' },
      { name: 'V&A Waterfront', desc: 'Harbor-side shopping and dining' },
    ],
    restaurants: [
      { name: 'The Test Kitchen', desc: 'Award-winning creative cuisine' },
      { name: 'La Colombe', desc: 'French-Mediterranean with Cape flair' },
    ],
  },
  {
    name: 'Sydney', continent: 'Oceania',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=600&auto=format&fit=crop',
    description: 'Harbour city with the Opera House, beaches, and sun.',
    attractions: [
      { name: 'Sydney Opera House', desc: 'UNESCO-listed architectural masterpiece' },
      { name: 'Bondi Beach', desc: 'Iconic surf beach with coastal walk' },
      { name: 'Sydney Harbour Bridge', desc: 'Climb the bridge for panoramic views' },
    ],
    restaurants: [
      { name: 'Quay', desc: 'Three-hatted harbour-view fine dining' },
      { name: 'Tetsuya\'s', desc: 'Japanese-French fusion tasting menu' },
    ],
  },
]

export default destinationsData
