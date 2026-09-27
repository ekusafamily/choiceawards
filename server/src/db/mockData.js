// Comprehensive mock dataset for Comrade Choice Awards 2026
// Provides authentic DeKUT student leaders, innovators, athletes, creators, and clubs

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Social Media Personality of the Year', slug: 'social-media-personality', type: 'individual', display_order: 1 },
  { id: 'cat-2', name: "Male Students' Council Member of the Year", slug: 'male-council-member', type: 'individual', display_order: 2 },
  { id: 'cat-3', name: "Female Students' Council Member of the Year", slug: 'female-council-member', type: 'individual', display_order: 3 },
  { id: 'cat-4', name: 'Male Class Representative of the Year', slug: 'male-class-rep', type: 'individual', display_order: 4 },
  { id: 'cat-5', name: 'Female Class Representative of the Year', slug: 'female-class-rep', type: 'individual', display_order: 5 },
  { id: 'cat-6', name: 'Male Sports Person of the Year', slug: 'male-sports-person', type: 'individual', display_order: 6 },
  { id: 'cat-7', name: 'Female Sports Person of the Year', slug: 'female-sports-person', type: 'individual', display_order: 7 },
  { id: 'cat-8', name: 'Male Influencer of the Year', slug: 'male-influencer', type: 'individual', display_order: 8 },
  { id: 'cat-9', name: 'Female Influencer of the Year', slug: 'female-influencer', type: 'individual', display_order: 9 },
  { id: 'cat-10', name: 'Male Model of the Year', slug: 'male-model', type: 'individual', display_order: 10 },
  { id: 'cat-11', name: 'Female Model of the Year', slug: 'female-model', type: 'individual', display_order: 11 },
  { id: 'cat-12', name: 'Association Leader of the Year', slug: 'association-leader', type: 'individual', display_order: 12 },
  { id: 'cat-13', name: 'Marketer of the Year', slug: 'marketer', type: 'individual', display_order: 13 },
  { id: 'cat-14', name: 'Content Creator of the Year', slug: 'content-creator', type: 'individual', display_order: 14 },
  { id: 'cat-15', name: 'Photographer/Videographer of the Year', slug: 'photographer-videographer', type: 'individual', display_order: 15 },
  { id: 'cat-16', name: 'Campus Personality of the Year', slug: 'campus-personality', type: 'individual', display_order: 16 },
  { id: 'cat-17', name: 'Tech Developer of the Year', slug: 'tech-developer', type: 'individual', display_order: 17 },
  { id: 'cat-18', name: 'Association of the Year', slug: 'association-of-year', type: 'organization', display_order: 18 },
  { id: 'cat-19', name: 'Club of the Year', slug: 'club-of-year', type: 'organization', display_order: 19 },
];

let MOCK_NOMINEES = [
  // Social Media Personality
  {
    id: 'nom-1',
    name: 'Brian Kiprop',
    course: 'BSc Computer Science',
    year_of_study: 'Year 3',
    category_id: 'cat-1',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    bio: 'Digital storyteller, meme curator, and campus tech advocate bridging student news with humor and viral TikTok moments across DeKUT.',
    achievements: 'Over 45,000 followers on TikTok; Covered DeKUT Tech Expo 2025; Hosted campus live interview series with over 100k views.',
    status: 'approved',
    total_points: 3420,
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'nom-2',
    name: 'Faith Chebet',
    course: 'BSc Information Technology',
    year_of_study: 'Year 2',
    category_id: 'cat-1',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    bio: 'Campus lifestyle influencer, podcast host of "DeKUT Diaries", and student advocate for mental wellness and campus lifestyle.',
    achievements: 'Host of DeKUT Diaries Podcast; Coordinated the 2025 Mental Health Awareness social media campaign reaching 20,000 students.',
    status: 'approved',
    total_points: 2850,
    created_at: new Date('2026-09-02').toISOString(),
  },
  {
    id: 'nom-3',
    name: 'Dennis Ochieng',
    course: 'BSc Telecommunication Engineering',
    year_of_study: 'Year 4',
    category_id: 'cat-1',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    bio: 'X (Twitter) space host and campus commentator focused on higher education reforms, tech policy, and student innovation.',
    achievements: 'Hosted weekly campus X Spaces with an average of 1,200 live listeners; Published DeKUT Tech Review quarterly digest.',
    status: 'approved',
    total_points: 1980,
    created_at: new Date('2026-09-03').toISOString(),
  },

  // Male Students' Council Member
  {
    id: 'nom-4',
    name: 'Moses Musyoka Mutuku',
    course: 'BSc Telecommunication & Info Engineering',
    year_of_study: 'Year 4',
    category_id: 'cat-2',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    bio: 'Chairperson of DeKUTSO. Dynamic and purpose-led student leader championing student welfare, internet connectivity across hostels, and institutional collaboration.',
    achievements: 'Successfully negotiated extended library hours and campus Wi-Fi expansion; spearheading student bursary initiatives and leadership summits.',
    status: 'approved',
    total_points: 4890,
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'nom-5',
    name: 'Kelvin Kariuki',
    course: 'BSc Mechanical Engineering',
    year_of_study: 'Year 3',
    category_id: 'cat-2',
    photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80',
    bio: 'Secretary for Academic Affairs. Dedicated to addressing curriculum challenges, exam timetabling resolutions, and laboratory equipment access.',
    achievements: 'Established the Student Academic Support Helpdesk resolving over 300 unit registration and timetable conflicts in semester 1.',
    status: 'approved',
    total_points: 3120,
    created_at: new Date('2026-09-02').toISOString(),
  },

  // Female Students' Council Member
  {
    id: 'nom-6',
    name: 'Pascoline Muthoni Wereri',
    course: 'BSc Nursing',
    year_of_study: 'Year 2',
    category_id: 'cat-3',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    bio: 'Vice Chairperson of DeKUTSO. Passionate advocate for student health, gender equality, clean sanitation facilities, and peer mentorship.',
    achievements: 'Spearheaded campus sanitary towel drive; initiated first-aid training camps across engineering and nursing schools; led student welfare outreach.',
    status: 'approved',
    total_points: 4650,
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'nom-7',
    name: 'Bernadette Maureen Seiyan',
    course: 'BSc Actuarial Science',
    year_of_study: 'Year 3',
    category_id: 'cat-3',
    photo_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
    bio: 'Gender & Disability Mainstreaming Secretary. Championing accessibility across university halls, elevators, ramps, and inclusive campus life.',
    achievements: 'Audit and improvement of ramps in resource centres; organised the first annual Campus Disability Inclusion Week.',
    status: 'approved',
    total_points: 3780,
    created_at: new Date('2026-09-02').toISOString(),
  },

  // Tech Developer
  {
    id: 'nom-8',
    name: 'Alex Gitonga',
    course: 'BSc Software Engineering',
    year_of_study: 'Year 4',
    category_id: 'cat-17',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80',
    bio: 'Full-stack developer, open source contributor, and creator of the DeKUT Timetable & Mess Meal Tracker app used by 4,000+ students.',
    achievements: 'Built and published the Comrade Timetable mobile app; 1st Place at Central Kenya Hackathon 2025; Google Developer Student Clubs Lead.',
    status: 'approved',
    total_points: 5210,
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'nom-9',
    name: 'Joy Wambui',
    course: 'BSc Computer Science',
    year_of_study: 'Year 3',
    category_id: 'cat-17',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
    bio: 'AI researcher and web3 builder working on agricultural computer vision models to detect coffee rust in Nyeri county farms.',
    achievements: 'Presented paper at African Conference on Software Engineering; Mentored 60+ first-year women in STEM coding bootcamp.',
    status: 'approved',
    total_points: 4190,
    created_at: new Date('2026-09-02').toISOString(),
  },
  {
    id: 'nom-10',
    name: 'Evans Kiprotich',
    course: 'BSc Mechatronics Engineering',
    year_of_study: 'Year 4',
    category_id: 'cat-17',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
    bio: 'Embedded systems engineer and robotics enthusiast. Designed the solar-powered autonomous security rover at DeKUT Innovation Hub.',
    achievements: 'DeKUT Innovation Challenge winner; Designed smart IoT power meter for student hostel rooms; Embedded systems mentor.',
    status: 'approved',
    total_points: 3450,
    created_at: new Date('2026-09-03').toISOString(),
  },

  // Sports Person
  {
    id: 'nom-11',
    name: 'Samuel Mwangi',
    course: 'BSc Criminology & Security Management',
    year_of_study: 'Year 3',
    category_id: 'cat-6',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
    bio: 'Captain of DeKUT Rugby Team (The Kimathi RFC). Leading the team to victory in KUSA Central Region championship.',
    achievements: 'Top try scorer in KUSA League 2025; Captained the team to Kenya Universities Sports Association Central Region Gold.',
    status: 'approved',
    total_points: 3890,
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'nom-12',
    name: 'Mercy Achieng',
    course: 'BSc Business Information Technology',
    year_of_study: 'Year 2',
    category_id: 'cat-7',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
    bio: 'DeKUT Queens Basketball point guard and athletics sprinter. National university championship finalist in 200m sprint.',
    achievements: 'MVP at Central Universities Basketball Tournament 2025; Silver medalist in 200m KUSA Games.',
    status: 'approved',
    total_points: 3620,
    created_at: new Date('2026-09-02').toISOString(),
  },

  // Organization Awards: Club & Association
  {
    id: 'nom-13',
    name: 'DeKUT Tech Club (GDSC & IEEE)',
    course: 'All Engineering & Computing Schools',
    year_of_study: 'All Years',
    category_id: 'cat-19',
    photo_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80',
    bio: 'The largest technical student society on campus, hosting weekly workshops on cloud computing, cybersecurity, AI, and competitive programming.',
    achievements: 'Organized DeKUT HackFest 2025 with 350+ attendees; 15 workshops hosted; partnered with Microsoft & Google student communities.',
    status: 'approved',
    total_points: 6840,
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'nom-14',
    name: 'Rotaract Club of Dedan Kimathi University',
    course: 'Multidisciplinary',
    year_of_study: 'All Years',
    category_id: 'cat-19',
    photo_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500&auto=format&fit=crop&q=80',
    bio: 'Dedicated to community service, environmental conservation, tree planting around Mount Kenya forest reserves, and health awareness.',
    achievements: 'Planted over 5,000 indigenous trees in Nyeri; donated learning materials to 3 local primary schools; blood donation drives.',
    status: 'approved',
    total_points: 5930,
    created_at: new Date('2026-09-02').toISOString(),
  },
  {
    id: 'nom-15',
    name: 'Dedan Kimathi University Engineering Association (DeKUTEA)',
    course: 'School of Engineering',
    year_of_study: 'Year 1 - 5',
    category_id: 'cat-18',
    photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    bio: 'Uniting all engineering students across Mechanical, Electrical, Mechatronics, Telecommunications, and Civil Engineering.',
    achievements: 'Organised the 2025 Engineering & Industrial Innovation Symposium; secured 40+ industrial attachments for student members.',
    status: 'approved',
    total_points: 5120,
    created_at: new Date('2026-09-01').toISOString(),
  },
];

let MOCK_VOTES = [
  { id: 'v-1', nominee_id: 'nom-8', category_id: 'cat-17', amount: 500, points: 550, created_at: new Date().toISOString() },
  { id: 'v-2', nominee_id: 'nom-4', category_id: 'cat-2', amount: 200, points: 220, created_at: new Date().toISOString() },
  { id: 'v-3', nominee_id: 'nom-6', category_id: 'cat-3', amount: 100, points: 110, created_at: new Date().toISOString() },
  { id: 'v-4', nominee_id: 'nom-13', category_id: 'cat-19', amount: 500, points: 550, created_at: new Date().toISOString() },
];

let MOCK_NOMINATIONS = [
  {
    id: 'nomination-1',
    nominee_name: 'George Ndirangu',
    category_id: 'cat-17',
    course: 'BSc Mechanical Engineering',
    year_of_study: '3',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
    short_profile: 'Hardware maker, IoT designer, and founder of the campus 3D print lab.',
    achievements: 'Fabricated campus 3D printer prototype; Conducted 4 hardware workshops in Siemens Lab.',
    reason: 'Outstanding contribution to campus makerspace and student innovation.',
    submitted_by: 'Martin Mwangi (Class Rep)',
    status: 'pending',
    created_at: new Date('2026-09-26T10:00:00Z').toISOString(),
  },
  {
    id: 'nomination-2',
    nominee_name: 'Faith Wangari',
    category_id: 'cat-13',
    course: 'BSc Business Information Technology',
    year_of_study: '2',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    short_profile: 'Student entrepreneur running the campus thrift store and event marketing.',
    achievements: 'Managed publicity for Cultural Week 2025; Grew campus business community to 1,500 students.',
    reason: 'Dynamic marketing leadership and consistent engagement across DeKUT.',
    submitted_by: 'Sharon Chepkemoi',
    status: 'pending',
    created_at: new Date('2026-09-27T08:30:00Z').toISOString(),
  },
  {
    id: 'nomination-3',
    nominee_name: 'Victor Koech',
    category_id: 'cat-6',
    course: 'BSc Electrical & Electronics Engineering',
    year_of_study: '4',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    bio: 'DeKUT Athletics track captain and 400m sprinter.',
    short_profile: 'Track captain representing DeKUT at National University Games.',
    achievements: 'Gold medal 400m KUSA Central League 2025; Team captain.',
    reason: 'Exemplary discipline in sports and academics.',
    submitted_by: 'Coach Otieno',
    status: 'pending',
    created_at: new Date('2026-09-27T11:15:00Z').toISOString(),
  },
];

function getCategories() {
  return MOCK_CATEGORIES;
}

function getCategoryBySlug(slug) {
  const cat = MOCK_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  const nominees = MOCK_NOMINEES.filter((n) => n.category_id === cat.id && n.status === 'approved')
    .sort((a, b) => b.total_points - a.total_points);
  return { ...cat, nominees };
}

function getNominees(categoryId) {
  let list = MOCK_NOMINEES.filter((n) => n.status === 'approved');
  if (categoryId) {
    list = list.filter((n) => n.category_id === categoryId);
  }
  return list.map((nom) => {
    const cat = MOCK_CATEGORIES.find((c) => c.id === nom.category_id);
    return {
      ...nom,
      categories: cat ? { name: cat.name, slug: cat.slug } : null,
    };
  }).sort((a, b) => b.total_points - a.total_points);
}

function getNomineeById(id) {
  const nom = MOCK_NOMINEES.find((n) => n.id === id);
  if (!nom) return null;
  const cat = MOCK_CATEGORIES.find((c) => c.id === nom.category_id);
  return {
    ...nom,
    categories: cat ? { name: cat.name, slug: cat.slug } : null,
  };
}

function addNominee(data) {
  const newNominee = {
    id: `nom-${Date.now()}`,
    name: data.name,
    course: data.course || '',
    year_of_study: data.year_of_study ? `Year ${data.year_of_study.toString().replace(/^year\s*/i, '')}` : '',
    category_id: data.category_id,
    photo_url: data.photo_url || null,
    bio: data.bio || data.short_profile || '',
    achievements: data.achievements || '',
    status: 'approved',
    total_points: data.total_points || 0,
    created_at: new Date().toISOString(),
  };
  MOCK_NOMINEES.unshift(newNominee);
  return newNominee;
}

function deleteNominee(id) {
  const idx = MOCK_NOMINEES.findIndex((n) => n.id === id);
  if (idx !== -1) {
    const deleted = MOCK_NOMINEES.splice(idx, 1)[0];
    return deleted;
  }
  return null;
}

function getNominations(status) {
  let list = [...MOCK_NOMINATIONS];
  if (status) {
    list = list.filter((n) => n.status === status);
  }
  return list.map((nom) => {
    const cat = MOCK_CATEGORIES.find((c) => c.id === nom.category_id);
    return {
      ...nom,
      categories: cat ? { name: cat.name, slug: cat.slug } : null,
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function approveNomination(id) {
  const nom = MOCK_NOMINATIONS.find((n) => n.id === id);
  if (!nom) return null;
  nom.status = 'approved';

  // Promote to approved nominee
  const promotedNominee = addNominee({
    name: nom.nominee_name,
    course: nom.course,
    year_of_study: nom.year_of_study,
    category_id: nom.category_id,
    photo_url: nom.photo_url,
    bio: nom.short_profile || nom.reason,
    achievements: nom.achievements,
    total_points: 0,
  });

  return { nomination: nom, nominee: promotedNominee };
}

function rejectNomination(id) {
  const nom = MOCK_NOMINATIONS.find((n) => n.id === id);
  if (!nom) return null;
  nom.status = 'rejected';
  return nom;
}

function deleteNomination(id) {
  const idx = MOCK_NOMINATIONS.findIndex((n) => n.id === id);
  if (idx !== -1) {
    return MOCK_NOMINATIONS.splice(idx, 1)[0];
  }
  return null;
}

function getLeaderboard(slug) {
  const cat = MOCK_CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  const categoryNominees = MOCK_NOMINEES
    .filter((n) => n.category_id === cat.id && n.status === 'approved')
    .sort((a, b) => b.total_points - a.total_points)
    .map((nom, idx) => ({
      position: idx + 1,
      id: nom.id,
      name: nom.name,
      photo_url: nom.photo_url,
      course: nom.course,
      total_points: nom.total_points,
    }));
  return { category: cat, nominees: categoryNominees };
}

function recordVote({ nominee_id, category_id, amount, transaction_id, voter_phone }) {
  const points = amount >= 100 ? Math.floor(amount * 1.1) : amount;
  const vote = {
    id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    nominee_id,
    category_id,
    amount,
    points,
    transaction_id: transaction_id || `TXN-${Date.now()}`,
    voter_phone: voter_phone || null,
    created_at: new Date().toISOString(),
  };
  MOCK_VOTES.push(vote);

  const nominee = MOCK_NOMINEES.find((n) => n.id === nominee_id);
  if (nominee) {
    nominee.total_points = (nominee.total_points || 0) + points;
  }
  return vote;
}

function recordNomination(data) {
  const nomination = {
    id: `nomination-${Date.now()}`,
    ...data,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  MOCK_NOMINATIONS.unshift(nomination);
  return nomination;
}

function getStats() {
  const totalVotesCount = MOCK_VOTES.length;
  const totalPoints = MOCK_NOMINEES.reduce((acc, curr) => acc + (curr.total_points || 0), 0);
  const pendingNominations = MOCK_NOMINATIONS.filter((n) => n.status === 'pending').length;
  return {
    categoriesCount: MOCK_CATEGORIES.length,
    nomineesCount: MOCK_NOMINEES.length,
    votesCount: totalVotesCount + 148,
    totalPoints,
    pendingNominations,
  };
}

module.exports = {
  MOCK_CATEGORIES,
  MOCK_NOMINEES,
  MOCK_VOTES,
  MOCK_NOMINATIONS,
  getCategories,
  getCategoryBySlug,
  getNominees,
  getNomineeById,
  addNominee,
  deleteNominee,
  getNominations,
  approveNomination,
  rejectNomination,
  deleteNomination,
  getLeaderboard,
  recordVote,
  recordNomination,
  getStats,
};
