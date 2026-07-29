export enum AppView {
  STRAINVERSE = 'STRAINVERSE',
  HERBHUB = 'HERBHUB',
  MATCHIT = 'MATCHIT',
  SOCIALSESH = 'SOCIALSESH',
  PROFILE = 'PROFILE'
}

export type UserRole = 'User' | 'Bud Tender' | 'Moderator' | 'Administrator' | 'Manager' | 'Director';

export interface Strain {
  id: string;
  name: string;
  type: 'Sativa' | 'Indica' | 'Hybrid' | 'Exotic';
  description: string;
  thc_min?: number;
  thc_max?: number;
  cbd_min?: number;
  cbd_max?: number;
  effects: string[];
  flavors: string[];
  genetics: string;
  // Aggregated data for display
  photo_count?: number;
  review_count?: number;
  avg_rating?: number;
  cover_image_url?: string;
  // User-specific data
  user_has_smoked?: boolean;
  user_has_dabbed?: boolean;
}

export interface StrainPhoto {
  id: string;
  strain_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  image_url: string;
  created_at: string;
  form: 'FLOWER' | 'CONCENTRATE';
  brand?: string;
}

export interface StrainReview {
  id: string;
  strain_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  text: string;
  created_at: string;
  form: 'FLOWER' | 'CONCENTRATE';
}

export interface StrainChatMessage {
    id: string;
    strain_id: string;
    user_id: string;
    user_name: string;
    message: string;
    created_at: string;
    form: 'FLOWER' | 'CONCENTRATE';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  latitude?: number;
  longitude?: number;
  distanceRadius?: number; // km
  city?: string;
  state?: string;
  favStrains?: string[];
  smokingStyle?: 'Joint' | 'Blunt' | 'Glass' | 'Vape' | 'Edibles';
  badges?: Badge[];
  dateOfBirth?: string; // YYYY-MM-DD
  status?: 'active' | 'shadow_banned' | 'banned';
  role?: UserRole;
  /** MatchIt presence — show this person in the nearby people feed */
  showInMatchIt?: boolean;
  matchLookingFor?: string;
}

/** Nearby person card in the MatchIt people feed */
export interface MatchPerson {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  distance?: number | null;
  matchLookingFor?: string;
  smokingStyle?: string;
  favStrains?: string[];
}

export type PostVisibility =
  | 'HIGHLINE'        // Global Public
  | 'LOCAL_LOUD'      // Local Radius
  | 'FRIENDS' 
  | 'FAMILY' 
  | 'FRIENDS_AND_FAMILY' 
  | 'FRIEND_GROUP' 
  | 'FAMILY_GROUP' 
  | 'MEET_MATCH'      // Dating/Linkup profile feed
  | 'ONLY_ME';

// Fix: Expand ReactionType to include all possible reaction types from different components
export type ReactionType = 
  | 'LIKE' 
  | 'FIRE' 
  | 'DISLIKE'
  | 'THUMBS_UP'
  | 'HIGH_AF'
  | 'WEAK'
  | 'FELT_THIS'
  | 'BRUH'
  | 'MELTING'
  | 'DROOLING'
  | 'ZANY'
  | 'LAUGHING'
  | 'MIND_BLOWN'
  | 'RELIEF';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  timestamp: number;
  reactions: Record<string, number>;
  userReaction?: ReactionType | null;
  comments: number;
  visibility: PostVisibility;
  latitude?: number;
  longitude?: number;
  distance?: number; 
  groupId?: string;
  isMatchIt?: boolean;
  authorCity?: string;
  authorState?: string;
  mood?: string;
  
  // MatchIt Metadata
  matchLookingFor?: string;
  matchExpiresAt?: string; // ISO string

  // HighLine Metadata
  strain?: string;
  highLevel?: number; // 0-10
  soundtrack?: string;
  badges?: string[]; // 'Clean Cone', 'Funnel God', etc.
}

export interface PostComment {
    id: string;
    post_id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'FRIEND' | 'FAMILY' | 'PUBLIC' | 'MATCH';
  members: string[]; 
  messages: ChatMessage[];
  cover_image_url?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface SafetyReport {
  id: string;
  latitude: number;
  longitude: number;
  status: 'HOT' | 'CHILL';
  timestamp: number;
}

export interface GrowPlant {
  id: string;
  user_id: string;
  name: string;
  strain: string;
  stage: 'SEEDLING' | 'VEG' | 'FLOWER' | 'DRYING' | 'CURING';
  health: number; // 0-100
  next_watering: string; // ISO string timestamp
}

export interface Story {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  image_url: string;
  strain_name?: string;
  high_level?: number;
}

export interface Relationship {
  user_1_id: string;
  user_2_id: string;
  type: 'FRIEND' | 'FAMILY';
  status: 'PENDING' | 'ACCEPTED';
}

export interface GameScore {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  game_id: string;
  score: number;
}

export type ReportCategory = 
  | 'Suspicious activity'
  | 'Underage'
  | 'Spam'
  | 'Harassment'
  | 'Drugs for sale'
  | 'Fake / catfishing';

export type MatchItInteractionType = 'TAP' | 'SPARK';
export type MatchItInteractionStatus = 'PENDING' | 'MATCHED' | 'DECLINED';

export interface MatchItInteraction {
    id: string;
    post_id?: string | null;
    sender_id: string;
    sender_name: string;
    sender_avatar: string;
    receiver_id: string;
    message: string | null;
    type: MatchItInteractionType;
    status: MatchItInteractionStatus;
    created_at: string;
    group_id?: string | null;
}