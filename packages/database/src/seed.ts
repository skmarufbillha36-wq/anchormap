import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Category Data ────────────────────────────────────────────

const categories = [
  {
    name: 'Education',
    nameTr: 'Eğitim',
    slug: 'education',
    icon: 'graduation-cap',
    color: '#3b82f6',
    sortOrder: 1,
    children: [
      { name: 'University', nameTr: 'Üniversite', slug: 'university', icon: 'building-columns', color: '#3b82f6' },
      { name: 'School', nameTr: 'Okul', slug: 'school', icon: 'school', color: '#3b82f6' },
      { name: 'Kindergarten', nameTr: 'Anaokulu', slug: 'kindergarten', icon: 'baby', color: '#3b82f6' },
      { name: 'Library', nameTr: 'Kütüphane', slug: 'library', icon: 'book-open', color: '#3b82f6' },
    ],
  },
  {
    name: 'Healthcare',
    nameTr: 'Sağlık',
    slug: 'healthcare',
    icon: 'heart-pulse',
    color: '#ef4444',
    sortOrder: 2,
    children: [
      { name: 'Hospital', nameTr: 'Hastane', slug: 'hospital', icon: 'hospital', color: '#ef4444' },
      { name: 'Clinic', nameTr: 'Klinik', slug: 'clinic', icon: 'stethoscope', color: '#ef4444' },
      { name: 'Pharmacy', nameTr: 'Eczane', slug: 'pharmacy', icon: 'pill', color: '#ef4444' },
      { name: 'Dentist', nameTr: 'Diş Hekimi', slug: 'dentist', icon: 'tooth', color: '#ef4444' },
      { name: 'Veterinary', nameTr: 'Veteriner', slug: 'veterinary', icon: 'paw-print', color: '#ef4444' },
    ],
  },
  {
    name: 'Emergency & Security',
    nameTr: 'Acil ve Güvenlik',
    slug: 'emergency',
    icon: 'siren',
    color: '#f97316',
    sortOrder: 3,
    children: [
      { name: 'Police Station', nameTr: 'Karakol', slug: 'police-station', icon: 'shield', color: '#f97316' },
      { name: 'Fire Station', nameTr: 'İtfaiye', slug: 'fire-station', icon: 'flame', color: '#f97316' },
      { name: 'Emergency Hospital', nameTr: 'Acil Servis', slug: 'emergency-hospital', icon: 'ambulance', color: '#f97316' },
    ],
  },
  {
    name: 'Public Services',
    nameTr: 'Kamu Hizmetleri',
    slug: 'public-services',
    icon: 'landmark',
    color: '#8b5cf6',
    sortOrder: 4,
    children: [
      { name: 'Government Office', nameTr: 'Devlet Dairesi', slug: 'government-office', icon: 'building', color: '#8b5cf6' },
      { name: 'Municipality', nameTr: 'Belediye', slug: 'municipality', icon: 'city', color: '#8b5cf6' },
      { name: 'Post Office', nameTr: 'PTT', slug: 'post-office', icon: 'mail', color: '#8b5cf6' },
      { name: 'Tax Office', nameTr: 'Vergi Dairesi', slug: 'tax-office', icon: 'receipt', color: '#8b5cf6' },
      { name: 'Bank', nameTr: 'Banka', slug: 'bank', icon: 'banknote', color: '#8b5cf6' },
    ],
  },
  {
    name: 'Historical & Cultural',
    nameTr: 'Tarihi ve Kültürel',
    slug: 'historical',
    icon: 'landmark-dome',
    color: '#d97706',
    sortOrder: 5,
    children: [
      { name: 'Museum', nameTr: 'Müze', slug: 'museum', icon: 'museum', color: '#d97706' },
      { name: 'Historical Building', nameTr: 'Tarihi Yapı', slug: 'historical-building', icon: 'castle', color: '#d97706' },
      { name: 'Monument', nameTr: 'Anıt', slug: 'monument', icon: 'monument', color: '#d97706' },
      { name: 'Mosque', nameTr: 'Cami', slug: 'mosque', icon: 'mosque', color: '#d97706' },
      { name: 'Archaeological Site', nameTr: 'Arkeolojik Alan', slug: 'archaeological-site', icon: 'pickaxe', color: '#d97706' },
      { name: 'Cultural Center', nameTr: 'Kültür Merkezi', slug: 'cultural-center', icon: 'theatre-masks', color: '#d97706' },
    ],
  },
  {
    name: 'Tourism & Recreation',
    nameTr: 'Turizm ve Rekreasyon',
    slug: 'tourism',
    icon: 'map-pin',
    color: '#10b981',
    sortOrder: 6,
    children: [
      { name: 'Tourist Attraction', nameTr: 'Turistik Yer', slug: 'tourist-attraction', icon: 'camera', color: '#10b981' },
      { name: 'Viewpoint', nameTr: 'Seyir Noktası', slug: 'viewpoint', icon: 'eye', color: '#10b981' },
      { name: 'Hotel', nameTr: 'Otel', slug: 'hotel', icon: 'bed', color: '#10b981' },
      { name: 'Park', nameTr: 'Park', slug: 'park', icon: 'tree-pine', color: '#10b981' },
      { name: 'Tourist Information', nameTr: 'Turist Danışma', slug: 'tourist-information', icon: 'info', color: '#10b981' },
    ],
  },
];

// ─── Seed Function ────────────────────────────────────────────

async function main() {
  console.log('\n🌱 AnchorMap Database Seed\n');

  // --- Categories ---
  console.log('📂 Seeding categories...');
  for (const cat of categories) {
    const { children, ...parentData } = cat;

    const parent = await prisma.category.upsert({
      where: { slug: parentData.slug },
      update: {},
      create: {
        name: parentData.name,
        nameTr: parentData.nameTr,
        slug: parentData.slug,
        icon: parentData.icon,
        color: parentData.color,
        sortOrder: parentData.sortOrder,
      },
    });

    if (children) {
      for (const child of children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: {},
          create: {
            name: child.name,
            nameTr: child.nameTr,
            slug: child.slug,
            icon: child.icon,
            color: child.color,
            parentId: parent.id,
            sortOrder: 0,
          },
        });
      }
    }

    console.log(`  ✅ ${parent.name} + ${children?.length ?? 0} subcategories`);
  }

  // --- Admin User ---
  console.log('\n👤 Seeding admin user...');
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'AnkaraGIS2026!';
  const hash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@anchormap.tr' },
    update: {},
    create: {
      email: 'admin@anchormap.tr',
      name: 'AnchorMap Admin',
      passwordHash: hash,
      role: 'ADMIN',
      provider: 'email',
      emailVerified: true,
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);
  console.log(`  🔑 Password: ${adminPassword}`);

  console.log('\n✨ Seed complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
