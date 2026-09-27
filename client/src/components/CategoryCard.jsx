import { Link } from 'react-router-dom';
import {
  Award, Users, Star, Camera, Megaphone, Code,
  Trophy, Heart, Mic, Palette, Shield, Globe
} from 'lucide-react';

const iconMap = {
  'social-media-personality': Globe,
  'male-council-member': Shield,
  'female-council-member': Shield,
  'male-class-rep': Users,
  'female-class-rep': Users,
  'male-sports-person': Trophy,
  'female-sports-person': Trophy,
  'male-influencer': Star,
  'female-influencer': Star,
  'male-model': Heart,
  'female-model': Heart,
  'association-leader': Megaphone,
  'marketer': Mic,
  'content-creator': Palette,
  'photographer-videographer': Camera,
  'campus-personality': Award,
  'tech-developer': Code,
  'association-of-year': Users,
  'club-of-year': Users,
};

export default function CategoryCard({ category }) {
  const Icon = iconMap[category.slug] || Award;

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="category-card"
      id={`category-${category.slug}`}
    >
      <div className="category-card-icon">
        <Icon size={48} />
      </div>
      <h3>{category.name}</h3>
      <span className="category-type">{category.type}</span>
    </Link>
  );
}
