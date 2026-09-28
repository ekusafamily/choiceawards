import { Link } from 'react-router-dom';
import {
  Award, Users, Star, Camera, Megaphone, Code,
  Trophy, Heart, Mic, Palette, Shield, Globe, User
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

export default function CategoryCard({ category, nomineeCount = 0, topNominees = [] }) {
  const Icon = iconMap[category.slug] || Award;

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="category-card"
      id={`category-${category.slug}`}
    >
      {/* Icon + Name + Type */}
      <div className="category-card-icon">
        <Icon size={40} />
      </div>
      <h3>{category.name}</h3>
      <span className="category-type">{category.type}</span>

      {/* Bottom: stacked avatars + count */}
      <div className="category-card-footer">
        <div className="category-avatar-stack">
          {topNominees.length > 0
            ? topNominees.map((nom, i) => (
                <div
                  key={nom.id}
                  className="category-stack-avatar"
                  style={{ zIndex: 3 - i }}
                  title={nom.name}
                >
                  {nom.photo_url ? (
                    <img src={nom.photo_url} alt={nom.name} className="category-stack-img" />
                  ) : (
                    <div className="category-stack-placeholder">
                      <User size={13} />
                    </div>
                  )}
                </div>
              ))
            : /* placeholder ghosts when no nominees yet */
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="category-stack-avatar category-stack-ghost"
                  style={{ zIndex: 3 - i }}
                >
                  <User size={13} />
                </div>
              ))}
        </div>

        <span className="category-nominee-count">
          {nomineeCount} {nomineeCount === 1 ? 'nominee' : 'nominees'}
        </span>
      </div>
    </Link>
  );
}
